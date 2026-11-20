import { AnnotationItem, AnnotationTool, Exponat, Kommentar, KommentarStelle } from '../types/museum';
import { begrenzt } from './museumHelpers';

export const ANM_FARBEN: [string, string][] = [
  ['Gelb', '#e8a800'],
  ['Rot', '#d93025'],
  ['Blau', '#1a73e8'],
  ['Grün', '#188038'],
  ['Lila', '#8e44ad'],
];

export const ANM_MAX = 30;
export const ANM_TEXT_MAX = 200;
export const STIFT_MAX = 150;
export const STIFT_SEITE_MAX = 1500;
export const SVG_NS = 'http://www.w3.org/2000/svg';

export const WERKZEUGE: Record<AnnotationTool, [string, string]> = {
  pfeil: ['➚', 'Pfeil'],
  stift: ['✏️', 'Stift'],
  mark: ['▮', 'Markieren'],
  rahmen: ['▢', 'Umranden'],
  notiz: ['✎', 'Notiz'],
};

export const WERKZEUG_TIPP: Record<AnnotationTool, string> = {
  pfeil: 'Auf das Wort tippen und zum Rand ziehen – dann die Erklärung schreiben.',
  mark: 'Über die Stelle ziehen, die farbig hinterlegt werden soll.',
  stift: 'Frei zeichnen, unterstreichen oder einkreisen – mit Finger, Maus oder Apple Pencil.',
  rahmen: 'Einen Rahmen um die Stelle ziehen.',
  notiz: 'Dorthin tippen oder ziehen, wo die Notiz stehen soll – dann schreiben.',
};

export function glatt4(z: number): number {
  return Math.round(begrenzt(z, 0, 1) * 10000) / 10000;
}

export function getPageAnnotations(e: Exponat | null | undefined, pageIndex: number): AnnotationItem[] {
  if (!e || !e.anm) return [];
  return e.anm[String(pageIndex)] || [];
}

export function countAnnotations(e: Exponat | null | undefined): number {
  if (!e || !e.anm) return 0;
  return Object.values(e.anm).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
}

export function getCommentsWithSpot(e: Exponat | null | undefined): Kommentar[] {
  if (!e || !Array.isArray(e.kommentare)) return [];
  return e.kommentare.filter((k) => Boolean(k.stelle));
}

export function rotateAnnotations90(liste: AnnotationItem[]): AnnotationItem[] {
  return (liste || []).map((x) => {
    const [a, b, c, d] = x.a;
    const neu: AnnotationItem = {
      ...x,
      a: [glatt4(1 - b), glatt4(a), glatt4(1 - d), glatt4(c)],
    };
    if (x.p) {
      neu.p = x.p.map((_, n) => (n % 2 ? x.p![n - 1] : glatt4(1 - x.p![n + 1])));
    }
    return neu;
  });
}

function umbrechen(text: string, zeichen: number): string[] {
  const zeilen: string[] = [];
  let z = '';
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    if (!z) z = w;
    else if ((z + ' ' + w).length <= zeichen) z += ' ' + w;
    else {
      zeilen.push(z);
      z = w;
    }
    while (z.length > zeichen) {
      zeilen.push(z.slice(0, zeichen));
      z = z.slice(zeichen);
    }
  }
  if (z) zeilen.push(z);
  return zeilen.slice(0, 8);
}

export interface RenderedShape {
  k: 'rect' | 'line' | 'pfad' | 'poly' | 'kreis' | 'text';
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rx?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  r?: number;
  pts?: [number, number][];
  lines?: string[];
  fs?: number;
  fill?: string;
  stroke?: string;
  sw?: number;
  op?: number;
  strich?: boolean;
  schatten?: boolean;
  mitte?: boolean;
  fett?: boolean;
  ref?: string;
}

export interface SpotOverlayItem {
  st: KommentarStelle;
  nr: number;
  id: string;
  frage: boolean;
}

export interface FormenOptions {
  stellen?: SpotOverlayItem[];
  wahl?: string;
  sel?: number;
}

export function formen(anm: AnnotationItem[], W: number, H: number, o: FormenOptions = {}): RenderedShape[] {
  const fs = Math.max(16, Math.min(W, H) * 0.032);
  const aus: RenderedShape[] = [];
  const rechteck = (a: [number, number, number, number]) => {
    const x = Math.min(a[0], a[2]) * W;
    const y = Math.min(a[1], a[3]) * H;
    return { x, y, w: Math.abs(a[2] - a[0]) * W, h: Math.abs(a[3] - a[1]) * H };
  };
  const kasten = (lines: string[], cx: number, cy: number, farbe: string, mitte: boolean, ref: string) => {
    const pad = fs * 0.35;
    const bw = Math.max(...lines.map((l) => l.length)) * fs * 0.5 + pad * 2;
    const bh = lines.length * fs * 1.18 + pad * 1.4;
    let x = mitte ? cx - bw / 2 : cx;
    let y = mitte ? cy - bh / 2 : cy;
    x = begrenzt(x, 2, Math.max(2, W - bw - 2));
    y = begrenzt(y, 2, Math.max(2, H - bh - 2));
    aus.push({ k: 'rect', x, y, w: bw, h: bh, rx: fs * 0.3, fill: '#ffffff', stroke: farbe, sw: fs * 0.12, ref });
    aus.push({ k: 'text', x: x + pad, y: y + pad * 0.7 + fs * 0.92, lines, fs, fill: '#1f1b16', ref });
  };

  (anm || []).forEach((x, i) => {
    const farbe = (ANM_FARBEN[x.f] || ANM_FARBEN[0])[1];
    const ref = 'h' + i;
    const stark = o.sel === i;
    const a = x.a;

    if (x.t === 'mark' || x.t === 'rahmen') {
      const r = rechteck(a);
      if (x.t === 'mark') {
        aus.push({ k: 'rect', ...r, rx: fs * 0.15, fill: farbe, op: 0.32, stroke: stark ? farbe : '', sw: fs * 0.12, ref });
      } else {
        aus.push({ k: 'rect', ...r, rx: fs * 0.3, fill: 'none', stroke: farbe, sw: fs * (stark ? 0.32 : 0.22), ref });
      }
      if (x.s) {
        const lines = umbrechen(x.s, 26);
        const yPos = r.y - lines.length * fs * 1.18 - fs * 0.8 < 0 ? r.y + r.h + fs * 0.3 : r.y - lines.length * fs * 1.18 - fs * 0.6;
        kasten(lines, r.x, yPos, farbe, false, ref);
      }
    } else if (x.t === 'pfeil') {
      const sx = a[0] * W;
      const sy = a[1] * H;
      const ex = a[2] * W;
      const ey = a[3] * H;
      const d = Math.hypot(sx - ex, sy - ey) || 1;
      const ux = (sx - ex) / d;
      const uy = (sy - ey) / d;
      const k = fs * 0.85;
      aus.push({ k: 'line', x1: ex, y1: ey, x2: sx - ux * k * 0.6, y2: sy - uy * k * 0.6, stroke: farbe, sw: fs * (stark ? 0.26 : 0.18), ref });
      aus.push({
        k: 'poly',
        pts: [
          [sx, sy],
          [sx - ux * k - uy * k * 0.5, sy - uy * k + ux * k * 0.5],
          [sx - ux * k + uy * k * 0.5, sy - uy * k - ux * k * 0.5],
        ],
        fill: farbe,
        ref,
      });
      if (x.s) kasten(umbrechen(x.s, 24), ex, ey, farbe, true, ref);
      else aus.push({ k: 'kreis', x: ex, y: ey, r: fs * 0.25, fill: farbe, ref });
    } else if (x.t === 'stift' && x.p && x.p.length >= 4) {
      const pts: [number, number][] = [];
      for (let n = 0; n + 1 < x.p.length; n += 2) {
        pts.push([x.p[n] * W, x.p[n + 1] * H]);
      }
      aus.push({ k: 'pfad', pts, stroke: farbe, sw: fs * (stark ? 0.24 : 0.17), ref });
      if (x.s) {
        const r = rechteck(a);
        const lines = umbrechen(x.s, 26);
        const yPos = r.y - lines.length * fs * 1.18 - fs * 0.8 < 0 ? r.y + r.h + fs * 0.3 : r.y - lines.length * fs * 1.18 - fs * 0.6;
        kasten(lines, r.x, yPos, farbe, false, ref);
      }
    } else if (x.t === 'notiz') {
      const r = rechteck(a);
      const bw = Math.max(r.w, fs * 7);
      const zeichen = Math.max(8, Math.floor((bw - fs * 0.8) / (fs * 0.5)));
      const lines = umbrechen(x.s || '…', zeichen);
      const bh = lines.length * fs * 1.18 + fs * 0.6;
      const nx = begrenzt(r.x, 2, Math.max(2, W - bw - 2));
      const ny = begrenzt(r.y, 2, Math.max(2, H - bh - 2));
      aus.push({ k: 'rect', x: nx, y: ny, w: bw, h: bh, rx: fs * 0.2, fill: '#fff6b8', stroke: farbe, sw: fs * (stark ? 0.2 : 0.1), schatten: true, ref });
      aus.push({ k: 'rect', x: nx, y: ny, w: fs * 0.28, h: bh, rx: 0, fill: farbe, ref });
      aus.push({ k: 'text', x: nx + fs * 0.55, y: ny + fs * 0.25 + fs * 0.92, lines, fs, fill: '#2c2410', ref });
    }
  });

  for (const q of o.stellen || []) {
    const farbe = q.frage ? '#B7791F' : '#1a73e8';
    const a = q.st.a;
    const ref = 'k' + q.id;
    const gewaehlt = o.wahl === q.id;
    const blass = Boolean(o.wahl && !gewaehlt);
    const op = blass ? 0.35 : 1;
    let bx = 0;
    let by = 0;

    if (q.st.t === 'pfeil') {
      const sx = a[0] * W;
      const sy = a[1] * H;
      const ex = a[2] * W;
      const ey = a[3] * H;
      const d = Math.hypot(sx - ex, sy - ey) || 1;
      const ux = (sx - ex) / d;
      const uy = (sy - ey) / d;
      const k = fs * 0.85;
      aus.push({ k: 'line', x1: ex, y1: ey, x2: sx - ux * k * 0.6, y2: sy - uy * k * 0.6, stroke: farbe, sw: fs * (gewaehlt ? 0.28 : 0.16), op, strich: !gewaehlt, ref });
      aus.push({
        k: 'poly',
        pts: [
          [sx, sy],
          [sx - ux * k - uy * k * 0.5, sy - uy * k + ux * k * 0.5],
          [sx - ux * k + uy * k * 0.5, sy - uy * k - ux * k * 0.5],
        ],
        fill: farbe,
        op,
        ref,
      });
      bx = ex;
      by = ey;
    } else {
      const r = rechteck(a);
      if (q.st.t === 'mark') {
        aus.push({ k: 'rect', ...r, rx: fs * 0.15, fill: farbe, op: (gewaehlt ? 0.34 : 0.18) * op, stroke: '', sw: 0, ref });
      }
      aus.push({ k: 'rect', ...r, rx: fs * 0.25, fill: 'none', stroke: farbe, sw: fs * (gewaehlt ? 0.3 : 0.14), op, strich: q.st.t === 'mark' || !gewaehlt, ref });
      bx = r.x;
      by = r.y;
    }
    if (q.nr) {
      aus.push({ k: 'kreis', x: begrenzt(bx, fs, W - fs), y: begrenzt(by, fs, H - fs), r: fs * (gewaehlt ? 0.95 : 0.75), fill: farbe, stroke: '#ffffff', sw: fs * 0.12, op: blass ? 0.6 : 1, ref });
      aus.push({ k: 'text', x: begrenzt(bx, fs, W - fs), y: begrenzt(by, fs, H - fs) + fs * 0.32, lines: [(q.frage ? '?' : '') + q.nr], fs: fs * (gewaehlt ? 0.95 : 0.8), fill: '#ffffff', mitte: true, fett: true, ref });
    }
  }
  return aus;
}

export function leinwandFormen(g: CanvasRenderingContext2D, liste: RenderedShape[], sx: number, sy: number): void {
  g.save();
  g.scale(sx, sy);
  for (const f of liste) {
    g.globalAlpha = f.op != null ? f.op : 1;
    g.setLineDash(f.strich ? [(f.sw || 2) * 3, (f.sw || 2) * 2] : []);
    if (f.k === 'rect') {
      g.beginPath();
      if (typeof g.roundRect === 'function') g.roundRect(f.x || 0, f.y || 0, Math.max(1, f.w || 1), Math.max(1, f.h || 1), f.rx || 0);
      else g.rect(f.x || 0, f.y || 0, f.w || 1, f.h || 1);
      if (f.fill && f.fill !== 'none') {
        g.fillStyle = f.fill;
        g.fill();
      }
      g.globalAlpha = f.op != null && f.fill === 'none' ? f.op : 1;
      if (f.stroke) {
        g.strokeStyle = f.stroke;
        g.lineWidth = f.sw || 2;
        g.stroke();
      }
    } else if (f.k === 'line') {
      g.beginPath();
      g.moveTo(f.x1 || 0, f.y1 || 0);
      g.lineTo(f.x2 || 0, f.y2 || 0);
      g.strokeStyle = f.stroke || '#000';
      g.lineWidth = f.sw || 2;
      g.lineCap = 'round';
      g.stroke();
    } else if (f.k === 'pfad' && f.pts) {
      g.beginPath();
      f.pts.forEach((p, n) => (n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.strokeStyle = f.stroke || '#000';
      g.lineWidth = f.sw || 2;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.stroke();
    } else if (f.k === 'poly' && f.pts) {
      g.beginPath();
      f.pts.forEach((p, n) => (n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.closePath();
      g.fillStyle = f.fill || '#000';
      g.fill();
    } else if (f.k === 'kreis') {
      g.beginPath();
      g.arc(f.x || 0, f.y || 0, f.r || 4, 0, Math.PI * 2);
      g.fillStyle = f.fill || '#000';
      g.fill();
      if (f.stroke) {
        g.strokeStyle = f.stroke;
        g.lineWidth = f.sw || 2;
        g.stroke();
      }
    } else if (f.k === 'text' && f.lines) {
      g.fillStyle = f.fill || '#000';
      g.font = `${f.fett ? '700 ' : '400 '}${f.fs || 16}px "Plus Jakarta Sans", Calibri, system-ui, sans-serif`;
      g.textAlign = f.mitte ? 'center' : 'left';
      f.lines.forEach((l, n) => g.fillText(l, f.x || 0, (f.y || 0) + n * (f.fs || 16) * 1.18));
    }
  }
  g.restore();
}
