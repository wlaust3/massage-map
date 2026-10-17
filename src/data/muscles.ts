import { MUSCLE_PATHS } from '../assets/anatomy/musclePaths';
import type { RegionId } from './regions';

export type View = 'front' | 'back';
export const VIEWS: readonly View[] = ['front', 'back'];
export type Side = 'l' | 'r';

/** One muscle (a left/right pair). */
interface MuscleDef {
  base: string;
  /** The view it is listed under on the summary card. It may also be tappable on the other view (see musclePaths). */
  view: View;
  region: RegionId;
}

// Order = draw order (later is on top) and list order on the summary card.
const DEFS: MuscleDef[] = [
  // ---- front
  { base: 'frontalis', view: 'front', region: 'head' },
  { base: 'temporalis', view: 'front', region: 'head' },
  { base: 'masseter', view: 'front', region: 'head' },
  { base: 'sternocleidomastoid', view: 'front', region: 'neck' },
  { base: 'deltoid-anterior', view: 'front', region: 'shoulders' },
  { base: 'pectoralis-major', view: 'front', region: 'chest' },
  { base: 'biceps-brachii', view: 'front', region: 'arms' },
  { base: 'brachialis', view: 'front', region: 'arms' },
  { base: 'brachioradialis', view: 'front', region: 'arms' },
  { base: 'pronator-teres', view: 'front', region: 'arms' },
  { base: 'flexor-carpi-radialis', view: 'front', region: 'arms' },
  { base: 'palmaris-longus', view: 'front', region: 'arms' },
  { base: 'flexor-carpi-ulnaris', view: 'front', region: 'arms' },
  { base: 'thenar', view: 'front', region: 'hands' },
  { base: 'hypothenar', view: 'front', region: 'hands' },
  { base: 'rectus-abdominis', view: 'front', region: 'abdomen' },
  { base: 'external-oblique', view: 'front', region: 'abdomen' },
  { base: 'iliopsoas', view: 'front', region: 'hips' },
  { base: 'tensor-fasciae-latae', view: 'front', region: 'hips' },
  { base: 'sartorius', view: 'front', region: 'legs' },
  { base: 'pectineus', view: 'front', region: 'legs' },
  { base: 'adductor-longus', view: 'front', region: 'legs' },
  { base: 'gracilis', view: 'front', region: 'legs' },
  { base: 'rectus-femoris', view: 'front', region: 'legs' },
  { base: 'vastus-lateralis', view: 'front', region: 'legs' },
  { base: 'vastus-medialis', view: 'front', region: 'legs' },
  { base: 'tibialis-anterior', view: 'front', region: 'legs' },
  { base: 'extensor-digitorum-longus', view: 'front', region: 'legs' },
  { base: 'fibularis-longus', view: 'front', region: 'legs' },
  { base: 'extensor-digitorum-brevis', view: 'front', region: 'feet' },
  // ---- back
  { base: 'occipitalis', view: 'back', region: 'head' },
  { base: 'splenius-capitis', view: 'back', region: 'neck' },
  { base: 'trapezius-upper', view: 'back', region: 'shoulders' },
  { base: 'deltoid-posterior', view: 'back', region: 'shoulders' },
  { base: 'trapezius-middle', view: 'back', region: 'upper-back' },
  { base: 'trapezius-lower', view: 'back', region: 'upper-back' },
  { base: 'rhomboid-major', view: 'back', region: 'upper-back' },
  { base: 'infraspinatus', view: 'back', region: 'upper-back' },
  { base: 'teres-major', view: 'back', region: 'upper-back' },
  { base: 'latissimus-dorsi', view: 'back', region: 'upper-back' },
  { base: 'erector-spinae', view: 'back', region: 'lower-back' },
  { base: 'triceps-brachii', view: 'back', region: 'arms' },
  { base: 'forearm-extensors', view: 'back', region: 'arms' },
  { base: 'thumb-extensors', view: 'back', region: 'arms' },
  { base: 'gluteus-medius', view: 'back', region: 'hips' },
  { base: 'gluteus-maximus', view: 'back', region: 'hips' },
  { base: 'biceps-femoris', view: 'back', region: 'legs' },
  { base: 'semitendinosus', view: 'back', region: 'legs' },
  { base: 'semimembranosus', view: 'back', region: 'legs' },
  { base: 'gastrocnemius-medial', view: 'back', region: 'legs' },
  { base: 'gastrocnemius-lateral', view: 'back', region: 'legs' },
  { base: 'soleus', view: 'back', region: 'legs' },
];

/**
 * Muscle ids from the first, hand-drawn figure (before the anatomical art). Old favorites, saved picks and share
 * links that use them are expanded to the muscles that now cover the same area.
 */
export const LEGACY_BASES: Readonly<Record<string, readonly string[]>> = {
  'neck-back': ['splenius-capitis'],
  'deltoid-front': ['deltoid-anterior'],
  'deltoid-rear': ['deltoid-posterior'],
  pectoralis: ['pectoralis-major'],
  biceps: ['biceps-brachii'],
  triceps: ['triceps-brachii'],
  'forearm-flexors': ['flexor-carpi-radialis', 'palmaris-longus', 'flexor-carpi-ulnaris'],
  'hand-front': ['thenar', 'hypothenar'],
  'hand-back': ['forearm-extensors'],
  obliques: ['external-oblique'],
  'hip-flexor': ['iliopsoas', 'tensor-fasciae-latae'],
  quadriceps: ['rectus-femoris', 'vastus-lateralis', 'vastus-medialis'],
  adductors: ['adductor-longus', 'pectineus', 'gracilis'],
  'foot-front': ['extensor-digitorum-brevis'],
  'foot-back': ['soleus'],
  rhomboids: ['rhomboid-major'],
  latissimus: ['latissimus-dorsi'],
  gluteus: ['gluteus-maximus', 'gluteus-medius'],
  hamstrings: ['biceps-femoris', 'semitendinosus', 'semimembranosus'],
  calves: ['gastrocnemius-medial', 'gastrocnemius-lateral', 'soleus'],
};

export interface Muscle {
  /** Stable id, e.g. `biceps-brachii-l`. `-l`/`-r` is the person's own left / right. Used in storage and share links. */
  id: string;
  base: string;
  side: Side;
  /** The view it is listed under on the summary card. */
  view: View;
  region: RegionId;
  /** i18n key of the anatomical name (without side), e.g. "Biceps brachii". */
  nameKey: string;
  /** i18n key of the everyday description, e.g. "Front of upper arm". */
  plainKey: string;
  /** Tap shape (SVG path data) on each view the muscle can be seen on. */
  paths: Partial<Record<View, string>>;
}

export const muscleNameKey = (base: string) => `muscle.${base}`;
export const musclePlainKey = (base: string) => `muscle.${base}.plain`;

function build(): Muscle[] {
  const out: Muscle[] = [];
  for (const def of DEFS) {
    for (const side of ['r', 'l'] as const) {
      const id = `${def.base}-${side}`;
      const paths: Partial<Record<View, string>> = {};
      for (const v of VIEWS) if (MUSCLE_PATHS[v][id]) paths[v] = MUSCLE_PATHS[v][id];
      if (!paths[def.view]) throw new Error(`missing shape for ${id} on the ${def.view} view`);
      out.push({
        id,
        base: def.base,
        side,
        view: def.view,
        region: def.region,
        nameKey: muscleNameKey(def.base),
        plainKey: musclePlainKey(def.base),
        paths,
      });
    }
  }
  return out;
}

export const MUSCLES: readonly Muscle[] = build();
export const MUSCLE_BY_ID: ReadonlyMap<string, Muscle> = new Map(MUSCLES.map((m) => [m.id, m]));
/** Muscles that can be tapped on a view. */
export const musclesInView = (view: View): Muscle[] => MUSCLES.filter((m) => m.paths[view]);
export const isMuscleId = (id: unknown): id is string => typeof id === 'string' && MUSCLE_BY_ID.has(id);

/** Current muscle ids for an id that may be from the old figure (empty when unknown). */
export function resolveMuscleId(id: string): string[] {
  if (MUSCLE_BY_ID.has(id)) return [id];
  const m = /^(.+)-([lr])$/.exec(id);
  const bases = m && Object.prototype.hasOwnProperty.call(LEGACY_BASES, m[1]) ? LEGACY_BASES[m[1]] : null;
  return bases ? bases.map((b) => `${b}-${m![2]}`).filter((x) => MUSCLE_BY_ID.has(x)) : [];
}

/** Muscles of a region, optionally limited to those tappable on one view. */
export const musclesInRegion = (region: RegionId, view?: View): Muscle[] =>
  MUSCLES.filter((m) => m.region === region && (!view || m.paths[view]));

/** Regions that have at least one muscle on the given view, in display order. */
export function regionsInView(view: View, all: readonly RegionId[]): RegionId[] {
  return all.filter((r) => musclesInRegion(r, view).length > 0);
}

export const MUSCLE_BASES: readonly string[] = Array.from(new Set(DEFS.map((d) => d.base)));
