import { DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { applyOriginProtection, getR2Client, sanitizeMuseumKey } from './_r2.js';

export default async function handler(req: any, res: any) {
  if (!applyOriginProtection(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST-Anfragen sind zulässig.' });
  }

  const client = getR2Client();
  if (!client) {
    return res.status(500).json({ error: 'Cloudflare R2 Umgebungsvariablen sind nicht konfiguriert.' });
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

    const { key, keys } = body;

    if (Array.isArray(keys)) {
      const sanitizedKeys = keys
        .filter((k): k is string => typeof k === 'string')
        .map(sanitizeMuseumKey)
        .filter((k) => k.length > 0);

      if (sanitizedKeys.length === 0) {
        return res.status(200).json({ success: true, deletedCount: 0 });
      }

      let deletedCount = 0;
      for (let i = 0; i < sanitizedKeys.length; i += 1000) {
        const chunk = sanitizedKeys.slice(i, i + 1000);
        await client.s3.send(
          new DeleteObjectsCommand({
            Bucket: client.bucketName,
            Delete: {
              Objects: chunk.map((k) => ({ Key: k })),
              Quiet: true,
            },
          })
        );
        deletedCount += chunk.length;
      }

      return res.status(200).json({ success: true, deletedCount });
    }

    const sanitized = sanitizeMuseumKey(key);
    if (!sanitized) {
      return res.status(400).json({ error: 'Ungültiger R2-Schlüssel.' });
    }

    await client.s3.send(
      new DeleteObjectCommand({
        Bucket: client.bucketName,
        Key: sanitized,
      })
    );

    return res.status(200).json({ success: true, key: sanitized });
  } catch (err: any) {
    console.error('Fehler bei /api/r2-delete:', err);
    return res.status(500).json({
      error: 'Fehler beim Löschen in Cloudflare R2.',
      details: err?.message || String(err),
    });
  }
}
