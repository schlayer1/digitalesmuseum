import { AnnotationItem, Exponat, Kommentar, MuseumAusstellung, Rueckmeldung, SaalStil } from '../types/museum';
import { spitzname } from './museumHelpers';

const PLAKATE: [string, string, string, string, string[], string][] = [
  [
    '1950er',
    'Rock ’n’ Roll',
    '#a83f57',
    'platte',
    ['Rock ’n’ Roll erobert die Hitparaden', 'Elvis Presley und Chuck Berry', 'Die Single: 45 Umdrehungen pro Minute', 'Musik aus der Jukebox'],
    'Stars, Stile und die Technik dahinter – unser Plakat zu den Fünfzigern.',
  ],
  [
    '1960er',
    'Beat & Flower Power',
    '#d9821e',
    'peace',
    ['Die Beatles aus Liverpool', 'Woodstock 1969: 3 Days of Peace & Music', 'Album als Gesamtwerk: Sgt. Pepper (1967)', 'Protestsongs gegen den Vietnamkrieg'],
    'Von Liverpool bis Woodstock.',
  ],
  [
    '1970er',
    'Disco & Punk',
    '#7d3c98',
    'kugel',
    ['ABBA gewinnt 1974 den Grand Prix', 'Disco: „Saturday Night Fever“ (1977)', 'Punk: drei Akkorde und laut', '1979 kommt der Walkman'],
    'Glitzer auf der Tanzfläche, Krach im Keller.',
  ],
  [
    '1980er',
    'Synthie-Pop',
    '#d6337f',
    'kassette',
    ['Synthesizer und Drumcomputer', 'MTV startet 1981', 'Neue Deutsche Welle: Nena, „99 Luftballons“ (1983)', '1982 kommt die CD'],
    'Als die Musik elektronisch wurde.',
  ],
  [
    '1990er',
    'Techno & Hip-Hop',
    '#1e8a6e',
    'boxen',
    ['Techno: Loveparade in Berlin', 'Hip-Hop auf Deutsch: Die Fantastischen Vier', 'Grunge: Nirvana', 'Boybands: Backstreet Boys'],
    'Raves, Rap und Boybands.',
  ],
  [
    '2000er',
    'MP3 & Castingshows',
    '#2d6fb8',
    'player',
    ['Musik als MP3-Datei', 'iPod (2001): 1.000 Songs in der Tasche', 'Castingshows im Fernsehen', 'Auto-Tune als Effekt: T-Pain'],
    'Als die Musik in die Hosentasche passte.',
  ],
  [
    '2010er',
    'Streaming',
    '#3f8f4f',
    'handy',
    ['Streaming statt kaufen', 'Deutschrap ganz oben in den Charts', 'Gangnam Style: 1 Mrd. Klicks (2012)', 'Playlist statt Album'],
    'Alles jederzeit – aber nichts mehr im Regal.',
  ],
  [
    '2020er',
    'Kurzvideo',
    '#2b3445',
    'kopfhoerer',
    ['Hits starten als TikTok-Sound', 'Alte Hits kommen zurück: „Dreams“ (2020)', 'Konzerte im Livestream (2020)', 'Musik mit KI wird zum Streitthema'],
    'Ein Sound, ein Video, ein Hit?',
  ],
];

export const DEMO_KOMMENTARE = [
  'Die Farben passen richtig gut zum Jahrzehnt!',
  'Sehr übersichtlich, auch von hinten gut lesbar.',
  'Das Symbol erklärt schon viel.',
  'Ich hätte noch ein Hörbeispiel ergänzt.',
  'Starke Idee mit dem Vergleich!',
  'Schöne Gestaltung, wenig Text, viel Bild.',
  'Das habe ich vorher nicht gewusst.',
  'Meine Eltern hören das heute noch.',
];

export const DEMO_FRAGEN = [
  'Woher habt ihr die Informationen?',
  'Was bedeutet das Symbol?',
  'Warum habt ihr diese Farbe gewählt?',
  'Was ist euer Lieblingssong aus der Zeit?',
  'Gab es das auch in Deutschland?',
];

export const DEMO_ANTWORTEN = [
  'Gute Frage – schau mal auf die zweite Seite.',
  'Das erklären wir gleich bei der Präsentation.',
  'Aus dem Musikbuch und einem Lexikon im Netz.',
];

const RUECK_GUT = [
  'Die Überschrift macht sofort neugierig.',
  'Die Pfeile mit den Worterklärungen helfen sehr.',
  'Klar gegliedert und gut lesbar.',
  'Das Symbol erklärt schon viel.',
];

const RUECK_TIPP = [
  'Die Schrift unten könnte größer sein.',
  'Ein Hörbeispiel würde das noch klarer machen.',
  'Gebt eure Quellen genauer an.',
  'Weniger Text, mehr Stichworte.',
];

const PROBE_HILFEN: Record<number, Record<string, AnnotationItem[]>> = {
  0: {
    '0': [
      { t: 'pfeil', a: [0.33, 0.52, 0.1, 0.88], f: 2, s: 'Single: Schallplatte mit einem Song pro Seite' },
      { t: 'mark', a: [0.52, 0.3, 0.96, 0.41], f: 0, s: 'Das Wichtigste in einem Satz' },
      { t: 'notiz', a: [0.56, 0.86, 0.95, 0.94], f: 3, s: 'Tipp: Auf Seite 2 stehen unsere Quellen.' },
    ],
  },
  2: {
    '0': [
      { t: 'rahmen', a: [0.08, 0.38, 0.46, 0.84], f: 1, s: 'Discokugel' },
      { t: 'pfeil', a: [0.54, 0.74, 0.7, 0.93], f: 4, s: 'Walkman: tragbarer Kassettenspieler' },
    ],
  },
  4: {
    '0': [{ t: 'pfeil', a: [0.54, 0.33, 0.3, 0.3], f: 2, s: 'Techno: elektronische Tanzmusik' }],
  },
  6: {
    '0': [{ t: 'pfeil', a: [0.54, 0.33, 0.3, 0.3], f: 4, s: 'Streaming: Musik übers Internet abspielen statt kaufen' }],
  },
};

export const zufallAus = <T,>(liste: T[]): T => liste[Math.floor(Math.random() * liste.length)];

export function createRandomFeedback(): Rueckmeldung {
  return {
    id: 'r' + Date.now() + Math.floor(Math.random() * 999),
    deviceId: 'sim-' + Math.floor(Math.random() * 9999),
    name: spitzname(),
    gut: Math.random() < 0.8 ? zufallAus(RUECK_GUT) : '',
    tipp: Math.random() < 0.7 ? zufallAus(RUECK_TIPP) : '',
    sterne: [3 + Math.floor(Math.random() * 3), 2 + Math.floor(Math.random() * 4), 3 + Math.floor(Math.random() * 3)],
    zeit: Math.floor(Date.now() / 1000),
  };
}

function drawPosterDataUrl(
  titel: string,
  stil: string,
  farbe: string,
  symbol: string,
  punkte: string[],
  seite: number,
  hoch: boolean
): { dataUrl: string; w: number; h: number } {
  const w = hoch ? 900 : 1200;
  const h = hoch ? 1200 : 900;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  const papier = '#fbf7ef';
  const schrift = '"Plus Jakarta Sans", Calibri, Arial, sans-serif';

  const rr = (px: number, py: number, pw: number, ph: number, pr: number) => {
    x.beginPath();
    x.moveTo(px + pr, py);
    x.arcTo(px + pw, py, px + pw, py + ph, pr);
    x.arcTo(px + pw, py + ph, px, py + ph, pr);
    x.arcTo(px, py + ph, px, py, pr);
    x.arcTo(px, py, px + pw, py, pr);
    x.closePath();
  };

  const umbrechen = (text: string, breite: number) => {
    const zeilen: string[] = [];
    let z = '';
    for (const wort of text.split(' ')) {
      const neu = z ? z + ' ' + wort : wort;
      if (z && x.measureText(neu).width > breite) {
        zeilen.push(z);
        z = wort;
      } else z = neu;
    }
    if (z) zeilen.push(z);
    return zeilen;
  };

  x.fillStyle = papier;
  x.fillRect(0, 0, w, h);

  const band = h * 0.24;
  x.fillStyle = farbe;
  x.fillRect(0, 0, w, band);
  x.fillStyle = 'rgba(255,255,255,.12)';
  for (let i = 0; i < 6; i++) x.fillRect(0, band - h * 0.012 * (i + 1) * 1.6, w, h * 0.006);
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = '700 ' + Math.round(seite ? Math.min(w, h) * 0.075 : h * 0.1) + 'px Georgia, serif';
  x.fillText(seite ? 'Quellen und Fragen' : titel, w / 2, seite ? band / 2 : band * 0.4);
  if (!seite) {
    x.font = '700 ' + Math.round(h * 0.045) + 'px ' + schrift;
    x.fillText(stil.toUpperCase(), w / 2, band * 0.8);
  }

  if (seite) {
    x.textAlign = 'left';
    x.font = '700 ' + Math.round(h * 0.042) + 'px ' + schrift;
    ['Musikbuch, Kapitel Popgeschichte', 'Lexikon der Popmusik', 'Interview mit meinen Eltern'].forEach((t, i) => {
      x.fillStyle = farbe;
      x.beginPath();
      x.arc(w * 0.1, h * (0.36 + i * 0.09), h * 0.012, 0, 7);
      x.fill();
      x.fillStyle = '#2b2b2b';
      x.fillText(t, w * 0.13, h * (0.36 + i * 0.09));
    });
    x.fillStyle = farbe;
    x.font = '700 ' + Math.round(h * 0.042) + 'px ' + schrift;
    x.fillText('Unsere Frage an euch:', w * 0.1, h * 0.7);
    x.fillStyle = '#2b2b2b';
    x.font = 'italic ' + Math.round(Math.min(w, h) * 0.04) + 'px ' + schrift;
    umbrechen('Welcher Song gehört für euch in dieses Jahrzehnt?', w * 0.8).forEach((z, k) =>
      x.fillText(z, w * 0.1, h * 0.78 + k * Math.min(w, h) * 0.05)
    );
    return { dataUrl: c.toDataURL('image/jpeg', 0.85), w, h };
  }

  const mx = hoch ? w / 2 : w * 0.27;
  const my = hoch ? h * 0.44 : h * 0.6;
  const r = Math.min(w, h) * (hoch ? 0.18 : 0.2);
  x.fillStyle = farbe + '22';
  x.beginPath();
  x.arc(mx, my, r * 1.25, 0, 7);
  x.fill();
  x.fillStyle = farbe;
  x.strokeStyle = farbe;
  x.lineCap = 'round';
  x.lineJoin = 'round';

  if (symbol === 'platte') {
    x.fillStyle = '#1d1d1f';
    x.beginPath();
    x.arc(mx, my, r, 0, 7);
    x.fill();
    x.strokeStyle = '#3a3a3e';
    x.lineWidth = r * 0.015;
    for (const k of [0.92, 0.84, 0.76, 0.68, 0.6, 0.52]) {
      x.beginPath();
      x.arc(mx, my, r * k, 0, 7);
      x.stroke();
    }
    x.strokeStyle = 'rgba(255,255,255,.18)';
    x.lineWidth = r * 0.05;
    x.beginPath();
    x.arc(mx, my, r * 0.75, -2.4, -1.7);
    x.stroke();
    x.fillStyle = farbe;
    x.beginPath();
    x.arc(mx, my, r * 0.32, 0, 7);
    x.fill();
    x.fillStyle = papier;
    x.beginPath();
    x.arc(mx, my, r * 0.07, 0, 7);
    x.fill();
  } else if (symbol === 'peace') {
    x.lineWidth = r * 0.14;
    x.beginPath();
    x.arc(mx, my, r * 0.9, 0, 7);
    x.stroke();
    x.beginPath();
    x.moveTo(mx, my - r * 0.9);
    x.lineTo(mx, my + r * 0.9);
    x.stroke();
    for (const a of [Math.PI * 0.75, Math.PI * 0.25]) {
      x.beginPath();
      x.moveTo(mx, my);
      x.lineTo(mx + r * 0.9 * Math.cos(a), my + r * 0.9 * Math.sin(a));
      x.stroke();
    }
  } else if (symbol === 'kugel') {
    x.strokeStyle = '#8a8d96';
    x.lineWidth = r * 0.03;
    x.beginPath();
    x.moveTo(mx, my - r * 0.85);
    x.lineTo(mx, my - r * 1.25);
    x.stroke();
    const g = x.createRadialGradient(mx - r * 0.3, my - r * 0.3, r * 0.1, mx, my, r * 0.85);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#c7cad3');
    g.addColorStop(1, '#7c808c');
    x.fillStyle = g;
    x.beginPath();
    x.arc(mx, my, r * 0.85, 0, 7);
    x.fill();
    x.save();
    x.beginPath();
    x.arc(mx, my, r * 0.85, 0, 7);
    x.clip();
    x.strokeStyle = 'rgba(60,60,70,.45)';
    x.lineWidth = r * 0.02;
    for (let k = -4; k <= 4; k++) {
      x.beginPath();
      x.ellipse(mx, my, (Math.abs(k) / 4) * r * 0.85 + 0.01, r * 0.85, 0, 0, 7);
      x.stroke();
    }
    for (let k = -4; k <= 4; k++) {
      x.beginPath();
      x.moveTo(mx - r, my + k * r * 0.2);
      x.lineTo(mx + r, my + k * r * 0.2);
      x.stroke();
    }
    x.restore();
  } else if (symbol === 'kassette') {
    rr(mx - r, my - r * 0.65, r * 2, r * 1.3, r * 0.12);
    x.fill();
    x.fillStyle = papier;
    rr(mx - r * 0.82, my - r * 0.5, r * 1.64, r * 0.62, r * 0.06);
    x.fill();
    x.fillStyle = '#2b2b2b';
    rr(mx - r * 0.5, my - r * 0.32, r, r * 0.3, r * 0.15);
    x.fill();
    for (const sx of [-0.33, 0.33]) {
      x.fillStyle = papier;
      x.beginPath();
      x.arc(mx + sx * r, my - r * 0.17, r * 0.12, 0, 7);
      x.fill();
    }
  } else if (symbol === 'boxen') {
    x.fillStyle = '#26272b';
    rr(mx - r * 0.62, my - r, r * 1.24, r * 2, r * 0.1);
    x.fill();
    for (const [py, pr] of [[-0.5, 0.24], [0.3, 0.46]]) {
      x.fillStyle = farbe;
      x.beginPath();
      x.arc(mx, my + py * r, r * pr, 0, 7);
      x.fill();
      x.fillStyle = '#26272b';
      x.beginPath();
      x.arc(mx, my + py * r, r * pr * 0.72, 0, 7);
      x.fill();
    }
  } else if (symbol === 'player') {
    x.fillStyle = '#f1f2f4';
    rr(mx - r * 0.55, my - r, r * 1.1, r * 2, r * 0.18);
    x.fill();
    x.lineWidth = r * 0.05;
    rr(mx - r * 0.55, my - r, r * 1.1, r * 2, r * 0.18);
    x.stroke();
    x.fillStyle = farbe;
    rr(mx - r * 0.42, my - r * 0.85, r * 0.84, r * 0.7, r * 0.05);
    x.fill();
    x.fillStyle = '#c9ccd3';
    x.beginPath();
    x.arc(mx, my + r * 0.45, r * 0.38, 0, 7);
    x.fill();
  } else if (symbol === 'handy') {
    x.fillStyle = '#1d1d1f';
    rr(mx - r * 0.55, my - r, r * 1.1, r * 2, r * 0.16);
    x.fill();
    x.fillStyle = farbe;
    rr(mx - r * 0.46, my - r * 0.88, r * 0.92, r * 1.76, r * 0.08);
    x.fill();
    x.fillStyle = '#fff';
    x.beginPath();
    x.moveTo(mx - r * 0.14, my - r * 0.42);
    x.lineTo(mx + r * 0.2, my - r * 0.22);
    x.lineTo(mx - r * 0.14, my - r * 0.02);
    x.fill();
  } else if (symbol === 'kopfhoerer') {
    x.lineWidth = r * 0.16;
    x.beginPath();
    x.arc(mx, my + r * 0.1, r * 0.78, Math.PI * 1.05, Math.PI * 1.95);
    x.stroke();
    for (const sx of [-1, 1]) {
      rr(mx + sx * r * 0.78 - r * 0.2, my + r * 0.05, r * 0.4, r * 0.7, r * 0.16);
      x.fill();
    }
  }

  const tx = hoch ? w * 0.12 : w * 0.535;
  const ty = hoch ? h * 0.655 : h * 0.33;
  const breite = hoch ? w * 0.78 : w * 0.43;
  const abstand = hoch ? h * 0.088 : h * 0.135;
  const groesse = Math.round(h * (hoch ? 0.032 : 0.04));
  x.font = '700 ' + groesse + 'px ' + schrift;
  x.textAlign = 'left';
  x.textBaseline = 'middle';
  punkte.forEach((p, i) => {
    const y0 = ty + i * abstand;
    x.fillStyle = farbe;
    x.beginPath();
    x.arc(tx - groesse * 0.7, y0, groesse * 0.22, 0, 7);
    x.fill();
    x.fillStyle = '#2b2b2b';
    umbrechen(p, breite)
      .slice(0, 2)
      .forEach((z, k) => x.fillText(z, tx, y0 + k * groesse * 1.15));
  });

  return { dataUrl: c.toDataURL('image/jpeg', 0.85), w, h };
}

export function buildDemoExhibition(saal: SaalStil = 'klassisch'): {
  museum: MuseumAusstellung;
  exponate: Exponat[];
} {
  const jetzt = Math.floor(Date.now() / 1000);
  const nowMs = Date.now();

  const exponate: Exponat[] = PLAKATE.map(([jahrzehnt, stil, farbe, symbol, punkte, text], i) => {
    const id = 'demo' + String(i).padStart(8, '0');
    const titel = `${jahrzehnt}: ${stil}`;
    const seiten = i % 3 === 0 ? 2 : 1;
    const hoch = i % 2 === 1;
    const pages = Array.from({ length: seiten }, (_, s) => {
      const rendered = drawPosterDataUrl(jahrzehnt, stil, farbe, symbol, punkte, s, hoch);
      return {
        r2Key: '',
        demoUrl: rendered.dataUrl,
        width: rendered.w,
        height: rendered.h,
        aspect: rendered.w / rendered.h,
        sourceLabel: s === 0 ? 'Plakat' : 'Quellen',
      };
    });

    const kommentare: Kommentar[] =
      i % 4 === 0
        ? [
            {
              id: 'k' + i,
              deviceId: 'sim-visitor-' + i,
              name: spitzname(),
              art: 'kommentar' as const,
              text: DEMO_KOMMENTARE[i % DEMO_KOMMENTARE.length],
              zeit: jetzt - 300,
              antwort: null,
            },
          ]
        : [];

    if (i === 0) {
      kommentare.push({
        id: 'ks0',
        deviceId: 'sim-visitor-a',
        name: spitzname(),
        art: 'frage',
        text: 'Was ist eine Jukebox?',
        zeit: jetzt - 200,
        antwort: null,
        stelle: { s: 0, t: 'rahmen', a: [0.52, 0.71, 0.86, 0.77] },
      });
    }
    if (i === 2) {
      kommentare.push({
        id: 'ks2',
        deviceId: 'sim-visitor-b',
        name: spitzname(),
        art: 'kommentar',
        text: 'Die Discokugel ist richtig schön gezeichnet!',
        zeit: jetzt - 150,
        antwort: null,
        stelle: { s: 0, t: 'pfeil', a: [0.2, 0.5, 0.05, 0.3] },
      });
    }

    const likes = (i * 3) % 5;
    const likedBy = Array.from({ length: likes }, (_, l) => `sim-like-${i}-${l}`);

    return {
      id,
      museumCode: 'DEMO',
      deviceId: 'sim-author-' + i,
      name: spitzname(),
      titel,
      text,
      mediaType: 'image',
      seiten,
      pages,
      v: 1,
      createdAt: nowMs - (10 - i) * 60000,
      updatedAt: nowMs,
      likesCount: likes,
      likedBy,
      anm: PROBE_HILFEN[i] || {},
      kommentare,
      rueck: i % 3 === 0 ? [createRandomFeedback(), createRandomFeedback()] : [],
    };
  });

  const museum: MuseumAusstellung = {
    id: 'DEMO',
    code: 'DEMO',
    titel: 'Wie klingt ein Jahrzehnt? – Probeausstellung',
    klasse: 'Demo',
    hinweis: 'So sieht ein Rundgang aus. Alles hier ist eine Simulation – nichts wird in der Datenbank gespeichert.',
    saal,
    phase: 'rundgang',
    einreichen: true,
    kommentare: true,
    rueck: true,
    kriterien: ['Inhalt', 'Gestaltung', 'Verständlichkeit'],
    fuehrung: { an: false, id: '', s: 0, t: 0 },
    stand: 1,
    authorId: 'demo-teacher',
    authorName: 'Kollegium HBS',
    createdAt: nowMs,
    updatedAt: nowMs,
    expiresAt: nowMs + 86400000,
  };

  return { museum, exponate };
}
