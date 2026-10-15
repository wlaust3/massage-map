import { describe, expect, it } from 'vitest';
import { MUSCLES, MUSCLE_BY_ID, musclesInRegion, regionsInView } from './muscles';
import { REGION_IDS } from './regions';
import { SHAPES, mirrorPath } from '../assets/anatomy/shapes';

describe('muscle data', () => {
  it('ids are unique and stable-looking (<base>-l | <base>-r)', () => {
    expect(new Set(MUSCLES.map((m) => m.id)).size).toBe(MUSCLES.length);
    for (const m of MUSCLES) expect(m.id).toMatch(/^[a-z-]+-[lr]$/);
    expect(MUSCLE_BY_ID.get('biceps-l')?.view).toBe('front');
    expect(MUSCLE_BY_ID.get('gluteus-r')?.view).toBe('back');
  });

  it('every muscle has a path, a region and both sides', () => {
    for (const m of MUSCLES) {
      expect(m.path.startsWith('M')).toBe(true);
      expect(REGION_IDS).toContain(m.region);
    }
    for (const base of new Set(MUSCLES.map((m) => m.base))) {
      expect(MUSCLES.filter((m) => m.base === base).length).toBe(2);
    }
    expect(Object.keys(SHAPES).length).toBeGreaterThan(20);
  });

  it('left and right of one view are on opposite viewer halves', () => {
    const l = MUSCLE_BY_ID.get('triceps-l')!;
    const r = MUSCLE_BY_ID.get('triceps-r')!;
    expect(l.half).not.toBe(r.half);
  });

  it('every region has muscles, and the region list per view is non-empty', () => {
    for (const r of REGION_IDS) expect(musclesInRegion(r).length).toBeGreaterThan(0);
    expect(regionsInView('front', REGION_IDS)).toContain('chest');
    expect(regionsInView('back', REGION_IDS)).toContain('lower-back');
    expect(regionsInView('front', REGION_IDS)).not.toContain('lower-back');
  });

  it('mirrorPath flips x around the centre line and is an involution', () => {
    expect(mirrorPath('M100 10 L110 20 Z')).toBe('M140 10 L130 20 Z');
    const d = SHAPES.biceps;
    expect(mirrorPath(mirrorPath(d))).toBe(d);
  });
});
