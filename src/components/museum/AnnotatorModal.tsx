import React, { useEffect, useRef, useState } from 'react';
import { AnnotationItem, AnnotationTool, KommentarStelle } from '../../types/museum';
import {
  ANM_FARBEN,
  ANM_MAX,
  ANM_TEXT_MAX,
  STIFT_MAX,
  STIFT_SEITE_MAX,
  WERKZEUG_TIPP,
  WERKZEUGE,
  glatt4,
} from '../../utils/annotations';
import { begrenzt, readStorage, writeStorage } from '../../utils/museumHelpers';
import { AnnotationSvgOverlay } from './AnnotationSvgOverlay';

interface AnnotatorModalProps {
  imageUrl: string;
  title: string;
  mode: 'hilfen' | 'stelle';
  initialAnnotations?: AnnotationItem[];
  initialSpot?: { t: 'mark' | 'rahmen' | 'pfeil'; a: [number, number, number, number] } | null;
  onCancel: () => void;
  onConfirmHilfen?: (items: AnnotationItem[]) => void;
  onConfirmSpot?: (spot: Omit<KommentarStelle, 's'> | null) => void;
  onToast?: (msg: string) => void;
}

export const AnnotatorModal: React.FC<AnnotatorModalProps> = ({
  imageUrl,
  title,
  mode,
  initialAnnotations = [],
  initialSpot = null,
  onCancel,
  onConfirmHilfen,
  onConfirmSpot,
  onToast,
}) => {
  const isHilfen = mode === 'hilfen';
  const [liste, setListe] = useState<AnnotationItem[]>(() =>
    isHilfen
      ? JSON.parse(JSON.stringify(initialAnnotations))
      : initialSpot
        ? [{ t: initialSpot.t, a: [...initialSpot.a] as [number, number, number, number], f: 2, s: '' }]
        : []
  );
  const [werkzeug, setWerkzeug] = useState<AnnotationTool>(() =>
    isHilfen ? 'pfeil' : initialSpot?.t || 'rahmen'
  );
  const [farbe, setFarbe] = useState<number>(() => readStorage('farbe', 0));
  const [sel, setSel] = useState<number>(-1);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const flaecheRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const dragRef = useRef<{
    pointerId: number;
    pointerType: string;
    art: 'neu' | 'schieben';
    startP: [number, number];
    origA: [number, number, number, number];
    origP: number[] | null;
    tippIdx: number;
  } | null>(null);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const stiftPunkte = (items: AnnotationItem[]) =>
    items.reduce((s, x) => s + (x.t === 'stift' && x.p ? x.p.length / 2 : 0), 0);

  const relativ = (ev: React.PointerEvent): [number, number] => {
    const r = imgRef.current!.getBoundingClientRect();
    return [glatt4((ev.clientX - r.left) / r.width), glatt4((ev.clientY - r.top) / r.height)];
  };

  const imBild = (ev: React.PointerEvent): boolean => {
    const img = imgRef.current;
    if (!img) return false;
    const r = img.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  };

  const handlePointerDown = (ev: React.PointerEvent) => {
    if (dragRef.current || (ev.pointerType === 'mouse' && ev.button > 0) || !imBild(ev)) return;
    ev.preventDefault();
    try {
      flaecheRef.current?.setPointerCapture(ev.pointerId);
    } catch {
      // ignore
    }

    const p = relativ(ev);
    const target = ev.target as Element | null;
    const refAttr = target?.getAttribute?.('data-ref') || '';
    const getippt = isHilfen && refAttr.startsWith('h') ? Number(refAttr.slice(1)) : -1;

    if (getippt >= 0 && werkzeug !== 'stift' && liste[getippt]) {
      setSel(getippt);
      dragRef.current = {
        pointerId: ev.pointerId,
        pointerType: ev.pointerType,
        art: 'schieben',
        startP: p,
        origA: [...liste[getippt].a] as [number, number, number, number],
        origP: liste[getippt].p ? [...liste[getippt].p!] : null,
        tippIdx: getippt,
      };
      return;
    }

    if (isHilfen && liste.length >= ANM_MAX) {
      onToast?.(`Mehr als ${ANM_MAX} Hilfen gehen auf einer Seite nicht.`);
      return;
    }
    if (werkzeug === 'stift' && stiftPunkte(liste) >= STIFT_SEITE_MAX) {
      onToast?.('Auf dieser Seite ist schon sehr viel gezeichnet – lösche erst einen Strich.');
      return;
    }

    const neuItem: AnnotationItem = {
      t: werkzeug,
      a: [p[0], p[1], p[0], p[1]],
      f: isHilfen ? farbe : 2,
      s: '',
      ...(werkzeug === 'stift' ? { p: [p[0], p[1]] } : {}),
    };

    const nextList = isHilfen ? [...liste, neuItem] : [neuItem];
    const nextSel = nextList.length - 1;
    setListe(nextList);
    setSel(nextSel);

    dragRef.current = {
      pointerId: ev.pointerId,
      pointerType: ev.pointerType,
      art: 'neu',
      startP: p,
      origA: neuItem.a,
      origP: null,
      tippIdx: getippt,
    };
  };

  const handlePointerMove = (ev: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || ev.pointerId !== drag.pointerId || sel < 0) return;
    ev.preventDefault();
    const p = relativ(ev);

    setListe((prev) => {
      const cur = prev[sel];
      if (!cur) return prev;
      const updated = { ...cur };

      if (drag.art === 'neu' && updated.t === 'stift') {
        const pts = updated.p ? [...updated.p] : [];
        const total = stiftPunkte(prev);
        const frei = Math.min(STIFT_MAX, STIFT_SEITE_MAX - total + pts.length / 2);
        if (pts.length / 2 >= frei) return prev;
        if (pts.length >= 2 && Math.hypot(p[0] - pts[pts.length - 2], p[1] - pts[pts.length - 1]) < 0.004) return prev;
        pts.push(p[0], p[1]);
        updated.p = pts;
        updated.a = [
          Math.min(updated.a[0], p[0]),
          Math.min(updated.a[1], p[1]),
          Math.max(updated.a[2], p[0]),
          Math.max(updated.a[3], p[1]),
        ];
      } else if (drag.art === 'neu') {
        updated.a = [updated.a[0], updated.a[1], p[0], p[1]];
      } else {
        const dx = p[0] - drag.startP[0];
        const dy = p[1] - drag.startP[1];
        const a = drag.origA;
        const kx = begrenzt(dx, -Math.min(a[0], a[2]), 1 - Math.max(a[0], a[2]));
        const ky = begrenzt(dy, -Math.min(a[1], a[3]), 1 - Math.max(a[1], a[3]));
        updated.a = [glatt4(a[0] + kx), glatt4(a[1] + ky), glatt4(a[2] + kx), glatt4(a[3] + ky)];
        if (drag.origP) {
          updated.p = drag.origP.map((v, n) => glatt4(v + (n % 2 ? ky : kx)));
        }
      }

      const next = [...prev];
      next[sel] = updated;
      return next;
    });
  };

  const handlePointerUp = (ev: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || ev.pointerId !== drag.pointerId) return;
    dragRef.current = null;

    setListe((prev) => {
      const x = prev[sel];
      if (drag.art === 'neu' && x) {
        const w = Math.abs(x.a[2] - x.a[0]);
        const h = Math.abs(x.a[3] - x.a[1]);
        if (x.t === 'stift' && (!x.p || x.p.length < 4) && drag.tippIdx >= 0) {
          setSel(drag.tippIdx);
          return prev.filter((_, i) => i !== sel);
        }
        if (x.t === 'stift' && x.p && x.p.length < 4) {
          const next = [...prev];
          next[sel] = {
            ...x,
            p: [x.p[0], x.p[1], x.p[0] + 0.004, x.p[1] + 0.004],
            a: [x.a[0], x.a[1], x.a[0] + 0.004, x.a[1] + 0.004],
          };
          return next;
        }
        if (x.t === 'notiz' && w < 0.05) {
          const next = [...prev];
          next[sel] = {
            ...x,
            a: [x.a[0], x.a[1], glatt4(x.a[0] + 0.42), glatt4(x.a[1] + 0.08)],
          };
          return next;
        }
        if (x.t === 'pfeil' && Math.hypot(w, h) < 0.03) {
          setSel(-1);
          return prev.filter((_, i) => i !== sel);
        }
        if ((x.t === 'mark' || x.t === 'rahmen') && (w < 0.01 || h < 0.008)) {
          setSel(-1);
          return prev.filter((_, i) => i !== sel);
        }
      }
      return prev;
    });

    if (isHilfen && drag.pointerType !== 'pen' && werkzeug !== 'stift') {
      setTimeout(() => textInputRef.current?.focus({ preventScroll: true }), 40);
    }
  };

  const tools: AnnotationTool[] = isHilfen ? ['pfeil', 'stift', 'mark', 'rahmen', 'notiz'] : ['mark', 'rahmen', 'pfeil'];
  const selectedItem = sel >= 0 ? liste[sel] : undefined;

  const handleSave = () => {
    if (isHilfen) {
      const cleaned = liste
        .filter((x) => (x.t !== 'notiz' || x.s.trim()) && (x.t !== 'stift' || (x.p && x.p.length >= 4)))
        .map((x) => ({
          t: x.t,
          a: x.a.map(glatt4) as [number, number, number, number],
          f: x.f,
          s: (x.s || '').trim().slice(0, ANM_TEXT_MAX),
          ...(x.t === 'stift' && x.p ? { p: x.p.map(glatt4) } : {}),
        }));
      onConfirmHilfen?.(cleaned);
    } else {
      const first = liste[0];
      if (!first) onConfirmSpot?.(null);
      else {
        onConfirmSpot?.({
          t: first.t as 'mark' | 'rahmen' | 'pfeil',
          a: first.a.map(glatt4) as [number, number, number, number],
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[85] bg-[#14100c] text-white flex flex-col" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex flex-wrap gap-2 items-center px-3 py-2.5 bg-white/10 border-b border-white/10">
        <b className="font-serif text-base flex-1 min-w-[10rem] truncate">{title}</b>

        <div className="inline-flex rounded-full border-2 border-white overflow-hidden" role="group" aria-label="Werkzeug">
          {tools.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => {
                setWerkzeug(w);
                setSel(-1);
              }}
              title={WERKZEUG_TIPP[w]}
              className={`px-3 py-1.5 min-h-[38px] text-sm font-bold transition-colors ${
                werkzeug === w ? 'bg-white text-hbs-slate-dark' : 'text-white hover:bg-white/10'
              }`}
            >
              {WERKZEUGE[w][0]} {WERKZEUGE[w][1]}
            </button>
          ))}
        </div>

        {isHilfen && (
          <div className="flex gap-1.5" role="group" aria-label="Farbe">
            {ANM_FARBEN.map(([label, hex], i) => (
              <button
                key={label}
                type="button"
                aria-label={`Farbe ${label}`}
                title={label}
                onClick={() => {
                  setFarbe(i);
                  writeStorage('farbe', i);
                  if (sel >= 0) {
                    setListe((prev) => prev.map((item, idx) => (idx === sel ? { ...item, f: i } : item)));
                  }
                }}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  farbe === i ? 'border-white scale-110 ring-2 ring-white/50' : 'border-transparent'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}

        {isHilfen && (
          <button
            type="button"
            onClick={() => {
              if (!liste.length) return;
              setListe((prev) => prev.slice(0, -1));
              setSel(-1);
            }}
            className="h-9 px-3 rounded-xl border border-white/50 text-sm font-bold hover:bg-white/10"
          >
            ↶ Rückgängig
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-3 rounded-xl border border-white/50 text-sm font-bold hover:bg-white/10"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="h-9 px-4 rounded-xl bg-hbs-amber hover:bg-hbs-amber-dark text-white text-sm font-bold shadow-sm"
        >
          {isHilfen ? 'Fertig' : 'Stelle übernehmen'}
        </button>
      </div>

      <div
        ref={flaecheRef}
        className="flex-1 min-h-0 relative overflow-hidden touch-none select-none"
        onTouchStart={(ev) => {
          if (ev.cancelable) ev.preventDefault();
        }}
        onTouchMove={(ev) => {
          if (ev.cancelable) ev.preventDefault();
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Seite"
          draggable={false}
          className="absolute inset-0 m-auto max-w-[calc(100%-1.5rem)] max-h-[calc(100%-1.5rem)] bg-white select-none pointer-events-none"
        />
        <AnnotationSvgOverlay
          imgRef={imgRef}
          annotations={isHilfen ? liste : []}
          stellen={
            !isHilfen
              ? liste.map((x) => ({
                  st: { s: 0, t: x.t as 'mark' | 'rahmen' | 'pfeil', a: x.a },
                  nr: 0,
                  id: 'neu',
                  frage: false,
                }))
              : []
          }
          selectedSpotId="neu"
          selectedHelpIdx={sel}
          interactive={false}
          className="cursor-crosshair"
        />
      </div>

      <div className="px-3 py-2.5 bg-white/10 border-t border-white/10 flex flex-col gap-1.5">
        {isHilfen && (
          <div className="flex items-center gap-2">
            <input
              ref={textInputRef}
              type="text"
              maxLength={ANM_TEXT_MAX}
              disabled={!selectedItem}
              value={selectedItem?.s || ''}
              onChange={(e) => {
                if (sel < 0) return;
                const val = e.target.value.slice(0, ANM_TEXT_MAX);
                setListe((prev) => prev.map((it, idx) => (idx === sel ? { ...it, s: val } : it)));
              }}
              placeholder={
                !selectedItem
                  ? 'Erst etwas zeichnen oder antippen …'
                  : selectedItem.t === 'notiz'
                    ? 'Text der Notiz'
                    : selectedItem.t === 'pfeil'
                      ? 'Erklärung am Pfeil (z. B. ein Wort erklären)'
                      : 'Beschriftung (freiwillig)'
              }
              className="flex-1 h-10 px-3 rounded-xl bg-white text-hbs-slate-dark text-sm font-medium disabled:opacity-50"
            />
            <span className="text-xs text-slate-300 font-semibold whitespace-nowrap">
              {liste.length} / {ANM_MAX}
            </span>
            {sel >= 0 && (
              <button
                type="button"
                onClick={() => {
                  setListe((prev) => prev.filter((_, idx) => idx !== sel));
                  setSel(-1);
                }}
                className="h-10 px-3 rounded-xl border border-rose-300 text-rose-200 text-sm font-bold hover:bg-rose-500/20"
              >
                Löschen
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-slate-300">
          {isHilfen
            ? `${WERKZEUG_TIPP[werkzeug]} ${
                werkzeug === 'stift'
                  ? 'Kurz antippen wählt einen Strich aus (zum Löschen oder Beschriften).'
                  : 'Antippen wählt eine Hilfe aus, Ziehen verschiebt sie.'
              }`
            : `Markiere die Stelle, zu der du etwas sagen oder fragen willst. ${WERKZEUG_TIPP[werkzeug]}`}
        </p>
      </div>
    </div>
  );
};
