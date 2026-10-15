import { FAVORITE_NAME_MAX } from '../data/options';
import { KEYS, SCHEMA_VERSION, defaultStore, readJson, writeJson, type KV } from './storage';
import { countSelected, sanitizeSelection, selectionsEqual, type Selection } from './selection';

export interface Favorite {
  id: string;
  /** User text, shown exactly as typed. */
  name: string;
  createdAt: number;
  updatedAt: number;
  items: Selection;
}

export type FavError = 'emptyName' | 'emptySelection' | 'notFound';
export type FavResult<T> = { ok: true; value: T } | { ok: false; error: FavError };

export const cleanName = (name: string): string => Array.from(name.trim()).slice(0, FAVORITE_NAME_MAX).join('');

let counter = 0;
const newId = (now: number) => `f${now.toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function addFavorite(
  list: readonly Favorite[],
  name: string,
  selection: Selection,
  now: number = Date.now(),
): FavResult<Favorite[]> {
  const n = cleanName(name);
  if (!n) return { ok: false, error: 'emptyName' };
  if (countSelected(selection) === 0) return { ok: false, error: 'emptySelection' };
  const fav: Favorite = {
    id: newId(now),
    name: n,
    createdAt: now,
    updatedAt: now,
    items: sanitizeSelection(JSON.parse(JSON.stringify(selection))),
  };
  return { ok: true, value: [...list, fav] };
}

export function renameFavorite(
  list: readonly Favorite[],
  id: string,
  name: string,
  now: number = Date.now(),
): FavResult<Favorite[]> {
  const n = cleanName(name);
  if (!n) return { ok: false, error: 'emptyName' };
  if (!list.some((f) => f.id === id)) return { ok: false, error: 'notFound' };
  return { ok: true, value: list.map((f) => (f.id === id ? { ...f, name: n, updatedAt: now } : f)) };
}

export function deleteFavorite(list: readonly Favorite[], id: string): Favorite[] {
  return list.filter((f) => f.id !== id);
}

/** A fresh copy of the saved routine, ready to replace the current selection. */
export function loadFavorite(list: readonly Favorite[], id: string): FavResult<Selection> {
  const f = list.find((x) => x.id === id);
  if (!f) return { ok: false, error: 'notFound' };
  return { ok: true, value: sanitizeSelection(JSON.parse(JSON.stringify(f.items))) };
}

/** True when the current selection is non-empty and not identical to any saved favorite ("unsaved changes"). */
export function hasUnsavedChanges(list: readonly Favorite[], current: Selection): boolean {
  if (countSelected(current) === 0) return false;
  return !list.some((f) => selectionsEqual(f.items, current));
}

// ---- persistence (versioned) --------------------------------------------------------------

export function parseFavorites(raw: unknown): Favorite[] {
  const r = raw as { version?: unknown; favorites?: unknown } | undefined;
  if (!r || r.version !== SCHEMA_VERSION || !Array.isArray(r.favorites)) return [];
  const out: Favorite[] = [];
  const seen = new Set<string>();
  for (const f of r.favorites as unknown[]) {
    if (!f || typeof f !== 'object') continue;
    const o = f as Record<string, unknown>;
    if (typeof o.id !== 'string' || seen.has(o.id) || typeof o.name !== 'string') continue;
    const name = cleanName(o.name);
    if (!name) continue;
    const items = sanitizeSelection(o.items);
    if (countSelected(items) === 0) continue;
    seen.add(o.id);
    out.push({
      id: o.id,
      name,
      createdAt: typeof o.createdAt === 'number' ? o.createdAt : 0,
      updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : 0,
      items,
    });
  }
  return out;
}

export function loadFavorites(store: KV | null = defaultStore()): Favorite[] {
  return parseFavorites(readJson(store, KEYS.favorites));
}

export function saveFavorites(list: readonly Favorite[], store: KV | null = defaultStore()): boolean {
  return writeJson(store, KEYS.favorites, { version: SCHEMA_VERSION, favorites: list });
}
