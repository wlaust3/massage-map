/** Pure pan / zoom math in SVG viewBox units (kept free of DOM so it can be unit-tested). */
export interface Transform {
  /** scale, 1 = whole figure visible */
  s: number;
  /** translation in viewBox units, applied before scaling: p' = p * s + t */
  tx: number;
  ty: number;
}
export interface Pt {
  x: number;
  y: number;
}

export const IDENTITY: Transform = { s: 1, tx: 0, ty: 0 };
export const MIN_SCALE = 1;
export const MAX_SCALE = 4;

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Keep the content covering the viewport (no empty space past the figure's edges). */
export function clampTransform(t: Transform, w: number, h: number): Transform {
  const s = clamp(t.s, MIN_SCALE, MAX_SCALE);
  if (s <= MIN_SCALE + 1e-6) return IDENTITY;
  return { s, tx: clamp(t.tx, w - w * s, 0), ty: clamp(t.ty, h - h * s, 0) };
}

/** Zoom to `newScale` keeping the content point currently under `focal` (viewBox coords) fixed. */
export function zoomAt(t: Transform, newScale: number, focal: Pt, w: number, h: number): Transform {
  const s = clamp(newScale, MIN_SCALE, MAX_SCALE);
  const cx = (focal.x - t.tx) / t.s;
  const cy = (focal.y - t.ty) / t.s;
  return clampTransform({ s, tx: focal.x - cx * s, ty: focal.y - cy * s }, w, h);
}

/**
 * Pinch: `start` is the transform when the gesture began, `startMid`/`mid` the finger midpoints (viewBox coords),
 * `ratio` = current finger distance / starting distance.
 */
export function pinch(start: Transform, startMid: Pt, mid: Pt, ratio: number, w: number, h: number): Transform {
  const s = clamp(start.s * ratio, MIN_SCALE, MAX_SCALE);
  const cx = (startMid.x - start.tx) / start.s;
  const cy = (startMid.y - start.ty) / start.s;
  return clampTransform({ s, tx: mid.x - cx * s, ty: mid.y - cy * s }, w, h);
}

export function panBy(t: Transform, dx: number, dy: number, w: number, h: number): Transform {
  return clampTransform({ ...t, tx: t.tx + dx, ty: t.ty + dy }, w, h);
}

/** Viewport (viewBox coords) point -> content coords. */
export const toContent = (t: Transform, p: Pt): Pt => ({ x: (p.x - t.tx) / t.s, y: (p.y - t.ty) / t.s });

export interface Candidate {
  id: string;
  /** distance in content units from the tap to the shape (0 when inside) */
  dist: number;
  /** bounding box area, used to prefer the smaller shape when several overlap */
  area: number;
}

/**
 * Resolve a tap to the most sensible muscle: the nearest shape within `maxDist`, preferring shapes that
 * contain the point (dist 0), and the smaller shape when distances tie. Returns null when nothing is near.
 */
export function pickNearest(cands: readonly Candidate[], maxDist: number): string | null {
  let best: Candidate | null = null;
  for (const c of cands) {
    if (c.dist > maxDist) continue;
    if (
      !best ||
      c.dist < best.dist - 0.25 ||
      (Math.abs(c.dist - best.dist) <= 0.25 && c.area < best.area)
    ) {
      best = c;
    }
  }
  return best ? best.id : null;
}

export function distToPoints(p: Pt, pts: readonly Pt[]): number {
  let best = Infinity;
  for (const q of pts) {
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < best) best = d;
  }
  return best;
}
