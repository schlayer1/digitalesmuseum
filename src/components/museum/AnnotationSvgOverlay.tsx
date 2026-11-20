import React, { useEffect, useRef, useState } from 'react';
import { AnnotationItem } from '../../types/museum';
import { formen, SpotOverlayItem } from '../../utils/annotations';

interface AnnotationSvgOverlayProps {
  imgRef: React.RefObject<HTMLImageElement | null>;
  annotations: AnnotationItem[];
  stellen?: SpotOverlayItem[];
  selectedSpotId?: string;
  selectedHelpIdx?: number;
  interactive?: boolean;
  transform?: string;
  onSpotClick?: (commentId: string) => void;
  className?: string;
}

export const AnnotationSvgOverlay: React.FC<AnnotationSvgOverlayProps> = ({
  imgRef,
  annotations,
  stellen = [],
  selectedSpotId = '',
  selectedHelpIdx = -1,
  interactive = true,
  transform = '',
  onSpotClick,
  className = '',
}) => {
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number; natW: number; natH: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    natW: 1000,
    natH: 750,
  });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const measure = () => {
      if (!img.isConnected || !img.naturalWidth) return;
      setBox({
        left: img.offsetLeft,
        top: img.offsetTop,
        width: img.offsetWidth,
        height: img.offsetHeight,
        natW: img.naturalWidth,
        natH: img.naturalHeight,
      });
    };

    const onLoad = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    img.addEventListener('load', onLoad);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onLoad) : null;
    ro?.observe(img);
    if (img.parentElement) ro?.observe(img.parentElement);
    if (img.complete) measure();

    return () => {
      img.removeEventListener('load', onLoad);
      ro?.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [imgRef, annotations, stellen]);

  if (!box.width || !box.height) return null;

  const W = 1000;
  const H = Math.max(100, Math.round((1000 * box.natH) / Math.max(1, box.natW)));
  const shapes = formen(annotations, W, H, {
    stellen,
    wahl: selectedSpotId,
    sel: selectedHelpIdx,
  });

  return (
    <svg
      className={`ebene ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        transform,
      }}
    >
      {shapes.map((f, idx) => {
        const ref = f.ref || '';
        const isSpot = ref.startsWith('k');
        const clickable = interactive && isSpot && Boolean(onSpotClick);
        const handleClick = clickable
          ? (ev: React.MouseEvent) => {
              ev.stopPropagation();
              onSpotClick?.(ref.slice(1));
            }
          : undefined;

        if (f.k === 'rect') {
          return (
            <rect
              key={idx}
              data-ref={ref}
              className={ref ? 'tippbar' : ''}
              x={f.x}
              y={f.y}
              width={Math.max(1, f.w || 1)}
              height={Math.max(1, f.h || 1)}
              rx={f.rx}
              fill={f.fill || 'none'}
              fillOpacity={f.fill && f.fill !== 'none' && f.op != null ? f.op : undefined}
              stroke={f.stroke || undefined}
              strokeWidth={f.stroke ? f.sw : undefined}
              strokeOpacity={f.stroke && f.op != null && f.fill === 'none' ? f.op : undefined}
              strokeDasharray={f.strich && f.sw ? `${f.sw * 3} ${f.sw * 2}` : undefined}
              style={{
                filter: f.schatten ? 'drop-shadow(0 2px 3px rgba(0,0,0,.3))' : undefined,
                pointerEvents: clickable ? 'visiblePainted' : undefined,
              }}
              onClick={handleClick}
            />
          );
        }

        if (f.k === 'line') {
          return (
            <line
              key={idx}
              data-ref={ref}
              className={ref ? 'tippbar' : ''}
              x1={f.x1}
              y1={f.y1}
              x2={f.x2}
              y2={f.y2}
              stroke={f.stroke}
              strokeWidth={f.sw}
              strokeLinecap="round"
              opacity={f.op}
              strokeDasharray={f.strich && f.sw ? `${f.sw * 3} ${f.sw * 2}` : undefined}
              style={{ pointerEvents: clickable ? 'visiblePainted' : undefined }}
              onClick={handleClick}
            />
          );
        }

        if (f.k === 'pfad' && f.pts) {
          const ptsStr = f.pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
          return (
            <g key={idx} data-ref={ref} className={ref ? 'tippbar' : ''}>
              <polyline
                data-ref={ref}
                points={ptsStr}
                fill="none"
                stroke={f.stroke}
                strokeWidth={f.sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                data-ref={ref}
                points={ptsStr}
                fill="none"
                stroke="transparent"
                strokeWidth={(f.sw || 3) * 5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        }

        if (f.k === 'poly' && f.pts) {
          return (
            <polygon
              key={idx}
              data-ref={ref}
              className={ref ? 'tippbar' : ''}
              points={f.pts.map((p) => p.join(',')).join(' ')}
              fill={f.fill}
              opacity={f.op}
              style={{ pointerEvents: clickable ? 'visiblePainted' : undefined }}
              onClick={handleClick}
            />
          );
        }

        if (f.k === 'kreis') {
          return (
            <circle
              key={idx}
              data-ref={ref}
              className={ref ? 'tippbar' : ''}
              cx={f.x}
              cy={f.y}
              r={f.r}
              fill={f.fill}
              stroke={f.stroke || undefined}
              strokeWidth={f.stroke ? f.sw : undefined}
              opacity={f.op}
              style={{ pointerEvents: clickable ? 'visiblePainted' : undefined }}
              onClick={handleClick}
            />
          );
        }

        if (f.k === 'text' && f.lines) {
          return (
            <text
              key={idx}
              data-ref={ref}
              className={ref ? 'tippbar' : ''}
              x={f.x}
              y={f.y}
              fontSize={f.fs}
              fill={f.fill}
              fontFamily='"Plus Jakarta Sans", Calibri, "Segoe UI", system-ui, sans-serif'
              fontWeight={f.fett ? 700 : 400}
              textAnchor={f.mitte ? 'middle' : undefined}
              opacity={f.op}
              style={{ pointerEvents: clickable ? 'visiblePainted' : undefined }}
              onClick={handleClick}
            >
              {f.lines.map((l, n) => (
                <tspan key={n} x={f.x} dy={n ? (f.fs || 16) * 1.18 : 0}>
                  {l}
                </tspan>
              ))}
            </text>
          );
        }

        return null;
      })}
    </svg>
  );
};
