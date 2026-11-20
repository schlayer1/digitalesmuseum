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
  { id: 't-allerdt', name: 'Allerdt', pin: '6300', role: 'teacher', active: true },
  { id: 't-dengler', name: 'Dengler', pin: '8991', role: 'teacher', active: true },
  { id: 't-funk', name: 'Funk', pin: '1091', role: 'teacher', active: true },
  { id: 't-graefe', name: 'Gräfe', pin: '6169', role: 'teacher', active: true },
  { id: 't-gruchmann', name: 'Gruchmann', pin: '4444', role: 'teacher', active: true },
  { id: 't-haase', name: 'Haase', pin: '8511', role: 'teacher', active: true },
  { id: 't-halm', name: 'Halm', pin: '1350', role: 'teacher', active: true },
  { id: 't-herold', name: 'Herold', pin: '2116', role: 'teacher', active: true },
  { id: 't-illessy', name: 'Illessy', pin: '2479', role: 'teacher', active: true },
  { id: 't-keim', name: 'Keim', pin: '9672', role: 'teacher', active: true },
  { id: 't-keller', name: 'Keller', pin: '6079', role: 'teacher', active: true },
  { id: 't-kleinfeld', name: 'Kleinfeld', pin: '5901', role: 'teacher', active: true },
  { id: 't-koenig', name: 'König', pin: '2699', role: 'teacher', active: true },
  { id: 't-koenitzern', name: 'Könitzer N', pin: '2535', role: 'teacher', active: true },
  { id: 't-koenitzert', name: 'Könitzer T', pin: '7909', role: 'teacher', active: true },
  { id: 't-mange', name: 'Mange', pin: '3518', role: 'teacher', active: true },
  { id: 't-meier', name: 'Meier', pin: '8652', role: 'teacher', active: true },
  { id: 't-nowak', name: 'Nowak', pin: '6652', role: 'teacher', active: true },
  { id: 't-ottma', name: 'Ottma', pin: '7710', role: 'teacher', active: true },
  { id: 't-petzold', name: 'Petzold', pin: '6244', role: 'teacher', active: true },
  { id: 't-piel', name: 'Piel', pin: '8814', role: 'teacher', active: true },
  { id: 't-schirmer', name: 'Schirmer', pin: '8386', role: 'teacher', active: true },
  { id: 't-schmidt', name: 'Schmidt', pin: '6403', role: 'teacher', active: true },
  { id: 't-schwappach', name: 'Schwappach', pin: '7673', role: 'teacher', active: true },
  { id: 't-seifert', name: 'Seifert', pin: '3314', role: 'teacher', active: true },
  { id: 't-surowy', name: 'Surowy', pin: '9330', role: 'teacher', active: true },
  { id: 't-teubert', name: 'Teubert', pin: '5812', role: 'teacher', active: true },
  { id: 't-thum', name: 'Thum', pin: '2012', role: 'teacher', active: true },
  { id: 't-vogel', name: 'Vogel', pin: '1027', role: 'teacher', active: true },
  { id: 't-voigt', name: 'Voigt', pin: '5067', role: 'teacher', active: true },
  { id: 't-wagner', name: 'Wagner', pin: '7734', role: 'teacher', active: true },
  { id: 't-weber', name: 'Weber', pin: '2540', role: 'teacher', active: true },
  { id: 't-wesely', name: 'Wesely', pin: '7484', role: 'teacher', active: true },
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

// ---------- Lehrer-Authentifizierung (HBS App-Portal Sync) ----------

export async function loadPortalTeachers(): Promise<PortalUser[]> {
  const byId = new Map<string, PortalUser>();
  for (const t of SEED_TEACHERS) byId.set(t.name.toLowerCase(), t);

  try {
    const portalDoc = await getDoc(doc(getDb(), PORTAL_COLLECTION, PORTAL_DATA_DOC));
    if (portalDoc.exists()) {
      const data = portalDoc.data();
      if (Array.isArray(data?.users)) {
        for (const u of data.users as PortalUser[]) {
          if (u?.name && u?.pin) {
            byId.set(u.name.toLowerCase(), {
              id: u.id || `t-${u.name.toLowerCase()}`,
              name: u.name,
              pin: String(u.pin),
              role: u.role === 'admin' ? 'admin' : 'teacher',
              active: u.active !== false,
              gender: u.gender,
              sourceTeacherId: u.sourceTeacherId,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Konnte Portal-Lehrkräfte nicht aus Firestore laden:', err);
  }

  const sDb = getStatistikDb();
  if (sDb) {
    try {
      const snap = await getDocs(collection(sDb, 'teachers'));
    snap.forEach((d) => {
      const raw = d.data() as any;
      if (raw?.name && raw?.pin && raw?.active !== false) {
        const key = String(raw.name).trim().toLowerCase();
        const prev = byId.get(key);
        byId.set(key, {
          id: prev?.id || `stat-${d.id}`,
          name: String(raw.name).trim(),
          pin: String(raw.pin).trim(),
          role: prev?.role || 'teacher',
          active: true,
          gender: raw.gender || prev?.gender,
          sourceTeacherId: d.id,
        });
      }
    });
    } catch {
      // Fallback to portal_data + SEED_TEACHERS
    }
  }

  return Array.from(byId.values())
    .filter((u) => u.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export function getSavedTeacherUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem(TEACHER_SESSION_KEY);
    return raw ? (JSON.parse(raw) as PortalUser) : null;
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
