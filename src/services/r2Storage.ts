import { Exponat, ExponatPage } from '../types/museum';

const R2_PREFIX = 'museum/';

export function buildMuseumR2Key(museumCode: string, exhibitId: string, fileName: string): string {
  const safeCode = museumCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const safeExhibit = exhibitId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${R2_PREFIX}${safeCode}/${safeExhibit}/${Date.now()}_${safeName}`;
}

export function getR2FileProxyUrl(r2Key: string): string {
  if (!r2Key) return '';
  return `/api/r2-file?key=${encodeURIComponent(r2Key)}`;
}

export function resolvePageImageUrl(page?: ExponatPage | null): string {
  if (!page) return '';
  if (page.demoUrl) return page.demoUrl;
  if (page.r2Key) return getR2FileProxyUrl(page.r2Key);
  return '';
}

export function resolveMediaUrl(ref?: { r2Key?: string; demoUrl?: string } | null): string {
  if (!ref) return '';
  if (ref.demoUrl) return ref.demoUrl;
  if (ref.r2Key) return getR2FileProxyUrl(ref.r2Key);
  return '';
}

export async function uploadBlobToR2(
  blob: Blob,
  r2Key: string,
  contentType?: string
): Promise<string> {
  const mime = contentType || blob.type || 'application/octet-stream';
  const presignRes = await fetch('/api/r2-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'upload',
      key: r2Key,
      contentType: mime,
      fileSize: blob.size,
    }),
  });

  if (!presignRes.ok) {
    let msg = 'Upload-Vorbereitung zu Cloudflare R2 fehlgeschlagen.';
    try {
      const errJson = await presignRes.json();
      if (errJson?.error) msg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  const data = (await presignRes.json()) as { uploadUrl?: string; key?: string };
  if (!data.uploadUrl || !data.key) {
    throw new Error('Ungültige Antwort von /api/r2-presign.');
  }

  const putRes = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mime,
    },
    body: blob,
  });

  if (!putRes.ok) {
    throw new Error(`Cloudflare R2 Upload fehlgeschlagen (HTTP ${putRes.status}).`);
  }

  return data.key;
}

export async function deleteKeysFromR2(keys: string[]): Promise<void> {
  const valid = keys.filter((k) => Boolean(k && k.startsWith(R2_PREFIX)));
  if (!valid.length) return;
  try {
    await fetch('/api/r2-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: valid }),
    });
  } catch (err) {
    console.warn('R2 Delete Warnung:', err);
  }
}

export function collectExhibitR2Keys(ex: Exponat): string[] {
  const keys: string[] = [];
  for (const p of ex.pages || []) {
    if (p.r2Key) keys.push(p.r2Key);
  }
  if (ex.mediaAsset?.r2Key) keys.push(ex.mediaAsset.r2Key);
  if (ex.audioCompanion?.r2Key) keys.push(ex.audioCompanion.r2Key);
  return keys;
}
