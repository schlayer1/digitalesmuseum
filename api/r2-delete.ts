import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { applyOriginProtection, getR2Client, R2_MUSEUM_PREFIX, sanitizeMuseumKey } from './_r2.js';

function sanitizeMuseumFolderPrefix(rawPrefix?: string, rawMuseumCode?: string): string {
  const basePrefix = R2_MUSEUM_PREFIX.endsWith('/') ? R2_MUSEUM_PREFIX : `${R2_MUSEUM_PREFIX}/`;
  if (rawMuseumCode && typeof rawMuseumCode === 'string') {
    const safeCode = rawMuseumCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (safeCode.length >= 4 && safeCode.length <= 16) {
      return `${basePrefix}${safeCode}/`;
    }
  }
  if (rawPrefix && typeof rawPrefix === 'string') {
    const cleaned = sanitizeMuseumKey(rawPrefix);
    // Sicherheitscheck: Darf niemals das gesamte "museum/"-Root löschen, sondern muss mindestens einen Ausstellungscode enthalten (z.B. "museum/ABC123/")
    if (cleaned.startsWith(basePrefix) && cleaned.length > basePrefix.length + 3) {
      const normalized = cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
      const rest = normalized.slice(basePrefix.length);
      if (/^[A-Z0-9_-]{4,24}\//i.test(rest)) {
        return normalized;
      }
    }
  }
  return '';
}

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

    const { key, keys, prefix, museumCode } = body;
    const keysToDelete = new Set<string>();

    // 1. Falls ein Ausstellungs-Ordner (prefix / museumCode) angegeben wurde, alle Objekte darunter in R2 auflisten
    const folderPrefix = sanitizeMuseumFolderPrefix(prefix, museumCode);
    if (folderPrefix) {
      let continuationToken: string | undefined = undefined;
      do {
        const listResp: ListObjectsV2CommandOutput = await client.s3.send(
          new ListObjectsV2Command({
            Bucket: client.bucketName,
            Prefix: folderPrefix,
            ContinuationToken: continuationToken,
          })
        );
        for (const obj of listResp.Contents || []) {
          if (obj.Key) {
            const safe = sanitizeMuseumKey(obj.Key);
            if (safe) keysToDelete.add(safe);
          }
        }
        continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
      } while (continuationToken);
    }

    // 2. Falls zusätzlich oder ausschließlich ein Array von Schlüsseln übergeben wurde
    if (Array.isArray(keys)) {
      for (const k of keys) {
        if (typeof k === 'string') {
          const safe = sanitizeMuseumKey(k);
          if (safe) keysToDelete.add(safe);
        }
      }
    }

    // 3. Falls Ordnersuche oder Array-Löschung aktiv war -> gesammelt löschen
    if (folderPrefix || Array.isArray(keys)) {
      const allKeys = [...keysToDelete];
      if (allKeys.length === 0) {
        return res.status(200).json({ success: true, deletedCount: 0, prefix: folderPrefix || undefined });
      }

      let deletedCount = 0;
      for (let i = 0; i < allKeys.length; i += 1000) {
        const chunk = allKeys.slice(i, i + 1000);
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

      return res.status(200).json({
        success: true,
        deletedCount,
        prefix: folderPrefix || undefined,
      });
    }

    // 4. Einzelschlüssel löschen
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

    return res.status(200).json({ success: true, key: sanitized, deletedCount: 1 });
  } catch (err: any) {
    console.error('Fehler bei /api/r2-delete:', err);
    return res.status(500).json({
      error: 'Fehler beim Löschen in Cloudflare R2.',
      details: err?.message || String(err),
    });
  }
}
