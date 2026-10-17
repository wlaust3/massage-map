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
    s = toggleMuscle(s, 'biceps-brachii-l');
    expect(s['biceps-brachii-l']).toEqual({ intensity: 'medium', duration: 'normal', note: '' });
    s = toggleMuscle(s, 'biceps-brachii-l');
    expect(countSelected(s)).toBe(0);
  });

  it('ignores unknown ids and does not mutate', () => {
    const s: Selection = {};
    expect(toggleMuscle(s, 'nope-l')).toBe(s);
    const s2 = toggleMuscle(s, 'biceps-brachii-l');
    expect(s).toEqual({});
    expect(s2).not.toBe(s);
  });

  it('region toggle selects all muscles of the region on that view, then deselects them', () => {
    let s: Selection = {};
    s = toggleRegion(s, 'legs', 'front');
    const frontLegs = musclesInRegion('legs', 'front');
    expect(frontLegs.length).toBe(20);
    expect(countSelected(s)).toBe(20);
    expect(regionState(s, 'legs', 'front')).toBe('all');
    expect(regionState(s, 'legs', 'back')).toBe('partial'); // gracilis is seen from both sides
    s = toggleRegion(s, 'legs', 'front');
    expect(countSelected(s)).toBe(0);
  });

  it('region toggle with a partial selection completes it and keeps edited settings', () => {
    let s: Selection = toggleMuscle({}, 'rectus-femoris-l');
    s = updateEntry(s, 'rectus-femoris-l', { intensity: 'deep', note: 'old injury' });
    expect(regionState(s, 'legs', 'front')).toBe('partial');
    s = toggleRegion(s, 'legs', 'front');
    expect(regionState(s, 'legs', 'front')).toBe('all');
    expect(s['rectus-femoris-l'].intensity).toBe('deep');
    expect(s['rectus-femoris-l'].note).toBe('old injury');
  });

  it('updates intensity, duration and note; rejects invalid values', () => {
    let s = toggleMuscle({}, 'gastrocnemius-medial-r');
    s = updateEntry(s, 'gastrocnemius-medial-r', { intensity: 'firm', duration: 'extra', note: 'hello' });
    expect(s['gastrocnemius-medial-r']).toEqual({ intensity: 'firm', duration: 'extra', note: 'hello' });
    // @ts-expect-error invalid on purpose
    s = updateEntry(s, 'gastrocnemius-medial-r', { duration: 'forever' as never, intensity: 'crushing' });
    expect(s['gastrocnemius-medial-r']).toEqual({ intensity: 'firm', duration: 'extra', note: 'hello' });
    expect(updateEntry(s, 'biceps-brachii-l', { intensity: 'light' })).toBe(s); // not selected
  });

  it('clamps notes to the limit by characters', () => {
    expect(NOTE_MAX).toBe(200);
    let s = toggleMuscle({}, 'gluteus-maximus-l');
    s = updateEntry(s, 'gluteus-maximus-l', { note: 'x'.repeat(500) });
    expect(noteLength(s['gluteus-maximus-l'].note)).toBe(NOTE_MAX);
    expect(noteLength(clampNote('好'.repeat(250)))).toBe(NOTE_MAX);
    expect(noteLength('😀'.repeat(3))).toBe(3);
  });

  it('applyToAll changes intensity/duration for everything but never touches notes', () => {
    let s = toggleRegion({}, 'arms', 'front');
    s = updateEntry(s, 'biceps-brachii-l', { note: 'bruise' });
    s = applyToAll(s, { intensity: 'light', duration: 'less' });
    for (const e of Object.values(s)) {
      expect(e.intensity).toBe('light');
      expect(e.duration).toBe('less');
    }
    expect(s['biceps-brachii-l'].note).toBe('bruise');
  });

  it('reducer: remove and clear', () => {
    let s = selectionReducer({}, { type: 'toggle', id: 'thenar-l' });
    s = selectionReducer(s, { type: 'toggle', id: 'extensor-digitorum-brevis-r' });
    s = selectionReducer(s, { type: 'remove', id: 'thenar-l' });
    expect(Object.keys(s)).toEqual(['extensor-digitorum-brevis-r']);
    expect(selectionReducer(s, { type: 'clear' })).toEqual({});
  });

  it('sanitizeSelection expands ids from the old figure', () => {
    const s = sanitizeSelection({ 'hand-front-r': { intensity: 'deep', duration: 'less', note: 'x' } });
    expect(Object.keys(s).sort()).toEqual(['hypothenar-r', 'thenar-r']);
    expect(s['thenar-r']).toEqual({ intensity: 'deep', duration: 'less', note: 'x' });
  });

  it('sanitizeSelection drops unknown ids and repairs bad values', () => {
    const s = sanitizeSelection({
      'biceps-brachii-l': { intensity: 'bogus', duration: 7, note: 5 },
      'evil-l': { intensity: 'deep', duration: 'less', note: '' },
      '__proto__': { intensity: 'deep' },
      'thenar-r': null,
    });
    expect(Object.keys(s)).toEqual(['biceps-brachii-l']);
    expect(s['biceps-brachii-l']).toEqual({ intensity: 'medium', duration: 'normal', note: '' });
    expect(sanitizeSelection('junk')).toEqual({});
    expect(sanitizeSelection([1, 2])).toEqual({});
  });

  it('selectionsEqual compares settings and notes', () => {
    const a = toggleMuscle({}, 'thenar-l');
    const b = toggleMuscle({}, 'thenar-l');
    expect(selectionsEqual(a, b)).toBe(true);
    expect(selectionsEqual(a, updateEntry(b, 'thenar-l', { note: 'x' }))).toBe(false);
  });
});

describe('summaryRows', () => {
  it('groups by front/back and merges identical left+right pairs', () => {
    let s: Selection = {};
    s = toggleMuscle(s, 'biceps-brachii-l');
    s = toggleMuscle(s, 'biceps-brachii-r');
    s = toggleMuscle(s, 'biceps-femoris-l');
    const rows = summaryRows(s);
    expect(rows.front).toHaveLength(1);
    expect(rows.front[0].sides).toBe('both');
    expect(rows.back).toHaveLength(1);
    expect(rows.back[0].sides).toBe('l');
  });

  it('does not merge a pair when settings or notes differ', () => {
    let s: Selection = toggleMuscle(toggleMuscle({}, 'biceps-brachii-l'), 'biceps-brachii-r');
    s = updateEntry(s, 'biceps-brachii-r', { note: 'careful' });
    expect(summaryRows(s).front).toHaveLength(2);
  });
});
