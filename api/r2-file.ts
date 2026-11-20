import { GetObjectCommand } from '@aws-sdk/client-s3';
import { applyOriginProtection, getR2Client, sanitizeMuseumKey } from './_r2';

export default async function handler(req: any, res: any) {
  if (!applyOriginProtection(req, res, 'GET,OPTIONS')) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Nur GET-Anfragen sind zulässig.' });
  }

  const client = getR2Client();
  if (!client) {
    return res.status(500).json({ error: 'Cloudflare R2 Umgebungsvariablen sind nicht konfiguriert.' });
  }

  const rawKey = Array.isArray(req.query?.key) ? req.query.key[0] : req.query?.key;
  const key = sanitizeMuseumKey(String(rawKey || ''));
  if (!key) {
    return res.status(400).json({ error: 'Ungültiger Dateischlüssel.' });
  }

  try {
    const range = typeof req.headers?.range === 'string' ? req.headers.range : undefined;
    const result = await client.s3.send(
      new GetObjectCommand({
        Bucket: client.bucketName,
        Key: key,
        ...(range ? { Range: range } : {}),
      })
    );

    if (result.ContentType) res.setHeader('Content-Type', result.ContentType);
    if (result.ContentLength != null) res.setHeader('Content-Length', String(result.ContentLength));
    if (result.ContentRange) res.setHeader('Content-Range', result.ContentRange);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    res.status(result.ContentRange ? 206 : 200);

    const body = result.Body as any;
    if (!body) {
      return res.end();
    }

    if (typeof body.transformToByteArray === 'function') {
      const bytes = await body.transformToByteArray();
      return res.end(Buffer.from(bytes));
    }

    if (typeof body.pipe === 'function') {
      return body.pipe(res);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return res.end(Buffer.concat(chunks));
  } catch (err: any) {
    const code = err?.$metadata?.httpStatusCode;
    if (code === 404 || err?.name === 'NoSuchKey') {
      return res.status(404).json({ error: 'Datei nicht gefunden.' });
    }
    console.error('Fehler bei /api/r2-file:', err);
    return res.status(500).json({ error: 'Datei konnte nicht aus R2 geladen werden.' });
  }
}
