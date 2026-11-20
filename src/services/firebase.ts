import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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

let dbInstance: Firestore | null = null;
let statistikDbInstance: Firestore | null = null;

function createPersistentFirestore(firebaseApp: FirebaseApp): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  const app = getApps().some((a) => a.name === '[DEFAULT]') ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
  dbInstance = createPersistentFirestore(app);
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
    const portalDoc = await getDoc(doc(getDb(), PORTAL_COLLECTION, PORTAL_DATA_DOC));
    if (portalDoc.exists()) {
      const data = portalDoc.data();
      if (Array.isArray(data?.users)) {
        for (const u of data.users as PortalUser[]) {
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

// ---------- Ausstellungen & Exponate (Firestore) ----------

export async function listMuseums(): Promise<MuseumAusstellung[]> {
  const q = query(collection(getDb(), MUSEUMS_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const out: MuseumAusstellung[] = [];
  snap.forEach((d) => {
    out.push(d.data() as MuseumAusstellung);
  });
  return out;
}

export async function getMuseumByCode(code: string): Promise<MuseumAusstellung | null> {
  const snap = await getDoc(doc(getDb(), MUSEUMS_COLLECTION, code));
  return snap.exists() ? (snap.data() as MuseumAusstellung) : null;
}

export function subscribeToMuseum(
  code: string,
  onData: (museum: MuseumAusstellung | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), MUSEUMS_COLLECTION, code),
    (snap) => {
      onData(snap.exists() ? (snap.data() as MuseumAusstellung) : null);
    },
    (err) => {
      console.error('Firestore Museum Subscribe Error:', err);
      onError?.(err);
    }
  );
}

export function subscribeToExhibits(
  code: string,
  onData: (exhibits: Exponat[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(getDb(), MUSEUMS_COLLECTION, code, 'exponate'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: Exponat[] = [];
      snap.forEach((d) => list.push(d.data() as Exponat));
      onData(list);
    },
    (err) => {
      console.error('Firestore Exhibits Subscribe Error:', err);
      onError?.(err);
    }
  );
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
  const db = getDb();
  let code = generateMuseumCode(6);
  for (let i = 0; i < 6; i++) {
    const existing = await getDoc(doc(db, MUSEUMS_COLLECTION, code));
    if (!existing.exists()) break;
    code = generateMuseumCode(6);
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

  await setDoc(doc(db, MUSEUMS_COLLECTION, code), docData);
  return docData;
}

export async function updateMuseumSettings(
  code: string,
  patch: Partial<Pick<MuseumAusstellung, 'titel' | 'klasse' | 'hinweis' | 'saal' | 'kriterien' | 'phase' | 'einreichen' | 'kommentare' | 'rueck' | 'fuehrung'>>
): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code);
  await updateDoc(ref, {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function updateMuseumFuehrung(code: string, fuehrung: FuehrungState): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code);
  await updateDoc(ref, {
    fuehrung,
    updatedAt: Date.now(),
  });
}

export async function deleteMuseumAndFiles(
  code: string
): Promise<{ deletedExhibits: number; deletedR2Files: number }> {
  const db = getDb();
  const exSnap = await getDocs(collection(db, MUSEUMS_COLLECTION, code, 'exponate'));
  const allKeys: string[] = [];
  for (const d of exSnap.docs) {
    const ex = d.data() as Exponat;
    allKeys.push(...collectExhibitR2Keys(ex));
    await deleteDoc(d.ref);
  }
  const deletedR2Files = await deleteMuseumFolderFromR2(code, allKeys);
  await deleteDoc(doc(db, MUSEUMS_COLLECTION, code));
  return {
    deletedExhibits: exSnap.size,
    deletedR2Files,
  };
}

export async function saveExhibit(code: string, exhibit: Exponat): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibit.id);
  await setDoc(ref, exhibit);
}

export async function deleteExhibitAndFiles(code: string, exhibit: Exponat): Promise<void> {
  const keys = collectExhibitR2Keys(exhibit);
  await deleteKeysFromR2(keys);
  await deleteDoc(doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibit.id));
}

export async function toggleExhibitLike(code: string, exhibitId: string, deviceId: string): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibitId);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const ex = snap.data() as Exponat;
    const likedBy = Array.isArray(ex.likedBy) ? [...ex.likedBy] : [];
    const idx = likedBy.indexOf(deviceId);
    if (idx >= 0) likedBy.splice(idx, 1);
    else likedBy.push(deviceId);
    tx.update(ref, {
      likedBy,
      likesCount: likedBy.length,
      updatedAt: Date.now(),
    });
  });
}

export async function addExhibitComment(code: string, exhibitId: string, comment: Kommentar): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibitId);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const ex = snap.data() as Exponat;
    const kommentare = Array.isArray(ex.kommentare) ? [...ex.kommentare] : [];
    kommentare.push(comment);
    tx.update(ref, {
      kommentare: kommentare.slice(-300),
      updatedAt: Date.now(),
    });
  });
}

export async function removeExhibitComment(code: string, exhibitId: string, commentId: string): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibitId);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const ex = snap.data() as Exponat;
    const kommentare = (ex.kommentare || []).filter((c) => c.id !== commentId);
    tx.update(ref, {
      kommentare,
      updatedAt: Date.now(),
    });
  });
}

export async function answerExhibitQuestion(
  code: string,
  exhibitId: string,
  commentId: string,
  answerText: string
): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibitId);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const ex = snap.data() as Exponat;
    const kommentare = (ex.kommentare || []).map((c) =>
      c.id === commentId
        ? {
            ...c,
            antwort: answerText.trim() ? { text: answerText.trim().slice(0, 300), zeit: Math.floor(Date.now() / 1000) } : null,
          }
        : c
    );
    tx.update(ref, {
      kommentare,
      updatedAt: Date.now(),
    });
  });
}

export async function upsertExhibitFeedback(code: string, exhibitId: string, feedback: Rueckmeldung): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibitId);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const ex = snap.data() as Exponat;
    const rueck = (ex.rueck || []).filter((r) => r.deviceId !== feedback.deviceId);
    rueck.push(feedback);
    tx.update(ref, {
      rueck: rueck.slice(-300),
      updatedAt: Date.now(),
    });
  });
}

export async function removeExhibitFeedback(code: string, exhibitId: string, feedbackId: string): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibitId);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const ex = snap.data() as Exponat;
    const rueck = (ex.rueck || []).filter((r) => r.id !== feedbackId);
    tx.update(ref, {
      rueck,
      updatedAt: Date.now(),
    });
  });
}

export async function updateExhibitAnnotations(
  code: string,
  exhibitId: string,
  anm: Record<string, AnnotationItem[]>
): Promise<void> {
  const ref = doc(getDb(), MUSEUMS_COLLECTION, code, 'exponate', exhibitId);
  await updateDoc(ref, {
    anm,
    updatedAt: Date.now(),
  });
}

export async function setMuseumPhase(code: string, phase: MuseumPhase): Promise<void> {
  await updateMuseumSettings(code, { phase });
}
