import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import { MAX_ENCODED_LENGTH, buildShareUrl, decodeHash, decodePlan, encodeHash, encodePlan, looksLikeShareHash } from './codec';
import { makeQr } from './qr';
import { toggleMuscle, toggleRegion, updateEntry, type Selection } from '../state/selection';
import { MUSCLES } from '../data/muscles';

const sample = (): Selection => {
  let s = toggleRegion({}, 'upper-back', 'back');
  s = toggleMuscle(s, 'quadriceps-l');
  s = updateEntry(s, 'quadriceps-l', { intensity: 'deep', duration: 60, note: '这里别按，有旧伤 <b>"quote"</b> & 😀\nline 2' });
  s = updateEntry(s, 'rhomboids-l', { intensity: 'light', duration: 30 });
  return s;
};

describe('share codec', () => {
  it('round-trips selections, intensities, durations, notes and language', () => {
    const sel = sample();
    for (const lang of ['en', 'zh'] as const) {
      const r = decodeHash(encodeHash(sel, lang));
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.lang).toBe(lang);
        expect(r.selection).toEqual(sel);
      }
    }
  });

  it('works through a full URL and ignores the page URL part', () => {
    const url = buildShareUrl(sample(), 'zh', 'https://example.com/massage-map/?x=1#old');
    expect(url.startsWith('https://example.com/massage-map/?x=1#v1=')).toBe(true);
    const hash = url.slice(url.indexOf('#'));
    expect(looksLikeShareHash(hash)).toBe(true);
    expect(decodeHash(hash).ok).toBe(true);
  });

  it('uses only URL-safe characters and is compact', () => {
    const hash = encodeHash(sample(), 'en');
    expect(hash).toMatch(/^#v1=[A-Za-z0-9+\-$]+$/);
    // every muscle selected, no notes: still well under a scannable QR size
    const all: Selection = {};
    for (const m of MUSCLES) all[m.id] = { intensity: 'firm', duration: 30, note: '' };
    expect(encodeHash(all, 'en').length).toBeLessThan(1200);
  });

  it('keeps a plan with a note on every muscle decodable (large but valid)', () => {
    const all: Selection = {};
    MUSCLES.forEach((m, i) => (all[m.id] = { intensity: 'deep', duration: 60, note: `note ${i} ` + 'ab'.repeat(40) }));
    const enc = encodePlan(all, 'en');
    expect(enc.length).toBeLessThan(MAX_ENCODED_LENGTH);
    const r = decodePlan(enc);
    expect(r.ok && Object.keys(r.selection).length).toBe(MUSCLES.length);
  });

  describe('bad input never throws and reports an error', () => {
    const bad = (hash: string) => {
      const r = decodeHash(hash);
      expect(r.ok).toBe(false);
      return r.ok ? null : r.error;
    };
    const wrap = (value: unknown) => `#v1=${LZString.compressToEncodedURIComponent(JSON.stringify(value))}`;

    it('rejects non-share hashes', () => {
      expect(bad('')).toBe('not-a-share-link');
      expect(bad('#about')).toBe('not-a-share-link');
      expect(looksLikeShareHash('#about')).toBe(false);
    });
    it('rejects empty, garbage and truncated data', () => {
      expect(bad('#v1=')).toBe('corrupt');
      expect(bad('#v1=%%%%not-lz%%%%')).toMatch(/corrupt|invalid/);
      const good = encodeHash(sample(), 'en');
      for (const cut of [10, 20, good.length - 5]) {
        const r = decodeHash(good.slice(0, cut));
        expect(r.ok).toBe(false);
      }
    });
    it('rejects unknown versions', () => {
      expect(bad('#v2=abc')).toBe('unsupported-version');
      expect(bad(wrap([2, 'en', [['hand-front-l', 0, 15]]]))).toBe('unsupported-version');
    });
    it('rejects oversized links before decompressing', () => {
      expect(bad('#v1=' + 'A'.repeat(MAX_ENCODED_LENGTH + 1))).toBe('too-large');
    });
    it('rejects decompression bombs', () => {
      const r = decodePlan(LZString.compressToEncodedURIComponent(JSON.stringify([1, 'en', [['hand-front-l', 0, 15, 'x'.repeat(200000)]]])));
      expect(r.ok).toBe(false);
    });
    it('validates the structure strictly', () => {
      expect(bad(wrap({ a: 1 }))).toBe('invalid');
      expect(bad(wrap([1, 'fr', [['hand-front-l', 0, 15]]]))).toBe('invalid');
      expect(bad(wrap([1, 'en', 'nope']))).toBe('invalid');
      expect(bad(wrap([1, 'en', [['fake-l', 0, 15]]]))).toBe('invalid');
      expect(bad(wrap([1, 'en', [['hand-front-l', 7, 15]]]))).toBe('invalid');
      expect(bad(wrap([1, 'en', [['hand-front-l', 0, 20]]]))).toBe('invalid');
      expect(bad(wrap([1, 'en', [['hand-front-l', 0, 15, 123]]]))).toBe('invalid');
      expect(bad(wrap([1, 'en', [['hand-front-l', 0, 15, 'x'.repeat(201)]]]))).toBe('invalid');
      expect(bad(wrap([1, 'en', [['hand-front-l', 0, 15], ['hand-front-l', 1, 30]]]))).toBe('invalid'); // duplicate
      expect(bad(wrap([1, 'en', [['__proto__', 0, 15]]]))).toBe('invalid');
      expect(bad(wrap([1, 'en', []]))).toBe('empty');
    });
    it('does not pollute prototypes', () => {
      decodePlan(LZString.compressToEncodedURIComponent('[1,"en",[["__proto__",0,15]]]'));
      expect(({} as Record<string, unknown>).intensity).toBeUndefined();
    });
  });
});

describe('QR generation (client-side)', () => {
  it('makes a QR code for a typical share link', async () => {
    const url = buildShareUrl(sample(), 'en', 'https://example.com/');
    const r = await makeQr(url);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.size).toBeGreaterThan(20);
      expect(r.path.startsWith('M')).toBe(true);
    }
  });
  it('flags dense codes for long links and fails gracefully past QR capacity', async () => {
    const long = 'https://example.com/#v1=' + 'a'.repeat(1500);
    const dense = await makeQr(long);
    expect(dense.ok && dense.dense).toBe(true);
    const huge = await makeQr('https://example.com/#v1=' + 'a'.repeat(4000));
    expect(huge).toEqual({ ok: false, error: 'too-large' });
  });
});
