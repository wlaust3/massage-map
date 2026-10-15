import {
  DEFAULT_DURATION,
  DEFAULT_INTENSITY,
  NOTE_MAX,
  isDuration,
  isIntensity,
  type Duration,
  type Intensity,
} from '../data/options';
import { MUSCLES, MUSCLE_BY_ID, musclesInRegion, type Muscle, type Side, type View } from '../data/muscles';
import type { RegionId } from '../data/regions';

export interface Entry {
  intensity: Intensity;
  duration: Duration;
  /** Free-text injury / pressure note, plain text, at most NOTE_MAX characters. */
  note: string;
}
/** muscle id -> settings. Presence of the key means "selected". */
export type Selection = Record<string, Entry>;

export const newEntry = (): Entry => ({ intensity: DEFAULT_INTENSITY, duration: DEFAULT_DURATION, note: '' });

/** Notes are limited by Unicode characters (so one Chinese character or emoji counts as 1). */
export const noteLength = (s: string): number => Array.from(s).length;
export const clampNote = (s: string): string => {
  const chars = Array.from(s);
  return chars.length > NOTE_MAX ? chars.slice(0, NOTE_MAX).join('') : s;
};

export const countSelected = (sel: Selection): number => Object.keys(sel).length;
export const isSelected = (sel: Selection, id: string): boolean => Object.prototype.hasOwnProperty.call(sel, id);

/** Selected muscle ids in canonical (drawing) order. */
export function selectedIds(sel: Selection): string[] {
  return MUSCLES.filter((m) => isSelected(sel, m.id)).map((m) => m.id);
}

export function toggleMuscle(sel: Selection, id: string): Selection {
  if (!MUSCLE_BY_ID.has(id)) return sel;
  if (isSelected(sel, id)) {
    const { [id]: _removed, ...rest } = sel;
    void _removed;
    return rest;
  }
  return { ...sel, [id]: newEntry() };
}

export type RegionState = 'none' | 'partial' | 'all';

export function regionState(sel: Selection, region: RegionId, view: View): RegionState {
  const ms = musclesInRegion(region, view);
  const n = ms.filter((m) => isSelected(sel, m.id)).length;
  if (n === 0) return 'none';
  return n === ms.length ? 'all' : 'partial';
}

/** Region tap: if everything in the region (on this view) is selected, deselect it; otherwise select all of it. */
export function toggleRegion(sel: Selection, region: RegionId, view: View): Selection {
  const ms = musclesInRegion(region, view);
  if (ms.length === 0) return sel;
  if (regionState(sel, region, view) === 'all') {
    const next = { ...sel };
    for (const m of ms) delete next[m.id];
    return next;
  }
  const next = { ...sel };
  for (const m of ms) if (!isSelected(next, m.id)) next[m.id] = newEntry();
  return next;
}

export interface EntryPatch {
  intensity?: Intensity;
  duration?: Duration;
  note?: string;
}

export function updateEntry(sel: Selection, id: string, patch: EntryPatch): Selection {
  if (!isSelected(sel, id)) return sel;
  const cur = sel[id];
  const next: Entry = {
    intensity: patch.intensity && isIntensity(patch.intensity) ? patch.intensity : cur.intensity,
    duration: patch.duration !== undefined && isDuration(patch.duration) ? patch.duration : cur.duration,
    note: patch.note !== undefined ? clampNote(patch.note) : cur.note,
  };
  return { ...sel, [id]: next };
}

/** Apply intensity and/or duration to every selected muscle (notes are never bulk-changed). */
export function applyToAll(sel: Selection, patch: Pick<EntryPatch, 'intensity' | 'duration'>): Selection {
  const next: Selection = {};
  for (const id of Object.keys(sel)) {
    next[id] = {
      ...sel[id],
      intensity: patch.intensity && isIntensity(patch.intensity) ? patch.intensity : sel[id].intensity,
      duration: patch.duration !== undefined && isDuration(patch.duration) ? patch.duration : sel[id].duration,
    };
  }
  return next;
}

export const removeMuscle = (sel: Selection, id: string): Selection => {
  if (!isSelected(sel, id)) return sel;
  const next = { ...sel };
  delete next[id];
  return next;
};

export type Action =
  | { type: 'toggle'; id: string }
  | { type: 'toggleRegion'; region: RegionId; view: View }
  | { type: 'update'; id: string; patch: EntryPatch }
  | { type: 'applyAll'; patch: Pick<EntryPatch, 'intensity' | 'duration'> }
  | { type: 'remove'; id: string }
  | { type: 'clear' }
  | { type: 'replace'; selection: Selection };

export function selectionReducer(sel: Selection, a: Action): Selection {
  switch (a.type) {
    case 'toggle':
      return toggleMuscle(sel, a.id);
    case 'toggleRegion':
      return toggleRegion(sel, a.region, a.view);
    case 'update':
      return updateEntry(sel, a.id, a.patch);
    case 'applyAll':
      return applyToAll(sel, a.patch);
    case 'remove':
      return removeMuscle(sel, a.id);
    case 'clear':
      return {};
    case 'replace':
      return sanitizeSelection(a.selection);
  }
}

/** Defensive parse of untrusted/persisted data: unknown ids and bad values are dropped or defaulted. */
export function sanitizeSelection(raw: unknown): Selection {
  const out: Selection = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const src = raw as Record<string, unknown>;
  for (const m of MUSCLES) {
    if (!Object.prototype.hasOwnProperty.call(src, m.id)) continue;
    const e = src[m.id];
    if (!e || typeof e !== 'object') continue;
    const r = e as Record<string, unknown>;
    out[m.id] = {
      intensity: isIntensity(r.intensity) ? r.intensity : DEFAULT_INTENSITY,
      duration: isDuration(r.duration) ? r.duration : DEFAULT_DURATION,
      note: typeof r.note === 'string' ? clampNote(r.note) : '',
    };
  }
  return out;
}

export function selectionsEqual(a: Selection, b: Selection): boolean {
  const ka = selectedIds(a);
  const kb = selectedIds(b);
  if (ka.length !== kb.length) return false;
  return ka.every((id, i) => {
    if (id !== kb[i]) return false;
    const x = a[id];
    const y = b[id];
    return x.intensity === y.intensity && x.duration === y.duration && x.note === y.note;
  });
}

// ---- summary grouping -----------------------------------------------------------------------

export interface SummaryRow {
  key: string;
  base: string;
  nameKey: string;
  /** 'both' when the left and right muscle are selected with identical settings */
  sides: 'both' | Side;
  entry: Entry;
}

/** Group by body side of the picture (front / back); merge identical left+right pairs into one row. */
export function summaryRows(sel: Selection): Record<View, SummaryRow[]> {
  const rows: Record<View, SummaryRow[]> = { front: [], back: [] };
  const done = new Set<string>();
  for (const m of MUSCLES) {
    if (!isSelected(sel, m.id) || done.has(m.id)) continue;
    const mate: Muscle | undefined = MUSCLES.find((o) => o.base === m.base && o.view === m.view && o.id !== m.id);
    const e = sel[m.id];
    const me = mate && isSelected(sel, mate.id) ? sel[mate.id] : undefined;
    if (mate && me && me.intensity === e.intensity && me.duration === e.duration && me.note === e.note) {
      done.add(mate.id);
      rows[m.view].push({ key: `${m.view}:${m.base}`, base: m.base, nameKey: m.nameKey, sides: 'both', entry: e });
    } else {
      rows[m.view].push({ key: m.id, base: m.base, nameKey: m.nameKey, sides: m.side, entry: e });
    }
  }
  return rows;
}
