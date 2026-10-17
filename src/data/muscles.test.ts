import { describe, expect, it } from 'vitest';
import { LEGACY_BASES, MUSCLES, MUSCLE_BY_ID, musclesInRegion, musclesInView, regionsInView, resolveMuscleId } from './muscles';
import { REGION_IDS } from './regions';

describe('muscle data', () => {
  it('ids are unique and stable-looking (<base>-l | <base>-r)', () => {
    expect(new Set(MUSCLES.map((m) => m.id)).size).toBe(MUSCLES.length);
    for (const m of MUSCLES) expect(m.id).toMatch(/^[a-z-]+-[lr]$/);
    expect(MUSCLE_BY_ID.get('biceps-brachii-l')?.view).toBe('front');
    expect(MUSCLE_BY_ID.get('gluteus-maximus-r')?.view).toBe('back');
  });

  it('has many muscles, each with a shape on its own view, a region and both sides', () => {
    expect(MUSCLES.length).toBeGreaterThanOrEqual(100);
    for (const m of MUSCLES) {
      expect(m.paths[m.view]?.startsWith('M')).toBe(true);
      expect(REGION_IDS).toContain(m.region);
    }
    for (const base of new Set(MUSCLES.map((m) => m.base))) {
      expect(MUSCLES.filter((m) => m.base === base).length).toBe(2);
    }
  });

  it('muscles seen from both sides are tappable on both views', () => {
    for (const id of ['trapezius-upper-l', 'brachioradialis-r', 'gracilis-l']) {
      const m = MUSCLE_BY_ID.get(id)!;
      expect(musclesInView('front')).toContain(m);
      expect(musclesInView('back')).toContain(m);
    }
    expect(musclesInView('front')).not.toContain(MUSCLE_BY_ID.get('soleus-l'));
  });

  it('every region has muscles, and the region list per view is non-empty', () => {
    for (const r of REGION_IDS) expect(musclesInRegion(r).length).toBeGreaterThan(0);
    expect(regionsInView('front', REGION_IDS)).toContain('chest');
    expect(regionsInView('back', REGION_IDS)).toContain('lower-back');
    expect(regionsInView('front', REGION_IDS)).not.toContain('lower-back');
  });

  it('maps ids from the old figure to current muscles', () => {
    expect(resolveMuscleId('quadriceps-l')).toEqual(['rectus-femoris-l', 'vastus-lateralis-l', 'vastus-medialis-l']);
    expect(resolveMuscleId('trapezius-upper-r')).toEqual(['trapezius-upper-r']);
    expect(resolveMuscleId('fake-l')).toEqual([]);
    expect(resolveMuscleId('__proto__')).toEqual([]);
    for (const [old, bases] of Object.entries(LEGACY_BASES)) {
      expect(MUSCLE_BY_ID.has(`${old}-l`), old).toBe(false);
      for (const b of bases) expect(MUSCLE_BY_ID.has(`${b}-r`), b).toBe(true);
    }
  });
});
