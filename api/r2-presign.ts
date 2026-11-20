import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  applyOriginProtection,
  getR2Client,
  isAllowedMuseumFile,
  MAX_MUSEUM_FILE_BYTES,
  sanitizeMuseumKey,
} from './_r2';

export default async function handler(req: any, res: any) {
  if (!applyOriginProtection(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST-Anfragen sind zulässig.' });
  }

  const client = getR2Client();
  if (!client) {
    return res.status(500).json({
      error: 'Cloudflare R2 Umgebungsvariablen sind nicht konfiguriert (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Ungültiger JSON-Body.' });
      }
    }
    body = body || {};

    const { action = 'upload', key, contentType = 'application/octet-stream', fileSize } = body;
    const sanitizedKey = sanitizeMuseumKey(key);
    if (!sanitizedKey) {
      return res.status(400).json({ error: 'Ungültiger Dateischlüssel (muss im Präfix museum/ liegen).' });
    }

    if (action === 'upload') {
      if (!isAllowedMuseumFile(sanitizedKey, contentType)) {
        return res.status(400).json({ error: 'Dateiformat oder MIME-Typ wird im Museum nicht unterstützt.' });
      }

      const parsedSize = typeof fileSize === 'number' ? Math.floor(fileSize) : NaN;
      if (!Number.isFinite(parsedSize) || parsedSize <= 0 || parsedSize > MAX_MUSEUM_FILE_BYTES) {
        return res.status(413).json({ error: 'Dateigröße fehlt oder überschreitet 50 MB.' });
      }

      const command = new PutObjectCommand({
        Bucket: client.bucketName,
        Key: sanitizedKey,
        ContentType: contentType,
        ContentLength: parsedSize,
      });

      const uploadUrl = await getSignedUrl(client.s3, command, { expiresIn: 900 });
      return res.status(200).json({
        success: true,
        action: 'upload',
        key: sanitizedKey,
        uploadUrl,
        expiresInSeconds: 900,
      });
    }

    if (action === 'download') {
      const command = new GetObjectCommand({
        Bucket: client.bucketName,
        Key: sanitizedKey,
      });
      const downloadUrl = await getSignedUrl(client.s3, command, { expiresIn: 3600 });
      return res.status(200).json({
        success: true,
        action: 'download',
        key: sanitizedKey,
        downloadUrl,
        expiresInSeconds: 3600,
      });
    }

    return res.status(400).json({ error: 'Unbekannte Aktion.' });
  } catch (err: any) {
    console.error('Fehler bei /api/r2-presign:', err);
    return res.status(500).json({
      error: 'Fehler beim Erzeugen der signierten R2-URL.',
      details: err?.message || String(err),
    });
  }
}
