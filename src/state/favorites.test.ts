import { describe, expect, it } from 'vitest';
import {
  addFavorite,
  cleanName,
  deleteFavorite,
  hasUnsavedChanges,
  loadFavorite,
  loadFavorites,
  parseFavorites,
  renameFavorite,
  saveFavorites,
  type Favorite,
} from './favorites';
import { toggleMuscle, toggleRegion, updateEntry, type Selection } from './selection';
import { KEYS, loadSelection, saveSelection, type KV } from './storage';
import { FAVORITE_NAME_MAX } from '../data/options';

function memoryStore(): KV & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const routine = (): Selection => {
  let s = toggleRegion({}, 'shoulders', 'back');
  s = updateEntry(s, 'trapezius-upper-l', { intensity: 'deep', duration: 30, note: 'avoid left spot, old injury' });
  return s;
};

const must = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('favorites', () => {
  it('saves a named routine including notes', () => {
    const list = must(addFavorite([], '  Usual back  ', routine(), 1000));
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Usual back');
    expect(list[0].items['trapezius-upper-l'].note).toBe('avoid left spot, old injury');
    expect(list[0].createdAt).toBe(1000);
  });

  it('blocks an empty name and an empty selection', () => {
    expect(addFavorite([], '   ', routine())).toEqual({ ok: false, error: 'emptyName' });
    expect(addFavorite([], 'x', {})).toEqual({ ok: false, error: 'emptySelection' });
  });

  it('limits the name length but keeps user text as typed (no translation, no markup stripping)', () => {
    expect(Array.from(cleanName('a'.repeat(100))).length).toBe(FAVORITE_NAME_MAX);
    const list = must(addFavorite([], '<b>肩膀</b> & 背', routine()));
    expect(list[0].name).toBe('<b>肩膀</b> & 背');
  });

  it('loading returns an independent copy of the routine', () => {
    const list = must(addFavorite([], 'A', routine()));
    const loaded = must(loadFavorite(list, list[0].id));
    loaded['trapezius-upper-l'].note = 'changed';
    expect(list[0].items['trapezius-upper-l'].note).toBe('avoid left spot, old injury');
    expect(loadFavorite(list, 'missing')).toEqual({ ok: false, error: 'notFound' });
  });

  it('renames (with validation) and deletes', () => {
    let list = must(addFavorite([], 'A', routine()));
    list = must(addFavorite(list, 'B', toggleMuscle({}, 'hand-front-l')));
    const id = list[0].id;
    expect(renameFavorite(list, id, '  ', 5)).toEqual({ ok: false, error: 'emptyName' });
    expect(renameFavorite(list, 'zzz', 'C', 5)).toEqual({ ok: false, error: 'notFound' });
    list = must(renameFavorite(list, id, '肩颈', 5));
    expect(list[0].name).toBe('肩颈');
    expect(list[0].updatedAt).toBe(5);
    list = deleteFavorite(list, id);
    expect(list.map((f) => f.name)).toEqual(['B']);
  });

  it('detects unsaved changes for the load-confirm', () => {
    const sel = routine();
    const list = must(addFavorite([], 'A', sel));
    expect(hasUnsavedChanges(list, {})).toBe(false); // nothing to lose
    expect(hasUnsavedChanges(list, sel)).toBe(false); // identical to a saved routine
    expect(hasUnsavedChanges(list, updateEntry(sel, 'trapezius-upper-l', { duration: 60 }))).toBe(true);
    expect(hasUnsavedChanges([], sel)).toBe(true);
  });
});

describe('persistence (versioned localStorage schema)', () => {
  it('round-trips favorites', () => {
    const store = memoryStore();
    const list = must(addFavorite([], 'A', routine()));
    expect(saveFavorites(list, store)).toBe(true);
    expect(JSON.parse(store.data[KEYS.favorites]).version).toBe(1);
    expect(loadFavorites(store)).toEqual(list);
  });

  it('survives corrupt, unversioned or wrong-version data', () => {
    const store = memoryStore();
    store.data[KEYS.favorites] = '{not json';
    expect(loadFavorites(store)).toEqual([]);
    store.data[KEYS.favorites] = JSON.stringify({ version: 99, favorites: [] });
    expect(loadFavorites(store)).toEqual([]);
    expect(parseFavorites({ version: 1, favorites: [{ id: 1 }, null, { id: 'x', name: 'n', items: {} }] })).toEqual([]);
  });

  it('drops unknown muscles inside saved favorites', () => {
    const parsed = parseFavorites({
      version: 1,
      favorites: [{ id: 'a', name: 'n', items: { 'hand-front-l': { intensity: 'deep', duration: 30, note: 'ok' }, 'fake-l': {} } }],
    });
    expect(Object.keys(parsed[0].items)).toEqual(['hand-front-l']);
  });

  it('reports a failed write (e.g. quota exceeded) instead of throwing', () => {
    const failing: KV = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => undefined,
    };
    expect(saveFavorites([] as Favorite[], failing)).toBe(false);
    expect(saveSelection({}, failing)).toBe(false);
    expect(saveFavorites([], null)).toBe(false);
  });

  it('round-trips the current selection', () => {
    const store = memoryStore();
    const sel = routine();
    saveSelection(sel, store);
    expect(loadSelection(store)).toEqual(sel);
    store.data[KEYS.selection] = JSON.stringify({ version: 2, items: sel });
    expect(loadSelection(store)).toEqual({});
  });
});
