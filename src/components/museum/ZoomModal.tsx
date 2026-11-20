import React, { useEffect, useRef, useState } from 'react';
import { Exponat } from '../../types/museum';
import { countAnnotations, getCommentsWithSpot, getPageAnnotations, SpotOverlayItem } from '../../utils/annotations';
import { resolvePageImageUrl } from '../../services/r2Storage';
import { begrenzt } from '../../utils/museumHelpers';
import { AnnotationSvgOverlay } from './AnnotationSvgOverlay';

interface ZoomModalProps {
  exhibit: Exponat;
  pageIndex: number;
  showHilfen: boolean;
  showStellen: boolean;
  onToggleHilfen: () => void;
  onToggleStellen: () => void;
  onPageChange: (page: number) => void;
  onClose: () => void;
}

export const ZoomModal: React.FC<ZoomModalProps> = ({
  exhibit,
  pageIndex,
  showHilfen,
  showStellen,
  onToggleHilfen,
  onToggleStellen,
  onPageChange,
  onClose,
}) => {
  const [zoom, setZoom] = useState({ s: 1, x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement | null>(null);
  const flaecheRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const fingersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const startRef = useRef<{ x: number; y: number; zx: number; zy: number; t: number } | null>(null);
  const pinchDistRef = useRef(0);
  const lastTapRef = useRef(0);

  const safePage = begrenzt(pageIndex, 0, Math.max(0, exhibit.seiten - 1));
  const imgUrl = resolvePageImageUrl(exhibit.pages[safePage]);

  useEffect(() => {
    setZoom({ s: 1, x: 0, y: 0 });
  }, [safePage, exhibit.id]);

  const clampOffset = (s: number, x: number, y: number) => {
    const r = flaecheRef.current?.getBoundingClientRect();
    const img = imgRef.current;
    if (!r || !img) return { s, x, y };
    const w = img.offsetWidth * s;
    const h = img.offsetHeight * s;
    const mx = Math.max(0, (w - r.width) / 2);
    const my = Math.max(0, (h - r.height) / 2);
    return { s, x: begrenzt(x, -mx, mx), y: begrenzt(y, -my, my) };
  };

  const applyZoom = (factor: number, cx?: number, cy?: number) => {
    const r = flaecheRef.current?.getBoundingClientRect();
    if (!r) return;
    setZoom((prev) => {
      const px = (cx ?? r.left + r.width / 2) - (r.left + r.width / 2);
      const py = (cy ?? r.top + r.height / 2) - (r.top + r.height / 2);
      const nextS = begrenzt(prev.s * factor, 1, 6);
      const k = nextS / prev.s;
      const nx = nextS === 1 ? 0 : px - (px - prev.x) * k;
      const ny = nextS === 1 ? 0 : py - (py - prev.y) * k;
      return clampOffset(nextS, nx, ny);
    });
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        onClose();
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        onPageChange(begrenzt(safePage - 1, 0, exhibit.seiten - 1));
      } else if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        onPageChange(begrenzt(safePage + 1, 0, exhibit.seiten - 1));
      } else if (ev.key === '+' || ev.key === '=') {
        ev.preventDefault();
        applyZoom(1.5);
      } else if (ev.key === '-') {
        ev.preventDefault();
        applyZoom(1 / 1.5);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [safePage, exhibit.seiten, onClose, onPageChange]);

  const spotsAll = getCommentsWithSpot(exhibit);
  const pageSpots: SpotOverlayItem[] = showStellen
    ? spotsAll
        .map((c, idx) => ({ c, nr: idx + 1 }))
        .filter(({ c }) => c.stelle && c.stelle.s === safePage)
        .map(({ c, nr }) => ({
          st: c.stelle!,
          nr,
          id: c.id,
          frage: c.art === 'frage',
        }))
    : [];
  const pageHilfen = showHilfen ? getPageAnnotations(exhibit, safePage) : [];

  const transformCss = `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`;

  return (
    <div
      ref={boxRef}
      className="fixed inset-0 z-[80] bg-[#0b0907] text-white flex flex-col select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`${exhibit.titel} – Vollbild`}
    >
      <div
        ref={flaecheRef}
        className={`absolute inset-0 grid place-items-center overflow-hidden touch-none ${zoom.s > 1.01 ? 'cursor-grab' : 'cursor-zoom-in'}`}
        onPointerDown={(ev) => {
          flaecheRef.current?.setPointerCapture(ev.pointerId);
          fingersRef.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
          if (fingersRef.current.size === 1) {
            startRef.current = { x: ev.clientX, y: ev.clientY, zx: zoom.x, zy: zoom.y, t: Date.now() };
          }
          if (fingersRef.current.size === 2) {
            const [a, b] = [...fingersRef.current.values()];
            pinchDistRef.current = Math.hypot(a.x - b.x, a.y - b.y);
            startRef.current = null;
          }
        }}
        onPointerMove={(ev) => {
          if (!fingersRef.current.has(ev.pointerId)) return;
          fingersRef.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
          if (fingersRef.current.size === 2) {
            const [a, b] = [...fingersRef.current.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinchDistRef.current) applyZoom(d / pinchDistRef.current, (a.x + b.x) / 2, (a.y + b.y) / 2);
            pinchDistRef.current = d;
          } else if (startRef.current && zoom.s > 1.01) {
            setZoom((prev) =>
              clampOffset(prev.s, startRef.current!.zx + ev.clientX - startRef.current!.x, startRef.current!.zy + ev.clientY - startRef.current!.y)
            );
          }
        }}
        onPointerUp={(ev) => {
          if (!fingersRef.current.has(ev.pointerId)) return;
          fingersRef.current.delete(ev.pointerId);
          if (fingersRef.current.size < 2) pinchDistRef.current = 0;
          if (fingersRef.current.size || !startRef.current) return;
          const dx = ev.clientX - startRef.current.x;
          const dy = ev.clientY - startRef.current.y;
          const kurz = Date.now() - startRef.current.t < 350;
          if (zoom.s <= 1.01 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            onPageChange(begrenzt(safePage + (dx < 0 ? 1 : -1), 0, exhibit.seiten - 1));
          } else if (kurz && Math.hypot(dx, dy) < 10) {
            if (Date.now() - lastTapRef.current < 320) {
              if (zoom.s > 1.01) setZoom({ s: 1, x: 0, y: 0 });
              else applyZoom(2.5, ev.clientX, ev.clientY);
              lastTapRef.current = 0;
            } else {
              lastTapRef.current = Date.now();
            }
          }
          startRef.current = null;
        }}
        onWheel={(ev) => {
          ev.preventDefault();
          applyZoom(Math.exp(-ev.deltaY * 0.0015), ev.clientX, ev.clientY);
        }}
      >
        <img
          ref={imgRef}
          src={imgUrl}
          alt={exhibit.titel}
          draggable={false}
          style={{ transform: transformCss }}
          className="max-w-full max-h-full object-contain bg-white origin-center"
        />
        <AnnotationSvgOverlay
          imgRef={imgRef}
          annotations={pageHilfen}
          stellen={pageSpots}
          interactive={false}
          transform={transformCss}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 flex gap-2 items-center px-3 py-2.5 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none">
        <b className="font-serif text-base sm:text-lg truncate pointer-events-auto flex-1">{exhibit.titel}</b>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {countAnnotations(exhibit) > 0 && (
            <button
              type="button"
              onClick={onToggleHilfen}
              className={`h-10 px-3 rounded-full text-sm font-bold backdrop-blur ${
                showHilfen ? 'bg-white text-hbs-slate-dark' : 'bg-white/20 text-white'
              }`}
            >
              ✎ Hilfen
            </button>
          )}
          {spotsAll.length > 0 && (
            <button
              type="button"
              onClick={onToggleStellen}
              className={`h-10 px-3 rounded-full text-sm font-bold backdrop-blur ${
                showStellen ? 'bg-white text-hbs-slate-dark' : 'bg-white/20 text-white'
              }`}
            >
              📍 Stellen
            </button>
          )}
          <button
            type="button"
            aria-label="Verkleinern"
            onClick={() => applyZoom(1 / 1.5)}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 font-bold text-lg"
          >
            −
          </button>
          <button
            type="button"
            aria-label="Vergrößern"
            onClick={() => applyZoom(1.5)}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 font-bold text-lg"
          >
            +
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-3.5 rounded-full bg-white/20 hover:bg-white/30 font-bold text-sm"
          >
            ✕ Schließen
          </button>
        </div>
      </div>

      {exhibit.seiten > 1 && (
        <div className="absolute left-1/2 bottom-4 -translate-x-1/2 flex items-center gap-3 bg-black/60 px-3 py-1.5 rounded-full z-10">
          <button
            type="button"
            aria-label="Vorige Seite"
            disabled={safePage === 0}
            onClick={() => onPageChange(safePage - 1)}
            className="w-10 h-10 rounded-full bg-white/15 disabled:opacity-30 font-bold"
          >
            ‹
          </button>
          <span className="text-sm font-semibold px-2">
            Seite {safePage + 1} von {exhibit.seiten}
          </span>
          <button
            type="button"
            aria-label="Nächste Seite"
            disabled={safePage >= exhibit.seiten - 1}
            onClick={() => onPageChange(safePage + 1)}
            className="w-10 h-10 rounded-full bg-white/15 disabled:opacity-30 font-bold"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};
