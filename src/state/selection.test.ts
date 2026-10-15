import { describe, expect, it } from 'vitest';
import {
  applyToAll,
  clampNote,
  countSelected,
  noteLength,
  regionState,
  sanitizeSelection,
  selectionReducer,
  selectionsEqual,
  summaryRows,
  toggleMuscle,
  toggleRegion,
  updateEntry,
  type Selection,
} from './selection';
import { musclesInRegion } from '../data/muscles';
import { NOTE_MAX } from '../data/options';

describe('selection state', () => {
  it('toggles a muscle on (with defaults) and off', () => {
    let s: Selection = {};
    s = toggleMuscle(s, 'biceps-l');
    expect(s['biceps-l']).toEqual({ intensity: 'medium', duration: 15, note: '' });
    s = toggleMuscle(s, 'biceps-l');
    expect(countSelected(s)).toBe(0);
  });

  it('ignores unknown ids and does not mutate', () => {
    const s: Selection = {};
    expect(toggleMuscle(s, 'nope-l')).toBe(s);
    const s2 = toggleMuscle(s, 'biceps-l');
    expect(s).toEqual({});
    expect(s2).not.toBe(s);
  });

  it('region toggle selects all muscles of the region on that view, then deselects them', () => {
    let s: Selection = {};
    s = toggleRegion(s, 'legs', 'front');
    const frontLegs = musclesInRegion('legs', 'front');
    expect(frontLegs.length).toBe(6);
    expect(countSelected(s)).toBe(6);
    expect(regionState(s, 'legs', 'front')).toBe('all');
    expect(regionState(s, 'legs', 'back')).toBe('none');
    s = toggleRegion(s, 'legs', 'front');
    expect(countSelected(s)).toBe(0);
  });

  it('region toggle with a partial selection completes it and keeps edited settings', () => {
    let s: Selection = toggleMuscle({}, 'quadriceps-l');
    s = updateEntry(s, 'quadriceps-l', { intensity: 'deep', note: 'old injury' });
    expect(regionState(s, 'legs', 'front')).toBe('partial');
    s = toggleRegion(s, 'legs', 'front');
    expect(regionState(s, 'legs', 'front')).toBe('all');
    expect(s['quadriceps-l'].intensity).toBe('deep');
    expect(s['quadriceps-l'].note).toBe('old injury');
  });

  it('updates intensity, duration and note; rejects invalid values', () => {
    let s = toggleMuscle({}, 'calves-r');
    s = updateEntry(s, 'calves-r', { intensity: 'firm', duration: 45, note: 'hello' });
    expect(s['calves-r']).toEqual({ intensity: 'firm', duration: 45, note: 'hello' });
    // @ts-expect-error invalid on purpose
    s = updateEntry(s, 'calves-r', { duration: 99, intensity: 'crushing' });
    expect(s['calves-r']).toEqual({ intensity: 'firm', duration: 45, note: 'hello' });
    expect(updateEntry(s, 'biceps-l', { intensity: 'light' })).toBe(s); // not selected
  });

  it('clamps notes to the limit by characters', () => {
    expect(NOTE_MAX).toBe(200);
    let s = toggleMuscle({}, 'gluteus-l');
    s = updateEntry(s, 'gluteus-l', { note: 'x'.repeat(500) });
    expect(noteLength(s['gluteus-l'].note)).toBe(NOTE_MAX);
    expect(noteLength(clampNote('好'.repeat(250)))).toBe(NOTE_MAX);
    expect(noteLength('😀'.repeat(3))).toBe(3);
  });

  it('applyToAll changes intensity/duration for everything but never touches notes', () => {
    let s = toggleRegion({}, 'arms', 'front');
    s = updateEntry(s, 'biceps-l', { note: 'bruise' });
    s = applyToAll(s, { intensity: 'light', duration: 60 });
    for (const e of Object.values(s)) {
      expect(e.intensity).toBe('light');
      expect(e.duration).toBe(60);
    }
    expect(s['biceps-l'].note).toBe('bruise');
  });

  it('reducer: remove and clear', () => {
    let s = selectionReducer({}, { type: 'toggle', id: 'hand-front-l' });
    s = selectionReducer(s, { type: 'toggle', id: 'foot-front-r' });
    s = selectionReducer(s, { type: 'remove', id: 'hand-front-l' });
    expect(Object.keys(s)).toEqual(['foot-front-r']);
    expect(selectionReducer(s, { type: 'clear' })).toEqual({});
  });

  it('sanitizeSelection drops unknown ids and repairs bad values', () => {
    const s = sanitizeSelection({
      'biceps-l': { intensity: 'bogus', duration: 7, note: 5 },
      'evil-l': { intensity: 'deep', duration: 30, note: '' },
      '__proto__': { intensity: 'deep' },
      'hand-front-r': null,
    });
    expect(Object.keys(s)).toEqual(['biceps-l']);
    expect(s['biceps-l']).toEqual({ intensity: 'medium', duration: 15, note: '' });
    expect(sanitizeSelection('junk')).toEqual({});
    expect(sanitizeSelection([1, 2])).toEqual({});
  });

  it('selectionsEqual compares settings and notes', () => {
    const a = toggleMuscle({}, 'hand-front-l');
    const b = toggleMuscle({}, 'hand-front-l');
    expect(selectionsEqual(a, b)).toBe(true);
    expect(selectionsEqual(a, updateEntry(b, 'hand-front-l', { note: 'x' }))).toBe(false);
  });
});

describe('summaryRows', () => {
  it('groups by front/back and merges identical left+right pairs', () => {
    let s: Selection = {};
    s = toggleMuscle(s, 'biceps-l');
    s = toggleMuscle(s, 'biceps-r');
    s = toggleMuscle(s, 'hamstrings-l');
    const rows = summaryRows(s);
    expect(rows.front).toHaveLength(1);
    expect(rows.front[0].sides).toBe('both');
    expect(rows.back).toHaveLength(1);
    expect(rows.back[0].sides).toBe('l');
  });

  it('does not merge a pair when settings or notes differ', () => {
    let s: Selection = toggleMuscle(toggleMuscle({}, 'biceps-l'), 'biceps-r');
    s = updateEntry(s, 'biceps-r', { note: 'careful' });
    expect(summaryRows(s).front).toHaveLength(2);
  });
});
