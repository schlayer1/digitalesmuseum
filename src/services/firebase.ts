import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import {
  AnnotationItem,
  Exponat,
  FuehrungState,
  Kommentar,
  MuseumAusstellung,
  MuseumPhase,
  PortalUser,
  Rueckmeldung,
  SaalStil,
} from '../types/museum';
import { deleteKeysFromR2, deleteMuseumFolderFromR2, collectExhibitR2Keys } from './r2Storage';
import { generateMuseumCode } from '../utils/museumHelpers';

// Offizielle Firebase-Konfiguration des HBS App-Portals (terminkalender-7f269)
const envApiKey = ((import.meta as any).env?.VITE_FIREBASE_API_KEY as string | undefined)?.trim() || '';
const envStatistikApiKey = ((import.meta as any).env?.VITE_STATISTIK_FIREBASE_API_KEY as string | undefined)?.trim() || '';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: envApiKey,
  authDomain: 'terminkalender-7f269.firebaseapp.com',
  projectId: 'terminkalender-7f269',
  storageBucket: 'terminkalender-7f269.firebasestorage.app',
  messagingSenderId: '919163141331',
  appId: '1:919163141331:web:12c659f5c2946e7c7e2826',
};

// Optional: Kollegiumsliste aus Vertretungsstatistik (statistik-91f25)
export const STATISTIK_FIREBASE_CONFIG = {
  apiKey: envStatistikApiKey,
  authDomain: 'statistik-91f25.firebaseapp.com',
  projectId: 'statistik-91f25',
  storageBucket: 'statistik-91f25.firebasestorage.app',
  messagingSenderId: '277742289737',
  appId: '1:277742289737:web:b87043732524cc283d5098',
};

export const MASTER_ADMIN_PIN = 'Year2003?!%';
export const PORTAL_COLLECTION = 'hbs_appportal';
export const PORTAL_DATA_DOC = 'portal_data';
export const MUSEUMS_COLLECTION = 'hbs_museums';
export const TEACHER_SESSION_KEY = 'hbs_museum_teacher_user_v1';

export const SEED_TEACHERS: PortalUser[] = [
  { id: 't-allerdt', name: 'Allerdt', gender: 'm', pin: '6300', role: 'teacher', active: true },
  { id: 't-dengler', name: 'Dengler', gender: 'm', pin: '8991', role: 'teacher', active: true },
  { id: 't-funk', name: 'Funk', gender: 'f', pin: '1091', role: 'teacher', active: true },
  { id: 't-graefe', name: 'Gräfe', gender: 'm', pin: '6169', role: 'teacher', active: true },
  { id: 't-gruchmann', name: 'Gruchmann', gender: 'f', pin: '4444', role: 'teacher', active: true },
  { id: 't-haack', name: 'Haack', gender: 'f', pin: '4782', role: 'teacher', active: true },
  { id: 't-haase', name: 'Haase', gender: 'f', pin: '8511', role: 'teacher', active: true },
  { id: 't-halm', name: 'Halm', gender: 'f', pin: '1350', role: 'teacher', active: true },
  { id: 't-herold', name: 'Herold', gender: 'f', pin: '2116', role: 'teacher', active: true },
  { id: 't-illessy', name: 'Illessy', gender: 'm', pin: '2479', role: 'teacher', active: true },
  { id: 't-keim', name: 'Keim', gender: 'm', pin: '9672', role: 'teacher', active: true },
  { id: 't-keller', name: 'Keller', gender: 'f', pin: '6079', role: 'teacher', active: true },
  { id: 't-kleinfeld', name: 'Kleinfeld', gender: 'f', pin: '5901', role: 'teacher', active: true },
  { id: 't-koenig', name: 'König', gender: 'm', pin: '2699', role: 'teacher', active: true },
  { id: 't-koenitzern', name: 'Könitzer N', gender: 'f', pin: '2535', role: 'teacher', active: true },
  { id: 't-koenitzert', name: 'Könitzer T', gender: 'm', pin: '7909', role: 'teacher', active: true },
  { id: 't-mange', name: 'Mange', gender: 'f', pin: '3518', role: 'teacher', active: true },
  { id: 't-meier', name: 'Meier', gender: 'f', pin: '8652', role: 'teacher', active: true },
  { id: 't-nowak', name: 'Nowak', gender: 'm', pin: '6652', role: 'teacher', active: true },
  { id: 't-ottma', name: 'Ottma', gender: 'm', pin: '7710', role: 'teacher', active: true },
  { id: 't-petzold', name: 'Petzold', gender: 'f', pin: '6244', role: 'teacher', active: true },
  { id: 't-piel', name: 'Piel', gender: 'f', pin: '8814', role: 'teacher', active: true },
  { id: 't-schirmer', name: 'Schirmer', gender: 'f', pin: '8386', role: 'teacher', active: true },
  { id: 't-schmidt', name: 'Schmidt', gender: 'f', pin: '6403', role: 'teacher', active: true },
  { id: 't-schwappach', name: 'Schwappach', gender: 'm', pin: '7673', role: 'teacher', active: true },
  { id: 't-seifert', name: 'Seifert', gender: 'm', pin: '3314', role: 'teacher', active: true },
  { id: 't-surowy', name: 'Surowy', gender: 'f', pin: '9330', role: 'teacher', active: true },
  { id: 't-teubert', name: 'Teubert', gender: 'm', pin: '5812', role: 'teacher', active: true },
  { id: 't-thum', name: 'Thum', gender: 'f', pin: '2012', role: 'teacher', active: true },
  { id: 't-vogel', name: 'Vogel', gender: 'f', pin: '1027', role: 'teacher', active: true },
  { id: 't-voigt', name: 'Voigt', gender: 'f', pin: '5067', role: 'teacher', active: true },
  { id: 't-wagner', name: 'Wagner', gender: 'f', pin: '7734', role: 'teacher', active: true },
  { id: 't-weber', name: 'Weber', gender: 'm', pin: '2540', role: 'teacher', active: true },
  { id: 't-wesely', name: 'Wesely', gender: 'm', pin: '7484', role: 'teacher', active: true },
];

const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${DEFAULT_FIREBASE_CONFIG.projectId}/databases/(default)/documents`;
const SDK_OP_TIMEOUT_MS = 5000;

let dbInstance: Firestore | null = null;
let statistikDbInstance: Firestore | null = null;

function hasPrimaryApiKey(): boolean {
  return Boolean(DEFAULT_FIREBASE_CONFIG.apiKey);
}

function createSafeFirestore(firebaseApp: FirebaseApp): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  const app = getApps().some((a) => a.name === '[DEFAULT]') ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
  dbInstance = createSafeFirestore(app);
  return dbInstance;
}

function getStatistikDb(): Firestore | null {
  if (!STATISTIK_FIREBASE_CONFIG.apiKey) return null;
  if (statistikDbInstance) return statistikDbInstance;
  const existing = getApps().find((a) => a.name === 'statistik');
  const app = existing || initializeApp(STATISTIK_FIREBASE_CONFIG, 'statistik');
  statistikDbInstance = getFirestore(app);
  return statistikDbInstance;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer = 0;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(`${label}: Zeitüberschreitung nach ${Math.round(ms / 1000)}s`)), ms);
      }),
    ]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

function toFirestoreRestValue(val: unknown): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { integerValue: '0' };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map((item) => toFirestoreRestValue(item)),
      },
    };
  }
  if (typeof val === 'object') {
    return {
      mapValue: {
        fields: toFirestoreRestFields(val as Record<string, unknown>),
      },
    };
  }
  return { stringValue: String(val) };
}

function toFirestoreRestFields(obj: Record<string, unknown>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      fields[k] = toFirestoreRestValue(v);
    }
  }
  return fields;
}

function fromFirestoreRestValue(v: any): any {
  if (!v || typeof v !== 'object') return undefined;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return String(v.stringValue);
  if ('timestampValue' in v) return String(v.timestampValue);
  if ('arrayValue' in v) {
    const vals = v.arrayValue?.values;
    return Array.isArray(vals) ? vals.map((item: any) => fromFirestoreRestValue(item)) : [];
  }
  if ('mapValue' in v) {
    return fromFirestoreRestFields(v.mapValue?.fields);
  }
  return undefined;
}

function fromFirestoreRestFields(fields?: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  if (!fields || typeof fields !== 'object') return out;
  for (const [k, v] of Object.entries(fields)) {
    const decoded = fromFirestoreRestValue(v);
    if (decoded !== undefined) out[k] = decoded;
  }
  return out;
}

function buildRestUrl(docPath: string, params?: Record<string, string | string[]>): string {
  const url = new URL(`${FIRESTORE_REST_BASE}/${docPath}`);
  if (envApiKey) url.searchParams.set('key', envApiKey);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, item);
      } else {
        url.searchParams.set(k, v);
      }
    }
  }
  return url.toString();
}

async function parseRestError(res: Response, fallbackMsg: string): Promise<Error> {
  try {
    const json = await res.json();
    const msg = json?.error?.message || json?.[0]?.error?.message;
    if (msg) return new Error(`${fallbackMsg} (${msg})`);
  } catch {
    // ignore
  }
  return new Error(`${fallbackMsg} (HTTP ${res.status})`);
}

async function restGetDoc<T>(docPath: string): Promise<T | null> {
  const res = await withTimeout(fetch(buildRestUrl(docPath)), 8000, 'Firestore REST GET');
  if (res.status === 404) return null;
  if (!res.ok) throw await parseRestError(res, 'Datenbankabruf fehlgeschlagen');
  const json = await res.json();
  return fromFirestoreRestFields(json?.fields) as T;
}

async function restListCollection<T>(collectionPath: string, pageSize = 200): Promise<T[]> {
  const out: T[] = [];
  let pageToken = '';
  do {
    const params: Record<string, string> = { pageSize: String(pageSize) };
    if (pageToken) params.pageToken = pageToken;
    const res = await withTimeout(fetch(buildRestUrl(collectionPath, params)), 8000, 'Firestore REST LIST');
    if (res.status === 404) return [];
    if (!res.ok) throw await parseRestError(res, 'Ausstellungen konnten nicht geladen werden');
    const json = await res.json();
    if (Array.isArray(json?.documents)) {
      for (const d of json.documents) {
        out.push(fromFirestoreRestFields(d?.fields) as T);
      }
    }
    pageToken = typeof json?.nextPageToken === 'string' ? json.nextPageToken : '';
  } while (pageToken);
  return out;
}

async function restSetDoc(docPath: string, data: Record<string, unknown>, createOnly = false): Promise<void> {
  const params: Record<string, string> = {};
  if (createOnly) params['currentDocument.exists'] = 'false';
  const res = await withTimeout(
    fetch(buildRestUrl(docPath, params), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreRestFields(data) }),
    }),
    8000,
    'Firestore REST WRITE'
  );
  if (!res.ok) throw await parseRestError(res, 'Speichern in Firestore fehlgeschlagen');
}

async function restPatchDoc(docPath: string, patch: Record<string, unknown>): Promise<void> {
  const fieldPaths = Object.keys(patch).filter((k) => patch[k] !== undefined);
  if (!fieldPaths.length) return;
  const res = await withTimeout(
    fetch(buildRestUrl(docPath, { 'updateMask.fieldPaths': fieldPaths }), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreRestFields(patch) }),
    }),
    8000,
    'Firestore REST PATCH'
  );
  if (!res.ok) throw await parseRestError(res, 'Aktualisieren in Firestore fehlgeschlagen');
}

async function restDeleteDoc(docPath: string): Promise<void> {
  const res = await withTimeout(
    fetch(buildRestUrl(docPath), { method: 'DELETE' }),
    8000,
    'Firestore REST DELETE'
  );
  if (!res.ok && res.status !== 404) {
    throw await parseRestError(res, 'Löschen in Firestore fehlgeschlagen');
  }
}

// ---------- Lehrer-Authentifizierung (HBS App-Portal & Vertretungsstatistik Sync) ----------

export function getCurrentSchoolYear(): string {
  const now = new Date();
  const y1 = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${String(y1).slice(-2)}/${String(y1 + 1).slice(-2)}`;
}

interface StatistikTeacherEntry {
  id: string;
  name: string;
  pin: string;
  gender: string;
  active: boolean;
}

function parseStatistikYears(rawYearsJson: unknown, rawYearsObj: unknown): Record<string, any> {
  if (typeof rawYearsJson === 'string' && rawYearsJson.trim()) {
    try {
      const parsed = JSON.parse(rawYearsJson);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // ignore
    }
  }
  if (rawYearsObj && typeof rawYearsObj === 'object') {
    return rawYearsObj as Record<string, any>;
  }
  return {};
}

function isTeacherActiveInStatistikYear(teacher: { id?: string; active?: boolean }, yearData: any): boolean {
  if (!yearData || typeof yearData !== 'object') return teacher.active !== false;
  const tId = teacher.id ? String(teacher.id).trim() : '';
  if (!tId) return teacher.active !== false;

  if (yearData.staffStatus && yearData.staffStatus[tId] !== undefined) {
    return Boolean(yearData.staffStatus[tId]);
  }
  if (yearData.records && typeof yearData.records === 'object') {
    for (const monthKey of Object.keys(yearData.records)) {
      const rec = yearData.records[monthKey]?.[tId];
      if (rec && typeof rec === 'object' && Object.keys(rec).length > 0) return true;
    }
  }
  if (Array.isArray(yearData.azv) && yearData.azv.some((entry: any) => entry?.tId === tId)) {
    return true;
  }
  if (yearData.monthConfigs && typeof yearData.monthConfigs === 'object') {
    for (const monthKey of Object.keys(yearData.monthConfigs)) {
      if (yearData.monthConfigs[monthKey]?.[tId] !== undefined) return true;
    }
  }
  const yearHasAnyData =
    Object.keys(yearData.records || {}).length > 0 ||
    Object.keys(yearData.monthConfigs || {}).length > 0 ||
    (Array.isArray(yearData.azv) && yearData.azv.length > 0);
  if (!yearHasAnyData) return teacher.active !== false;
  return false;
}

function extractStatistikTeachers(
  rawTeachers: any[],
  docSchoolYear: unknown,
  rawYearsJson: unknown,
  rawYearsObj: unknown
): StatistikTeacherEntry[] {
  if (!Array.isArray(rawTeachers)) return [];
  const years = parseStatistikYears(rawYearsJson, rawYearsObj);
  const calcYear = getCurrentSchoolYear();
  const docYearStr = typeof docSchoolYear === 'string' ? docSchoolYear.trim() : '';
  const targetYear = years?.[calcYear] ? calcYear : docYearStr && years?.[docYearStr] ? docYearStr : calcYear;
  const yearData = years?.[targetYear];

  return rawTeachers.map((t: any) => ({
    id: t?.id ? String(t.id).trim() : '',
    name: t?.name ? String(t.name).trim() : '',
    pin: t?.pin !== undefined && t?.pin !== null ? String(t.pin).trim() : '',
    gender: t?.gender === 'f' || t?.gender === 'm' || t?.gender === 'd' ? t.gender : '',
    active: isTeacherActiveInStatistikYear({ id: t?.id ? String(t.id).trim() : '', active: t?.active }, yearData),
  }));
}

async function fetchStatistikTeachersFromCloud(): Promise<StatistikTeacherEntry[]> {
  const sDb = getStatistikDb();
  if (sDb) {
    try {
      const snap = await getDoc(doc(sDb, 'schools', 'HBS'));
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.teachers)) {
          return extractStatistikTeachers(data.teachers, data.schoolYear, data.yearsJson, data.years);
        }
      }
    } catch (err) {
      console.warn('Statistik Firestore SDK Lesefehler, nutze REST-Fallback:', err);
    }
  }

  try {
    const res = await fetch(
      'https://firestore.googleapis.com/v1/projects/statistik-91f25/databases/(default)/documents/schools/HBS'
    );
    if (!res.ok) return [];
    const docJson = await res.json();
    const fields = docJson?.fields || {};
    const values = fields?.teachers?.arrayValue?.values;
    if (!Array.isArray(values)) return [];
    const rawTeachers = values.map((v: any) => {
      const f = v?.mapValue?.fields || {};
      return {
        id: f.id?.stringValue ?? '',
        name: f.name?.stringValue ?? '',
        pin: f.pin?.stringValue ?? '',
        gender: f.gender?.stringValue ?? '',
        active: f.active?.booleanValue !== undefined ? Boolean(f.active.booleanValue) : true,
      };
    });
    return extractStatistikTeachers(rawTeachers, fields?.schoolYear?.stringValue, fields?.yearsJson?.stringValue, null);
  } catch (err) {
    console.warn('Statistik REST-Fallback Fehler:', err);
    return [];
  }
}

export async function loadPortalTeachers(): Promise<PortalUser[]> {
  const byName = new Map<string, PortalUser>();
  for (const t of SEED_TEACHERS) {
    byName.set(t.name.toLowerCase(), { ...t });
  }

  try {
    let portalUsers: PortalUser[] | undefined;
    if (hasPrimaryApiKey()) {
      try {
        const portalDoc = await withTimeout(
          getDoc(doc(getDb(), PORTAL_COLLECTION, PORTAL_DATA_DOC)),
          3500,
          'loadPortalTeachers'
        );
        if (portalDoc.exists()) {
          const data = portalDoc.data();
          if (Array.isArray(data?.users)) portalUsers = data.users as PortalUser[];
        }
      } catch {
        const restData = await restGetDoc<{ users?: PortalUser[] }>(`${PORTAL_COLLECTION}/${PORTAL_DATA_DOC}`);
        if (Array.isArray(restData?.users)) portalUsers = restData.users;
      }
    } else {
      const restData = await restGetDoc<{ users?: PortalUser[] }>(`${PORTAL_COLLECTION}/${PORTAL_DATA_DOC}`);
      if (Array.isArray(restData?.users)) portalUsers = restData.users;
    }

    if (Array.isArray(portalUsers)) {
      for (const u of portalUsers) {
        const cleanName = (u?.name || '').trim();
        if (cleanName && u?.pin && !cleanName.toLowerCase().includes('schulleitung') && cleanName.toLowerCase() !== 'nn') {
          const key = cleanName.toLowerCase();
          const prev = byName.get(key);
          byName.set(key, {
            id: u.id || prev?.id || `t-${key}`,
            name: cleanName,
            pin: String(u.pin).trim(),
            role: u.role === 'admin' ? 'admin' : 'teacher',
            active: u.active !== false,
            gender: u.gender || prev?.gender || '',
            sourceTeacherId: u.sourceTeacherId || prev?.sourceTeacherId,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Konnte Portal-Lehrkräfte nicht aus Firestore laden:', err);
  }

  const statList = await fetchStatistikTeachersFromCloud();
  for (const st of statList) {
    const cleanName = (st.name || '').trim();
    if (!cleanName || cleanName.toLowerCase().includes('schulleitung') || cleanName.toLowerCase() === 'nn') continue;
    const key = cleanName.toLowerCase();
    const prev = byName.get(key);
    if (prev) {
      byName.set(key, {
        ...prev,
        name: cleanName,
        pin: /^\d{4,}$/.test(st.pin) ? st.pin : prev.pin,
        gender: st.gender || prev.gender || '',
        active: st.active,
        sourceTeacherId: st.id || prev.sourceTeacherId,
      });
    } else if (st.active && /^\d{4,}$/.test(st.pin)) {
      byName.set(key, {
        id: st.id ? `t-${st.id}` : `t-${key}`,
        name: cleanName,
        pin: st.pin,
        role: 'teacher',
        active: true,
        gender: st.gender || '',
        sourceTeacherId: st.id || undefined,
      });
    }
  }

  return Array.from(byName.values())
    .filter((u) => u.active !== false && u.name.toLowerCase() !== 'nn')
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export function getSavedTeacherUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem(TEACHER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalUser;
    if (parsed && !parsed.gender && parsed.name) {
      const match = SEED_TEACHERS.find((t) => t.name.toLowerCase() === parsed.name.toLowerCase());
      if (match?.gender) {
        parsed.gender = match.gender;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveTeacherUser(user: PortalUser | null): void {
  try {
    if (user) localStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(TEACHER_SESSION_KEY);
  } catch {
    // ignore
  }
}

// ---------- Ausstellungen & Exponate (Firestore + REST Fallback) ----------

export async function listMuseums(): Promise<MuseumAusstellung[]> {
  if (hasPrimaryApiKey()) {
    try {
      const q = query(collection(getDb(), MUSEUMS_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await withTimeout(getDocs(q), SDK_OP_TIMEOUT_MS, 'listMuseums');
      const out: MuseumAusstellung[] = [];
      snap.forEach((d) => {
        out.push(d.data() as MuseumAusstellung);
      });
      return out;
    } catch (err) {
      console.warn('Firestore SDK listMuseums fehlgeschlagen, nutze REST-Fallback:', err);
    }
  }

  const list = await restListCollection<MuseumAusstellung>(MUSEUMS_COLLECTION);
  return list.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
}

export async function getMuseumByCode(code: string): Promise<MuseumAusstellung | null> {
  if (hasPrimaryApiKey()) {
    try {
      const snap = await withTimeout(
        getDoc(doc(getDb(), MUSEUMS_COLLECTION, code)),
        SDK_OP_TIMEOUT_MS,
        'getMuseumByCode'
      );
      return snap.exists() ? (snap.data() as MuseumAusstellung) : null;
    } catch (err) {
      console.warn('Firestore SDK getMuseumByCode fehlgeschlagen, nutze REST-Fallback:', err);
    }
  }
  return restGetDoc<MuseumAusstellung>(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}`);
}

export function subscribeToMuseum(
  code: string,
  onData: (museum: MuseumAusstellung | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  let receivedFromSdk = false;
  let pollTimer = 0;
  let unsubSdk: Unsubscribe = () => {};

  const startRestPolling = () => {
    if (pollTimer) return;
    const poll = () => {
      restGetDoc<MuseumAusstellung>(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}`)
        .then((m) => {
          if (!receivedFromSdk) onData(m);
        })
        .catch((err) => {
          if (!receivedFromSdk) onError?.(err);
        });
    };
    poll();
    pollTimer = window.setInterval(poll, 4000);
  };

  if (hasPrimaryApiKey()) {
    try {
      unsubSdk = onSnapshot(
        doc(getDb(), MUSEUMS_COLLECTION, code),
        (snap) => {
          receivedFromSdk = true;
          if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = 0;
          }
          onData(snap.exists() ? (snap.data() as MuseumAusstellung) : null);
        },
        (err) => {
          console.error('Firestore Museum Subscribe Error:', err);
          startRestPolling();
          onError?.(err);
        }
      );
      // Falls das WebChannel-Snapshot nach 2,5 s nicht eintrifft, sofort per REST laden
      window.setTimeout(() => {
        if (!receivedFromSdk) {
          restGetDoc<MuseumAusstellung>(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}`)
            .then((m) => {
              if (!receivedFromSdk) onData(m);
            })
            .catch(() => {});
        }
      }, 2500);
    } catch (err: any) {
      startRestPolling();
      onError?.(err);
    }
  } else {
    startRestPolling();
  }

  return () => {
    unsubSdk();
    if (pollTimer) window.clearInterval(pollTimer);
  };
}

export function subscribeToExhibits(
  code: string,
  onData: (exhibits: Exponat[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  let receivedFromSdk = false;
  let pollTimer = 0;
  let unsubSdk: Unsubscribe = () => {};

  const loadViaRest = () => {
    restListCollection<Exponat>(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}/exponate`)
      .then((list) => {
        if (!receivedFromSdk) {
          onData(list.sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0)));
        }
      })
      .catch((err) => {
        if (!receivedFromSdk) onError?.(err);
      });
  };

  const startRestPolling = () => {
    if (pollTimer) return;
    loadViaRest();
    pollTimer = window.setInterval(loadViaRest, 4000);
  };

  if (hasPrimaryApiKey()) {
    try {
      const q = query(collection(getDb(), MUSEUMS_COLLECTION, code, 'exponate'), orderBy('createdAt', 'asc'));
      unsubSdk = onSnapshot(
        q,
        (snap) => {
          receivedFromSdk = true;
          if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = 0;
          }
          const list: Exponat[] = [];
          snap.forEach((d) => list.push(d.data() as Exponat));
          onData(list);
        },
        (err) => {
          console.error('Firestore Exhibits Subscribe Error:', err);
          startRestPolling();
          onError?.(err);
        }
      );
      window.setTimeout(() => {
        if (!receivedFromSdk) loadViaRest();
      }, 2500);
    } catch (err: any) {
      startRestPolling();
      onError?.(err);
    }
  } else {
    startRestPolling();
  }

  return () => {
    unsubSdk();
    if (pollTimer) window.clearInterval(pollTimer);
  };
}

export async function createMuseum(input: {
  titel: string;
  klasse: string;
  hinweis: string;
  saal: SaalStil;
  kriterien: string[];
  authorId: string;
  authorName: string;
}): Promise<MuseumAusstellung> {
  let code = generateMuseumCode(6);
  for (let i = 0; i < 4; i++) {
    try {
      const existing = await getMuseumByCode(code);
      if (!existing) break;
      code = generateMuseumCode(6);
    } catch {
      break;
    }
  }

  const now = Date.now();
  const docData: MuseumAusstellung = {
    id: code,
    code,
    titel: input.titel.trim().slice(0, 120),
    klasse: input.klasse.trim().slice(0, 24),
    hinweis: input.hinweis.trim().slice(0, 500),
    saal: input.saal,
    phase: 'aufbau',
    einreichen: true,
    kommentare: true,
    rueck: true,
    kriterien: input.kriterien.length ? input.kriterien.slice(0, 3) : ['Inhalt', 'Gestaltung', 'Verständlichkeit'],
    fuehrung: { an: false, id: '', s: 0, t: 0 },
    stand: 1,
    authorId: input.authorId,
    authorName: input.authorName,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 Tage
  };

  if (hasPrimaryApiKey()) {
    try {
      await withTimeout(setDoc(doc(getDb(), MUSEUMS_COLLECTION, code), docData), SDK_OP_TIMEOUT_MS, 'createMuseum');
      return docData;
    } catch (err) {
      console.warn('Firestore SDK createMuseum fehlgeschlagen, nutze REST-Fallback:', err);
    }
  }

  await restSetDoc(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}`, docData as unknown as Record<string, unknown>, true);
  return docData;
}

export async function updateMuseumSettings(
  code: string,
  patch: Partial<Pick<MuseumAusstellung, 'titel' | 'klasse' | 'hinweis' | 'saal' | 'kriterien' | 'phase' | 'einreichen' | 'kommentare' | 'rueck' | 'fuehrung'>>
): Promise<void> {
  const payload = {
    ...patch,
    updatedAt: Date.now(),
  };
  if (hasPrimaryApiKey()) {
    try {
      const ref = doc(getDb(), MUSEUMS_COLLECTION, code);
      await withTimeout(updateDoc(ref, payload), SDK_OP_TIMEOUT_MS, 'updateMuseumSettings');
      return;
    } catch (err) {
      console.warn('Firestore SDK updateMuseumSettings fehlgeschlagen, nutze REST-Fallback:', err);
    }
  }
  await restPatchDoc(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}`, payload);
}

export async function updateMuseumFuehrung(code: string, fuehrung: FuehrungState): Promise<void> {
  const payload = {
    fuehrung,
    updatedAt: Date.now(),
  };
  if (hasPrimaryApiKey()) {
    try {
      const ref = doc(getDb(), MUSEUMS_COLLECTION, code);
      await withTimeout(updateDoc(ref, payload), SDK_OP_TIMEOUT_MS, 'updateMuseumFuehrung');
      return;
    } catch (err) {
      console.warn('Firestore SDK updateMuseumFuehrung fehlgeschlagen, nutze REST-Fallback:', err);
    }
  }
  await restPatchDoc(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}`, payload);
}

export async function deleteMuseumAndFiles(
  code: string
): Promise<{ deletedExhibits: number; deletedR2Files: number }> {
  let exhibits: Exponat[] = [];
  let usedSdk = false;

  if (hasPrimaryApiKey()) {
    try {
      const db = getDb();
      const exSnap = await withTimeout(
        getDocs(collection(db, MUSEUMS_COLLECTION, code, 'exponate')),
        SDK_OP_TIMEOUT_MS,
        'deleteMuseumAndFiles.list'
      );
      usedSdk = true;
      exhibits = exSnap.docs.map((d) => d.data() as Exponat);
      for (const d of exSnap.docs) {
        await withTimeout(deleteDoc(d.ref), SDK_OP_TIMEOUT_MS, 'deleteMuseumAndFiles.deleteExponat');
      }
    } catch (err) {
      console.warn('Firestore SDK deleteMuseumAndFiles fehlgeschlagen, nutze REST-Fallback:', err);
      usedSdk = false;
    }
  }

  if (!usedSdk) {
    exhibits = await restListCollection<Exponat>(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}/exponate`);
    for (const ex of exhibits) {
      await restDeleteDoc(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}/exponate/${encodeURIComponent(ex.id)}`);
    }
  }

  const allKeys: string[] = [];
  for (const ex of exhibits) {
    allKeys.push(...collectExhibitR2Keys(ex));
  }
  const deletedR2Files = await deleteMuseumFolderFromR2(code, allKeys);

  if (usedSdk) {
    try {
      await withTimeout(deleteDoc(doc(getDb(), MUSEUMS_COLLECTION, code)), SDK_OP_TIMEOUT_MS, 'deleteMuseumAndFiles.deleteMuseum');
    } catch {
      await restDeleteDoc(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}`);
    }
  } else {
    await restDeleteDoc(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}`);
  }

  return {
    deletedExhibits: exhibits.length,
    deletedR2Files,
  };
}

export async function saveExhibit(code: string, exhibit: Exponat): Promise<void> {
  if (hasPrimaryApiKey()) {
    try {
      const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibit.id);
      await withTimeout(setDoc(ref, exhibit), SDK_OP_TIMEOUT_MS, 'saveExhibit');
      return;
    } catch (err) {
      console.warn('Firestore SDK saveExhibit fehlgeschlagen, nutze REST-Fallback:', err);
    }
  }
  await restSetDoc(
    `${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}/exponate/${encodeURIComponent(exhibit.id)}`,
    exhibit as unknown as Record<string, unknown>
  );
}

export async function deleteExhibitAndFiles(code: string, exhibit: Exponat): Promise<void> {
  const keys = collectExhibitR2Keys(exhibit);
  await deleteKeysFromR2(keys);
  if (hasPrimaryApiKey()) {
    try {
      await withTimeout(
        deleteDoc(doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibit.id)),
        SDK_OP_TIMEOUT_MS,
        'deleteExhibitAndFiles'
      );
      return;
    } catch (err) {
      console.warn('Firestore SDK deleteExhibitAndFiles fehlgeschlagen, nutze REST-Fallback:', err);
    }
  }
  await restDeleteDoc(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}/exponate/${encodeURIComponent(exhibit.id)}`);
}

async function mutateExhibit(
  code: string,
  exhibitId: string,
  buildPatch: (ex: Exponat) => Record<string, unknown>
): Promise<void> {
  if (hasPrimaryApiKey()) {
    try {
      const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibitId);
      await withTimeout(
        runTransaction(getDb(), async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const patch = buildPatch(snap.data() as Exponat);
          tx.update(ref, { ...patch, updatedAt: Date.now() });
        }),
        SDK_OP_TIMEOUT_MS,
        'mutateExhibit'
      );
      return;
    } catch (err) {
      console.warn('Firestore SDK mutateExhibit fehlgeschlagen, nutze REST-Fallback:', err);
    }
  }

  const docPath = `${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}/exponate/${encodeURIComponent(exhibitId)}`;
  const ex = await restGetDoc<Exponat>(docPath);
  if (!ex) return;
  const patch = buildPatch(ex);
  await restPatchDoc(docPath, { ...patch, updatedAt: Date.now() });
}

export async function toggleExhibitLike(code: string, exhibitId: string, deviceId: string): Promise<void> {
  await mutateExhibit(code, exhibitId, (ex) => {
    const likedBy = Array.isArray(ex.likedBy) ? [...ex.likedBy] : [];
    const idx = likedBy.indexOf(deviceId);
    if (idx >= 0) likedBy.splice(idx, 1);
    else likedBy.push(deviceId);
    return { likedBy, likesCount: likedBy.length };
  });
}

export async function addExhibitComment(code: string, exhibitId: string, comment: Kommentar): Promise<void> {
  await mutateExhibit(code, exhibitId, (ex) => {
    const kommentare = Array.isArray(ex.kommentare) ? [...ex.kommentare] : [];
    kommentare.push(comment);
    return { kommentare: kommentare.slice(-300) };
  });
}

export async function removeExhibitComment(code: string, exhibitId: string, commentId: string): Promise<void> {
  await mutateExhibit(code, exhibitId, (ex) => ({
    kommentare: (ex.kommentare || []).filter((c) => c.id !== commentId),
  }));
}

export async function answerExhibitQuestion(
  code: string,
  exhibitId: string,
  commentId: string,
  answerText: string
): Promise<void> {
  await mutateExhibit(code, exhibitId, (ex) => ({
    kommentare: (ex.kommentare || []).map((c) =>
      c.id === commentId
        ? {
            ...c,
            antwort: answerText.trim() ? { text: answerText.trim().slice(0, 300), zeit: Math.floor(Date.now() / 1000) } : null,
          }
        : c
    ),
  }));
}

export async function upsertExhibitFeedback(code: string, exhibitId: string, feedback: Rueckmeldung): Promise<void> {
  await mutateExhibit(code, exhibitId, (ex) => {
    const rueck = (ex.rueck || []).filter((r) => r.deviceId !== feedback.deviceId);
    rueck.push(feedback);
    return { rueck: rueck.slice(-300) };
  });
}

export async function removeExhibitFeedback(code: string, exhibitId: string, feedbackId: string): Promise<void> {
  await mutateExhibit(code, exhibitId, (ex) => ({
    rueck: (ex.rueck || []).filter((r) => r.id !== feedbackId),
  }));
}

export async function updateExhibitAnnotations(
  code: string,
  exhibitId: string,
  anm: Record<string, AnnotationItem[]>
): Promise<void> {
  const payload = { anm, updatedAt: Date.now() };
  if (hasPrimaryApiKey()) {
    try {
      const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibitId);
      await withTimeout(updateDoc(ref, payload), SDK_OP_TIMEOUT_MS, 'updateExhibitAnnotations');
      return;
    } catch (err) {
      console.warn('Firestore SDK updateExhibitAnnotations fehlgeschlagen, nutze REST-Fallback:', err);
    }
  }
  await restPatchDoc(`${MUSEUMS_COLLECTION}/${encodeURIComponent(code)}/exponate/${encodeURIComponent(exhibitId)}`, payload);
}

export async function setMuseumPhase(code: string, phase: MuseumPhase): Promise<void> {
  await updateMuseumSettings(code, { phase });
}
