import { S3Client } from '@aws-sdk/client-s3';

export const R2_MUSEUM_PREFIX = (process.env.R2_PREFIX || 'museum/').replace(/^\/+/, '');
export const MAX_MUSEUM_FILE_BYTES = 50 * 1024 * 1024; // 50 MB (für Videos/Präsentationen)

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'pdf', 'pptx', 'ppt',
  'mp3', 'm4a', 'wav', 'ogg',
  'mp4', 'webm', 'mov', 'm4v',
]);

const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'video/'];
const ALLOWED_EXACT_MIMES = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/octet-stream',
]);

export function sanitizeMuseumKey(rawKey: string): string {
  const cleaned = String(rawKey || '')
    .replace(/\.\./g, '')
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9._/-]/g, '_');
  if (!cleaned) return '';
  const prefix = R2_MUSEUM_PREFIX.endsWith('/') ? R2_MUSEUM_PREFIX : `${R2_MUSEUM_PREFIX}/`;
  return cleaned.startsWith(prefix) ? cleaned : '';
}

export function isAllowedMuseumFile(key: string, contentType: string): boolean {
  const ext = key.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  const normalized = (contentType || 'application/octet-stream').split(';')[0].trim().toLowerCase();
  if (ALLOWED_EXACT_MIMES.has(normalized)) return true;
  return ALLOWED_MIME_PREFIXES.some((p) => normalized.startsWith(p));
}

export function isOriginAllowed(urlStr: string, requestHost: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    const host = parsed.host.toLowerCase();
    if (requestHost && host === requestHost.toLowerCase()) return true;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname.endsWith('.vercel.app')) return true;
    const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return extraOrigins.includes(parsed.origin.toLowerCase());
  } catch {
    return false;
  }
}

export function applyOriginProtection(req: any, res: any, methods = 'POST,OPTIONS'): boolean {
  const rawHost = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  const requestHost = (Array.isArray(rawHost) ? rawHost[0] : String(rawHost)).split(',')[0].trim();
  const rawOrigin = req.headers?.origin;
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : (rawOrigin || '');
  const rawReferer = req.headers?.referer;
  const referer = Array.isArray(rawReferer) ? rawReferer[0] : (rawReferer || '');

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Range');
  res.setHeader('Vary', 'Origin');

  if (origin && isOriginAllowed(origin, requestHost)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    if (origin && !isOriginAllowed(origin, requestHost)) {
      res.status(403).json({ error: 'CORS: Herkunft nicht erlaubt.' });
      return false;
    }
    res.status(200).end();
    return false;
  }

  if (origin) {
    if (!isOriginAllowed(origin, requestHost)) {
      res.status(403).json({ error: 'Zugriff verweigert: Unzulässige Herkunft (Origin).' });
      return false;
    }
    return true;
  }

  if (referer && isOriginAllowed(referer, requestHost)) {
    return true;
  }

  // Same-origin GET requests (e.g. <img>, <video>, <audio>) often omit Origin and sometimes Referer
  if (req.method === 'GET') {
    return true;
  }

  res.status(403).json({ error: 'Zugriff verweigert: Fehlender Origin-Header.' });
  return false;
}

export function getR2Client(): { s3: S3Client; bucketName: string } | null {
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { s3, bucketName };
}
