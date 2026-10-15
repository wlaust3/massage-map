import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DETAILS, SILHOUETTE_CENTER, SILHOUETTE_HALF, VIEWBOX, mirrorPath } from '../../assets/anatomy/shapes';
import { musclesInView, type Muscle, type View } from '../../data/muscles';
import { useI18n } from '../../i18n';
import {
  IDENTITY,
  MAX_SCALE,
  clampTransform,
  distToPoints,
  panBy,
  pickNearest,
  pinch,
  toContent,
  zoomAt,
  type Candidate,
  type Pt,
  type Transform,
} from './viewport';

/** Every tap is resolved within this radius (CSS px) of a muscle: a 44px-wide forgiving target even for tiny shapes. */
export const TAP_RADIUS_PX = 24;
const SLOP_PX = 10;
const SWIPE_PX = 48;
const SAMPLE_STEP = 3;

interface Props {
  view: View;
  selected: ReadonlySet<string>;
  /** Interactive maps call this on a tap (null when the tap was not near any muscle). */
  onTap?: (id: string | null) => void;
  /** Swipe sideways to flip between front and back. */
  onSwipe?: () => void;
  readOnly?: boolean;
}

interface Shape {
  samples: Pt[];
  area: number;
}

const SILHOUETTE = [...SILHOUETTE_HALF, ...SILHOUETTE_HALF.map(mirrorPath), ...SILHOUETTE_CENTER];

export function BodyMap({ view, selected, onTap, onSwipe, readOnly = false }: Props) {
  const { t } = useI18n();
  const muscles = useMemo(() => musclesInView(view), [view]);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const shapes = useRef(new Map<string, Shape>());
  const [tf, setTf] = useState<Transform>(IDENTITY);
  const tfRef = useRef(tf);
  tfRef.current = tf;
  const W = VIEWBOX.width;
  const H = VIEWBOX.height;

  // Outline samples for nearest-muscle hit testing. Computed lazily on the first tap of a view (not at startup),
  // so loading the page stays fast.
  const ensureShapes = useCallback(() => {
    if (shapes.current.size > 0) return;
    for (const m of muscles) {
      const p = pathRefs.current.get(m.id);
      if (!p || typeof p.getTotalLength !== 'function') continue;
      const total = p.getTotalLength();
      const samples: Pt[] = [];
      for (let d = 0; d <= total; d += SAMPLE_STEP) {
        const q = p.getPointAtLength(d);
        samples.push({ x: q.x, y: q.y });
      }
      const b = p.getBBox();
      shapes.current.set(m.id, { samples, area: b.width * b.height });
    }
  }, [muscles]);
  useEffect(() => {
    shapes.current.clear();
  }, [muscles]);

  // Reset zoom when flipping view.
  useEffect(() => setTf(IDENTITY), [view]);

  const ctm = () => svgRef.current?.getScreenCTM() ?? null;
  const toSvg = useCallback((clientX: number, clientY: number): Pt | null => {
    const m = ctm();
    if (!m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const resolveTap = useCallback(
    (clientX: number, clientY: number): string | null => {
      const m = ctm();
      const p = toSvg(clientX, clientY);
      if (!m || !p) return null;
      ensureShapes();
      const cur = tfRef.current;
      const c = toContent(cur, p);
      const maxDist = TAP_RADIUS_PX / (m.a * cur.s);
      const cands: Candidate[] = [];
      for (const mu of muscles) {
        const el = pathRefs.current.get(mu.id);
        const sh = shapes.current.get(mu.id);
        if (!el || !sh) continue;
        const inside = el.isPointInFill(new DOMPoint(c.x, c.y));
        cands.push({ id: mu.id, dist: inside ? 0 : distToPoints(c, sh.samples), area: sh.area });
      }
      return pickNearest(cands, maxDist);
    },
    [muscles, toSvg, ensureShapes],
  );

  // ---- pointer gestures (Pointer Events: one code path for touch, pen and mouse) ----
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startX: number;
    startY: number;
    startTf: Transform;
    moved: boolean;
    pinch?: { dist: number; mid: Pt; tf: Transform };
  } | null>(null);

  const mid2 = (): { mid: Pt; dist: number } | null => {
    const pts = [...pointers.current.values()];
    if (pts.length < 2) return null;
    const a = toSvg(pts[0].x, pts[0].y);
    const b = toSvg(pts[1].x, pts[1].y);
    if (!a || !b) return null;
    return { mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer may already be gone (synthetic events); gestures still work without capture */
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      gesture.current = { startX: e.clientX, startY: e.clientY, startTf: tfRef.current, moved: false };
    } else if (pointers.current.size === 2 && gesture.current) {
      const m = mid2();
      if (m) gesture.current.pinch = { dist: m.dist || 1, mid: m.mid, tf: tfRef.current };
      gesture.current.moved = true; // a two-finger gesture is never a tap
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const m = ctm();
    if (!m) return;
    if (g.pinch && pointers.current.size >= 2) {
      const cur = mid2();
      if (cur) setTf(pinch(g.pinch.tf, g.pinch.mid, cur.mid, cur.dist / g.pinch.dist, W, H));
      return;
    }
    if (pointers.current.size !== 1) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!g.moved && Math.hypot(dx, dy) > SLOP_PX) g.moved = true;
    if (g.moved && g.startTf.s > 1.01) {
      setTf(panBy(g.startTf, dx / m.a, dy / m.a, W, H));
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gesture.current;
    const had = pointers.current.delete(e.pointerId);
    if (!g || !had) return;
    if (pointers.current.size === 0) {
      gesture.current = null;
      if (cancelled) return;
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (!g.moved) {
        onTap?.(resolveTap(e.clientX, e.clientY));
      } else if (!g.pinch && g.startTf.s <= 1.01 && Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
        onSwipe?.();
      }
    } else if (pointers.current.size === 1) {
      // one finger lifted after a pinch: continue as a pan from here, never as a tap
      const [rest] = [...pointers.current.values()];
      gesture.current = { startX: rest.x, startY: rest.y, startTf: tfRef.current, moved: true };
    }
  };

  // Ctrl/Cmd + wheel (trackpad pinch) zooms; plain wheel keeps scrolling the page.
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || readOnly) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      if (!p) return;
      const cur = tfRef.current;
      setTf(zoomAt(cur, cur.s * Math.exp(-e.deltaY * 0.01), p, W, H));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [readOnly, toSvg, W, H]);

  const zoomBy = (factor: number) => {
    const cur = tfRef.current;
    setTf(zoomAt(cur, cur.s * factor, { x: W / 2, y: H / 2 }, W, H));
  };

  const viewName = t(`view.${view}`);
  const leftHalfSide = view === 'front' ? 'r' : 'l'; // which of the person's sides is on the viewer's left
  const clamped = clampTransform(tf, W, H);

  const toggleFromKey = (e: React.KeyboardEvent, m: Muscle) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap?.(m.id);
    }
  };

  return (
    <div className={`map-wrap${readOnly ? ' is-readonly' : ''}`}>
      <div
        ref={viewportRef}
        className="map-viewport"
        onPointerDown={readOnly ? undefined : onPointerDown}
        onPointerMove={readOnly ? undefined : onPointerMove}
        onPointerUp={readOnly ? undefined : (e) => endPointer(e, false)}
        onPointerCancel={readOnly ? undefined : (e) => endPointer(e, true)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role={readOnly ? 'img' : 'group'}
          aria-label={t(readOnly ? 'map.readOnlyLabel' : 'map.label', { view: viewName })}
          className="map-svg"
        >
          <g aria-hidden="true">
            <text x="6" y="16" className="map-side">
              {t(`side.${leftHalfSide}.short`)}
            </text>
            <text x={W - 6} y="16" textAnchor="end" className="map-side">
              {t(`side.${leftHalfSide === 'l' ? 'r' : 'l'}.short`)}
            </text>
          </g>
          <g transform={`translate(${clamped.tx} ${clamped.ty}) scale(${clamped.s})`}>
            <g aria-hidden="true">
              <g className="body-outline">
                {SILHOUETTE.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <g className="body-fill">
                {SILHOUETTE.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            </g>
            {muscles.map((m) => {
              const isSel = selected.has(m.id);
              const name = t('muscle.withSide', { name: t(m.nameKey), side: t(`side.${m.side}`) });
              const common = {
                className: `muscle${isSel ? ' is-selected' : ''}`,
              };
              return readOnly ? (
                <g key={m.id} {...common} aria-hidden="true">
                  <path d={m.path} className="shape" />
                </g>
              ) : (
                <g
                  key={m.id}
                  {...common}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={name}
                  onKeyDown={(e) => toggleFromKey(e, m)}
                  onClick={(e) => {
                    // real pointer taps are handled by the viewport; this only fires for assistive tech (detail 0)
                    if (e.detail === 0) onTap?.(m.id);
                  }}
                >
                  <path
                    d={m.path}
                    className="shape"
                    ref={(el) => {
                      if (el) pathRefs.current.set(m.id, el);
                      else pathRefs.current.delete(m.id);
                    }}
                  />
                </g>
              );
            })}
            <g className="details" aria-hidden="true">
              {DETAILS[view].map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
          </g>
        </svg>
      </div>
      {!readOnly && (
        <div className="zoom-controls">
          <button type="button" className="icon-btn" onClick={() => zoomBy(1.4)} aria-label={t('map.zoomIn')} disabled={clamped.s >= MAX_SCALE - 0.01}>
            +
          </button>
          <button type="button" className="icon-btn" onClick={() => zoomBy(1 / 1.4)} aria-label={t('map.zoomOut')} disabled={clamped.s <= 1.01}>
            −
          </button>
          <button type="button" className="icon-btn" onClick={() => setTf(IDENTITY)} aria-label={t('map.zoomReset')} disabled={clamped.s <= 1.01}>
            ⤢
          </button>
        </div>
      )}
    </div>
  );
}
