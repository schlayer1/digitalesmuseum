import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AnnotationItem, Exponat, HallSlot, KommentarStelle, MuseumAusstellung } from '../../types/museum';
import { createMuseum3D, isWebGLAvailable, Museum3DController } from '../../engine/museum3d';
import {
  begrenzt,
  buildJoinLink,
  buildSlots,
  getWallColor,
  isSlotWalkable,
  kurzHash,
  mehrzahl,
  readStorage,
  writeStorage,
} from '../../utils/museumHelpers';
import { countAnnotations, getPageAnnotations, leinwandFormen, formen } from '../../utils/annotations';
import { resolvePageImageUrl } from '../../services/r2Storage';
import { ExhibitDetailModal } from './ExhibitDetailModal';
import { ZoomModal } from './ZoomModal';

interface MuseumHallViewProps {
  museum: MuseumAusstellung;
  exponate: Exponat[];
  deviceId: string;
  isBeamer: boolean;
  isDemo: boolean;
  onExitToDashboard?: () => void;
  onSwitchDemoMode?: (beamer: boolean) => void;
  onOpenSubmitForm?: () => void;
  onPhaseChange?: (phase: 'rundgang') => Promise<void>;
  onUpdateFuehrung?: (an: boolean, id: string, s: number) => Promise<void>;
  onLike: (exhibitId: string) => Promise<void>;
  onAddComment: (exhibitId: string, art: 'kommentar' | 'frage', text: string, spot: KommentarStelle | null, nickname: string) => Promise<void>;
  onDeleteComment: (exhibitId: string, commentId: string) => Promise<void>;
  onAnswerQuestion: (exhibitId: string, commentId: string, text: string) => Promise<void>;
  onSaveFeedback: (exhibitId: string, stars: number[], gut: string, tipp: string, nickname: string) => Promise<void>;
  onDeleteFeedback: (exhibitId: string, feedbackId: string) => Promise<void>;
  onSaveAnnotations: (exhibitId: string, anm: Record<string, AnnotationItem[]>) => Promise<void>;
  onDeleteExhibit?: (exhibit: Exponat) => Promise<void>;
  onFinishedWalk: (visitedIds: Set<string>) => void;
  onToast: (msg: string) => void;
  initialFocusExhibitId?: string | null;
}

export const MuseumHallView: React.FC<MuseumHallViewProps> = ({
  museum,
  exponate,
  deviceId,
  isBeamer,
  isDemo,
  onExitToDashboard,
  onSwitchDemoMode,
  onOpenSubmitForm,
  onPhaseChange,
  onUpdateFuehrung,
  onLike,
  onAddComment,
  onDeleteComment,
  onAnswerQuestion,
  onSaveFeedback,
  onDeleteFeedback,
  onSaveAnnotations,
  onDeleteExhibit,
  onFinishedWalk,
  onToast,
  initialFocusExhibitId,
}) => {
  const musRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const w3Ref = useRef<Museum3DController | null>(null);
  const overlayMapRef = useRef<Map<string, AnnotationItem[]>>(new Map());

  const [use3D, setUse3D] = useState<boolean>(() => {
    if (!isWebGLAvailable()) return false;
    return readStorage<string>('ansicht', '3d') !== '2d';
  });

  const slots = useMemo<HallSlot[]>(() => buildSlots(exponate), [exponate]);
  const [cur, setCur] = useState<number>(() => {
    if (initialFocusExhibitId) {
      const idx = slots.findIndex((s) => s.e?.id === initialFocusExhibitId);
      if (idx > 0) return idx;
    }
    return Math.max(1, slots.findIndex((s) => s.art === 'eingang'));
  });
  const curRef = useRef(cur);
  curRef.current = cur;

  const [pagesById, setPagesById] = useState<Record<string, number>>({});
  const pagesRef = useRef(pagesById);
  pagesRef.current = pagesById;

  const [showPortal, setShowPortal] = useState<boolean>(() => {
    if (initialFocusExhibitId) return false;
    return !readStorage<boolean>(`drin-${museum.code}`, false) || isBeamer || isDemo;
  });
  const [portalLeaving, setPortalLeaving] = useState(false);
  const [showHelp3D, setShowHelp3D] = useState(false);

  const [showZettel, setShowZettel] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showHilfen, setShowHilfen] = useState<boolean>(() => readStorage('hilfen', true));
  const [showStellen, setShowStellen] = useState<boolean>(() => readStorage('stellen', true));
  const [showSticks, setShowSticks] = useState<boolean>(() => readStorage('sticks', false));

  const [autoRunning, setAutoRunning] = useState(false);
  const [autoSeconds, setAutoSeconds] = useState(20);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [zoomId, setZoomId] = useState<string | null>(null);
  const [fadingOut, setFadingOut] = useState(false);

  const visitedRef = useRef<Set<string>>(new Set());
  const stickValRef = useRef({ vor: 0, seit: 0, dreh: 0, neig: 0 });
  const fuehrungActive = Boolean(museum.fuehrung?.an);
  const isGuidedStudent = !isBeamer && fuehrungActive;
  const isGuidedRef = useRef(isGuidedStudent);
  isGuidedRef.current = isGuidedStudent;

  const myExhibit = useMemo(() => exponate.find((e) => e.deviceId === deviceId) || null, [exponate, deviceId]);
  const openQuestionsCount = useMemo(
    () => (myExhibit ? myExhibit.kommentare.filter((k) => k.art === 'frage' && !k.antwort).length : 0),
    [myExhibit]
  );
  const feedbackCount = myExhibit?.rueck?.length || 0;

  const hasAnyHilfen = useMemo(() => exponate.some((e) => countAnnotations(e) > 0), [exponate]);
  const currentSlot = slots[cur];

  const detailExhibit = useMemo(() => (detailId ? exponate.find((e) => e.id === detailId) || null : null), [detailId, exponate]);
  const zoomExhibit = useMemo(() => (zoomId ? exponate.find((e) => e.id === zoomId) || null : null), [zoomId, exponate]);

  // Keep current slot valid when exhibits change
  useEffect(() => {
    const slot = slots[curRef.current];
    if (!slot || !isSlotWalkable(slot)) {
      const fallback = Math.max(1, slots.findIndex((s) => s.art === 'eingang'));
      setCur(fallback);
    }
  }, [slots]);

  // Track visited exhibits
  useEffect(() => {
    if (currentSlot?.e?.id) {
      visitedRef.current.add(currentSlot.e.id);
    }
  }, [currentSlot]);

  // Sync guided tour on student devices
  useEffect(() => {
    if (isBeamer || !museum.fuehrung?.an) return;
    const f = museum.fuehrung;
    const targetIdx = f.id ? slots.findIndex((s) => s.e?.id === f.id) : slots.findIndex((s) => s.art === 'eingang');
    if (targetIdx < 0) return;

    if (showPortal) {
      setShowPortal(false);
    }

    if (f.id && slots[targetIdx]?.e) {
      const clampedPage = begrenzt(f.s || 0, 0, Math.max(0, slots[targetIdx].e!.seiten - 1));
      setPagesById((prev) => (prev[f.id] === clampedPage ? prev : { ...prev, [f.id]: clampedPage }));
    }

    if (targetIdx !== curRef.current) {
      setCur(targetIdx);
      w3Ref.current?.gehe(targetIdx, true);
    }
  }, [isBeamer, museum.fuehrung, slots, showPortal]);

  // Report teacher movement when Beamer Führung is active
  useEffect(() => {
    if (!isBeamer || !museum.fuehrung?.an || !onUpdateFuehrung) return;
    const slot = slots[cur];
    if (!slot || (!slot.e && slot.art !== 'eingang')) return;
    const id = slot.e?.id || '';
    const page = id ? pagesById[id] || 0 : 0;
    if (museum.fuehrung.id === id && museum.fuehrung.s === page) return;

    const timer = window.setTimeout(() => {
      onUpdateFuehrung(true, id, page);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [isBeamer, museum.fuehrung, cur, pagesById, slots, onUpdateFuehrung]);

  // Beamer Führung heartbeat (30s)
  useEffect(() => {
    if (!isBeamer || !museum.fuehrung?.an || isDemo || !onUpdateFuehrung) return;
    const interval = window.setInterval(() => {
      const slot = slots[curRef.current];
      const id = slot?.e?.id || museum.fuehrung.id || '';
      const page = id ? pagesRef.current[id] || 0 : 0;
      onUpdateFuehrung(true, id, page);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [isBeamer, museum.fuehrung?.an, museum.fuehrung?.id, isDemo, onUpdateFuehrung, slots]);

  const moveStep = useCallback(
    (delta: number) => {
      if (isGuidedRef.current) return;
      let idx = curRef.current + delta;
      while (slots[idx] && !isSlotWalkable(slots[idx])) idx += delta;
      if (!isSlotWalkable(slots[idx])) return;
      setCur(idx);
      w3Ref.current?.gehe(idx, true);
    },
    [slots]
  );

  const flipPage = useCallback(
    (delta: number): boolean => {
      const slot = slots[curRef.current];
      if (!slot || slot.art !== 'exponat' || !slot.e || slot.e.seiten < 2 || isGuidedRef.current) return false;
      const curPage = pagesRef.current[slot.e.id] || 0;
      const nextPage = curPage + delta;
      if (nextPage < 0 || nextPage >= slot.e.seiten) return false;
      setPagesById((prev) => ({ ...prev, [slot.e!.id]: nextPage }));
      return true;
    },
    [slots]
  );

  // Auto-Walk timer in Beamer mode
  useEffect(() => {
    if (!autoRunning) return;
    const timer = window.setInterval(() => {
      if (detailId || zoomId) return;
      if (flipPage(1)) return;
      const prev = curRef.current;
      let idx = prev + 1;
      while (slots[idx] && !isSlotWalkable(slots[idx])) idx++;
      if (isSlotWalkable(slots[idx])) {
        setCur(idx);
        w3Ref.current?.gehe(idx, true);
      } else {
        setAutoRunning(false);
      }
    }, autoSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [autoRunning, autoSeconds, detailId, zoomId, flipPage, slots]);

  const handleExitMuseum = useCallback(() => {
    if (fadingOut) return;
    setAutoRunning(false);
    const finish = () => {
      setFadingOut(true);
      window.setTimeout(() => {
        onFinishedWalk(visitedRef.current);
      }, 650);
    };
    if (w3Ref.current) w3Ref.current.hinaus(finish);
    else finish();
  }, [fadingOut, onFinishedWalk]);

  // Initialize & clean up 3D WebGL engine
  useEffect(() => {
    if (!use3D || !canvasRef.current) return;
    const can = canvasRef.current;
    let disposed = false;

    let ctrl: Museum3DController;
    try {
      ctrl = createMuseum3D(can, {
        saal: museum.saal,
        wandfarbe: (r) => getWallColor(museum.saal, r),
        ruhig: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
        gesperrt: () => isGuidedRef.current,
        zettelPlatz: () => isBeamer && showZettel,
        logo: '/Siegel_bunt.png',
        ueber: (u, g, w, h, bw, bh) => {
          const anm = overlayMapRef.current.get(u);
          if (!anm || !anm.length || !bw || !bh) return;
          const H = Math.round((1000 * bh) / bw);
          leinwandFormen(g, formen(anm, 1000, H), w / 1000, h / H);
        },
        aktiv: () => !detailId && !zoomId && !showPortal,
        beiTipp: (slotIdx) => {
          const p = slots[slotIdx];
          if (!p || !isSlotWalkable(p)) return;
          if (slotIdx === curRef.current && p.e) {
            setDetailId(p.e.id);
            return;
          }
          if (isGuidedRef.current) return;
          setCur(slotIdx);
          ctrl.gehe(slotIdx, true);
        },
        beiStation: (slotIdx) => {
          if (!isSlotWalkable(slots[slotIdx]) || slotIdx === curRef.current) return;
          setCur(slotIdx);
        },
        beiAusgang: () => {
          if (isGuidedRef.current) return;
          if (slots[curRef.current]?.art === 'ausgang') {
            handleExitMuseum();
          } else {
            const ausIdx = slots.findIndex((s) => s.art === 'ausgang');
            if (ausIdx >= 0) {
              setCur(ausIdx);
              ctrl.gehe(ausIdx, true);
            }
          }
        },
        beiBeruehrung: () => setShowHelp3D(false),
        beiVerlust: () => {
          if (!disposed) {
            onToast('Die 3D-Ansicht wurde beendet – weiter in 2D.');
            setUse3D(false);
          }
        },
      });
    } catch (err) {
      console.warn('WebGL Start fehlgeschlagen:', err);
      setUse3D(false);
      return;
    }

    w3Ref.current = ctrl;
    const onResize = () => ctrl.groesse();
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      ctrl.weg();
      w3Ref.current = null;
    };
  }, [use3D, museum.saal, isBeamer]); // rebuild 3D world when room style or 3D toggle changes

  // Sync slots, plaques, banners, textures, and sticky notes into 3D engine
  useEffect(() => {
    const ctrl = w3Ref.current;
    if (!ctrl || !use3D) return;
    ctrl.bauen(slots);
    if (showPortal) {
      ctrl.draussen();
    } else {
      ctrl.gehe(begrenzt(curRef.current, 0, Math.max(0, slots.length - 1)), false);
    }
  }, [use3D, slots]);

  useEffect(() => {
    const ctrl = w3Ref.current;
    if (!ctrl || !use3D) return;

    const likesTotal = exponate.reduce((a, e) => a + e.likesCount, 0);
    const commentsTotal = exponate.reduce((a, e) => a + e.kommentare.length, 0);

    ctrl.eingang({
      titel: museum.titel,
      anzahl: `${mehrzahl(exponate.length, 'Exponat', 'Exponate')} · Eintritt frei`,
      hinweis: museum.hinweis || '',
    });
    ctrl.ausgang({
      titel: museum.titel,
      zahlen: `${mehrzahl(exponate.length, 'Exponat', 'Exponate')} · ${likesTotal} ♥ · ${mehrzahl(commentsTotal, 'Kommentar', 'Kommentare')}`,
    });

    slots.forEach((p, i) => {
      if (p.art !== 'exponat' || !p.e) return;
      const e = p.e;
      const fragen = e.kommentare.filter((k) => k.art === 'frage').length;
      const sn = pagesById[e.id] || 0;
      const mediaTag = e.mediaType === 'video' ? '🎬 Video  ' : e.mediaType === 'audio' ? '🎧 Audio  ' : '';
      ctrl.tafel(i, {
        titel: e.titel,
        name: `von ${e.name}${e.deviceId === deviceId ? ' (du)' : ''}`,
        zahlen: `${mediaTag}♥ ${e.likesCount}   💬 ${e.kommentare.length - fragen}${fragen ? `   ? ${fragen}` : ''}`,
        seite: e.seiten > 1 ? `Seite ${sn + 1}/${e.seiten}` : '',
      });
    });

    ctrl.bilder(
      cur,
      (slotIdx) => {
        const slot = slots[slotIdx];
        if (!slot?.e) return '';
        const sn = begrenzt(pagesById[slot.e.id] || 0, 0, Math.max(0, slot.e.seiten - 1));
        const base = resolvePageImageUrl(slot.e.pages[sn]);
        const anm = showHilfen ? getPageAnnotations(slot.e, sn) : [];
        const finalUrl = base + (anm.length ? `#h${kurzHash(JSON.stringify(anm))}` : '');
        overlayMapRef.current.set(finalUrl, anm);
        return finalUrl;
      },
      isBeamer
    );

    const activeSlot = slots[cur];
    const showNotes = isBeamer && showZettel && activeSlot?.art === 'exponat' && activeSlot.e;
    ctrl.zettel(
      showNotes ? cur : -1,
      showNotes
        ? activeSlot!.e!.kommentare.slice(-6).map((k) => ({
            id: k.id,
            name: k.name,
            text: k.text,
            frage: k.art === 'frage',
            antwort: k.antwort?.text || '',
          }))
        : []
    );
  }, [use3D, museum.titel, museum.hinweis, exponate, slots, cur, pagesById, showHilfen, showZettel, isBeamer, deviceId]);

  // Keyboard navigation outside modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (detailId || zoomId || showPortal) return;
      if (e.target && (e.target as HTMLElement).matches('input,textarea,select')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveStep(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveStep(-1);
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        flipPage(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        flipPage(-1);
      } else if (e.key === 'Enter' && currentSlot?.e) {
        setDetailId(currentSlot.e.id);
      } else if (e.key === ' ' && isBeamer) {
        e.preventDefault();
        setAutoRunning((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailId, zoomId, showPortal, moveStep, flipPage, currentSlot, isBeamer]);

  const handleEnterPortal = () => {
    if (portalLeaving) return;
    writeStorage(`drin-${museum.code}`, true);
    setPortalLeaving(true);
    if (w3Ref.current) {
      w3Ref.current.eintreten(cur, () => {
        setShowPortal(false);
        setPortalLeaving(false);
        if (!isBeamer && !isGuidedStudent) {
          const seen = readStorage('hilfe3d', 0);
          if (seen < 3) {
            writeStorage('hilfe3d', seen + 1);
            setShowHelp3D(true);
            window.setTimeout(() => setShowHelp3D(false), 9000);
          }
        }
      });
    } else {
      window.setTimeout(() => {
        setShowPortal(false);
        setPortalLeaving(false);
      }, 600);
    }
  };

  const toggleFullscreen = () => {
    const mu = musRef.current;
    if (!mu) return;
    const doc = document as any;
    const active = doc.fullscreenElement || doc.webkitFullscreenElement;
    if (active) (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc);
    else {
      const fn = (mu as any).requestFullscreen || (mu as any).webkitRequestFullscreen;
      fn?.call(mu)?.catch?.(() => {});
    }
  };

  const totalExhibits = exponate.length;
  const currentExhibitNr = currentSlot?.art === 'exponat' && currentSlot.nr !== undefined ? currentSlot.nr + 1 : 0;
  const canBack = slots.slice(0, cur).some((s) => isSlotWalkable(s));
  const canNext = slots.slice(cur + 1).some((s) => isSlotWalkable(s));

  return (
    <div
      ref={musRef}
      className={`museum saal-${museum.saal} ${isBeamer ? 'beamer' : ''} ${use3D ? 'd3' : ''}`}
      tabIndex={-1}
    >
      {/* 3D WebGL or 2D Gallery Scene */}
      {use3D ? (
        <div className="szene">
          <canvas ref={canvasRef} className="welt" aria-label="Das Museum in 3D" />
          <div className="vignette" />
        </div>
      ) : (
        <div
          className="szene"
          onPointerDown={(e) => {
            (e.currentTarget as any)._x0 = e.clientX;
          }}
          onPointerUp={(e) => {
            const x0 = (e.currentTarget as any)._x0;
            if (typeof x0 !== 'number') return;
            const dx = e.clientX - x0;
            if (Math.abs(dx) > 50) moveStep(dx < 0 ? 1 : -1);
          }}
        >
          <div
            className="spur"
            style={{
              width: `${slots.length * 620}px`,
              transform: `translateX(${(musRef.current?.clientWidth || window.innerWidth) / 2 - cur * 620 - 310}px)`,
              transition: 'transform 0.8s cubic-bezier(0.45, 0.05, 0.35, 1)',
            }}
          >
            {slots.map((p, i) => (
              <div
                key={i}
                className={`slot art-${p.art} ${i === cur ? 'aktiv' : ''}`}
                style={{
                  left: `${i * 620}px`,
                  width: '620px',
                  ['--wand' as any]: getWallColor(museum.saal, p.raum),
                }}
              >
                {p.art === 'exponat' && p.e && (
                  <>
                    <div className="lampe" />
                    <div className="kegel" />
                    <div
                      className="werk"
                      onClick={() => {
                        if (i === cur) setDetailId(p.e!.id);
                        else if (!isGuidedStudent) setCur(i);
                      }}
                    >
                      <div className="rahmen">
                        <img
                          src={resolvePageImageUrl(p.e.pages[pagesById[p.e.id] || 0])}
                          alt={p.e.titel}
                          draggable={false}
                        />
                        {p.e.seiten > 1 && (
                          <div className="punkte">
                            {Array.from({ length: p.e.seiten }, (_, k) => (
                              <i key={k} className={k === (pagesById[p.e!.id] || 0) ? 'an' : ''} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="tafel">
                        <b>{p.e.titel}</b>
                        <span>
                          von {p.e.name}
                          {p.e.deviceId === deviceId ? ' (du)' : ''}
                        </span>
                        <span className="zahlen">
                          ♥ {p.e.likesCount} · 💬 {p.e.kommentare.length}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {p.art === 'eingang' && (
                  <div className="banner">
                    <div className="tuch">
                      <small>Heimbürgeschule Kahla präsentiert</small>
                      <h2>{museum.titel}</h2>
                      <small>{mehrzahl(exponate.length, 'Exponat', 'Exponate')}</small>
                    </div>
                    {museum.hinweis && (
                      <div className="tafel">
                        <span>{museum.hinweis}</span>
                      </div>
                    )}
                  </div>
                )}
                {p.art === 'tuer' && (
                  <div className="tuer" style={{ ['--naechste' as any]: getWallColor(museum.saal, p.nach || 0) }}>
                    <span>Saal {(p.nach || 0) + 1}</span>
                  </div>
                )}
                {p.art === 'ausgang' && (
                  <>
                    <div className="banner">
                      <span className="ausgang-schild">AUSGANG</span>
                      <div className="tuch">
                        <small>Danke für deinen Besuch</small>
                        <h2>{museum.titel}</h2>
                      </div>
                    </div>
                    <div className="bank" />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="sockel" />
          <div className="boden">
            <div className="dielen" />
          </div>
          <div className="vignette" />
        </div>
      )}

      {/* Obere Werkzeugleiste */}
      <div className="oben">
        {isBeamer ? (
          <>
            <button
              type="button"
              className="rund"
              onClick={() => {
                if (isDemo && onSwitchDemoMode) onSwitchDemoMode(false);
                else onExitToDashboard?.();
              }}
            >
              {isDemo ? '✕ Geräteansicht' : '✕ Schließen'}
            </button>
            {onUpdateFuehrung && (
              <button
                type="button"
                className={`rund ${fuehrungActive ? 'an' : ''}`}
                title="Die Geräte folgen dir und können solange nicht selbst gehen"
                onClick={() => {
                  const id = currentSlot?.e?.id || '';
                  const pg = id ? pagesById[id] || 0 : 0;
                  onUpdateFuehrung(!fuehrungActive, id, pg);
                }}
              >
                {fuehrungActive ? 'Führung läuft' : 'Führung starten'}
              </button>
            )}
            <button
              type="button"
              className={`rund ${autoRunning ? 'an' : ''}`}
              title="Leertaste"
              onClick={() => setAutoRunning((v) => !v)}
            >
              {autoRunning ? '⏸ Rundgang' : '▶ Rundgang von selbst'}
            </button>
            <select
              className="rund"
              aria-label="Sekunden je Seite"
              value={autoSeconds}
              onChange={(e) => setAutoSeconds(Number(e.target.value))}
            >
              {[10, 20, 30, 45, 60].map((s) => (
                <option key={s} value={s} className="text-black">
                  {s} s
                </option>
              ))}
            </select>
            <button type="button" className={`rund ${showZettel ? 'an' : ''}`} onClick={() => setShowZettel((v) => !v)}>
              Zettel
            </button>
            <button type="button" className={`rund ${showQR ? 'an' : ''}`} onClick={() => setShowQR((v) => !v)}>
              QR-Code
            </button>
            {hasAnyHilfen && (
              <button
                type="button"
                className={`rund ${showHilfen ? 'an' : ''}`}
                onClick={() => {
                  const next = !showHilfen;
                  setShowHilfen(next);
                  writeStorage('hilfen', next);
                }}
              >
                ✎ Hilfen
              </button>
            )}
            <span className="flex-1" />
            {use3D && (
              <button
                type="button"
                className={`rund ${showSticks ? 'an' : ''}`}
                onClick={() => {
                  const next = !showSticks;
                  setShowSticks(next);
                  writeStorage('sticks', next);
                }}
              >
                🕹 Steuerung
              </button>
            )}
            {isWebGLAvailable() && (
              <button
                type="button"
                className="rund"
                onClick={() => {
                  const next = !use3D;
                  writeStorage('ansicht', next ? '3d' : '2d');
                  setUse3D(next);
                }}
              >
                {use3D ? '2D' : '3D'}
              </button>
            )}
            {museum.phase !== 'rundgang' && onPhaseChange && (
              <span className="fahne">
                {museum.phase === 'aufbau' ? 'Vorschau – Klasse sieht das Museum noch nicht' : 'Museum geschlossen'}
                <button type="button" onClick={() => onPhaseChange('rundgang')}>
                  {museum.phase === 'aufbau' ? 'Rundgang öffnen' : 'Wieder öffnen'}
                </button>
              </span>
            )}
            <button type="button" className="rund" onClick={toggleFullscreen}>
              Vollbild
            </button>
          </>
        ) : (
          <>
            {isDemo && onSwitchDemoMode && (
              <span className="fahne">
                Probeausstellung – Simulation
                <button type="button" onClick={() => onSwitchDemoMode(true)}>
                  Beamer-Ansicht
                </button>
              </span>
            )}
            {isGuidedStudent && <span className="fahne">Geführter Rundgang – du gehst mit der Lehrkraft</span>}
            {hasAnyHilfen && (
              <button
                type="button"
                className={`rund ${showHilfen ? 'an' : ''}`}
                onClick={() => {
                  const next = !showHilfen;
                  setShowHilfen(next);
                  writeStorage('hilfen', next);
                }}
              >
                ✎ Hilfen
              </button>
            )}
            <span className="flex-1" />
            {use3D && !isGuidedStudent && (
              <button
                type="button"
                className={`rund ${showSticks ? 'an' : ''}`}
                onClick={() => {
                  const next = !showSticks;
                  setShowSticks(next);
                  writeStorage('sticks', next);
                }}
              >
                🕹 Steuerung
              </button>
            )}
            {isWebGLAvailable() && (
              <button
                type="button"
                className="rund"
                onClick={() => {
                  const next = !use3D;
                  writeStorage('ansicht', next ? '3d' : '2d');
                  setUse3D(next);
                }}
              >
                {use3D ? '2D' : '3D'}
              </button>
            )}
            {openQuestionsCount > 0 && myExhibit && (
              <button
                type="button"
                className="rund fragen"
                onClick={() => {
                  const idx = slots.findIndex((s) => s.e?.id === myExhibit.id);
                  if (idx >= 0 && !isGuidedStudent) {
                    setCur(idx);
                    w3Ref.current?.gehe(idx, true);
                  }
                  setDetailId(myExhibit.id);
                }}
              >
                ? {mehrzahl(openQuestionsCount, 'Frage an dich', 'Fragen an dich')}
              </button>
            )}
            {feedbackCount > 0 && myExhibit && (
              <button
                type="button"
                className="rund rueck-knopf"
                onClick={() => {
                  const idx = slots.findIndex((s) => s.e?.id === myExhibit.id);
                  if (idx >= 0 && !isGuidedStudent) {
                    setCur(idx);
                    w3Ref.current?.gehe(idx, true);
                  }
                  setDetailId(myExhibit.id);
                }}
              >
                ★ {mehrzahl(feedbackCount, 'Rückmeldung', 'Rückmeldungen')}
              </button>
            )}
            {museum.einreichen && onOpenSubmitForm && (
              <button type="button" className="rund" onClick={onOpenSubmitForm}>
                {myExhibit ? 'Mein Exponat' : 'Exponat einreichen'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Untere Navigationsleiste */}
      <div className="steuer">
        {!isGuidedStudent && (
          <button type="button" className="rund" aria-label="Zurück" disabled={!canBack} onClick={() => moveStep(-1)}>
            ◀
          </button>
        )}
        {!isGuidedStudent && currentSlot?.e && currentSlot.e.seiten > 1 && (
          <button type="button" className="rund" aria-label="Vorige Seite" onClick={() => flipPage(-1)}>
            ‹
          </button>
        )}
        <span className="stelle">
          {currentSlot?.art === 'eingang'
            ? 'Eingang'
            : currentSlot?.art === 'ausgang'
              ? 'Ausgang'
              : `${currentExhibitNr} / ${totalExhibits}${use3D && currentSlot?.e ? ` · ${currentSlot.e.titel}` : ''}`}
        </span>
        {currentSlot?.e && (
          <>
            <button type="button" className="rund" onClick={() => setDetailId(currentSlot.e!.id)}>
              {currentSlot.e.mediaType === 'video' ? '🎬' : currentSlot.e.mediaType === 'audio' ? '🎧' : '🔍'}
              <span className="text">Ansehen</span>
            </button>
            {currentSlot.e.mediaType !== 'video' && (
              <button
                type="button"
                className="rund"
                aria-label="Plakat groß"
                title="Plakat groß ansehen und zoomen"
                onClick={() => setZoomId(currentSlot.e!.id)}
              >
                ⛶
              </button>
            )}
          </>
        )}
        {currentSlot?.art === 'ausgang' && (
          <button type="button" className="rund raus" onClick={handleExitMuseum}>
            🚪 <span className="text">Museum verlassen</span>
          </button>
        )}
        {currentSlot?.e && !isBeamer && (
          <button
            type="button"
            className={`rund herz ${(currentSlot.e.likedBy || []).includes(deviceId) ? 'an' : ''}`}
            onClick={() => onLike(currentSlot.e!.id)}
          >
            ♥ {currentSlot.e.likesCount}
          </button>
        )}
        {!isGuidedStudent && currentSlot?.e && currentSlot.e.seiten > 1 && (
          <button type="button" className="rund" aria-label="Nächste Seite" onClick={() => flipPage(1)}>
            ›
          </button>
        )}
        {!isGuidedStudent && (
          <button type="button" className="rund" aria-label="Weiter" disabled={!canNext} onClick={() => moveStep(1)}>
            ▶
          </button>
        )}
      </div>

      {/* QR-Code in der Ecke (Beamer) */}
      {isBeamer && showQR && (
        <div className="qr-ecke">
          <QRCodeSVG value={buildJoinLink(museum.code, isDemo)} size={180} className="w-full h-auto" />
          <b>{museum.code}</b>
        </div>
      )}

      {/* Dual Virtual Sticks */}
      {use3D && showSticks && !isGuidedStudent && !showPortal && (
        <div className="sticks">
          <VirtualStickPad
            label="Gehen"
            onChange={(dx, dy) => {
              stickValRef.current.seit = dx;
              stickValRef.current.vor = -dy;
              w3Ref.current?.stick(stickValRef.current);
            }}
          />
          <VirtualStickPad
            label="Umsehen"
            onChange={(dx, dy) => {
              stickValRef.current.dreh = dx;
              stickValRef.current.neig = dy;
              w3Ref.current?.stick(stickValRef.current);
            }}
          />
        </div>
      )}

      {/* Eingangsportal Overlay */}
      {showPortal && (
        <div className={`portal3d ${portalLeaving ? 'weg' : ''}`}>
          <small>Heimbürgeschule Kahla präsentiert</small>
          <h1>{museum.titel}</h1>
          <button
            type="button"
            onClick={handleEnterPortal}
            className="h-12 px-8 rounded-2xl bg-hbs-amber hover:bg-hbs-amber-dark text-white font-black text-lg shadow-xl mt-2 cursor-pointer transition-transform active:scale-95"
          >
            Eintreten
          </button>
        </div>
      )}

      {showHelp3D && (
        <div className="hilfe3d" role="note">
          <span>
            <b>Ziehen</b> umsehen
          </span>
          <span>
            <b>Auf den Boden tippen</b> hingehen
          </span>
          <span>
            <b>Auf ein Bild tippen</b> davortreten
          </span>
          <span>
            <b>W A S D</b> gehen
          </span>
        </div>
      )}

      {fadingOut && <div className="abblenden" />}

      {detailExhibit && (
        <ExhibitDetailModal
          museum={museum}
          exhibit={detailExhibit}
          deviceId={deviceId}
          isTeacherMode={isBeamer}
          pageIndex={pagesById[detailExhibit.id] || 0}
          showHilfen={showHilfen}
          showStellen={showStellen}
          onPageChange={(pg) => setPagesById((prev) => ({ ...prev, [detailExhibit.id]: pg }))}
          onToggleHilfen={() => {
            const next = !showHilfen;
            setShowHilfen(next);
            writeStorage('hilfen', next);
          }}
          onToggleStellen={() => {
            const next = !showStellen;
            setShowStellen(next);
            writeStorage('stellen', next);
          }}
          onOpenZoom={() => setZoomId(detailExhibit.id)}
          onLike={onLike}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          onAnswerQuestion={onAnswerQuestion}
          onSaveFeedback={onSaveFeedback}
          onDeleteFeedback={onDeleteFeedback}
          onSaveAnnotations={onSaveAnnotations}
          onDeleteExhibit={onDeleteExhibit}
          onClose={() => setDetailId(null)}
          onToast={onToast}
        />
      )}

      {zoomExhibit && (
        <ZoomModal
          exhibit={zoomExhibit}
          pageIndex={pagesById[zoomExhibit.id] || 0}
          showHilfen={showHilfen}
          showStellen={showStellen}
          onToggleHilfen={() => {
            const next = !showHilfen;
            setShowHilfen(next);
            writeStorage('hilfen', next);
          }}
          onToggleStellen={() => {
            const next = !showStellen;
            setShowStellen(next);
            writeStorage('stellen', next);
          }}
          onPageChange={(pg) => setPagesById((prev) => ({ ...prev, [zoomExhibit.id]: pg }))}
          onClose={() => setZoomId(null)}
        />
      )}
    </div>
  );
};

const VirtualStickPad: React.FC<{ label: string; onChange: (dx: number, dy: number) => void }> = ({ label, onChange }) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLSpanElement | null>(null);
  const ptrRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  const update = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    const knob = knobRef.current;
    if (!pad || !knob) return;
    const r = pad.getBoundingClientRect();
    const R = r.width / 2;
    let dx = (clientX - r.left - R) / R;
    let dy = (clientY - r.top - R) / R;
    const l = Math.hypot(dx, dy);
    if (l > 1) {
      dx /= l;
      dy /= l;
    }
    knob.style.transform = `translate(${Math.round(dx * R * 0.6)}px, ${Math.round(dy * R * 0.6)}px)`;
    const k = l < 0.15 ? 0 : (Math.min(1, l) - 0.15) / 0.85 / Math.min(1, l);
    onChange(dx * k, dy * k);
  };

  return (
    <div
      ref={padRef}
      aria-label={label}
      className={`stick ${active ? 'an' : ''}`}
      onTouchStart={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (ptrRef.current !== null) return;
        e.preventDefault();
        e.stopPropagation();
        ptrRef.current = e.pointerId;
        try {
          padRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        setActive(true);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.pointerId === ptrRef.current) update(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (e.pointerId !== ptrRef.current) return;
        ptrRef.current = null;
        setActive(false);
        if (knobRef.current) knobRef.current.style.transform = '';
        onChange(0, 0);
      }}
      onPointerCancel={(e) => {
        if (e.pointerId !== ptrRef.current) return;
        ptrRef.current = null;
        setActive(false);
        if (knobRef.current) knobRef.current.style.transform = '';
        onChange(0, 0);
      }}
    >
      <span className="stick-text">{label}</span>
      <span ref={knobRef} className="stick-knopf" />
    </div>
  );
};
