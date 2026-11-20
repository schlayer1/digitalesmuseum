import { Exponat, HallSlot, SaalStil } from '../types/museum';

export const SEITEN_MAX = 10;
export const KANTE_MAX = 1800;
export const ZIEL_BYTES = 700_000;
export const RAUM_GROESSE = 5;

export const SAELE: Record<SaalStil, { label: string; farben: string[]; rahmen: string }> = {
  klassisch: {
    label: 'Klassisch',
    farben: ['#7b2633', '#2e5240', '#24476b', '#6b4a24'],
    rahmen: '#c9a24a',
  },
  modern: {
    label: 'Moderne Galerie',
    farben: ['#f4f2ee', '#eef1f4', '#f6f1ea', '#eef3ef'],
    rahmen: '#1d1d1d',
  },
  nacht: {
    label: 'Bei Nacht',
    farben: ['#18202e', '#1f1a2e', '#13262a', '#2a1a1a'],
    rahmen: '#33343c',
  },
};

const TIERE: [string, 'm' | 'f' | 'n'][] = [
  ['Fuchs', 'm'], ['Eule', 'f'], ['Pferd', 'n'], ['Dachs', 'm'], ['Katze', 'f'],
  ['Zebra', 'n'], ['Biber', 'm'], ['Möwe', 'f'], ['Lama', 'n'], ['Igel', 'm'],
  ['Robbe', 'f'], ['Känguru', 'n'], ['Luchs', 'm'], ['Libelle', 'f'], ['Wal', 'm'],
  ['Giraffe', 'f'], ['Nashorn', 'n'], ['Panda', 'm'], ['Hummel', 'f'], ['Krokodil', 'n'],
];

const EIGEN = [
  'flink', 'leise', 'mutig', 'schlau', 'wild', 'sanft', 'bunt', 'heiter',
  'kühn', 'still', 'fröhlich', 'wach', 'zart', 'kess', 'munter',
];

const PREFIX = 'hbs-mu-';

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

export function getDeviceId(): string {
  let g = readStorage<string>('geraet', '');
  if (!/^[a-z0-9]{16,40}$/.test(g)) {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    g = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
    writeStorage('geraet', g);
  }
  return g;
}

export function randomId(len = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export function generateMuseumCode(len = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export function normalizeCode(raw: string): string {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidCode(code: string): boolean {
  return /^[A-Z0-9]{4,10}$/.test(code);
}

export function spitzname(): string {
  const [tier, g] = TIERE[Math.floor(Math.random() * TIERE.length)];
  const e = EIGEN[Math.floor(Math.random() * EIGEN.length)];
  const ende = e.endsWith('e') ? { m: 'r', f: '', n: 's' }[g] : { m: 'er', f: 'e', n: 'es' }[g];
  return (e[0].toUpperCase() + e.slice(1) + ende + ' ' + tier).slice(0, 20);
}

export function getSavedNickname(): string {
  return readStorage<string>('name', '');
}

export function setSavedNickname(name: string): void {
  writeStorage('name', name.trim().slice(0, 20));
}

export function mehrzahl(n: number, eins: string, viele: string): string {
  return `${n} ${n === 1 ? eins : viele}`;
}

export function begrenzt(z: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, z));
}

export function kurzHash(t: string): string {
  let h = 5381;
  for (let i = 0; i < t.length; i++) {
    h = (h * 33 + t.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

export function buildJoinLink(code: string, isDemo = false): string {
  const base = window.location.href.split('#')[0].split('?')[0];
  return isDemo ? `${base}?demo` : `${base}?r=${code}`;
}

export function buildSlots(exponate: Exponat[]): HallSlot[] {
  const liste: Omit<HallSlot, 'x'>[] = [
    { art: 'rand', b: 1.4, raum: 0 },
    { art: 'eingang', b: 1, raum: 0 },
  ];
  const raeume = exponate.length > RAUM_GROESSE + 1 ? Math.ceil(exponate.length / RAUM_GROESSE) : 1;
  const proRaum = Math.max(1, Math.ceil(exponate.length / raeume));

  exponate.forEach((e, i) => {
    const raum = Math.floor(i / proRaum);
    if (i > 0 && i % proRaum === 0) {
      liste.push({ art: 'tuer', b: 0.62, raum: raum - 1, nach: raum });
    }
    liste.push({ art: 'exponat', b: 1, raum, e, nr: i });
  });

  const letzter = exponate.length ? Math.floor((exponate.length - 1) / proRaum) : 0;
  liste.push({ art: 'ausgang', b: 1, raum: letzter });
  liste.push({ art: 'rand', b: 1.4, raum: letzter });

  let x = 0;
  return liste.map((slot) => {
    const item: HallSlot = { ...slot, x };
    x += slot.b;
    return item;
  });
}

export function isSlotWalkable(slot?: HallSlot): boolean {
  return Boolean(slot && slot.art !== 'rand' && slot.art !== 'tuer');
}

export function getWallColor(saal: SaalStil, raum: number): string {
  const cfg = SAELE[saal] || SAELE.klassisch;
  return cfg.farben[raum % cfg.farben.length];
}

export async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  return img;
}

export async function alsJpeg(
  quelle: CanvasImageSource,
  w: number,
  h: number,
  drehen = 0
): Promise<{ blob: Blob; w: number; h: number }> {
  let s = Math.min(1, KANTE_MAX / Math.max(w, h));
  for (let versuch = 0; versuch < 6; versuch++) {
    const bw = Math.max(1, Math.round(w * s));
    const bh = Math.max(1, Math.round(h * s));
    const c = document.createElement('canvas');
    const quer = drehen % 180 !== 0;
    c.width = quer ? bh : bw;
    c.height = quer ? bw : bh;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Kein Canvas-Kontext verfügbar.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((drehen * Math.PI) / 180);
    ctx.drawImage(quelle, -bw / 2, -bh / 2, bw, bh);

    for (const q of [0.86, 0.76, 0.66]) {
      const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/jpeg', q));
      if (blob && blob.size <= ZIEL_BYTES) {
        return { blob, w: c.width, h: c.height };
      }
    }
    s *= 0.8;
  }
  throw new Error('Bild konnte nicht ausreichend verkleinert werden.');
}

export function cleanFileTitle(name: string): string {
  return (
    name
      .replace(/\.[a-z0-9]{2,5}$/i, '')
      .replace(/[_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'Ohne Titel'
  );
}
