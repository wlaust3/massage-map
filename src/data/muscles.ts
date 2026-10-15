import { mirrorPath, SHAPES } from '../assets/anatomy/shapes';
import type { RegionId } from './regions';

export type View = 'front' | 'back';
export const VIEWS: readonly View[] = ['front', 'back'];
export type Side = 'l' | 'r';

/** One muscle (a left/right pair) as drawn on one view. */
interface MuscleDef {
  base: string;
  /** key into SHAPES when it differs from `base` (hands and feet are drawn once but exist in both views) */
  shape?: string;
  view: View;
  region: RegionId;
}

// Order = draw order (later is on top) and list order on the summary card.
const DEFS: MuscleDef[] = [
  // ---- front
  { base: 'sternocleidomastoid', view: 'front', region: 'neck' },
  { base: 'pectoralis', view: 'front', region: 'chest' },
  { base: 'rectus-abdominis', view: 'front', region: 'abdomen' },
  { base: 'obliques', view: 'front', region: 'abdomen' },
  { base: 'hip-flexor', view: 'front', region: 'hips' },
  { base: 'quadriceps', view: 'front', region: 'legs' },
  { base: 'adductors', view: 'front', region: 'legs' },
  { base: 'tibialis-anterior', view: 'front', region: 'legs' },
  { base: 'biceps', view: 'front', region: 'arms' },
  { base: 'forearm-flexors', view: 'front', region: 'arms' },
  { base: 'deltoid-front', view: 'front', region: 'shoulders' },
  { base: 'hand-front', shape: 'hand', view: 'front', region: 'hands' },
  { base: 'foot-front', shape: 'foot', view: 'front', region: 'feet' },
  // ---- back
  { base: 'neck-back', view: 'back', region: 'neck' },
  { base: 'trapezius-upper', view: 'back', region: 'shoulders' },
  { base: 'rhomboids', view: 'back', region: 'upper-back' },
  { base: 'infraspinatus', view: 'back', region: 'upper-back' },
  { base: 'trapezius-lower', view: 'back', region: 'upper-back' },
  { base: 'latissimus', view: 'back', region: 'upper-back' },
  { base: 'erector-spinae', view: 'back', region: 'lower-back' },
  { base: 'gluteus', view: 'back', region: 'hips' },
  { base: 'hamstrings', view: 'back', region: 'legs' },
  { base: 'calves', view: 'back', region: 'legs' },
  { base: 'triceps', view: 'back', region: 'arms' },
  { base: 'forearm-extensors', view: 'back', region: 'arms' },
  { base: 'deltoid-rear', view: 'back', region: 'shoulders' },
  { base: 'hand-back', shape: 'hand', view: 'back', region: 'hands' },
  { base: 'foot-back', shape: 'foot', view: 'back', region: 'feet' },
];

export interface Muscle {
  /** Stable id, e.g. `biceps-l`. `-l`/`-r` is the person's own left / right. Used in storage and share links. */
  id: string;
  base: string;
  side: Side;
  view: View;
  region: RegionId;
  /** i18n key of the muscle name (without side). */
  nameKey: string;
  /** SVG path data in viewBox coordinates. */
  path: string;
  /** Which half of the drawing it sits on (viewer's left or right), useful for labels. */
  half: 'viewer-left' | 'viewer-right';
}

export const muscleNameKey = (base: string) => `muscle.${base}`;

function build(): Muscle[] {
  const out: Muscle[] = [];
  for (const def of DEFS) {
    const shape = SHAPES[def.shape ?? def.base];
    if (!shape) throw new Error(`missing shape for ${def.base}`);
    // In the front view the viewer's left is the person's RIGHT; in the back view it is the person's left.
    const leftHalfSide: Side = def.view === 'front' ? 'r' : 'l';
    const rightHalfSide: Side = leftHalfSide === 'l' ? 'r' : 'l';
    const common = { base: def.base, view: def.view, region: def.region, nameKey: muscleNameKey(def.base) };
    out.push({ ...common, id: `${def.base}-${leftHalfSide}`, side: leftHalfSide, path: shape, half: 'viewer-left' });
    out.push({
      ...common,
      id: `${def.base}-${rightHalfSide}`,
      side: rightHalfSide,
      path: mirrorPath(shape),
      half: 'viewer-right',
    });
  }
  return out;
}

export const MUSCLES: readonly Muscle[] = build();
export const MUSCLE_BY_ID: ReadonlyMap<string, Muscle> = new Map(MUSCLES.map((m) => [m.id, m]));
export const musclesInView = (view: View): Muscle[] => MUSCLES.filter((m) => m.view === view);
export const isMuscleId = (id: unknown): id is string => typeof id === 'string' && MUSCLE_BY_ID.has(id);

/** Muscles of a region, optionally limited to one view. */
export const musclesInRegion = (region: RegionId, view?: View): Muscle[] =>
  MUSCLES.filter((m) => m.region === region && (!view || m.view === view));

/** Regions that have at least one muscle on the given view, in display order. */
export function regionsInView(view: View, all: readonly RegionId[]): RegionId[] {
  return all.filter((r) => musclesInRegion(r, view).length > 0);
}

export const MUSCLE_BASES: readonly string[] = Array.from(new Set(DEFS.map((d) => d.base)));
