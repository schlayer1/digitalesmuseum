import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GraduationCap, Landmark, MonitorPlay, Sparkles, Upload } from 'lucide-react';
import {
  AnnotationItem,
  Exponat,
  KommentarStelle,
  MuseumAusstellung,
  PortalUser,
  SaalStil,
} from './types/museum';
import {
  addExhibitComment,
  answerExhibitQuestion,
  deleteExhibitAndFiles,
  getMuseumByCode,
  getSavedTeacherUser,
  removeExhibitComment,
  removeExhibitFeedback,
  saveExhibit,
  saveTeacherUser,
  setMuseumPhase,
  subscribeToExhibits,
  subscribeToMuseum,
  toggleExhibitLike,
  updateExhibitAnnotations,
  updateMuseumFuehrung,
  upsertExhibitFeedback,
} from './services/firebase';
import { resolvePageImageUrl } from './services/r2Storage';
import {
  buildDemoExhibition,
  createRandomFeedback,
  DEMO_ANTWORTEN,
  DEMO_FRAGEN,
  DEMO_KOMMENTARE,
  zufallAus,
} from './utils/demoData';
import {
  getDeviceId,
  isValidCode,
  mehrzahl,
  normalizeCode,
  randomId,
  SAELE,
  spitzname,
} from './utils/museumHelpers';
import { HbsBadge, HbsButton, HbsCard, HbsHeader } from './components/hbs/HbsKit';
import { MuseumHallView } from './components/museum/MuseumHallView';
import { ExhibitSubmitForm } from './components/museum/ExhibitSubmitForm';
import { ExitSummaryView } from './components/museum/ExitSummaryView';
import { TeacherLoginCard } from './components/teacher/TeacherLoginCard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';

type RouteState =
  | { kind: 'home' }
  | { kind: 'demo'; beamer: boolean; saal: SaalStil }
  | { kind: 'student'; code: string }
  | { kind: 'teacher'; code: string }
  | { kind: 'beamer'; code: string };

function parseRoute(): RouteState {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  if (demo !== null) {
    const rawSaal = params.get('saal') as SaalStil | null;
    const saal: SaalStil = rawSaal && SAELE[rawSaal] ? rawSaal : 'klassisch';
    return { kind: 'demo', beamer: demo === 'beamer', saal };
  }

  const hash = window.location.hash || '';
  if (hash.startsWith('#beamer/')) {
    const code = normalizeCode(hash.slice(8));
    if (isValidCode(code)) return { kind: 'beamer', code };
  }
  if (hash.startsWith('#lehrer')) {
    const code = normalizeCode(hash.split('/')[1] || '');
    return { kind: 'teacher', code: isValidCode(code) ? code : '' };
  }

  const r = normalizeCode(params.get('r') || '');
  if (isValidCode(r)) {
    return { kind: 'student', code: r };
  }

  return { kind: 'home' };
}

export function App() {
  const [route, setRoute] = useState<RouteState>(parseRoute);
  const [deviceId] = useState<string>(() => getDeviceId());
  const [teacher, setTeacher] = useState<PortalUser | null>(() => getSavedTeacherUser());

  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef<number>(0);

  // Live Firestore exhibition state (for student & beamer views)
  const [liveMuseum, setLiveMuseum] = useState<MuseumAusstellung | null>(null);
  const [liveExhibits, setLiveExhibits] = useState<Exponat[]>([]);
  const [loadingRoom, setLoadingRoom] = useState(false);

  // Demo state
  const [demoState, setDemoState] = useState<{ museum: MuseumAusstellung; exponate: Exponat[] } | null>(null);

  // Subviews within student / demo / beamer
  const [studentSubview, setStudentSubview] = useState<'default' | 'form' | 'abschied'>('default');
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [focusExhibitId, setFocusExhibitId] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    const sync = () => {
      setRoute(parseRoute());
      setStudentSubview('default');
      setFocusExhibitId(null);
    };
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  const navigateUrl = (search: string, hash = '') => {
    const nextUrl = window.location.pathname + search + hash;
    window.history.pushState(null, '', nextUrl);
    setRoute(parseRoute());
    setStudentSubview('default');
    setFocusExhibitId(null);
  };

  // Initialize Demo when route is demo
  useEffect(() => {
    if (route.kind !== 'demo') {
      setDemoState(null);
      return;
    }
    setDemoState(buildDemoExhibition(route.saal));
  }, [route.kind, route.kind === 'demo' ? route.saal : '']);

  // Live Demo visitor simulation
  useEffect(() => {
    if (route.kind !== 'demo' || !demoState || studentSubview !== 'default') return;
    const timer = window.setInterval(() => {
      setDemoState((prev) => {
        if (!prev || !prev.exponate.length) return prev;
        const idx = Math.floor(Math.random() * prev.exponate.length);
        const ex = { ...prev.exponate[idx] };
        const z = Math.random();
        if (z < 0.45) {
          ex.likesCount += 1;
        } else {
          ex.kommentare = [
            ...ex.kommentare,
            {
              id: 'k' + Date.now() + Math.floor(Math.random() * 99),
              deviceId: 'sim-v-' + Date.now(),
              name: spitzname(),
              art: z < 0.85 ? 'kommentar' : 'frage',
              text: z < 0.85 ? zufallAus(DEMO_KOMMENTARE) : zufallAus(DEMO_FRAGEN),
              zeit: Math.floor(Date.now() / 1000),
              antwort: null,
            },
          ];
        }
        const openQIdx = ex.kommentare.findIndex((c) => c.art === 'frage' && !c.antwort && c.deviceId !== deviceId);
        if (openQIdx >= 0 && Math.random() < 0.4) {
          ex.kommentare = ex.kommentare.map((c, i) =>
            i === openQIdx ? { ...c, antwort: { text: zufallAus(DEMO_ANTWORTEN), zeit: Math.floor(Date.now() / 1000) } } : c
          );
        }
        if (Math.random() < 0.15 && ex.rueck.length < 6) {
          ex.rueck = [...ex.rueck, createRandomFeedback()];
        }
        const nextExhibits = [...prev.exponate];
        nextExhibits[idx] = ex;
        return { ...prev, exponate: nextExhibits };
      });
    }, 5500);
    return () => window.clearInterval(timer);
  }, [route.kind, Boolean(demoState), studentSubview, deviceId]);

  // Subscribe to Firestore when route is student or beamer
  useEffect(() => {
    if (route.kind !== 'student' && route.kind !== 'beamer') {
      setLiveMuseum(null);
      setLiveExhibits([]);
      return;
    }
    setLoadingRoom(true);
    const unsub1 = subscribeToMuseum(
      route.code,
      (m) => {
        setLiveMuseum(m);
        setLoadingRoom(false);
      },
      () => setLoadingRoom(false)
    );
    const unsub2 = subscribeToExhibits(route.code, (list) => {
      setLiveExhibits(list);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [route.kind, route.kind === 'student' || route.kind === 'beamer' ? route.code : '']);

  // End guided tour if leaving Beamer route
  useEffect(() => {
    if (route.kind !== 'beamer') return;
    const code = route.code;
    const endTour = () => {
      if (liveMuseum?.fuehrung?.an) {
        updateMuseumFuehrung(code, { an: false, id: '', s: 0, t: Date.now() }).catch(() => {});
      }
    };
    window.addEventListener('pagehide', endTour);
    return () => {
      window.removeEventListener('pagehide', endTour);
      endTour();
    };
  }, [route.kind, route.kind === 'beamer' ? route.code : '', liveMuseum?.fuehrung?.an]);

  const handleEnterCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = normalizeCode(codeInput);
    if (!isValidCode(clean)) {
      setCodeError('Bitte einen gültigen Code (4–10 Zeichen) eingeben.');
      return;
    }
    setCodeError('');
    setLoadingRoom(true);
    try {
      const m = await getMuseumByCode(clean);
      if (!m) {
        setCodeError('Diesen Ausstellungs-Code gibt es nicht.');
        setLoadingRoom(false);
        return;
      }
      navigateUrl(`?r=${clean}`);
    } catch {
      setCodeError('Verbindung zur Datenbank fehlgeschlagen.');
    } finally {
      setLoadingRoom(false);
    }
  };

  // Unified action handlers (Demo vs Live Firestore)
  const isDemoRoute = route.kind === 'demo';
  const activeMuseum = isDemoRoute ? demoState?.museum || null : liveMuseum;
  const activeExhibits = isDemoRoute ? demoState?.exponate || [] : liveExhibits;

  const handleLike = async (exhibitId: string) => {
    if (isDemoRoute) {
      setDemoState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exponate: prev.exponate.map((e) => {
            if (e.id !== exhibitId) return e;
            const liked = e.likedBy.includes(deviceId);
            const likedBy = liked ? e.likedBy.filter((d) => d !== deviceId) : [...e.likedBy, deviceId];
            return { ...e, likedBy, likesCount: likedBy.length };
          }),
        };
      });
      return;
    }
    if (activeMuseum) await toggleExhibitLike(activeMuseum.code, exhibitId, deviceId);
  };

  const handleAddComment = async (
    exhibitId: string,
    art: 'kommentar' | 'frage',
    text: string,
    spot: KommentarStelle | null,
    nickname: string
  ) => {
    const comment = {
      id: 'k_' + randomId(10),
      deviceId,
      name: nickname,
      art,
      text,
      zeit: Math.floor(Date.now() / 1000),
      stelle: spot,
      antwort: null,
    };
    if (isDemoRoute) {
      setDemoState((prev) =>
        prev
          ? {
              ...prev,
              exponate: prev.exponate.map((e) =>
                e.id === exhibitId ? { ...e, kommentare: [...e.kommentare, comment] } : e
              ),
            }
          : prev
      );
      return;
    }
    if (activeMuseum) await addExhibitComment(activeMuseum.code, exhibitId, comment);
  };

  const handleDeleteComment = async (exhibitId: string, commentId: string) => {
    if (isDemoRoute) {
      setDemoState((prev) =>
        prev
          ? {
              ...prev,
              exponate: prev.exponate.map((e) =>
                e.id === exhibitId ? { ...e, kommentare: e.kommentare.filter((c) => c.id !== commentId) } : e
              ),
            }
          : prev
      );
      return;
    }
    if (activeMuseum) await removeExhibitComment(activeMuseum.code, exhibitId, commentId);
  };

  const handleAnswerQuestion = async (exhibitId: string, commentId: string, text: string) => {
    if (isDemoRoute) {
      setDemoState((prev) =>
        prev
          ? {
              ...prev,
              exponate: prev.exponate.map((e) =>
                e.id === exhibitId
                  ? {
                      ...e,
                      kommentare: e.kommentare.map((c) =>
                        c.id === commentId ? { ...c, antwort: { text, zeit: Math.floor(Date.now() / 1000) } } : c
                      ),
                    }
                  : e
              ),
            }
          : prev
      );
      return;
    }
    if (activeMuseum) await answerExhibitQuestion(activeMuseum.code, exhibitId, commentId, text);
  };

  const handleSaveFeedback = async (
    exhibitId: string,
    sterne: number[],
    gut: string,
    tipp: string,
    nickname: string
  ) => {
    const fb = {
      id: 'r_' + randomId(10),
      deviceId,
      name: nickname,
      sterne,
      gut,
      tipp,
      zeit: Math.floor(Date.now() / 1000),
    };
    if (isDemoRoute) {
      setDemoState((prev) =>
        prev
          ? {
              ...prev,
              exponate: prev.exponate.map((e) =>
                e.id === exhibitId
                  ? { ...e, rueck: [...e.rueck.filter((r) => r.deviceId !== deviceId), fb] }
                  : e
              ),
            }
          : prev
      );
      return;
    }
    if (activeMuseum) await upsertExhibitFeedback(activeMuseum.code, exhibitId, fb);
  };

  const handleDeleteFeedback = async (exhibitId: string, feedbackId: string) => {
    if (isDemoRoute) {
      setDemoState((prev) =>
        prev
          ? {
              ...prev,
              exponate: prev.exponate.map((e) =>
                e.id === exhibitId ? { ...e, rueck: e.rueck.filter((r) => r.id !== feedbackId) } : e
              ),
            }
          : prev
      );
      return;
    }
    if (activeMuseum) await removeExhibitFeedback(activeMuseum.code, exhibitId, feedbackId);
  };

  const handleSaveAnnotations = async (exhibitId: string, anm: Record<string, AnnotationItem[]>) => {
    if (isDemoRoute) {
      setDemoState((prev) =>
        prev
          ? {
              ...prev,
              exponate: prev.exponate.map((e) => (e.id === exhibitId ? { ...e, anm, v: e.v + 1 } : e)),
            }
          : prev
      );
      return;
    }
    if (activeMuseum) await updateExhibitAnnotations(activeMuseum.code, exhibitId, anm);
  };

  const handleSubmittedExhibit = async (exhibit: Exponat) => {
    if (isDemoRoute) {
      setDemoState((prev) => {
        if (!prev) return prev;
        const filtered = prev.exponate.filter((x) => x.deviceId !== deviceId);
        return { ...prev, exponate: [...filtered, exhibit] };
      });
      setFocusExhibitId(exhibit.id);
      setStudentSubview('default');
      showToast('Dein Exponat hängt jetzt im Museum!');
      return;
    }
    if (activeMuseum) {
      await saveExhibit(activeMuseum.code, exhibit);
      setFocusExhibitId(exhibit.id);
      setStudentSubview('default');
      showToast('Dein Exponat hängt jetzt im Museum!');
    }
  };

  const headerTitle = useMemo(() => {
    if (activeMuseum) return `Museumsrundgang · ${activeMuseum.titel}`;
    return 'Digitaler Museumsrundgang';
  }, [activeMuseum]);

  const myStudentExhibit = useMemo(
    () => activeExhibits.find((e) => e.deviceId === deviceId) || null,
    [activeExhibits, deviceId]
  );

  return (
    <div className="min-h-screen flex flex-col bg-hbs-bg">
      <HbsHeader
        appTitle={headerTitle}
        badgeLabel={isDemoRoute ? 'Probeausstellung' : route.kind === 'teacher' || route.kind === 'beamer' ? 'Kollegium' : 'Schüler-Galerie'}
        userBadge={
          teacher ? (
            <HbsBadge label={`Lehrkraft: ${teacher.name}`} variant="teal" />
          ) : undefined
        }
        rightActions={
          route.kind !== 'teacher' && route.kind !== 'beamer' ? (
            <button
              type="button"
              onClick={() => navigateUrl(window.location.search.includes('demo') ? '' : window.location.search, '#lehrer')}
              className="h-11 px-3.5 rounded-xl bg-hbs-blue-soft hover:bg-hbs-blue-light text-hbs-blue text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Für Lehrkräfte</span>
            </button>
          ) : null
        }
      />

      <main className="flex-1 flex flex-col">
        {/* 1. Startseite (Code-Eingabe) */}
        {route.kind === 'home' && (
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-8 sm:py-12 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              <HbsCard className="md:col-span-7 flex flex-col justify-between space-y-5">
                <div className="space-y-2">
                  <HbsBadge label="Schüler-Zugang" variant="blue" />
                  <h2 className="text-2xl sm:text-3xl font-black text-hbs-slate-dark">
                    Ausstellung betreten
                  </h2>
                  <p className="text-sm text-hbs-slate">
                    Gib den Code der Ausstellung ein (vom Beamer oder QR-Code) und lade Plakate, PDFs, PowerPoint-Präsentationen, Audio oder Videos hoch.
                  </p>
                </div>

                <form onSubmit={handleEnterCode} className="space-y-3">
                  <input
                    type="text"
                    maxLength={10}
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    aria-label="Code der Ausstellung"
                    className="w-full h-14 px-4 rounded-2xl border-2 border-hbs-slate-border focus:border-hbs-blue text-center text-2xl font-black tracking-[0.35em] text-hbs-slate-dark bg-hbs-bg"
                  />
                  {codeError && <p className="text-sm font-bold text-rose-600">{codeError}</p>}
                  <HbsButton type="submit" size="lg" variant="action" disabled={loadingRoom} className="w-full">
                    <Landmark className="w-5 h-5" />
                    {loadingRoom ? 'Ausstellung wird gesucht …' : 'Ins Museum eintreten'}
                  </HbsButton>
                </form>
              </HbsCard>

              <div className="md:col-span-5 flex flex-col gap-4">
                <HbsCard className="flex-1 flex flex-col justify-between space-y-3 bg-hbs-bg-paper">
                  <div className="space-y-1.5">
                    <HbsBadge label="Ausprobieren" variant="amber" />
                    <h3 className="text-lg font-black text-hbs-slate-dark flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-hbs-amber" /> Probeausstellung
                    </h3>
                    <p className="text-xs sm:text-sm text-hbs-slate">
                      Teste den 3D-Rundgang sofort mit 8 fertigen Musik-Plakaten und simulierten Besuchern.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <HbsButton variant="primary" onClick={() => navigateUrl('?demo&saal=klassisch')} className="flex-1">
                      Als Gerät
                    </HbsButton>
                    <HbsButton variant="secondary" onClick={() => navigateUrl('?demo=beamer&saal=klassisch')} className="flex-1">
                      Am Beamer
                    </HbsButton>
                  </div>
                </HbsCard>

                <HbsCard className="flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <HbsBadge label="Kollegium HBS" variant="teal" />
                    <h3 className="text-lg font-black text-hbs-slate-dark">Ausstellung anlegen</h3>
                    <p className="text-xs sm:text-sm text-hbs-slate-muted">
                      Für Lehrkräfte: Neue Klasse anlegen, Beamer-Führung starten und Uploads verwalten.
                    </p>
                  </div>
                  <HbsButton variant="secondary" onClick={() => navigateUrl('', '#lehrer')}>
                    <GraduationCap className="w-4 h-4" /> Zum Lehrkraft-Bereich
                  </HbsButton>
                </HbsCard>
              </div>
            </div>
          </div>
        )}

        {/* 2. Lehrkraft-Bereich (#lehrer / #lehrer/CODE) */}
        {route.kind === 'teacher' &&
          (!teacher ? (
            <TeacherLoginCard
              onLoginSuccess={(u) => {
                setTeacher(u);
                saveTeacherUser(u);
              }}
              onCancel={() => navigateUrl('')}
            />
          ) : (
            <TeacherDashboard
              teacher={teacher}
              selectedCode={route.code}
              onSelectMuseum={(c) => navigateUrl('', c ? `#lehrer/${c}` : '#lehrer')}
              onLaunchBeamer={(c) => navigateUrl('', `#beamer/${c}`)}
              onLaunchDemo={(beamer) => navigateUrl(beamer ? '?demo=beamer&saal=klassisch' : '?demo&saal=klassisch')}
              onLogout={() => {
                setTeacher(null);
                saveTeacherUser(null);
              }}
              onToast={showToast}
            />
          ))}

        {/* 3. Beamer-Ansicht (#beamer/CODE) */}
        {route.kind === 'beamer' &&
          (!teacher ? (
            <TeacherLoginCard
              onLoginSuccess={(u) => {
                setTeacher(u);
                saveTeacherUser(u);
              }}
              onCancel={() => navigateUrl('')}
            />
          ) : loadingRoom ? (
            <div className="p-10 text-center text-hbs-slate-muted font-bold">Ausstellung wird geladen …</div>
          ) : !activeMuseum ? (
            <div className="w-full max-w-md mx-auto px-3 py-10">
              <HbsCard className="text-center space-y-3">
                <h2 className="text-xl font-black text-hbs-slate-dark">Ausstellung nicht gefunden</h2>
                <HbsButton onClick={() => navigateUrl('', '#lehrer')}>Zurück zur Übersicht</HbsButton>
              </HbsCard>
            </div>
          ) : studentSubview === 'abschied' ? (
            <ExitSummaryView
              museum={activeMuseum}
              exponate={activeExhibits}
              deviceId={deviceId}
              isBeamer={true}
              visitedIds={visitedIds}
              onReenter={() => setStudentSubview('default')}
              onBackToExhibition={() => navigateUrl('', `#lehrer/${activeMuseum.code}`)}
            />
          ) : (
            <MuseumHallView
              museum={activeMuseum}
              exponate={activeExhibits}
              deviceId={deviceId}
              isBeamer={true}
              isDemo={false}
              onExitToDashboard={() => navigateUrl('', `#lehrer/${activeMuseum.code}`)}
              onPhaseChange={(p) => setMuseumPhase(activeMuseum.code, p)}
              onUpdateFuehrung={(an, id, s) =>
                updateMuseumFuehrung(activeMuseum.code, { an, id, s, t: Date.now() })
              }
              onLike={handleLike}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onAnswerQuestion={handleAnswerQuestion}
              onSaveFeedback={handleSaveFeedback}
              onDeleteFeedback={handleDeleteFeedback}
              onSaveAnnotations={handleSaveAnnotations}
              onDeleteExhibit={(ex) => deleteExhibitAndFiles(activeMuseum.code, ex)}
              onFinishedWalk={(set) => {
                setVisitedIds(new Set(set));
                setStudentSubview('abschied');
              }}
              onToast={showToast}
            />
          ))}

        {/* 4. Demo & Schüler-Ansicht (?demo / ?r=CODE) */}
        {(route.kind === 'demo' || route.kind === 'student') && (
          <>
            {loadingRoom && !isDemoRoute ? (
              <div className="p-10 text-center text-hbs-slate-muted font-bold">Ausstellung wird geladen …</div>
            ) : !activeMuseum ? (
              <div className="w-full max-w-md mx-auto px-3 py-10">
                <HbsCard className="text-center space-y-3">
                  <h2 className="text-xl font-black text-hbs-slate-dark">Ausstellung nicht gefunden</h2>
                  <p className="text-sm text-hbs-slate-muted">Prüfe bitte den Code oder scanne den QR-Code erneut.</p>
                  <HbsButton onClick={() => navigateUrl('')}>Zur Code-Eingabe</HbsButton>
                </HbsCard>
              </div>
            ) : studentSubview === 'form' ? (
              <ExhibitSubmitForm
                museum={activeMuseum}
                deviceId={deviceId}
                existing={myStudentExhibit}
                isDemo={isDemoRoute}
                onSubmitted={handleSubmittedExhibit}
                onCancel={() => setStudentSubview('default')}
                onToast={showToast}
              />
            ) : studentSubview === 'abschied' ? (
              <ExitSummaryView
                museum={activeMuseum}
                exponate={activeExhibits}
                deviceId={deviceId}
                isBeamer={route.kind === 'demo' && route.beamer}
                visitedIds={visitedIds}
                onReenter={() => setStudentSubview('default')}
              />
            ) : activeMuseum.phase === 'zu' ? (
              <div className="w-full max-w-lg mx-auto px-3 py-10">
                <HbsCard className="text-center space-y-3">
                  <HbsBadge label="Geschlossen" variant="neutral" />
                  <h2 className="text-2xl font-black text-hbs-slate-dark">{activeMuseum.titel}</h2>
                  <p className="text-sm text-hbs-slate">Das Museum ist geschlossen. Danke für deinen Besuch!</p>
                </HbsCard>
              </div>
            ) : activeMuseum.phase === 'aufbau' ? (
              <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-5">
                <HbsCard className="bg-gradient-to-br from-hbs-blue to-hbs-blue-dark text-white border-0">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-hbs-blue-light">
                    Heimbürgeschule Kahla · Code {activeMuseum.code}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-1">{activeMuseum.titel}</h2>
                  {activeMuseum.hinweis && <p className="text-sm text-hbs-blue-light mt-1">{activeMuseum.hinweis}</p>}
                </HbsCard>

                {myStudentExhibit ? (
                  <HbsCard className="space-y-4">
                    <h3 className="text-lg font-black text-hbs-slate-dark">Dein Exponat hängt</h3>
                    <div className="flex items-center gap-4 flex-wrap">
                      <img
                        src={resolvePageImageUrl(myStudentExhibit.pages[0])}
                        alt={myStudentExhibit.titel}
                        className="w-36 h-28 object-contain bg-white rounded-lg border-4 border-[#2b2016] shadow"
                      />
                      <div className="space-y-1">
                        <b className="text-lg text-hbs-slate-dark block">{myStudentExhibit.titel}</b>
                        <span className="text-sm text-hbs-slate-muted block">
                          von {myStudentExhibit.name} · {mehrzahl(myStudentExhibit.seiten, 'Seite', 'Seiten')}
                        </span>
                      </div>
                    </div>
                    {activeMuseum.einreichen && (
                      <div className="flex flex-wrap gap-2">
                        <HbsButton onClick={() => setStudentSubview('form')}>Bearbeiten</HbsButton>
                        <HbsButton
                          variant="danger"
                          onClick={async () => {
                            if (!confirm('Dein Exponat wirklich aus dem Museum nehmen?')) return;
                            await deleteExhibitAndFiles(activeMuseum.code, myStudentExhibit);
                            showToast('Exponat zurückgezogen.');
                          }}
                        >
                          Zurückziehen
                        </HbsButton>
                      </div>
                    )}
                  </HbsCard>
                ) : activeMuseum.einreichen ? (
                  <HbsCard className="space-y-3">
                    <h3 className="text-lg font-black text-hbs-slate-dark">Stell dein Exponat aus</h3>
                    <p className="text-sm text-hbs-slate">
                      Lade Plakat-Fotos, eine PDF, eine PowerPoint-Präsentation (.pptx), Audio oder ein Video hoch.
                    </p>
                    <HbsButton size="lg" variant="action" onClick={() => setStudentSubview('form')} className="self-start">
                      <Upload className="w-5 h-5" /> Exponat einreichen
                    </HbsButton>
                  </HbsCard>
                ) : (
                  <HbsCard>
                    <p className="text-sm font-semibold text-hbs-slate-muted">Einreichen ist gerade geschlossen.</p>
                  </HbsCard>
                )}

                <HbsCard className="space-y-1">
                  <p className="text-base font-bold text-hbs-slate-dark">
                    {mehrzahl(activeExhibits.length, 'Exponat hängt', 'Exponate hängen')} schon im Museum.
                  </p>
                  <p className="text-xs text-hbs-slate-muted">
                    Der 3D-Rundgang öffnet hier automatisch, sobald deine Lehrkraft das Museum startet.
                  </p>
                </HbsCard>
              </div>
            ) : (
              <MuseumHallView
                museum={activeMuseum}
                exponate={activeExhibits}
                deviceId={deviceId}
                isBeamer={route.kind === 'demo' && route.beamer}
                isDemo={isDemoRoute}
                initialFocusExhibitId={focusExhibitId}
                onSwitchDemoMode={
                  route.kind === 'demo'
                    ? (b) => navigateUrl(b ? `?demo=beamer&saal=${route.saal}` : `?demo&saal=${route.saal}`)
                    : undefined
                }
                onUpdateFuehrung={
                  isDemoRoute
                    ? async (an, id, s) => {
                        setDemoState((prev) =>
                          prev
                            ? {
                                ...prev,
                                museum: {
                                  ...prev.museum,
                                  fuehrung: { an, id, s, t: Date.now() },
                                },
                              }
                            : prev
                        );
                      }
                    : undefined
                }
                onOpenSubmitForm={() => setStudentSubview('form')}
                onLike={handleLike}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onAnswerQuestion={handleAnswerQuestion}
                onSaveFeedback={handleSaveFeedback}
                onDeleteFeedback={handleDeleteFeedback}
                onSaveAnnotations={handleSaveAnnotations}
                onDeleteExhibit={
                  isDemoRoute
                    ? async (ex) => {
                        setDemoState((prev) =>
                          prev ? { ...prev, exponate: prev.exponate.filter((x) => x.id !== ex.id) } : prev
                        );
                      }
                    : undefined
                }
                onFinishedWalk={(set) => {
                  setVisitedIds(new Set(set));
                  setStudentSubview('abschied');
                }}
                onToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 bottom-5 -translate-x-1/2 z-[95] px-5 py-2.5 rounded-2xl bg-hbs-slate-dark text-white text-sm font-bold shadow-xl max-w-[calc(100vw-2rem)] text-center"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
