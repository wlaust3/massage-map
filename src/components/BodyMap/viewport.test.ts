import { describe, expect, it } from 'vitest';
import { IDENTITY, MAX_SCALE, clampTransform, pickNearest, pinch, toContent, zoomAt } from './viewport';

const W = 240;
const H = 440;

describe('viewport math', () => {
  it('clamps scale and keeps content covering the viewport', () => {
    expect(clampTransform({ s: 10, tx: 100, ty: 100 }, W, H)).toEqual({ s: MAX_SCALE, tx: 0, ty: 0 });
    const c = clampTransform({ s: 2, tx: -9999, ty: -9999 }, W, H);
    expect(c).toEqual({ s: 2, tx: W - W * 2, ty: H - H * 2 });
    expect(clampTransform({ s: 0.3, tx: 50, ty: 50 }, W, H)).toEqual(IDENTITY);
  });

  it('zoomAt keeps the focal content point fixed', () => {
    const focal = { x: 120, y: 200 };
    const t = zoomAt(IDENTITY, 2, focal, W, H);
    const c = toContent(t, focal);
    expect(c.x).toBeCloseTo(120);
    expect(c.y).toBeCloseTo(200);
    expect(t.s).toBe(2);
  });

  it('pinch scales by the finger distance ratio', () => {
    const mid = { x: 120, y: 220 };
    const t = pinch(IDENTITY, mid, mid, 2.5, W, H);
    expect(t.s).toBe(2.5);
    expect(pinch(IDENTITY, mid, mid, 0.2, W, H)).toEqual(IDENTITY);
  });
});

describe('pickNearest (forgiving tap resolution)', () => {
  it('prefers a shape containing the point', () => {
    expect(
      pickNearest(
        [
          { id: 'a', dist: 5, area: 10 },
          { id: 'b', dist: 0, area: 1000 },
        ],
        20,
      ),
    ).toBe('b');
  });
  it('takes the nearest shape within the radius', () => {
    expect(
      pickNearest(
        [
          { id: 'a', dist: 12, area: 10 },
          { id: 'b', dist: 7, area: 10 },
        ],
        20,
      ),
    ).toBe('b');
  });
  it('prefers the smaller shape when overlapping', () => {
    expect(
      pickNearest(
        [
          { id: 'big', dist: 0, area: 5000 },
          { id: 'small', dist: 0, area: 200 },
        ],
        20,
      ),
    ).toBe('small');
  });
  it('returns null when nothing is close enough', () => {
    expect(pickNearest([{ id: 'a', dist: 30, area: 1 }], 20)).toBeNull();
    expect(pickNearest([], 20)).toBeNull();
  });
});
