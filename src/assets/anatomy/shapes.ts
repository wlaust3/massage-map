/**
 * Original, simplified muscular-anatomy artwork (MIT, see ATTRIBUTION.md).
 *
 * Everything is authored for the viewer's LEFT half of the figure (x < 120) and mirrored in code, so
 * only absolute M / L / C / Q / Z commands are used (see `mirrorPath`).
 */

export const VIEWBOX = { width: 240, height: 440 } as const;
export const CENTER_X = VIEWBOX.width / 2;

type Pt = readonly [number, number];

const f = (n: number) => String(Math.round(n * 10) / 10);
const pt = (p: Pt) => `${f(p[0])} ${f(p[1])}`;
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** A tapered limb axis with half widths at both ends. */
interface Limb {
  a: Pt;
  b: Pt;
  w0: number;
  w1: number;
}

interface PartOptions {
  /** width multiplier at start / end */
  k0?: number;
  k1?: number;
  /** extra outward bulge of both edges at the middle */
  belly?: number;
  /** lateral shift of the axis, positive = toward the body midline */
  off?: number;
  /** end-cap roundness (fraction of half width) */
  cap0?: number;
  cap1?: number;
}

/** A rounded, tapered muscle belly along part of a limb axis. */
function part(limb: Limb, t0: number, t1: number, o: PartOptions = {}): string {
  const { k0 = 1, k1 = 1, belly = 0, off = 0, cap0 = 0.5, cap1 = 0.5 } = o;
  const dx = limb.b[0] - limb.a[0];
  const dy = limb.b[1] - limb.a[1];
  const len = Math.hypot(dx, dy);
  const d: Pt = [dx / len, dy / len];
  const n: Pt = [d[1], -d[0]]; // toward the midline for limbs hanging down on the left half
  const wAt = (t: number) => limb.w0 + (limb.w1 - limb.w0) * t;
  const shift = (p: Pt): Pt => [p[0] + n[0] * off, p[1] + n[1] * off];
  const p0 = shift(lerp(limb.a, limb.b, t0));
  const p1 = shift(lerp(limb.a, limb.b, t1));
  const w0 = wAt(t0) * k0;
  const w1 = wAt(t1) * k1;
  const add = (p: Pt, v: Pt, s: number): Pt => [p[0] + v[0] * s, p[1] + v[1] * s];
  const i0 = add(p0, n, w0);
  const o0 = add(p0, n, -w0);
  const i1 = add(p1, n, w1);
  const o1 = add(p1, n, -w1);
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const cI = add(mid(i0, i1), n, 2 * belly);
  const cO = add(mid(o0, o1), n, -2 * belly);
  const c1 = add(mid(i1, o1), d, 2 * cap1 * w1);
  const c0 = add(mid(o0, i0), d, -2 * cap0 * w0);
  return `M${pt(i0)} Q${pt(cI)} ${pt(i1)} Q${pt(c1)} ${pt(o1)} Q${pt(cO)} ${pt(o0)} Q${pt(c0)} ${pt(i0)} Z`;
}

/** Mirror absolute-coordinate path data around the figure's centre line. */
export function mirrorPath(d: string): string {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (m) => {
    const v = parseFloat(m);
    const out = i % 2 === 0 ? 2 * CENTER_X - v : v;
    i += 1;
    return f(out);
  });
}

// ---- limb axes (viewer-left half) -----------------------------------------------------------
const upperArm: Limb = { a: [78, 78], b: [60, 148], w0: 13, w1: 9.5 };
const foreArm: Limb = { a: [60, 148], b: [46, 208], w0: 9, w1: 6.5 };
const handAx: Limb = { a: [46, 208], b: [41, 242], w0: 6.5, w1: 5.5 };
const thigh: Limb = { a: [103, 208], b: [96, 292], w0: 15, w1: 10.5 };
const shin: Limb = { a: [96, 292], b: [98, 388], w0: 10, w1: 5.5 };
const footAx: Limb = { a: [98, 388], b: [96, 428], w0: 7, w1: 8 };

// ---- silhouette -------------------------------------------------------------------------------
const HEAD =
  'M120 8 C111 8 105 15 105 27 C105 38 111 47 120 47 C129 47 135 38 135 27 C135 15 129 8 120 8 Z';
const NECK = 'M107 42 L133 42 L137 68 L103 68 Z';
const TORSO_HALF =
  'M120 60 L104 64 C98 67 93 69 88 74 C88 84 91 94 92 102 C94 124 98 142 97 162 C96 176 90 190 86 206 C90 214 104 220 120 222 Z';

/** Left-half silhouette pieces (mirrored for the right half). */
export const SILHOUETTE_HALF: string[] = [
  TORSO_HALF,
  part(upperArm, 0, 1, { cap0: 0.9, cap1: 0.5 }),
  part(foreArm, 0, 1, { cap0: 0.5, cap1: 0.5 }),
  part(handAx, 0, 1, { belly: 1, cap0: 0.4, cap1: 0.9 }),
  part(thigh, 0, 1, { cap0: 0.3, cap1: 0.5 }),
  part(shin, 0, 1, { cap0: 0.5, cap1: 0.5 }),
  part(footAx, 0, 1, { cap0: 0.4, cap1: 0.8 }),
];
export const SILHOUETTE_CENTER: string[] = [HEAD, NECK];

// ---- muscle shapes (left half). Keyed by muscle base name; see src/data/muscles.ts -----------
const absRow = (y: number, h: number) =>
  `M111 ${y} L118.8 ${y} L118.8 ${y + h} L111 ${y + h} Q109 ${y + h} 109 ${y + h - 2} L109 ${y + 2} Q109 ${y} 111 ${y} Z`;

export const SHAPES: Record<string, string> = {
  // front
  sternocleidomastoid: 'M109 44 L113 43 C116 52 119 60 119.6 66 L115 67 C112 60 109 52 109 44 Z',
  'deltoid-front': part(upperArm, -0.02, 0.44, { k0: 1.0, k1: 0.95, belly: 1.6, cap0: 0.8, cap1: 0.4 }),
  pectoralis:
    'M119.6 73 C110 70 103 70 98 74 C96 84 94 92 93 99 C98 108 108 111 119.6 109 Z',
  biceps: part(upperArm, 0.4, 0.95, { k0: 0.85, k1: 0.8, belly: 2, off: 2, cap0: 0.5, cap1: 0.4 }),
  'forearm-flexors': part(foreArm, 0.06, 0.94, { k0: 0.95, k1: 0.9, belly: 1.8 }),
  'rectus-abdominis': [absRow(113, 15), absRow(131, 15), absRow(149, 15)].join(' '),
  obliques:
    'M107 112 C103 111 99 110 95 108 C95 128 96 146 97 162 C100 167 104 169 107 169 Z',
  'hip-flexor':
    'M108 172 C101 175 94 182 90 192 C95 200 105 208 119.6 212 C115 196 112 184 108 172 Z',
  quadriceps: part(thigh, 0.04, 0.9, { k0: 0.85, k1: 0.9, belly: 3, off: -2, cap0: 0.4, cap1: 0.6 }),
  adductors: part(thigh, 0.1, 0.72, { k0: 0.4, k1: 0.34, belly: 1, off: 8, cap0: 0.6, cap1: 0.6 }),
  'tibialis-anterior': part(shin, 0.06, 0.78, { k0: 0.55, k1: 0.45, belly: 1.6, off: -1, cap0: 0.6, cap1: 0.6 }),
  // back
  'neck-back': 'M113 46 L119.6 46 L119.6 70 C116 68 113 62 112 56 C111 52 112 49 113 46 Z',
  'trapezius-upper':
    'M112 56 C106 60 99 64 91 70 C97 78 108 82 119.6 85 L119.6 72 C116 70 113 64 112 56 Z',
  rhomboids: 'M119.6 88 C112 86 107 86 104 90 L104 124 C110 126 115 126 119.6 126 Z',
  infraspinatus: 'M102 90 C96 89 91 93 89 99 C89 111 94 120 102 124 Z',
  'trapezius-lower': 'M119.6 129 C113 129 107 127 104 127 C106 146 112 164 119.6 178 Z',
  latissimus: 'M102 128 C97 126 93 122 91 117 C91 136 94 160 104 184 C103 162 101 144 102 128 Z',
  'erector-spinae': 'M119.6 131 L109 131 C107 152 107 174 110 194 L119.6 196 Z',
  gluteus:
    'M119.6 196 C108 194 96 198 89 208 C84 220 88 236 100 243 C110 246 117 240 119.6 234 Z',
  'deltoid-rear': part(upperArm, -0.02, 0.44, { k0: 1.0, k1: 0.95, belly: 1.6, cap0: 0.8, cap1: 0.4 }),
  triceps: part(upperArm, 0.3, 0.95, { k0: 0.9, k1: 0.85, belly: 2, off: 0, cap0: 0.4, cap1: 0.4 }),
  'forearm-extensors': part(foreArm, 0.06, 0.94, { k0: 0.95, k1: 0.9, belly: 1.8 }),
  hamstrings: part(thigh, 0.1, 0.9, { k0: 0.92, k1: 0.9, belly: 3, cap0: 0.4, cap1: 0.6 }),
  calves: part(shin, 0.04, 0.62, { k0: 1, k1: 0.72, belly: 3.2, cap0: 0.6, cap1: 0.9 }),
  // both views
  hand: part(handAx, 0, 1, { belly: 1, cap0: 0.4, cap1: 0.9 }),
  foot: part(footAx, 0, 1, { k1: 1.1, belly: 1, cap0: 0.5, cap1: 0.9 }),
};

/** Non-interactive anatomical details drawn on top of the figure. */
export const DETAILS = {
  front: ['M120 70 L120 112', 'M120 164 L120 190'],
  back: ['M120 68 L120 198'],
};
