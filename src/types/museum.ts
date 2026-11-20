export type SaalStil = 'klassisch' | 'modern' | 'nacht';
export type MuseumPhase = 'aufbau' | 'rundgang' | 'zu';
export type MediaType = 'image' | 'pdf' | 'pptx' | 'video' | 'audio';

export type AnnotationTool = 'pfeil' | 'stift' | 'mark' | 'rahmen' | 'notiz';

export interface AnnotationItem {
  t: AnnotationTool;
  a: [number, number, number, number]; // [x1, y1, x2, y2] normalized 0..1
  f: number; // color index 0..4
  s: string; // text
  p?: number[]; // freehand stroke [x0, y0, x1, y1, ...]
}

export interface KommentarStelle {
  s: number; // page index
  t: 'mark' | 'rahmen' | 'pfeil';
  a: [number, number, number, number];
}

export interface KommentarAntwort {
  text: string;
  zeit: number;
}

export interface Kommentar {
  id: string;
  deviceId: string;
  name: string;
  art: 'kommentar' | 'frage';
  text: string;
  zeit: number;
  stelle?: KommentarStelle | null;
  antwort?: KommentarAntwort | null;
}

export interface Rueckmeldung {
  id: string;
  deviceId: string;
  name: string;
  sterne: number[];
  gut: string;
  tipp: string;
  zeit: number;
}

export interface ExponatPage {
  r2Key: string; // empty in demo mode; otherwise museum/<code>/...
  demoUrl?: string; // data URL or blob URL in demo mode
  width: number;
  height: number;
  aspect: number;
  sourceLabel?: string;
}

export interface MediaAssetRef {
  r2Key: string;
  demoUrl?: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  kind: 'video' | 'audio' | 'pdf' | 'pptx';
}

export interface AudioCompanionRef {
  r2Key: string;
  demoUrl?: string;
  mimeType: string;
  fileName: string;
}

export interface Exponat {
  id: string;
  museumCode: string;
  deviceId: string;
  name: string;
  titel: string;
  text: string;
  mediaType: MediaType;
  seiten: number;
  pages: ExponatPage[];
  mediaAsset?: MediaAssetRef | null;
  audioCompanion?: AudioCompanionRef | null;
  v: number;
  createdAt: number;
  updatedAt: number;
  likesCount: number;
  likedBy: string[];
  /** Stored as map {"0": AnnotationItem[]} so Firestore never sees nested arrays */
  anm: Record<string, AnnotationItem[]>;
  kommentare: Kommentar[];
  rueck: Rueckmeldung[];
}

export interface FuehrungState {
  an: boolean;
  id: string; // active exhibit id, or '' for entrance
  s: number; // page index
  t: number; // heartbeat timestamp ms
}

export interface MuseumAusstellung {
  id: string;
  code: string;
  titel: string;
  klasse: string;
  hinweis: string;
  saal: SaalStil;
  phase: MuseumPhase;
  einreichen: boolean;
  kommentare: boolean;
  rueck: boolean;
  kriterien: string[];
  fuehrung: FuehrungState;
  stand: number;
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface PortalUser {
  id: string;
  name: string;
  pin: string;
  role: 'teacher' | 'admin';
  active: boolean;
  gender?: string;
  sourceTeacherId?: string;
  createdAt?: number;
}

export interface HallSlot {
  art: 'rand' | 'eingang' | 'tuer' | 'exponat' | 'ausgang';
  b: number;
  x: number;
  raum: number;
  nach?: number;
  e?: Exponat;
  nr?: number;
}
