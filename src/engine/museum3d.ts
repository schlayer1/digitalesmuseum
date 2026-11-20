import { HallSlot, SaalStil } from '../types/museum';

const H = 4.2;
const HB = 3;
const TB = 1.1;
const TH = 3.0;
const AUGE = 1.65;
const PY = 1.72;
const ABSTAND = 1.8;
const WEIT = 400;
const NL = 12;

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Plus Jakarta Sans", Calibri, "Segoe UI", system-ui, -apple-system, sans-serif';

interface SaalThemeConfig {
  nebel: string;
  dichte: number;
  ambO: [number, number, number];
  ambU: [number, number, number];
  licht: [number, number, number];
  spiegel: number;
  boden: 'parkett' | 'beton' | 'dunkel';
  wand: 'stoff' | 'putz';
  decke: string;
  sockel: string;
  leiste: string;
  rahmen: string;
  glanz: number;
  rahmenB: number;
  passe: string;
  passeB: number;
  oberlicht: [number, number, number];
  oberlichtE: number;
  schiene: string;
  banner: [string, string, string];
  schild: [string, string];
  fassade: string;
  grund: string;
  fassadeE: number;
  aussen: {
    ambO: [number, number, number];
    ambU: [number, number, number];
    sonneD: [number, number, number];
    sonneC: [number, number, number];
    horizont: string;
    dichte: number;
  };
  himmel: 'tag' | 'hell' | 'nacht';
  dach: string;
  rasen: string;
  baum: string;
  hecke: string;
  tuer: string;
  laterne: number;
  aufhell: number;
  fries: string;
}

const STIL: Record<SaalStil, SaalThemeConfig> = {
  klassisch: {
    nebel: '#24180f',
    dichte: 0.028,
    ambO: [0.62, 0.56, 0.5],
    ambU: [0.26, 0.21, 0.17],
    licht: [1.7, 1.48, 1.12],
    spiegel: 0.14,
    boden: 'parkett',
    wand: 'stoff',
    decke: '#eee4d2',
    sockel: '#2b1d12',
    leiste: '#e3d3b0',
    rahmen: '#c9a24a',
    glanz: 1.4,
    rahmenB: 0.075,
    passe: '#f7f1e3',
    passeB: 0.07,
    oberlicht: [1.0, 0.97, 0.9],
    oberlichtE: 1.0,
    schiene: '#2a2522',
    banner: ['#8f1f2b', '#5f121b', '#fff3dc'],
    schild: ['#f5ecd9', '#2b2016'],
    fassade: '#e7dcc6',
    grund: '#b4ac9b',
    fassadeE: 0.12,
    aussen: {
      ambO: [0.62, 0.66, 0.74],
      ambU: [0.34, 0.31, 0.28],
      sonneD: [-0.42, 0.72, 0.55],
      sonneC: [0.8, 0.74, 0.62],
      horizont: '#d8e8f3',
      dichte: 0.009,
    },
    himmel: 'tag',
    dach: '#6f8478',
    rasen: '#5b7a3e',
    baum: '#3d6a31',
    hecke: '#35592b',
    tuer: '#5a3219',
    laterne: 0.55,
    aufhell: 0.3,
    fries: '#4a3a28',
  },
  modern: {
    nebel: '#e9e6e0',
    dichte: 0.016,
    ambO: [0.9, 0.9, 0.91],
    ambU: [0.6, 0.59, 0.58],
    licht: [0.85, 0.83, 0.78],
    spiegel: 0.24,
    boden: 'beton',
    wand: 'putz',
    decke: '#fbfbfa',
    sockel: '#d4cfc7',
    leiste: '#ffffff',
    rahmen: '#1d1d1d',
    glanz: 0.35,
    rahmenB: 0.026,
    passe: '#ffffff',
    passeB: 0.13,
    oberlicht: [1.0, 1.0, 1.0],
    oberlichtE: 1.15,
    schiene: '#e6e3de',
    banner: ['#0B7BA7', '#004C6A', '#ffffff'],
    schild: ['#ffffff', '#26221d'],
    fassade: '#f1efea',
    grund: '#c9c4bb',
    fassadeE: 0.12,
    aussen: {
      ambO: [0.7, 0.72, 0.77],
      ambU: [0.42, 0.42, 0.42],
      sonneD: [-0.42, 0.72, 0.55],
      sonneC: [0.62, 0.62, 0.6],
      horizont: '#e4edf3',
      dichte: 0.008,
    },
    himmel: 'hell',
    dach: '#8b8f93',
    rasen: '#6c8d4b',
    baum: '#4a7838',
    hecke: '#41683a',
    tuer: '#2b2b2b',
    laterne: 0.45,
    aufhell: 0.2,
    fries: '#26221d',
  },
  nacht: {
    nebel: '#040508',
    dichte: 0.05,
    ambO: [0.13, 0.14, 0.19],
    ambU: [0.05, 0.05, 0.065],
    licht: [2.5, 2.15, 1.6],
    spiegel: 0.22,
    boden: 'dunkel',
    wand: 'stoff',
    decke: '#1a1c22',
    sockel: '#050506',
    leiste: '#2a2c34',
    rahmen: '#0d0d10',
    glanz: 0.6,
    rahmenB: 0.05,
    passe: '#f2f0ea',
    passeB: 0.08,
    oberlicht: [0.14, 0.2, 0.4],
    oberlichtE: 0.7,
    schiene: '#0c0c0e',
    banner: ['#1b2c4a', '#0c1526', '#e9e4da'],
    schild: ['#1b1d24', '#e9e4da'],
    fassade: '#8d93a2',
    grund: '#3a3836',
    fassadeE: 0.04,
    aussen: {
      ambO: [0.08, 0.09, 0.16],
      ambU: [0.03, 0.03, 0.05],
      sonneD: [0.3, 0.7, 0.6],
      sonneC: [0.12, 0.14, 0.24],
      horizont: '#16234a',
      dichte: 0.012,
    },
    himmel: 'nacht',
    dach: '#2a2f3a',
    rasen: '#18241a',
    baum: '#16261a',
    hecke: '#132015',
    tuer: '#3a2312',
    laterne: 2.6,
    aufhell: 1.5,
    fries: '#2a2620',
  },
};

const F = (a: number[]) => new Float32Array(a);
const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const klemm = (z: number, a: number, b: number) => Math.max(a, Math.min(b, z));
const sanft = (t: number) => {
  t = klemm(t, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const winkel = (a: number) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
const zuWinkel = (a: number, b: number, t: number) => a + winkel(b - a) * t;
const richtung = (dx: number, dz: number) => Math.atan2(-dx, -dz);

function mal(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
      o[i * 4 + j] = s;
    }
  }
  return o;
}

function perspektive(fovy: number, asp: number, n: number, f: number): Float32Array {
  const t = 1 / Math.tan(fovy / 2);
  const nf = 1 / (n - f);
  return F([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]);
}

function achsen(yaw: number, pitch: number) {
  const f = [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
  const z = [-f[0], -f[1], -f[2]];
  let x = [z[2], 0, -z[0]];
  const l = Math.hypot(x[0], x[2]) || 1;
  x = [x[0] / l, 0, x[2] / l];
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return { f, x, y, z };
}

function ansicht(e: number[], yaw: number, pitch: number): Float32Array {
  const { x, y, z } = achsen(yaw, pitch);
  const d = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return F([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -d(x, e), -d(y, e), -d(z, e), 1]);
}

function modell(x: number, y: number, z: number, th: number, phi: number, sx: number, sy: number): Float32Array {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  return F([c * cp * sx, sp * sx, -s * cp * sx, 0, -c * sp * sy, cp * sy, s * sp * sy, 0, s, 0, c, 0, x, y, z, 1]);
}

const EINS = modell(0, 0, 0, 0, 0, 1, 1);

function leinwand(w: number, h: number, zeichnen: (g: CanvasRenderingContext2D, w: number, h: number) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  zeichnen(g, w, h);
  return c;
}

function zeilen(g: CanvasRenderingContext2D, text: string, breite: number, max: number): string[] {
  const woerter = String(text || '').split(/\s+/).filter(Boolean);
  const z: string[] = [];
  let akt = '';
  for (const w of woerter) {
    const t = akt ? akt + ' ' + w : w;
    if (!akt || g.measureText(t).width <= breite) akt = t;
    else {
      z.push(akt);
      akt = w;
    }
  }
  if (akt) z.push(akt);
  const kuerzen = (l: string) => {
    while (l.length > 1 && g.measureText(l + '…').width > breite) l = l.slice(0, -1);
    return l + '…';
  };
  if (z.length > max) {
    z.length = max;
    z[max - 1] = kuerzen(z[max - 1]);
  }
  return z.map((l) => (g.measureText(l).width <= breite ? l : kuerzen(l)));
}

function rund(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function rauschen(g: CanvasRenderingContext2D, w: number, h: number, staerke: number) {
  const d = g.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const r = (Math.random() - 0.5) * staerke;
    d.data[i] += r;
    d.data[i + 1] += r;
    d.data[i + 2] += r;
  }
  g.putImageData(d, 0, 0);
}

function dielen(dunkel: boolean) {
  return leinwand(1024, 1024, (g, w, h) => {
    const sp = 16;
    const b = w / sp;
    for (let s = 0; s < sp; s++) {
      let y = Math.random() * h;
      const ende = y + h;
      while (y < ende) {
        const l = 380 + Math.random() * 260;
        const t = Math.random();
        const farbe = dunkel ? [52 + t * 18, 40 + t * 12, 31 + t * 9] : [168 + t * 34, 118 + t * 26, 72 + t * 18];
        for (const dy of [0, -h]) {
          g.fillStyle = 'rgb(' + farbe.map(Math.round).join(',') + ')';
          g.fillRect(s * b, y + dy, b, l);
          g.strokeStyle = dunkel ? 'rgba(0,0,0,.25)' : 'rgba(70,40,15,.18)';
          g.lineWidth = 1.2;
          for (let k = 0; k < 7; k++) {
            const x = s * b + 4 + Math.random() * (b - 8);
            g.beginPath();
            g.moveTo(x, y + dy);
            g.bezierCurveTo(x + 3, y + dy + l * 0.3, x - 3, y + dy + l * 0.6, x + 1, y + dy + l);
            g.stroke();
          }
          g.fillStyle = 'rgba(0,0,0,.45)';
          g.fillRect(s * b, y + dy, b, 2);
        }
        y += l;
      }
      g.fillStyle = 'rgba(0,0,0,.4)';
      g.fillRect(s * b, 0, 2, h);
    }
    rauschen(g, w, h, 10);
  });
}

function beton() {
  return leinwand(1024, 1024, (g, w, h) => {
    g.fillStyle = '#d2cdc5';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 40 + Math.random() * 160;
      const hell = Math.random() < 0.5;
      for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
        const v = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        v.addColorStop(0, hell ? 'rgba(255,255,255,.12)' : 'rgba(90,80,70,.09)');
        v.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = v;
        g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
    g.fillStyle = 'rgba(0,0,0,.12)';
    g.fillRect(0, 0, w, 2);
    g.fillRect(0, 0, 2, h);
    g.fillRect(0, h / 2, w, 1);
    g.fillRect(w / 2, 0, 1, h);
    rauschen(g, w, h, 14);
  });
}

function wandBild(art: 'stoff' | 'putz') {
  return leinwand(512, 512, (g, w, h) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    if (art === 'stoff') {
      for (let x = 0; x < w; x += 16) {
        g.fillStyle = x % 32 ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.04)';
        g.fillRect(x, 0, 8, h);
      }
    }
    rauschen(g, w, h, art === 'stoff' ? 18 : 8);
  });
}

const deckeBild = () =>
  leinwand(256, 256, (g, w, h) => {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    rauschen(g, w, h, 6);
  });

const weissBild = () =>
  leinwand(4, 4, (g, w, h) => {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
  });

const schattenBild = () =>
  leinwand(128, 128, (g) => {
    g.shadowColor = 'rgba(0,0,0,.85)';
    g.shadowBlur = 16;
    g.shadowOffsetX = 1000;
    g.fillStyle = '#000';
    g.fillRect(-1000 + 26, 26, 76, 76);
  });

const platzhalterBild = () =>
  leinwand(64, 64, (g, w, h) => {
    g.fillStyle = '#d9d3c7';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#cbc4b6';
    for (let i = -64; i < 64; i += 12) {
      g.beginPath();
      g.moveTo(i, 64);
      g.lineTo(i + 64, 0);
      g.lineTo(i + 70, 0);
      g.lineTo(i + 6, 64);
      g.fill();
    }
  });

const steinBild = () =>
  leinwand(1024, 1024, (g, w, h) => {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) {
      for (let k = -1; k < 3; k++) {
        const x = k * 512 + (r % 2) * 256;
        g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.07).toFixed(3) + ')';
        g.fillRect(x, r * 128, 512, 128);
        g.fillStyle = 'rgba(0,0,0,.2)';
        g.fillRect(x, r * 128, 3, 128);
      }
    }
    g.fillStyle = 'rgba(0,0,0,.2)';
    for (let r = 0; r < 8; r++) g.fillRect(0, r * 128, w, 3);
    rauschen(g, w, h, 16);
  });

const pflasterBild = () =>
  leinwand(1024, 1024, (g, w, h) => {
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const t = 225 + Math.random() * 30;
        g.fillStyle = 'rgb(' + [t, t - 3, t - 8].map(Math.round).join(',') + ')';
        g.fillRect(x * 256, y * 256, 256, 256);
      }
    }
    g.fillStyle = 'rgba(0,0,0,.28)';
    for (let k = 0; k < 4; k++) {
      g.fillRect(k * 256, 0, 4, h);
      g.fillRect(0, k * 256, w, 4);
    }
    rauschen(g, w, h, 22);
  });

function himmelBild(art: 'tag' | 'hell' | 'nacht') {
  return leinwand(1024, 512, (g, w, h) => {
    const v = g.createLinearGradient(0, 0, 0, h);
    const stopps: [number, string][] =
      art === 'nacht'
        ? [[0, '#02040d'], [0.6, '#0b1533'], [1, '#16234a']]
        : art === 'hell'
          ? [[0, '#8fb9de'], [1, '#e4edf3']]
          : [[0, '#4f8ccb'], [0.7, '#a8cbe9'], [1, '#d8e8f3']];
    stopps.forEach(([o, c]) => v.addColorStop(o, c));
    g.fillStyle = v;
    g.fillRect(0, 0, w, h);
    if (art === 'nacht') {
      for (let i = 0; i < 420; i++) {
        g.fillStyle = 'rgba(255,255,255,' + (0.25 + Math.random() * 0.75).toFixed(2) + ')';
        const r = Math.random() < 0.08 ? 1.6 : 0.8;
        g.beginPath();
        g.arc(Math.random() * w, Math.random() * h * 0.8, r, 0, 7);
        g.fill();
      }
      const mx = w * 0.7;
      const my = h * 0.24;
      const glanz = g.createRadialGradient(mx, my, 6, mx, my, 90);
      glanz.addColorStop(0, 'rgba(230,236,255,.45)');
      glanz.addColorStop(1, 'rgba(230,236,255,0)');
      g.fillStyle = glanz;
      g.fillRect(mx - 90, my - 90, 180, 180);
      g.fillStyle = '#f2f1e8';
      g.beginPath();
      g.arc(mx, my, 17, 0, 7);
      g.fill();
      return;
    }
    g.shadowColor = 'rgba(255,255,255,' + (art === 'hell' ? 0.6 : 0.85) + ')';
    g.shadowBlur = 22;
    g.shadowOffsetX = 3000;
    g.fillStyle = '#000';
    for (let i = 0; i < (art === 'hell' ? 7 : 13); i++) {
      const cx = Math.random() * w;
      const cy = 40 + Math.random() * h * 0.5;
      const s = 0.6 + Math.random() * 0.9;
      for (const ox of [-w, 0, w]) {
        for (let k = 0; k < 6; k++) {
          g.beginPath();
          g.ellipse(cx + ox - 3000 + (k - 2.5) * 26 * s, cy + Math.sin(k * 1.7) * 7 * s, 34 * s, 17 * s, 0, 0, 7);
          g.fill();
        }
      }
    }
  });
}

let gehtWert: boolean | null = null;
export function isWebGLAvailable(): boolean {
  if (gehtWert !== null) return gehtWert;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    gehtWert = !!gl;
    const weg = gl && gl.getExtension('WEBGL_lose_context');
    if (weg) weg.loseContext();
  } catch {
    gehtWert = false;
  }
  return gehtWert;
}

const VS = `
attribute vec3 aP; attribute vec3 aN; attribute vec2 aT; attribute vec3 aC; attribute vec2 aM;
uniform mat4 uPV; uniform mat4 uM; uniform float uSp;
varying vec3 vP; varying vec3 vN; varying vec2 vT; varying vec3 vC; varying vec2 vM;
void main() {
  vec4 w = uM * vec4(aP, 1.0); w.y *= uSp;
  vec3 n = (uM * vec4(aN, 0.0)).xyz; n.y *= uSp;
  vP = w.xyz; vN = n; vT = aT; vC = aC; vM = aM;
  gl_Position = uPV * w;
}`;

const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define NL ${NL}
uniform sampler2D uTex; uniform vec3 uCam; uniform vec3 uAmbO; uniform vec3 uAmbU; uniform vec3 uNebel; uniform float uDichte;
uniform float uHell; uniform float uAlpha; uniform float uEmis; uniform float uEcht; uniform vec3 uSonneD; uniform vec3 uSonneC;
uniform vec3 uLp[NL]; uniform vec3 uLd[NL]; uniform vec3 uLc[NL]; uniform int uLn;
varying vec3 vP; varying vec3 vN; varying vec2 vT; varying vec3 vC; varying vec2 vM;
void main() {
  vec4 t = texture2D(uTex, vT);
  vec3 grund = t.rgb * vC;
  vec3 n = normalize(vN);
  vec3 v = normalize(uCam - vP);
  vec3 farbe = mix(uAmbU, uAmbO, n.y * 0.5 + 0.5) * grund;
  for (int i = 0; i < NL; i++) {
    if (i >= uLn) break;
    vec3 L = uLp[i] - vP; float d = length(L); L /= d;
    float kegel = smoothstep(0.80, 0.94, dot(-L, uLd[i]));
    if (kegel <= 0.0) continue;
    float nd = max(dot(n, L), 0.0);
    float ab = 1.0 / (1.0 + 0.09 * d * d);
    vec3 hv = normalize(L + v);
    float gz = pow(max(dot(n, hv), 0.0), 48.0) * vM.y;
    farbe += uLc[i] * kegel * ab * (nd * grund + gz * nd);
  }
  farbe += uSonneC * max(dot(n, uSonneD), 0.0) * grund;
  farbe += grund * (vM.x + uEmis);
  farbe = mix(farbe, grund, uEcht);
  farbe *= uHell;
  float f = 1.0 - exp(-uDichte * length(uCam - vP));
  gl_FragColor = vec4(mix(farbe, uNebel, f), t.a * uAlpha);
}`;

export interface TafelPayload {
  titel: string;
  name: string;
  zahlen: string;
  seite: string;
}

export interface EingangPayload {
  titel: string;
  anzahl: string;
  hinweis: string;
}

export interface AusgangPayload {
  titel: string;
  zahlen: string;
}

export interface ZettelPayload {
  id: string;
  name: string;
  text: string;
  frage: boolean;
  antwort: string;
}

export interface Museum3DOptions {
  saal: SaalStil;
  wandfarbe: (raum: number) => string;
  ruhig?: boolean;
  gesperrt?: () => boolean;
  zettelPlatz?: () => boolean;
  logo?: string;
  ueber?: (u: string, g: CanvasRenderingContext2D, w: number, h: number, bw: number, bh: number) => void;
  aktiv?: () => boolean;
  beiTipp?: (slotIdx: number) => void;
  beiStation?: (slotIdx: number) => void;
  beiFrei?: () => void;
  beiAusgang?: () => void;
  beiBeruehrung?: () => void;
  beiVerlust?: () => void;
}

export interface Museum3DController {
  bauen: (liste: HallSlot[]) => void;
  groesse: () => void;
  gehe: (i: number, gleiten: boolean) => void;
  hinaus: (fertig: () => void) => void;
  draussen: () => void;
  eintreten: (i: number, fertig?: () => void) => void;
  steht: () => boolean;
  bilder: (cur: number, urlFn: (slotIdx: number) => string, beamer: boolean) => void;
  stick: (s: { vor: number; seit: number; dreh: number; neig: number } | null) => void;
  tafel: (i: number, d: TafelPayload) => void;
  eingang: (d: EingangPayload) => void;
  ausgang: (d: AusgangPayload) => void;
  zettel: (i: number, liste: ZettelPayload[]) => void;
  weg: () => void;
}

export function createMuseum3D(can: HTMLCanvasElement, o: Museum3DOptions): Museum3DController {
  const opt: WebGLContextAttributes = { antialias: true, alpha: false, powerPreference: 'high-performance', stencil: true };
  const glCtx = (can.getContext('webgl2', opt) || can.getContext('webgl', opt)) as WebGLRenderingContext | null;
  if (!glCtx) throw new Error('WebGL nicht verfügbar');
  const gl: WebGLRenderingContext = glCtx;

  const st = STIL[o.saal] || STIL.klassisch;
  const ruhig = !!o.ruhig;

  const shader = (art: number, quelle: string) => {
    const s = gl.createShader(art)!;
    gl.shaderSource(s, quelle);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'Shader-Fehler');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  ['aP', 'aN', 'aT', 'aC', 'aM'].forEach((a, i) => gl.bindAttribLocation(prog, i, a));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'Link-Fehler');
  gl.useProgram(prog);

  const U: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['uPV', 'uM', 'uSp', 'uTex', 'uCam', 'uAmbO', 'uAmbU', 'uNebel', 'uDichte', 'uHell', 'uAlpha', 'uEmis', 'uEcht', 'uSonneD', 'uSonneC', 'uLp', 'uLd', 'uLc', 'uLn']) {
    U[n] = gl.getUniformLocation(prog, n);
  }
  for (let i = 0; i < 5; i++) gl.enableVertexAttribArray(i);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform1i(U.uTex, 0);
  gl.uniform3fv(U.uAmbO, st.ambO);
  gl.uniform3fv(U.uAmbU, st.ambU);
  gl.uniform3fv(U.uNebel, hex(st.nebel));
  gl.uniform1f(U.uDichte, st.dichte);

  const aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
  const anisoMax = aniso ? Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) : 0;
  const texMax = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

  function textur(quelle: HTMLCanvasElement, wiederholen = false, t?: WebGLTexture | null): WebGLTexture {
    const tex = t || gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, quelle);
    const wrap = wiederholen ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (aniso && anisoMax) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, anisoMax);
    return tex;
  }

  const T = {
    boden: textur(st.boden === 'beton' ? beton() : dielen(st.boden === 'dunkel'), true),
    wand: textur(wandBild(st.wand), true),
    decke: textur(deckeBild(), true),
    weiss: textur(weissBild(), true),
    schatten: textur(schattenBild()),
    platz: textur(platzhalterBild()),
    stein: textur(steinBild(), true),
    pflaster: textur(pflasterBild(), true),
    himmel: textur(himmelBild(st.himmel), true),
  };
  const SKALA = { boden: 2.4, wand: 2, decke: 2.4 };

  function netz() {
    const d: number[] = [];
    const ecke = (p: number[], n: number[], t: number[], c: number[], m: number[]) =>
      d.push(p[0], p[1], p[2], n[0], n[1], n[2], t[0], t[1], c[0], c[1], c[2], m[0], m[1]);
    const uvVon = (p: number[], art: string, sk: number) =>
      art === 'xz' ? [p[0] / sk, -p[2] / sk] : art === 'zy' ? [-p[2] / sk, p[1] / sk] : [p[0] / sk, p[1] / sk];
    return {
      d,
      vier(a: number[], b: number[], c: number[], e: number[], n: number[], farbe: number[], welt: string | null = null, sk = 1, m: [number, number] = [0, 0]) {
        const uv = welt ? [a, b, c, e].map((p) => uvVon(p, welt, sk)) : [[0, 0], [1, 0], [1, 1], [0, 1]];
        [
          [a, uv[0]],
          [b, uv[1]],
          [c, uv[2]],
          [a, uv[0]],
          [c, uv[2]],
          [e, uv[3]],
        ].forEach(([p, t]) => ecke(p, n, t, farbe, m));
      },
      saeule(cx: number, cz: number, r: number, y0: number, y1: number, farbe: number[], m: [number, number]) {
        const n = 20;
        for (let k = 0; k < n; k++) {
          const a0 = (k / n) * 2 * Math.PI;
          const a1 = ((k + 1) / n) * 2 * Math.PI;
          const am = (a0 + a1) / 2;
          const f = k % 2 ? farbe : farbe.map((v) => v * 0.93);
          this.vier(
            [cx + Math.sin(a0) * r, y0, cz + Math.cos(a0) * r],
            [cx + Math.sin(a1) * r, y0, cz + Math.cos(a1) * r],
            [cx + Math.sin(a1) * r * 0.9, y1, cz + Math.cos(a1) * r * 0.9],
            [cx + Math.sin(a0) * r * 0.9, y1, cz + Math.cos(a0) * r * 0.9],
            [Math.sin(am), 0.05, Math.cos(am)],
            f,
            null,
            0,
            m
          );
        }
      },
      kegel(cx: number, y0: number, cz: number, r: number, h: number, farbe: number[]) {
        const n = 9;
        const l = Math.hypot(r, h);
        for (let k = 0; k < n; k++) {
          const a0 = (k / n) * 2 * Math.PI;
          const a1 = ((k + 1) / n) * 2 * Math.PI;
          const am = (a0 + a1) / 2;
          const b0 = [cx + Math.sin(a0) * r, y0, cz + Math.cos(a0) * r];
          const b1 = [cx + Math.sin(a1) * r, y0, cz + Math.cos(a1) * r];
          const sp = [cx, y0 + h, cz];
          const f = farbe.map((v) => v * (0.9 + (k % 3) * 0.06));
          this.vier(b0, b1, sp, sp, [(Math.sin(am) * h) / l, r / l, (Math.cos(am) * h) / l], f, null, 0, [0, 0.1]);
          this.vier(b1, b0, [cx, y0, cz], [cx, y0, cz], [0, -1, 0], f.map((v) => v * 0.5), null, 0, [0, 0]);
        }
      },
      kiste(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, farbe: number[], m: [number, number] = [0, 0]) {
        this.vier([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], farbe, null, 0, m);
        this.vier([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], farbe, null, 0, m);
        this.vier([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], farbe, null, 0, m);
        this.vier([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], farbe, null, 0, m);
        this.vier([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], farbe, null, 0, m);
        this.vier([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], farbe, null, 0, m);
      },
    };
  }

  interface BufferMesh {
    b: WebGLBuffer;
    n: number;
  }

  function puffer(d: number[]): BufferMesh {
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, F(d), gl.STATIC_DRAW);
    return { b, n: d.length / 13 };
  }

  const wegPuffer = (p: BufferMesh | null) => {
    if (p) gl.deleteBuffer(p.b);
  };

  const HIMMEL = (() => {
    const n = netz();
    const k = 48;
    for (let i = 0; i < k; i++) {
      const a0 = (i / k) * 2 * Math.PI;
      const a1 = ((i + 1) / k) * 2 * Math.PI;
      const u0 = (i / k) * 2;
      const u1 = ((i + 1) / k) * 2;
      const p = (a: number, y: number) => [Math.sin(a) * 160, y, Math.cos(a) * 160];
      const d = n.d;
      const e = (q: number[], u: number, v: number) => d.push(q[0], q[1], q[2], 0, 0, 1, u, v, 1, 1, 1, 0, 0);
      e(p(a0, -25), u0, 0.01);
      e(p(a1, -25), u1, 0.01);
      e(p(a1, 320), u1, 0.99);
      e(p(a0, -25), u0, 0.01);
      e(p(a1, 320), u1, 0.99);
      e(p(a0, 320), u0, 0.99);
    }
    return puffer(n.d);
  })();

  const QUAD = (() => {
    const n = netz();
    n.vier([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [0, 0, 1], [1, 1, 1]);
    return puffer(n.d);
  })();

  interface Pose {
    x: number;
    z: number;
    yaw: number;
    pitch: number;
  }

  interface ExpEntry {
    i: number;
    nr: number;
    id: string;
    s: number;
    x: number;
    z: number;
    th: number;
    raum: number;
    aspekt: number;
    w: number;
    h: number;
    oben: number;
    tafelY: number;
    halb: number;
    rahmen: BufferMesh | null;
    url: string;
    tafelT: WebGLTexture | null;
    tafelKey: string;
    blink?: number;
  }

  const cam = { x: 0, z: -1, yaw: 0, pitch: 0.1 };
  let fovY = 1;
  let asp = 1;
  let bob = 0;
  let tw: any = null;
  let aktuell = -1;
  let laufen = false;
  let weg = false;
  let plaetze: HallSlot[] = [];
  let exp: ExpEntry[] = [];
  let posen: Pose[] = [];
  let durchgaenge = [0];
  let zEnde = -10;
  let statisch: { p: BufferMesh; t: WebGLTexture }[] = [];
  let boden: BufferMesh | null = null;
  let lichter: { p: number[]; d: number[]; ex: ExpEntry | null; staerke?: number }[] = [];
  let aussen: { p: BufferMesh; t: WebGLTexture }[] = [];
  let tuerL: BufferMesh | null = null;
  let tuerR: BufferMesh | null = null;
  let fries: WebGLTexture | null = null;
  let fahne: WebGLTexture | null = null;
  let emblem: WebGLTexture | null = null;
  let logoImg: HTMLImageElement | null = null;
  let draussenModus = false;
  let warten = false;
  const tuer = { w: 1, von: 1, ziel: 1, t0: 0 };

  const bodenH = (z: number) => (z > 3.85 ? 0 : z > 2.75 ? ((3.85 - z) / 1.1) * 0.45 : z > 0.2 ? 0.45 : z > -0.8 ? 0.45 * (z + 0.8) : 0);
  const augeY = () => AUGE + bodenH(cam.z) + bob;

  let schilder: { t: WebGLTexture; M: Float32Array; emis: number }[] = [];
  let banner: { key: string; daten: EingangPayload; t: WebGLTexture; hoehe: number } | null = null;
  let ausgang: { key: string; daten: AusgangPayload; t: WebGLTexture } | null = null;
  let zettelState: { i: number; key: string; liste: { id: string; t: WebGLTexture; t0: number; dreh: number }[] } = { i: -1, key: '', liste: [] };

  const tasten: Record<string, boolean> = {};
  const stick = { vor: 0, seit: 0, dreh: 0, neig: 0 };
  const cache = new Map<string, { stufe: number; t: WebGLTexture | null; laden: number; nr?: number; aspekt?: number }>();
  const aspekte = new Map<string, number>();
  let erzeugt = 0;

  const wand = (ex: ExpEntry, u: number, v: number, n: number): [number, number, number] => {
    const c = Math.cos(ex.th);
    const s = Math.sin(ex.th);
    return [ex.x + c * u + s * n, v, ex.z - s * u + c * n];
  };

  function rahmenNetz(w: number, h: number): BufferMesh {
    const n = netz();
    const rb = st.rahmenB;
    const pb = st.passeB;
    const fc = hex(st.rahmen);
    const m: [number, number] = [0.04, st.glanz];
    const W2 = w / 2 + pb;
    const H2 = h / 2 + pb;
    const t = 0.055;
    n.vier([-W2, -H2, 0.03], [W2, -H2, 0.03], [W2, H2, 0.03], [-W2, H2, 0.03], [0, 0, 1], hex(st.passe), null, 0, [0.06, 0]);
    n.kiste(-W2 - rb, -H2 - rb, 0, W2 + rb, -H2, t, fc, m);
    n.kiste(-W2 - rb, H2, 0, W2 + rb, H2 + rb, t, fc, m);
    n.kiste(-W2 - rb, -H2, 0, -W2, H2, t, fc, m);
    n.kiste(W2, -H2, 0, W2 + rb, H2, t, fc, m);
    if (rb > 0.04) {
      const ic = fc.map((v) => Math.min(1, v * 1.25));
      n.kiste(-W2 - 0.012, -H2 - 0.012, t, W2 + 0.012, -H2, t + 0.012, ic, m);
      n.kiste(-W2 - 0.012, H2, t, W2 + 0.012, H2 + 0.012, t + 0.012, ic, m);
      n.kiste(-W2 - 0.012, -H2, t, -W2, H2, t + 0.012, ic, m);
      n.kiste(W2, -H2, t, W2 + 0.012, H2, t + 0.012, ic, m);
    }
    return puffer(n.d);
  }

  function masse(e: ExpEntry) {
    const mw = st.passeB > 0.1 ? 1.55 : 1.7;
    const mh = 1.42;
    if (e.aspekt > mw / mh) {
      e.w = mw;
      e.h = mw / e.aspekt;
    } else {
      e.h = mh;
      e.w = mh * e.aspekt;
    }
    wegPuffer(e.rahmen);
    e.rahmen = rahmenNetz(e.w, e.h);
    const rand = st.passeB + st.rahmenB;
    e.oben = PY + e.h / 2 + rand;
    e.tafelY = PY - e.h / 2 - rand - 0.1 - 0.19;
    e.halb = e.w / 2 + rand;
  }

  function pose(e: ExpEntry): Pose {
    const tY = Math.tan(fovY / 2);
    const tX = tY * asp;
    const breit = e.halb * 2 + 0.25 + (o.zettelPlatz && o.zettelPlatz() ? 2.2 : 0);
    const unten = e.tafelY - 0.2;
    const hoch = e.oben - unten + 0.15;
    let d = Math.max(breit / 2 / tX / 0.88, hoch / 2 / tY / 0.84);
    d = klemm(d, 1.3, 5.3);
    const yc = (e.oben + unten) / 2;
    return { x: e.x - e.s * d, z: e.z, yaw: e.s < 0 ? Math.PI / 2 : -Math.PI / 2, pitch: Math.atan2(yc - AUGE, d) };
  }

  function schild(z: number, th: number, text: string) {
    const t = textur(
      leinwand(512, 128, (g, w, h) => {
        const [bg, fg] = st.schild;
        g.fillStyle = bg;
        rund(g, 4, 4, w - 8, h - 8, 10);
        g.fill();
        g.fillStyle = fg;
        g.font = '400 64px ' + SERIF;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(text, w / 2, h / 2 + 4);
      })
    );
    schilder.push({ t, M: modell(0, 3.45, z, th, 0, 1.2, 0.3), emis: 0.25 });
  }

  function ausgangSchild() {
    const t = textur(
      leinwand(512, 128, (g, w, h) => {
        g.fillStyle = '#1b7a3a';
        rund(g, 2, 2, w - 4, h - 4, 12);
        g.fill();
        g.fillStyle = '#fff';
        g.font = '800 70px ' + SANS;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('AUSGANG', w / 2, h / 2 + 4);
      })
    );
    schilder.push({ t, M: modell(-1.2, 3.0, zEnde + 0.03, 0, 0, 1.2, 0.3), emis: 0.9 });
  }

  function renderEmblem() {
    emblem = textur(
      leinwand(1024, 384, (g, w, h) => {
        if (logoImg && logoImg.naturalWidth > 0) {
          const size = 180;
          g.drawImage(logoImg, w / 2 - size / 2, 14, size, size);
        }
        g.fillStyle = st.fries;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.font = '700 64px ' + SERIF;
        g.fillText('H B S   M U S E U M', w / 2, logoImg ? 255 : h / 2 - 20);
        g.font = '600 32px ' + SANS;
        g.fillText('HEIMBÜRGESCHULE KAHLA PRÄSENTIERT', w / 2, logoImg ? 328 : h / 2 + 48);
      }),
      false,
      emblem
    );
  }

  function bannerSetzen(d: EingangPayload, neuBauen = false) {
    if (!neuBauen && banner && banner.key === JSON.stringify(d)) return;
    const BW = 1024;
    const BHMAX = 920;
    const mg = document.createElement('canvas').getContext('2d')!;
    mg.font = '400 84px ' + SERIF;
    const tz = zeilen(mg, d.titel, BW - 120, 2);
    const yA = 188 + tz.length * 88;
    let hz: string[] = [];
    let hg = 30;
    let hl = 36;
    if (d.hinweis) {
      for (hg = 30; hg >= 20; hg -= 2) {
        hl = Math.round(hg * 1.22);
        mg.font = 'italic ' + hg + 'px ' + SANS;
        hz = zeilen(mg, d.hinweis, BW - 170, 40);
        if ((yA + 30 + hz.length * hl + 40) / 0.86 <= BHMAX) break;
      }
      if (hg < 20) hg = 20;
      const platz = Math.floor((BHMAX * 0.86 - yA - 70) / hl);
      if (hz.length > platz) hz = zeilen(mg, d.hinweis, BW - 170, platz);
    }
    const BH = Math.max(512, Math.min(BHMAX, Math.ceil((yA + (hz.length ? 30 + hz.length * hl : 0) + 40) / 0.86)));
    const roh = leinwand(BW, BH, (g, w, h) => {
      const [a, b, fg] = st.banner;
      const v = g.createLinearGradient(0, 0, 0, h);
      v.addColorStop(0, a);
      v.addColorStop(1, b);
      g.fillStyle = v;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(w, 0);
      g.lineTo(w, h * 0.86);
      g.lineTo(w / 2, h);
      g.lineTo(0, h * 0.86);
      g.closePath();
      g.fill();

      g.fillStyle = fg;
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      g.font = '700 24px ' + SANS;
      g.fillText('HEIMBÜRGESCHULE KAHLA PRÄSENTIERT', w / 2, 54);
      g.font = '600 22px ' + SANS;
      g.globalAlpha = 0.85;
      g.fillText('A U S S T E L L U N G', w / 2, 92);
      g.globalAlpha = 1;
      g.font = '400 84px ' + SERIF;
      tz.forEach((l, k) => g.fillText(l, w / 2, 188 + k * 88));
      g.font = '400 32px ' + SANS;
      g.fillText(d.anzahl, w / 2, yA);
      if (hz.length) {
        g.globalAlpha = 0.9;
        g.font = 'italic ' + hg + 'px ' + SANS;
        hz.forEach((l, k) => g.fillText(l, w / 2, yA + 30 + (k + 1) * hl - Math.round(hl * 0.22)));
      }
    });
    const c = BH === 512 ? roh : leinwand(BW, 1024, (g) => g.drawImage(roh, 0, 0, BW, 1024));
    if (banner && banner.t) gl.deleteTexture(banner.t);
    banner = { key: JSON.stringify(d), daten: d, t: textur(c), hoehe: (3.2 * BH) / BW };

    fries = textur(
      leinwand(2048, 256, (g, w, h) => {
        g.fillStyle = st.fassade;
        g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(0,0,0,.12)';
        g.fillRect(0, 0, w, 10);
        g.fillRect(0, h - 10, w, 10);
        g.fillStyle = st.fries;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const titel = String(d.titel || '').toUpperCase();
        let gr = 92;
        do {
          g.font = '400 ' + gr + 'px ' + SERIF;
          gr -= 6;
        } while (gr > 48 && g.measureText(titel).width > w - 180);
        g.font = '700 34px ' + SANS;
        g.fillText('DIE HEIMBÜRGESCHULE KAHLA PRÄSENTIERT DIE AUSSTELLUNG', w / 2, h * 0.25);
        g.font = '400 ' + gr + 'px ' + SERIF;
        g.fillText(zeilen(g, titel, w - 180, 1)[0] || '', w / 2, h * 0.67);
        rauschen(g, w, h, 10);
      }),
      false,
      fries
    );

    fahne = textur(
      leinwand(512, 1024, (g, w, h) => {
        const [a, b, fg] = st.banner;
        const v = g.createLinearGradient(0, 0, 0, h);
        v.addColorStop(0, a);
        v.addColorStop(1, b);
        g.fillStyle = v;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(w, 0);
        g.lineTo(w, h);
        g.lineTo(w / 2, h * 0.9);
        g.lineTo(0, h);
        g.closePath();
        g.fill();
        g.fillStyle = fg;
        g.textAlign = 'center';
        g.font = '700 22px ' + SANS;
        g.fillText('HEIMBÜRGESCHULE', w / 2, 74);
        g.font = '600 24px ' + SANS;
        g.fillText('AUSSTELLUNG', w / 2, 110);
        g.fillRect(w / 2 - 60, 134, 120, 3);
        let gr = 74;
        const woerter = String(d.titel || '').split(/\s+/);
        do {
          g.font = '400 ' + gr + 'px ' + SERIF;
          gr -= 4;
        } while (gr > 38 && woerter.some((x) => g.measureText(x).width > w - 70));
        const z = zeilen(g, d.titel, w - 70, 6);
        z.forEach((l, k) => g.fillText(l, w / 2, 240 + k * (gr + 14)));
        g.font = '400 32px ' + SANS;
        g.globalAlpha = 0.85;
        g.fillText(d.anzahl, w / 2, h - 210);
      }),
      false,
      fahne
    );
    anstossen();
  }

  function ausgangSetzen(d: AusgangPayload, neuBauen = false) {
    if (!neuBauen && ausgang && ausgang.key === JSON.stringify(d)) return;
    const c = leinwand(1024, 512, (g, w, h) => {
      const [bg, fg] = st.schild;
      g.fillStyle = bg;
      rund(g, 6, 6, w - 12, h - 12, 14);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,.2)';
      g.lineWidth = 4;
      g.stroke();
      g.fillStyle = fg;
      g.textAlign = 'center';
      g.font = '600 34px ' + SANS;
      g.globalAlpha = 0.8;
      g.fillText('Danke für deinen Besuch · HBS Kahla', w / 2, 80);
      g.globalAlpha = 1;
      g.font = '400 70px ' + SERIF;
      const z = zeilen(g, d.titel, w - 100, 2);
      z.forEach((l, k) => g.fillText(l, w / 2, 170 + k * 76));
      g.font = '700 40px ' + SANS;
      g.fillText(d.zahlen, w / 2, 190 + z.length * 76);
      g.font = '400 30px ' + SANS;
      g.globalAlpha = 0.75;
      g.fillText('Umdrehen und noch einmal ansehen', w / 2, h - 50);
    });
    if (ausgang && ausgang.t) gl.deleteTexture(ausgang.t);
    ausgang = { key: JSON.stringify(d), daten: d, t: textur(c) };
    anstossen();
  }

  function tafelBild(d: TafelPayload) {
    return leinwand(1024, 384, (g, w, h) => {
      const [bg, fg] = st.schild;
      g.fillStyle = bg;
      rund(g, 6, 6, w - 12, h - 12, 12);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,.22)';
      g.lineWidth = 4;
      g.stroke();
      g.fillStyle = fg;
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      g.font = '700 70px ' + SERIF;
      const z = zeilen(g, d.titel, w - 70, 2);
      const y0 = z.length > 1 ? 80 : 104;
      z.forEach((l, k) => g.fillText(l, w / 2, y0 + k * 72));
      const y = y0 + (z.length - 1) * 72;
      g.font = '400 54px ' + SANS;
      g.globalAlpha = 0.8;
      g.fillText(zeilen(g, d.name, w - 70, 1)[0] || '', w / 2, y + 74);
      g.globalAlpha = 1;
      g.font = '700 54px ' + SANS;
      g.fillText(d.zahlen + (d.seite ? '    ' + d.seite : ''), w / 2, Math.min(h - 30, y + 146));
    });
  }

  function zettelBild(k: ZettelPayload) {
    return leinwand(512, 512, (g, w, h) => {
      g.shadowColor = 'rgba(0,0,0,.35)';
      g.shadowBlur = 18;
      g.shadowOffsetY = 8;
      g.fillStyle = k.frage ? '#ffd9a8' : '#fff6a8';
      g.fillRect(22, 18, w - 44, h - 50);
      g.shadowColor = 'transparent';
      g.fillStyle = '#2c2410';
      g.textAlign = 'left';
      g.textBaseline = 'alphabetic';
      g.font = '700 36px ' + SANS;
      g.globalAlpha = 0.7;
      g.fillText(zeilen(g, (k.frage ? '? ' : '') + k.name, w - 100, 1)[0] || '', 50, 74);
      g.globalAlpha = 1;
      g.font = '400 46px ' + SANS;
      const max = k.antwort ? 4 : 7;
      const z = zeilen(g, k.text, w - 100, max);
      z.forEach((l, n) => g.fillText(l, 50, 130 + n * 52));
      if (k.antwort) {
        const y = 130 + z.length * 52;
        g.strokeStyle = 'rgba(0,0,0,.3)';
        g.setLineDash([8, 6]);
        g.beginPath();
        g.moveTo(50, y - 14);
        g.lineTo(w - 50, y - 14);
        g.stroke();
        g.font = '400 38px ' + SANS;
        zeilen(g, '↳ ' + k.antwort, w - 100, Math.max(1, Math.floor((h - 60 - y) / 44))).forEach((l, n) =>
          g.fillText(l, 50, y + 30 + n * 44)
        );
      }
    });
  }

  function baum(n: ReturnType<typeof netz>, x: number, z: number, k: number) {
    n.kiste(x - 0.16 * k, 0, z - 0.16 * k, x + 0.16 * k, 1.6 * k, z + 0.16 * k, [0.33, 0.23, 0.15], [0, 0]);
    const g = hex(st.baum);
    n.kegel(x, 1.2 * k, z, 1.8 * k, 2.4 * k, g);
    n.kegel(x, 2.3 * k, z, 1.4 * k, 2.1 * k, g.map((v) => v * 1.1));
    n.kegel(x, 3.4 * k, z, 0.95 * k, 1.8 * k, g.map((v) => v * 1.2));
  }

  function tuerNetz(s: number): BufferMesh {
    const n = netz();
    const holz = hex(st.tuer);
    const hell = holz.map((v) => Math.min(1, v * 1.35));
    const x0 = s > 0 ? 0 : -TB;
    const x1 = s > 0 ? TB : 0;
    const a = s > 0 ? 0.15 : -0.95;
    const b = s > 0 ? 0.95 : -0.15;
    n.kiste(x0, 0.45, -0.04, x1, TH, 0.04, holz, [0, 0.3]);
    for (const [y0, y1] of [[0.7, 1.55], [1.8, 2.8]]) {
      n.kiste(a, y0, 0.04, b, y1, 0.065, hell, [0, 0.4]);
      n.kiste(a, y0, -0.065, b, y1, -0.04, hell, [0, 0.4]);
    }
    const kx = s > 0 ? 0.96 : -1.02;
    n.kiste(kx, 1.6, -0.1, kx + 0.06, 1.75, 0.1, [0.85, 0.7, 0.29], [0.15, 1.6]);
    return puffer(n.d);
  }

  function aussenBauen() {
    aussen.forEach((g) => wegPuffer(g.p));
    wegPuffer(tuerL);
    wegPuffer(tuerR);
    const M = netz();
    const A = netz();
    const PF = netz();
    const R = netz();
    const fa = hex(st.fassade);
    const fe: [number, number] = [st.fassadeE, 0.15];
    const dk = (k: number) => fa.map((v) => v * k);
    const zh = zEnde - 0.6;

    for (const [x0, x1, y0, y1] of [[-9, -TB, 0, 8], [TB, 9, 0, 8], [-TB, TB, TH, 8]]) {
      M.vier([x0, y0, 0.2], [x1, y0, 0.2], [x1, y1, 0.2], [x0, y1, 0.2], [0, 0, 1], fa, 'xy', 2.4, fe);
    }
    M.vier([-9, 0, zh], [-9, 0, 0.2], [-9, 8, 0.2], [-9, 8, zh], [-1, 0, 0], dk(0.92), 'zy', 2.4, fe);
    M.vier([9, 0, 0.2], [9, 0, zh], [9, 8, zh], [9, 8, 0.2], [1, 0, 0], dk(0.92), 'zy', 2.4, fe);
    A.kiste(-9.3, 7.8, zh - 0.1, 9.3, 8.15, 0.5, dk(0.95), fe);
    for (const [x0, x1] of [[-9.1, -TB - 0.25], [TB + 0.25, 9.1]]) A.kiste(x0, 0, 0.2, x1, 0.5, 0.32, dk(0.82), fe);
    A.kiste(-9.1, 0, zh, -9, 0.5, 0.32, dk(0.82), fe);
    A.kiste(9, 0, zh, 9.1, 0.5, 0.32, dk(0.82), fe);

    // Podest, Stufen, Schwelle
    A.kiste(-6.0, 0, 0.2, 6.0, 0.45, 2.75, dk(0.93), fe);
    A.kiste(-6.3, 0, 2.75, 6.3, 0.3, 3.3, dk(0.9), fe);
    A.kiste(-6.6, 0, 3.3, 6.6, 0.15, 3.85, dk(0.87), fe);
    A.kiste(-TB, 0, 0.12, TB, 0.45, 0.2, dk(0.78), fe);

    // Türrahmen
    A.kiste(-TB - 0.25, 0.45, 0.2, -TB, TH + 0.3, 0.34, dk(0.86), fe);
    A.kiste(TB, 0.45, 0.2, TB + 0.25, TH + 0.3, 0.34, dk(0.86), fe);
    A.kiste(-TB - 0.4, TH, 0.2, TB + 0.4, TH + 0.4, 0.38, dk(0.86), fe);

    // Säulen
    for (const x of [-4.5, -1.9, 1.9, 4.5]) {
      A.kiste(x - 0.5, 0.45, 1.55, x + 0.5, 0.68, 2.55, dk(0.95), fe);
      A.kiste(x - 0.43, 0.68, 1.62, x + 0.43, 0.8, 2.48, dk(0.98), fe);
      A.saeule(x, 2.05, 0.37, 0.8, 6.05, fa, fe);
      A.kiste(x - 0.44, 6.05, 1.61, x + 0.44, 6.18, 2.49, dk(0.98), fe);
      A.kiste(x - 0.52, 6.18, 1.53, x + 0.52, 6.45, 2.57, dk(0.95), fe);
    }

    // Gebälk, Giebel, Dach
    A.kiste(-5.3, 6.45, 0.2, 5.3, 7.3, 2.55, dk(0.97), fe);
    A.kiste(-5.55, 7.3, 0.2, 5.55, 7.45, 2.75, dk(0.9), fe);
    A.vier([-5.4, 7.45, 2.6], [5.4, 7.45, 2.6], [0, 9.0, 2.6], [0, 9.0, 2.6], [0, 0, 1], dk(0.97), null, 0, fe);
    const dach = hex(st.dach);
    const sl = Math.atan2(1.7, 5.7);
    const nx = Math.sin(sl);
    const ny = Math.cos(sl);
    A.vier([-5.75, 7.42, 2.8], [0, 9.12, 2.8], [0, 9.12, 0.2], [-5.75, 7.42, 0.2], [-nx, ny, 0], dach, null, 0, [0, 0.3]);
    A.vier([0, 9.12, 2.8], [5.75, 7.42, 2.8], [5.75, 7.42, 0.2], [0, 9.12, 0.2], [nx, ny, 0], dach, null, 0, [0, 0.3]);

    // Laternen & Fahnenstangen
    for (const x of [-1.75, 1.75]) {
      A.kiste(x - 0.12, 2.3, 0.34, x + 0.12, 2.72, 0.56, [1, 0.88, 0.62], [st.laterne, 0]);
      A.kiste(x - 0.16, 2.72, 0.32, x + 0.16, 2.8, 0.6, [0.12, 0.11, 0.1], [0, 0.5]);
      A.kiste(x - 0.03, 2.1, 0.2, x + 0.03, 2.3, 0.45, [0.12, 0.11, 0.1], [0, 0.5]);
    }
    for (const x of [-3.2, 3.2]) A.kiste(x - 0.78, 5.62, 1.0, x + 0.78, 5.68, 1.1, [0.2, 0.18, 0.16], [0, 0.8]);

    // Vorplatz, Rasen, Hecken, Bäume
    PF.vier([-7, 0, 40], [7, 0, 40], [7, 0, 0.2], [-7, 0, 0.2], [0, 1, 0], hex(st.grund), 'xz', 2.4, [0, 0.15]);
    const ra = hex(st.rasen);
    R.vier([-90, 0, 90], [-7, 0, 90], [-7, 0, -110], [-90, 0, -110], [0, 1, 0], ra, 'xz', 5);
    R.vier([7, 0, 90], [90, 0, 90], [90, 0, -110], [7, 0, -110], [0, 1, 0], ra, 'xz', 5);
    R.vier([-7, 0, 90], [7, 0, 90], [7, 0, 40], [-7, 0, 40], [0, 1, 0], ra, 'xz', 5);
    const he = hex(st.hecke);
    for (const s of [-1, 1]) {
      A.kiste(s > 0 ? 6.9 : -7.7, 0, 4.4, s > 0 ? 7.7 : -6.9, 0.85, 22, he, [0.02, 0.05]);
      for (const [x, z, k] of [[9.6, 7, 1], [12.5, 12, 1.25], [9.2, 17, 0.95], [14, 22, 1.4], [10.5, 27, 1.1]]) {
        baum(A, s * x, z, k);
      }
    }
    aussen = [
      { p: puffer(M.d), t: T.stein },
      { p: puffer(A.d), t: T.weiss },
      { p: puffer(PF.d), t: T.pflaster },
      { p: puffer(R.d), t: T.wand },
    ];
    tuerL = tuerNetz(1);
    tuerR = tuerNetz(-1);
    if (!emblem) renderEmblem();
  }

  function bauen(liste: HallSlot[]) {
    plaetze = liste;
    statisch.forEach((g) => wegPuffer(g.p));
    wegPuffer(boden);
    aussen.forEach((g) => wegPuffer(g.p));
    wegPuffer(tuerL);
    wegPuffer(tuerR);
    exp.forEach((e) => {
      wegPuffer(e.rahmen);
      if (e.tafelT) gl.deleteTexture(e.tafelT);
    });
    schilder.forEach((s) => gl.deleteTexture(s.t));
    schilder = [];
    exp = [];
    posen = [];
    lichter = [];

    let z = -5.2;
    let raum = 0;
    let letzteZ = -3.4;
    const trenn: { z: number; raum: number; nach: number }[] = [];

    liste.forEach((p, i) => {
      if (p.art === 'tuer' && p.nach !== undefined) {
        const zb = letzteZ - 2.3;
        trenn.push({ z: zb, raum: p.raum, nach: p.nach });
        z = zb - 2.6;
        raum = p.nach;
      }
      if (p.art !== 'exponat' || !p.e || p.nr === undefined) return;
      const s = p.nr % 2 ? 1 : -1;
      const e: ExpEntry = {
        i,
        nr: p.nr,
        id: p.e.id,
        s,
        x: s * HB,
        z,
        th: s < 0 ? Math.PI / 2 : -Math.PI / 2,
        raum,
        aspekt: aspekte.get(p.e.id) || (p.e.pages[0]?.aspect || 0.75),
        w: 1,
        h: 1,
        oben: PY + 0.7,
        tafelY: PY - 0.9,
        halb: 0.7,
        rahmen: null,
        url: '',
        tafelT: null,
        tafelKey: '',
      };
      masse(e);
      exp.push(e);
      letzteZ = z;
      z -= ABSTAND;
    });

    zEnde = (exp.length ? letzteZ : -3.4) - 4.4;
    durchgaenge = [0, ...trenn.map((t) => t.z)];
    const raumGrenzen = [0, ...trenn.map((t) => t.z), zEnde];
    const farbe = (r: number) => hex(o.wandfarbe(r));

    const W = netz();
    const B = netz();
    const D = netz();
    const P = netz();
    const sockel = hex(st.sockel);
    const leiste = hex(st.leiste);
    const schiene = hex(st.schiene);

    for (let r = 0; r < raumGrenzen.length - 1; r++) {
      const z0 = raumGrenzen[r] - (r ? 0.1 : 0);
      const z1 = raumGrenzen[r + 1] + (r < raumGrenzen.length - 2 ? 0.1 : 0);
      const c = farbe(r);
      W.vier([-HB, 0, z0], [-HB, 0, z1], [-HB, H, z1], [-HB, H, z0], [1, 0, 0], c, 'zy', SKALA.wand);
      W.vier([HB, 0, z1], [HB, 0, z0], [HB, H, z0], [HB, H, z1], [-1, 0, 0], c, 'zy', SKALA.wand);
      B.vier([-HB, 0, raumGrenzen[r]], [HB, 0, raumGrenzen[r]], [HB, 0, raumGrenzen[r + 1]], [-HB, 0, raumGrenzen[r + 1]], [0, 1, 0], [1, 1, 1], 'xz', SKALA.boden, [0, 0.35]);
      D.vier([-HB, H, z1], [HB, H, z1], [HB, H, z0], [-HB, H, z0], [0, -1, 0], hex(st.decke), 'xz', SKALA.decke);

      P.kiste(-HB, 0, z1, -HB + 0.03, 0.16, z0, sockel, [0, 0.3]);
      P.kiste(HB - 0.03, 0, z1, HB, 0.16, z0, sockel, [0, 0.3]);
      P.kiste(-HB, H - 0.14, z1, -HB + 0.06, H, z0, leiste, [0.05, 0]);
      P.kiste(HB - 0.06, H - 0.14, z1, HB, H, z0, leiste, [0.05, 0]);
      P.kiste(-2.2, H - 0.06, z1 + 0.3, -2.1, H, z0 - 0.3, schiene, [0, 0.4]);
      P.kiste(2.1, H - 0.06, z1 + 0.3, 2.2, H, z0 - 0.3, schiene, [0, 0.4]);

      const ol = st.oberlicht.map((v) => v);
      P.vier([-0.7, H - 0.02, z1 + 0.8], [0.7, H - 0.02, z1 + 0.8], [0.7, H - 0.02, z0 - 0.8], [-0.7, H - 0.02, z0 - 0.8], [0, -1, 0], ol, null, 0, [st.oberlichtE, 0]);
      P.kiste(-0.78, H - 0.08, z1 + 0.72, 0.78, H - 0.02, z1 + 0.8, leiste, [0.05, 0]);
      P.kiste(-0.78, H - 0.08, z0 - 0.8, 0.78, H - 0.02, z0 - 0.72, leiste, [0.05, 0]);
      P.kiste(-0.78, H - 0.08, z1 + 0.8, -0.7, H - 0.02, z0 - 0.8, leiste, [0.05, 0]);
      P.kiste(0.7, H - 0.08, z1 + 0.8, 0.78, H - 0.02, z0 - 0.8, leiste, [0.05, 0]);
    }

    const querwand = (zb: number, ca: number[] | null, cb: number[], tiefe: number, isAussen: boolean) => {
      const zv = zb + tiefe / 2;
      const zh = zb - tiefe / 2;
      const teile = [[-HB, -TB, 0, H], [TB, HB, 0, H], [-TB, TB, TH, H]];
      for (const [x0, x1, y0, y1] of teile) {
        if (!isAussen && ca) W.vier([x0, y0, zv], [x1, y0, zv], [x1, y1, zv], [x0, y1, zv], [0, 0, 1], ca, 'xy', SKALA.wand);
        W.vier([x1, y0, zh], [x0, y0, zh], [x0, y1, zh], [x1, y1, zh], [0, 0, -1], cb, 'xy', SKALA.wand);
      }
      P.kiste(-TB - 0.08, 0, zh - 0.02, -TB, TH + 0.08, zv + 0.02, leiste, [0.05, 0.2]);
      P.kiste(TB, 0, zh - 0.02, TB + 0.08, TH + 0.08, zv + 0.02, leiste, [0.05, 0.2]);
      P.kiste(-TB - 0.08, TH, zh - 0.02, TB + 0.08, TH + 0.08, zv + 0.02, leiste, [0.05, 0.2]);
      if (isAussen) B.vier([-TB, 0, zv], [TB, 0, zv], [TB, 0, zh], [-TB, 0, zh], [0, 1, 0], [1, 1, 1], 'xz', SKALA.boden, [0, 0.35]);
    };

    trenn.forEach((t) => {
      querwand(t.z, farbe(t.raum), farbe(t.nach), 0.2, false);
      schild(t.z + 0.11, 0, 'Saal ' + (t.nach + 1));
      schild(t.z - 0.11, Math.PI, 'Saal ' + (t.raum + 1));
    });

    querwand(0.1, null, farbe(0), 0.2, true);

    const cE = farbe(raumGrenzen.length - 2);
    W.vier([-HB, 0, zEnde], [HB, 0, zEnde], [HB, H, zEnde], [-HB, H, zEnde], [0, 0, 1], cE, 'xy', SKALA.wand);
    P.kiste(-HB, 0, zEnde, HB, 0.16, zEnde + 0.03, sockel, [0, 0.3]);
    P.vier([-1.95, 0, zEnde + 0.02], [-0.45, 0, zEnde + 0.02], [-0.45, 2.6, zEnde + 0.02], [-1.95, 2.6, zEnde + 0.02], [0, 0, 1], [0.05, 0.045, 0.04], null, 0);
    P.kiste(-2.05, 0, zEnde, -1.95, 2.7, zEnde + 0.08, leiste, [0.05, 0.2]);
    P.kiste(-0.45, 0, zEnde, -0.35, 2.7, zEnde + 0.08, leiste, [0.05, 0.2]);
    P.kiste(-2.05, 2.6, zEnde, -0.35, 2.7, zEnde + 0.08, leiste, [0.05, 0.2]);
    const holz = hex(st.boden === 'beton' ? '#9a8f80' : '#5a3d24');
    P.kiste(-1.2, 0.42, zEnde + 1.6, 1.2, 0.5, zEnde + 2.05, holz, [0, 0.5]);
    for (const x of [-1.05, 0.95]) P.kiste(x, 0, zEnde + 1.65, x + 0.1, 0.42, zEnde + 2.0, holz.map((v) => v * 0.6), [0, 0.2]);

    P.kiste(-1.7, 3.98, -5.43, 1.7, 4.02, -5.37, schiene, [0, 0.5]);
    for (const x of [-1.4, 1.4]) P.kiste(x - 0.01, 4.0, -5.41, x + 0.01, H, -5.39, schiene, [0, 0]);

    exp.forEach((e) => {
      const lx = e.s * 2.15;
      const lz = e.z;
      P.kiste(lx - 0.07, H - 0.34, lz - 0.07, lx + 0.07, H - 0.06, lz + 0.07, schiene, [0, 0.6]);
      P.vier([lx - 0.05, H - 0.345, lz + 0.05], [lx + 0.05, H - 0.345, lz + 0.05], [lx + 0.05, H - 0.345, lz - 0.05], [lx - 0.05, H - 0.345, lz - 0.05], [0, -1, 0], [1, 0.95, 0.85], null, 0, [2.2, 0]);
      const lp = [lx, H - 0.38, lz];
      const ziel = [e.x, PY, e.z];
      const d = [ziel[0] - lp[0], ziel[1] - lp[1], 0];
      const l = Math.hypot(d[0], d[1]);
      lichter.push({ p: lp, d: [d[0] / l, d[1] / l, 0], ex: e });
    });

    for (const x of [-1.3, 1.3]) {
      const lp = [x * 1.4, H - 0.2, -3.4];
      const ziel = [0, 3.2, -5.4];
      const d = ziel.map((v, k) => v - lp[k]);
      const l = Math.hypot(...d);
      lichter.push({ p: lp, d: d.map((v) => v / l), ex: null, staerke: 0.8 });
    }
    {
      const lp = [0, H - 0.2, zEnde + 2.2];
      const ziel = [0, 2.2, zEnde];
      const d = ziel.map((v, k) => v - lp[k]);
      const l = Math.hypot(...d);
      lichter.push({ p: lp, d: d.map((v) => v / l), ex: null, staerke: 0.9 });
    }

    statisch = [
      { p: puffer(W.d), t: T.wand },
      { p: puffer(D.d), t: T.decke },
      { p: puffer(P.d), t: T.weiss },
    ];
    boden = puffer(B.d);
    aussenBauen();
    for (const x of [-4.5, -1.9, 1.9, 4.5]) {
      const lp = [x, 0.6, 2.9];
      const ziel = [x, 6.0, 2.05];
      const d = ziel.map((v, k) => v - lp[k]);
      const l = Math.hypot(...d);
      lichter.push({ p: lp, d: d.map((v) => v / l), ex: null, staerke: st.aufhell });
    }

    liste.forEach((p, i) => {
      if (p.art === 'eingang') posen[i] = { x: 0, z: -1.0, yaw: 0, pitch: 0.07 };
      else if (p.art === 'ausgang') posen[i] = { x: 0, z: zEnde + 3.9, yaw: 0, pitch: 0.06 };
    });
    exp.forEach((e) => {
      posen[e.i] = pose(e);
    });

    ausgangSchild();
    if (banner) bannerSetzen(banner.daten, true);
    if (ausgang) ausgangSetzen(ausgang.daten, true);
    if (aktuell >= 0 && !posen[aktuell]) aktuell = -1;
    anstossen();
  }

  const stufeFuer = (abstand: number, beamer: boolean) =>
    abstand === 0 ? Math.min(beamer ? 2048 : 1024, texMax) : abstand <= 2 ? Math.min(1024, texMax) : abstand <= 4 ? 512 : 0;

  function bilder(cur: number, url: (slotIdx: number) => string, beamer: boolean) {
    const slot = plaetze[cur];
    const k = slot && slot.art === 'exponat' && slot.nr !== undefined ? slot.nr : cur <= 1 ? -1 : exp.length;
    const gebraucht = new Set<string>();
    exp.forEach((e) => {
      const u = url(e.i);
      const stufe = stufeFuer(Math.abs(e.nr - Math.max(0, Math.min(exp.length - 1, k))) + (k < 0 || k >= exp.length ? 1 : 0), beamer);
      if (e.url !== u) {
        if (e.url) e.blink = performance.now();
        e.url = u;
      }
      if (!stufe || !u) return;
      gebraucht.add(u);
      let c = cache.get(u);
      if (!c) {
        c = { stufe: 0, t: null, laden: 0 };
        cache.set(u, c);
      }
      if (c.stufe < stufe && c.laden < stufe) laden(u, c, stufe, e.id);
    });
    for (const [u, c] of cache) {
      if (!gebraucht.has(u)) {
        if (c.t) gl.deleteTexture(c.t);
        cache.delete(u);
      }
    }
    anstossen();
  }

  function laden(u: string, c: { stufe: number; t: WebGLTexture | null; laden: number; nr?: number; aspekt?: number }, stufe: number, id: string) {
    c.laden = stufe;
    const nr = ++erzeugt;
    c.nr = nr;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      if (weg || cache.get(u) !== c || c.nr !== nr) return;
      const a = img.naturalWidth / img.naturalHeight || 0.75;
      aspekte.set(id, a);
      const kante = Math.min(stufe, 1 << Math.ceil(Math.log2(Math.max(img.naturalWidth, img.naturalHeight, 64))));
      const can2 = leinwand(kante, kante, (g, w, h) => {
        g.fillStyle = '#fff';
        g.fillRect(0, 0, w, h);
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, 0, 0, w, h);
        if (o.ueber) {
          try {
            o.ueber(u, g, w, h, img.naturalWidth, img.naturalHeight);
          } catch {
            // Hilfen fehlen – das Bild bleibt
          }
        }
      });
      const alt = c.t;
      c.t = textur(can2);
      if (alt) gl.deleteTexture(alt);
      c.stufe = stufe;
      c.aspekt = a;
      exp.forEach((e) => {
        if (e.id === id && Math.abs(e.aspekt - a) > 0.01) {
          e.aspekt = a;
          masse(e);
          posen[e.i] = pose(e);
          if (e.i === aktuell && !tw && steht()) Object.assign(cam, posen[e.i]);
        }
      });
      anstossen();
    };
    img.onerror = () => {
      if (c.nr === nr) c.laden = 0;
    };
    img.src = u;
  }

  function lichterSetzen(spiegel: boolean) {
    const liste = lichter
      .map((l) => ({ l, d: (l.p[0] - cam.x) ** 2 + (l.p[2] - cam.z) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, NL);
    const lp = new Float32Array(NL * 3);
    const ld = new Float32Array(NL * 3);
    const lc = new Float32Array(NL * 3);
    liste.forEach(({ l }, k) => {
      const s = spiegel ? -1 : 1;
      lp.set([l.p[0], l.p[1] * s, l.p[2]], k * 3);
      ld.set([l.d[0], l.d[1] * s, l.d[2]], k * 3);
      const f = (l.staerke || 1) * (l.ex && l.ex.i === aktuell ? 1.12 : 1);
      lc.set(st.licht.map((v) => v * f), k * 3);
    });
    gl.uniform3fv(U.uLp, lp);
    gl.uniform3fv(U.uLd, ld);
    gl.uniform3fv(U.uLc, lc);
    gl.uniform1i(U.uLn, liste.length);
  }

  let hellGesamt = 1;
  function zeichne(p: BufferMesh, t: WebGLTexture, M: Float32Array | null = null, emis = 0, alpha = 1, h = 1, echt = 0) {
    gl.bindBuffer(gl.ARRAY_BUFFER, p.b);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 52, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 52, 12);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 52, 24);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 52, 32);
    gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 52, 44);
    gl.uniformMatrix4fv(U.uM, false, M || EINS);
    gl.uniform1f(U.uEmis, emis);
    gl.uniform1f(U.uEcht, echt);
    gl.uniform1f(U.uAlpha, alpha);
    gl.uniform1f(U.uHell, h * hellGesamt);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.drawArrays(gl.TRIANGLES, 0, p.n);
  }

  function welt(jetzt: number) {
    statisch.forEach((g) => zeichne(g.p, g.t));
    exp.forEach((e) => {
      const M = modell(...wand(e, 0, PY, 0), e.th, 0, 1, 1);
      if (e.rahmen) zeichne(e.rahmen, T.weiss, M);
      const c = cache.get(e.url);
      const blink = e.blink ? Math.min(1, (jetzt - e.blink) / 350) : 1;
      zeichne(QUAD, c && c.t ? c.t : T.platz, modell(...wand(e, 0, PY, 0.034), e.th, 0, e.w, e.h), 0.04, 1, 0.35 + 0.65 * blink, 0.5);
      if (e.tafelT) zeichne(QUAD, e.tafelT, modell(...wand(e, 0, e.tafelY, 0.02), e.th, 0, 1.0, 0.375), 0.1, 1, 1, 0.45);
    });
    schilder.forEach((s) => zeichne(QUAD, s.t, s.M, s.emis, 1, 1, 0.3));
    if (ausgang && ausgang.t) zeichne(QUAD, ausgang.t, modell(1.25, 1.75, zEnde + 0.03, 0, 0, 1.9, 0.95), 0.1, 1, 1, 0.45);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    exp.forEach((e) =>
      zeichne(QUAD, T.schatten, modell(...wand(e, 0, PY - 0.07, 0.004), e.th, 0, e.halb * 2 + 0.34, e.h + (st.passeB + st.rahmenB) * 2 + 0.36), 0, 0.7)
    );
    if (banner && banner.t) zeichne(QUAD, banner.t, modell(0, 4.05 - banner.hoehe / 2, -5.4, 0, 0, 3.2, banner.hoehe), 0.1, 1, 1, 0.3);
    const ex = exp.find((e) => e.i === zettelState.i);
    if (ex) {
      zettelState.liste.forEach((z, n) => {
        const k = ruhig ? 1 : klemm((jetzt - z.t0) / 450, 0, 1);
        if (k <= 0) return;
        const s = 0.58 * (k < 1 ? 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2) : 1);
        const seite = n % 2 ? -1 : 1;
        const reihe = Math.floor(n / 2);
        zeichne(QUAD, z.t, modell(...wand(ex, seite * (ex.halb + 0.5), ex.oben - 0.32 - reihe * 0.66, 0.03 + n * 0.002), ex.th, z.dreh, s, s), 0, 1, 1, 0.8);
      });
    }
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  function umgebung(a: boolean) {
    const u = a ? st.aussen : st;
    gl.uniform3fv(U.uAmbO, u.ambO);
    gl.uniform3fv(U.uAmbU, u.ambU);
    gl.uniform3fv(U.uNebel, hex(a ? st.aussen.horizont : st.nebel));
    gl.uniform1f(U.uDichte, u.dichte);
    const sd = st.aussen.sonneD;
    const l = Math.hypot(...sd);
    gl.uniform3fv(U.uSonneD, sd.map((v) => v / l));
    gl.uniform3fv(U.uSonneC, a ? st.aussen.sonneC : [0, 0, 0]);
  }

  function draussenZeichnen() {
    umgebung(true);
    gl.uniform1f(U.uDichte, 0);
    gl.depthMask(false);
    zeichne(HIMMEL, T.himmel, modell(cam.x, 0, cam.z, 0.6, 0, 1, 1), 0, 1, 1, 1);
    gl.depthMask(true);
    umgebung(true);
    aussen.forEach((g) => zeichne(g.p, g.t));
    const w = tuer.w * 1.75;
    if (tuerL) zeichne(tuerL, T.weiss, modell(-TB, 0, 0.07, w, 0, 1, 1));
    if (tuerR) zeichne(tuerR, T.weiss, modell(TB, 0, 0.07, -w, 0, 1, 1));
    if (fries) zeichne(QUAD, fries, modell(0, 6.88, 2.556, 0, 0, 10.5, 0.66), 0, 1, 1, 0.15);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    if (emblem) zeichne(QUAD, emblem, modell(0, 8.08, 2.61, 0, 0, 2.8, 1.05), 0.05, 1, 1, 0.25);
    if (fahne) for (const x of [-3.2, 3.2]) zeichne(QUAD, fahne, modell(x, 3.95, 1.06, 0, 0, 1.45, 2.9), 0.05, 1, 1, 0.3);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    umgebung(false);
  }

  function zeichnen(jetzt: number) {
    const P = perspektive(fovY, asp, 0.1, WEIT);
    const ey = augeY();
    const V = ansicht([cam.x, ey, cam.z], cam.yaw, cam.pitch);
    gl.uniformMatrix4fv(U.uPV, false, mal(P, V));
    gl.uniform3fv(U.uCam, [cam.x, ey, cam.z]);
    umgebung(false);
    const h = hex(st.aussen.horizont);
    gl.clearColor(h[0], h[1], h[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(U.uSp, -1);
    lichterSetzen(true);
    hellGesamt = 0.8;
    welt(jetzt);
    hellGesamt = 1;
    gl.uniform1f(U.uSp, 1);
    lichterSetzen(false);
    gl.enable(gl.BLEND);
    if (boden) zeichne(boden, T.boden, EINS, 0, 1 - st.spiegel);
    gl.disable(gl.BLEND);
    draussenZeichnen();
    welt(jetzt);
  }

  function anstossen() {
    if (laufen || weg) return;
    laufen = true;
    let vorher = performance.now();
    const bild = (jetzt: number) => {
      if (weg) return;
      const dt = Math.min(0.05, (jetzt - vorher) / 1000);
      vorher = jetzt;
      let weiter = false;
      try {
        weiter = schritt(dt, jetzt);
        if (boden) zeichnen(jetzt);
      } catch (err) {
        console.warn('Museum 3D:', err);
      }
      if (weiter) requestAnimationFrame(bild);
      else laufen = false;
    };
    requestAnimationFrame(bild);
  }

  const bewegtTasten = () => ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'].some((k) => tasten[k]);
  const bewegtStick = () => !!(stick.vor || stick.seit || stick.dreh || stick.neig);
  let gangPhase = 0;

  function schritt(dt: number, jetzt: number): boolean {
    let weiter = false;
    if (tuer.w !== tuer.ziel) {
      const k = ruhig ? 1 : sanft((jetzt - tuer.t0) / 1100);
      tuer.w = tuer.von + (tuer.ziel - tuer.von) * k;
      weiter = true;
    }
    if (warten && !tw) {
      cam.yaw = 0.05 * Math.sin(jetzt / 2600);
      cam.x = 0.3 * Math.sin(jetzt / 3900);
      weiter = true;
    }
    if (tw) {
      tweenSchritt(jetzt);
      weiter = true;
    } else if (bewegtTasten() || bewegtStick()) {
      const v = (tasten.ShiftLeft || tasten.ShiftRight ? 3.6 : 2.0) * dt;
      const vor = klemm((tasten.KeyW ? 1 : 0) - (tasten.KeyS ? 1 : 0) + stick.vor, -1, 1);
      const seit = klemm((tasten.KeyD ? 1 : 0) - (tasten.KeyA ? 1 : 0) + stick.seit, -1, 1);
      cam.yaw += (((tasten.KeyQ ? 1 : 0) - (tasten.KeyE ? 1 : 0)) * 1.7 - stick.dreh * 1.9) * dt;
      if (stick.neig) cam.pitch = klemm(cam.pitch - stick.neig * 0.9 * dt, -0.75, 0.75);
      if (vor || seit) {
        const s = Math.sin(cam.yaw);
        const c = Math.cos(cam.yaw);
        const l = Math.max(1, Math.hypot(vor, seit));
        verschieben(((-s * vor + c * seit) / l) * v, ((-c * vor - s * seit) / l) * v);
        gangPhase += v;
        bob = 0.022 * Math.sin((gangPhase * Math.PI) / 0.75);
      }
      weiter = true;
    } else bob *= 0.8;

    if (Math.abs(bob) > 0.001) weiter = true;
    const ex = exp.find((e) => e.i === zettelState.i);
    if (ex && zettelState.liste.some((z) => jetzt - z.t0 < 500)) weiter = true;
    if (exp.some((e) => e.blink && jetzt - e.blink < 400)) weiter = true;
    return weiter;
  }

  const raumVon = (z: number) => durchgaenge.filter((zb) => zb > z).length;

  function verschieben(dx: number, dz: number) {
    let nx = cam.x + dx;
    let nz = cam.z + dz;
    nx = klemm(nx, -HB + 0.45, HB - 0.45);
    nz = klemm(nz, zEnde + 0.45, -0.4);
    for (const zb of durchgaenge) {
      if (Math.abs(nz - zb) < 0.4 && Math.abs(nx) > TB - 0.3) {
        if (Math.abs(cam.z - zb) >= 0.4) nz = cam.z;
        else nx = klemm(nx, -(TB - 0.3), TB - 0.3);
      }
    }
    cam.x = nx;
    cam.z = nz;
  }

  function weg2(a: { x: number; z: number }, b: { x: number; z: number }) {
    const pfad: [number, number][] = [[a.x, a.z]];
    const zs = durchgaenge.filter((zb) => (a.z - zb) * (b.z - zb) < 0).sort((p, q) => (a.z > b.z ? q - p : p - q));
    for (const zb of zs) {
      const r = a.z > b.z ? 1 : -1;
      const x = klemm(pfad[pfad.length - 1][0], -0.4, 0.4);
      pfad.push([x, zb + r * 0.9], [x, zb - r * 0.9]);
    }
    pfad.push([b.x, b.z]);
    const seg: number[] = [];
    let L = 0;
    for (let k = 1; k < pfad.length; k++) {
      const l = Math.hypot(pfad[k][0] - pfad[k - 1][0], pfad[k][1] - pfad[k - 1][1]);
      seg.push(l);
      L += l;
    }
    return { pfad, seg, L };
  }

  function punkt(w: { pfad: [number, number][]; seg: number[]; L: number }, s: number): [number, number] {
    s = klemm(s, 0, w.L);
    for (let k = 0; k < w.seg.length; k++) {
      if (s <= w.seg[k] || k === w.seg.length - 1) {
        const t = w.seg[k] ? s / w.seg[k] : 1;
        const a = w.pfad[k];
        const b = w.pfad[k + 1];
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
      s -= w.seg[k];
    }
    return w.pfad[w.pfad.length - 1];
  }

  function laufRichtung(w: { pfad: [number, number][]; seg: number[]; L: number }, s: number): number {
    const a = punkt(w, s);
    const b = punkt(w, Math.min(w.L, s + 0.9));
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.05) {
      const c = punkt(w, Math.max(0, w.L - 0.9));
      return richtung(a[0] - c[0], a[1] - c[1]);
    }
    return richtung(b[0] - a[0], b[1] - a[1]);
  }

  function fahrt(ziel: Pose, fertig?: () => void, tempo = 2.3) {
    const a = { x: cam.x, z: cam.z, yaw: cam.yaw, pitch: cam.pitch };
    const w = weg2(a, ziel);
    const jetzt = performance.now();
    if (ruhig) {
      Object.assign(cam, { x: ziel.x, z: ziel.z, yaw: ziel.yaw, pitch: ziel.pitch });
      tw = null;
      anstossen();
      if (fertig) fertig();
      return;
    }
    if (w.L < 0.35) {
      tw = { kurz: true, a, ziel, w, t0: jetzt, T: (0.4 + Math.abs(winkel(ziel.yaw - a.yaw)) * 0.35 + Math.abs(ziel.pitch - a.pitch)) * 1000, fertig };
    } else {
      const r0 = laufRichtung(w, 0);
      const r1 = laufRichtung(w, w.L);
      const t1 = 0.2 + Math.abs(winkel(r0 - a.yaw)) * 0.32;
      const tw2 = Math.max(0.55, w.L / tempo);
      const t3 = 0.2 + Math.abs(winkel(ziel.yaw - r1)) * 0.32;
      const ws = t1 * 0.5;
      const t3s = ws + tw2 * 0.72;
      tw = { kurz: false, a, ziel, w, t0: jetzt, t1, tw: tw2, ws, t3, t3s, T: Math.max(t3s + t3, ws + tw2) * 1000, fertig };
    }
    anstossen();
  }

  function tweenSchritt(jetzt: number) {
    const t = (jetzt - tw.t0) / 1000;
    const { a, ziel, w } = tw;
    if (tw.kurz) {
      const k = sanft((t * 1000) / tw.T);
      cam.x = a.x + (ziel.x - a.x) * k;
      cam.z = a.z + (ziel.z - a.z) * k;
      cam.yaw = zuWinkel(a.yaw, ziel.yaw, k);
      cam.pitch = a.pitch + (ziel.pitch - a.pitch) * k;
      bob *= 0.85;
    } else {
      const e1 = sanft(t / tw.t1);
      const e3 = sanft((t - tw.t3s) / tw.t3);
      const g = klemm((t - tw.ws) / tw.tw, 0, 1);
      const s = w.L * sanft(g);
      const [x, z] = punkt(w, s);
      cam.x = x;
      cam.z = z;
      const basis = laufRichtung(w, s);
      cam.yaw = zuWinkel(zuWinkel(a.yaw, basis, e1), ziel.yaw, e3);
      cam.pitch = a.pitch * (1 - e1) * (1 - e3) + ziel.pitch * e3;
      bob = 0.024 * Math.sin((s * Math.PI) / 0.75) * Math.sin(Math.PI * g);
    }
    if (jetzt - tw.t0 >= tw.T) {
      Object.assign(cam, { x: ziel.x, z: ziel.z, yaw: ziel.yaw, pitch: ziel.pitch });
      const f = tw.fertig;
      tw = null;
      if (f) f();
    }
  }

  function steht() {
    const p = posen[aktuell];
    return !tw && !!p && Math.hypot(cam.x - p.x, cam.z - p.z) < 0.3 && Math.abs(winkel(cam.yaw - p.yaw)) < 0.25;
  }

  function stationPruefen() {
    if (tw) return;
    const f = [-Math.sin(cam.yaw), -Math.cos(cam.yaw)];
    let best = -1;
    let wert = Infinity;
    const raum = raumVon(cam.z);
    exp.forEach((e) => {
      if (raumVon(e.z) !== raum) return;
      const dx = e.x - cam.x;
      const dz = e.z - cam.z;
      const d = Math.hypot(dx, dz);
      const wk = Math.acos(klemm((dx * f[0] + dz * f[1]) / d, -1, 1));
      if (d < 6.5 && wk < 0.6) {
        const w = wk * 2 + d * 0.15;
        if (w < wert) {
          wert = w;
          best = e.i;
        }
      }
    });
    if (best < 0) {
      const ein = plaetze.findIndex((p) => p.art === 'eingang');
      const aus = plaetze.findIndex((p) => p.art === 'ausgang');
      if (exp.length && cam.z > exp[0].z + 0.8 && Math.abs(winkel(cam.yaw)) < 0.9) best = ein;
      else if (cam.z < zEnde + 6.5 && Math.abs(winkel(cam.yaw)) < 0.9) best = aus;
    }
    if (best >= 0 && best !== aktuell) {
      aktuell = best;
      if (o.beiStation) o.beiStation(best);
      anstossen();
    }
  }

  function strahl(cx: number, cy: number) {
    const r = can.getBoundingClientRect();
    const nx = ((cx - r.left) / r.width) * 2 - 1;
    const ny = 1 - ((cy - r.top) / r.height) * 2;
    const tY = Math.tan(fovY / 2);
    const tX = (tY * r.width) / r.height;
    const { f, x, y } = achsen(cam.yaw, cam.pitch);
    const d = [0, 1, 2].map((k) => f[k] + x[k] * nx * tX + y[k] * ny * tY);
    const l = Math.hypot(...d);
    return { o: [cam.x, augeY(), cam.z], d: d.map((v) => v / l) };
  }

  function treffer(cx: number, cy: number) {
    const { o: p, d } = strahl(cx, cy);
    let best: { t: number; art: string; i?: number; x?: number; z?: number } = { t: Infinity, art: '' };
    const nimm = (t: number, art: string, mehr?: Partial<typeof best>) => {
      if (t > 0.05 && t < best.t) best = Object.assign({ t, art }, mehr);
    };
    exp.forEach((e) => {
      const px = e.s * (HB - 0.05);
      if (Math.abs(d[0]) < 1e-6) return;
      const t = (px - p[0]) / d[0];
      const y = p[1] + d[1] * t;
      const z = p[2] + d[2] * t;
      if (Math.abs(z - e.z) <= Math.max(e.halb, 0.48) && y >= e.tafelY - 0.2 && y <= e.oben) nimm(t, 'ex', { i: e.i });
    });
    for (const x of [-HB, HB]) {
      if (Math.abs(d[0]) > 1e-6) {
        const t = (x - p[0]) / d[0];
        nimm(t, 'wand');
      }
    }
    if (d[1] > 1e-6) nimm((H - p[1]) / d[1], 'decke');
    for (const zb of [...durchgaenge, zEnde]) {
      if (Math.abs(d[2]) < 1e-6) continue;
      const t = (zb - p[2]) / d[2];
      const x = p[0] + d[0] * t;
      const y = p[1] + d[1] * t;
      if (zb === zEnde || Math.abs(x) > TB || y > TH) nimm(t, 'wand');
    }
    if (d[1] < -1e-6) {
      const t = -p[1] / d[1];
      nimm(t, 'boden', { x: p[0] + d[0] * t, z: p[2] + d[2] * t });
    }
    if (Math.abs(d[2]) > 1e-6) {
      const t = (zEnde + 0.03 - p[2]) / d[2];
      const x = p[0] + d[0] * t;
      const y = p[1] + d[1] * t;
      if (x > -1.95 && x < -0.45 && y > 0 && y < 2.6) nimm(t - 0.02, 'ausgang');
    }
    return best;
  }

  let zug: { id: number; x: number; y: number; t: number; weit: boolean; zuWeit?: boolean; yaw: number; pitch: number } | null = null;
  const gesperrt = () => !!(o.gesperrt && o.gesperrt());

  const runter = (ev: PointerEvent) => {
    if (ev.button > 0 || zug || draussenModus) return;
    zug = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, t: performance.now(), weit: false, yaw: cam.yaw, pitch: cam.pitch };
    try {
      can.setPointerCapture(ev.pointerId);
    } catch {
      // ignore
    }
    if (o.beiBeruehrung) o.beiBeruehrung();
  };

  const ziehen = (ev: PointerEvent) => {
    if (!zug || ev.pointerId !== zug.id) return;
    const dx = ev.clientX - zug.x;
    const dy = ev.clientY - zug.y;
    if (gesperrt()) {
      if (Math.hypot(dx, dy) > 8) zug.zuWeit = true;
      return;
    }
    if (!zug.weit && Math.hypot(dx, dy) > 8) {
      zug.weit = true;
      if (tw) {
        tw = null;
        zug.yaw = cam.yaw;
        zug.pitch = cam.pitch;
        zug.x = ev.clientX;
        zug.y = ev.clientY;
      }
      if (o.beiFrei) o.beiFrei();
    }
    if (zug.weit) {
      const k = (fovY / Math.max(200, can.clientHeight)) * 1.15;
      cam.yaw = zug.yaw + (ev.clientX - zug.x) * k;
      cam.pitch = klemm(zug.pitch + (ev.clientY - zug.y) * k, -0.75, 0.75);
      anstossen();
    }
  };

  const hoch = (ev: PointerEvent) => {
    if (!zug || ev.pointerId !== zug.id) return;
    const z = zug;
    zug = null;
    if (z.weit) {
      stationPruefen();
      return;
    }
    if (z.zuWeit || performance.now() - z.t > 600) return;
    const h = treffer(ev.clientX, ev.clientY);
    if (h.art === 'ex' && h.i !== undefined) {
      if (o.beiTipp) o.beiTipp(h.i);
      return;
    }
    if (gesperrt()) return;
    if (h.art === 'ausgang') {
      if (o.beiAusgang) o.beiAusgang();
      return;
    }
    if (h.art === 'boden' && h.x !== undefined && h.z !== undefined) {
      if (o.beiFrei) o.beiFrei();
      const x = klemm(h.x, -HB + 0.6, HB - 0.6);
      let zz = klemm(h.z, zEnde + 0.6, -0.5);
      for (const zb of durchgaenge) if (Math.abs(zz - zb) < 0.5) zz = zb + (cam.z > zb ? 0.5 : -0.5);
      const dx = x - cam.x;
      const dz = zz - cam.z;
      fahrt({ x, z: zz, yaw: Math.hypot(dx, dz) > 0.3 ? richtung(dx, dz) : cam.yaw, pitch: 0 }, stationPruefen);
    }
  };

  let radTimeout: number | undefined;
  const rad = (ev: WheelEvent) => {
    ev.preventDefault();
    if (draussenModus || gesperrt()) return;
    if (tw) tw = null;
    if (o.beiFrei) o.beiFrei();
    const v = klemm(-ev.deltaY * 0.004, -0.8, 0.8);
    verschieben(-Math.sin(cam.yaw) * v, -Math.cos(cam.yaw) * v);
    anstossen();
    window.clearTimeout(radTimeout);
    radTimeout = window.setTimeout(stationPruefen, 300);
  };

  const darf = (ev: KeyboardEvent) =>
    !draussenModus && !(ev.target && (ev.target as HTMLElement).matches && (ev.target as HTMLElement).matches('input,textarea,select')) && (!o.aktiv || o.aktiv());

  const taste = (ev: KeyboardEvent) => {
    if (!darf(ev) || gesperrt() || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (!/^(Key[WASDQE]|Shift(Left|Right))$/.test(ev.code)) return;
    if (!tasten[ev.code] && /^Key/.test(ev.code)) {
      tw = null;
      if (o.beiFrei) o.beiFrei();
    }
    tasten[ev.code] = true;
    anstossen();
  };

  const los = (ev: KeyboardEvent) => {
    if (!tasten[ev.code]) return;
    delete tasten[ev.code];
    if (!bewegtTasten()) stationPruefen();
  };

  const blur = () => {
    for (const k in tasten) delete tasten[k];
    stick.vor = stick.seit = stick.dreh = stick.neig = 0;
  };

  const pointerCancel = () => {
    zug = null;
  };

  const contextLost = (ev: Event) => {
    ev.preventDefault();
    if (weg) return;
    weg = true;
    if (o.beiVerlust) o.beiVerlust();
  };

  can.addEventListener('pointerdown', runter);
  can.addEventListener('pointermove', ziehen);
  can.addEventListener('pointerup', hoch);
  can.addEventListener('pointercancel', pointerCancel);
  can.addEventListener('wheel', rad, { passive: false });
  window.addEventListener('keydown', taste);
  window.addEventListener('keyup', los);
  window.addEventListener('blur', blur);
  can.addEventListener('webglcontextlost', contextLost);

  let stehtVorher = false;
  function groesse() {
    const w = can.clientWidth || 800;
    const h = can.clientHeight || 600;
    let r = Math.min(window.devicePixelRatio || 1, 2);
    if (w * h * r * r > 4.2e6) r = Math.sqrt(4.2e6 / (w * h));
    can.width = Math.round(w * r);
    can.height = Math.round(h * r);
    gl!.viewport(0, 0, can.width, can.height);
    asp = w / h;
    fovY = asp >= 1 ? (58 * Math.PI) / 180 : Math.min(2 * Math.atan(Math.tan((31 * Math.PI) / 180) / asp), (96 * Math.PI) / 180);
    exp.forEach((e) => {
      posen[e.i] = pose(e);
    });
    if (aktuell >= 0 && posen[aktuell] && !tw && stehtVorher) Object.assign(cam, posen[aktuell]);
    anstossen();
  }

  if (o.logo) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (weg) return;
      logoImg = img;
      renderEmblem();
      anstossen();
    };
    img.src = o.logo;
  }

  groesse();

  function tueren(ziel: number) {
    tuer.von = tuer.w;
    tuer.ziel = ziel;
    tuer.t0 = performance.now();
    anstossen();
  }

  return {
    bauen,
    groesse() {
      stehtVorher = steht();
      groesse();
      stehtVorher = false;
    },
    gehe(i: number, gleiten: boolean) {
      if (!posen[i]) return;
      aktuell = i;
      if (draussenModus) {
        draussenModus = false;
        warten = false;
        tueren(1);
      }
      const exEntry = exp.find((e) => e.i === i);
      if (exEntry) posen[i] = pose(exEntry);
      if (!gleiten) {
        tw = null;
        Object.assign(cam, posen[i]);
        anstossen();
        return;
      }
      fahrt(posen[i]);
    },
    hinaus(fertig: () => void) {
      if (ruhig) {
        fertig();
        return;
      }
      fahrt({ x: -1.2, z: zEnde + 0.9, yaw: 0, pitch: 0 }, fertig);
    },
    draussen() {
      tw = null;
      draussenModus = true;
      warten = !ruhig;
      tuer.w = tuer.von = tuer.ziel = 0;
      Object.assign(cam, { x: 0, z: 14.5, yaw: 0, pitch: 0.13 });
      anstossen();
    },
    eintreten(i: number, fertig?: () => void) {
      warten = false;
      const ende = () => {
        draussenModus = false;
        aktuell = i;
        anstossen();
        if (fertig) fertig();
      };
      if (ruhig || !posen[i]) {
        tueren(1);
        if (posen[i]) Object.assign(cam, posen[i]);
        return ende();
      }
      fahrt(
        { x: 0, z: 2.9, yaw: 0, pitch: 0.08 },
        () => {
          tueren(1);
          setTimeout(() => {
            if (!weg) fahrt(posen[i], ende);
          }, 650);
        },
        3.4
      );
    },
    steht,
    bilder,
    stick(s) {
      const war = bewegtStick();
      const an = !gesperrt() && !draussenModus && !weg;
      stick.vor = an && s ? klemm(+s.vor || 0, -1, 1) : 0;
      stick.seit = an && s ? klemm(+s.seit || 0, -1, 1) : 0;
      stick.dreh = an && s ? klemm(+s.dreh || 0, -1, 1) : 0;
      stick.neig = an && s ? klemm(+s.neig || 0, -1, 1) : 0;
      if (bewegtStick() && !war) {
        tw = null;
        if (o.beiFrei) o.beiFrei();
      }
      if (war && !bewegtStick()) stationPruefen();
      anstossen();
    },
    tafel(i, d) {
      const e = exp.find((x) => x.i === i);
      if (!e) return;
      const key = JSON.stringify(d);
      if (e.tafelKey === key) return;
      e.tafelKey = key;
      e.tafelT = textur(tafelBild(d), false, e.tafelT);
      anstossen();
    },
    eingang: (d) => bannerSetzen(d),
    ausgang: (d) => ausgangSetzen(d),
    zettel(i, liste) {
      const key = i + '|' + liste.map((k) => k.id + (k.antwort ? 'a' : '')).join(',');
      if (key === zettelState.key) return;
      const alt = new Map(zettelState.liste.map((z) => [z.id, z]));
      const jetzt = performance.now();
      const neuListe = liste.map((k, n) => {
        const keyId = k.id + (k.antwort ? 'a' : '');
        const a = alt.get(keyId);
        if (a && zettelState.i === i) {
          alt.delete(a.id);
          return a;
        }
        return {
          id: keyId,
          t: textur(zettelBild(k)),
          t0: jetzt + n * (zettelState.i === i ? 0 : 120),
          dreh: ((n % 3) - 1) * 0.045,
        };
      });
      for (const z of alt.values()) gl.deleteTexture(z.t);
      zettelState = { i, key, liste: neuListe };
      anstossen();
    },
    weg() {
      weg = true;
      can.removeEventListener('pointerdown', runter);
      can.removeEventListener('pointermove', ziehen);
      can.removeEventListener('pointerup', hoch);
      can.removeEventListener('pointercancel', pointerCancel);
      can.removeEventListener('wheel', rad);
      can.removeEventListener('webglcontextlost', contextLost);
      window.removeEventListener('keydown', taste);
      window.removeEventListener('keyup', los);
      window.removeEventListener('blur', blur);
      const l = gl.getExtension('WEBGL_lose_context');
      if (l) l.loseContext();
    },
  };
}
