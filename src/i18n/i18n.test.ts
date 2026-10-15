import { describe, expect, it } from 'vitest';
import en from './en.json';
import zh from './zh.json';
import { makeT, translate } from './index';
import { MUSCLE_BASES } from '../data/muscles';
import { REGION_IDS } from '../data/regions';
import { DURATIONS, INTENSITIES } from '../data/options';

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe('i18n parity', () => {
  it('en and zh have exactly the same keys', () => {
    const e = Object.keys(en).sort();
    const z = Object.keys(zh).sort();
    expect(z.filter((k) => !e.includes(k))).toEqual([]);
    expect(e.filter((k) => !z.includes(k))).toEqual([]);
  });

  it('no empty strings', () => {
    for (const [k, v] of Object.entries(en)) expect(v.trim(), `en ${k}`).not.toBe('');
    for (const [k, v] of Object.entries(zh)) expect(v.trim(), `zh ${k}`).not.toBe('');
  });

  it('{placeholders} match between languages', () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(zh[k]), k).toEqual(placeholders(en[k]));
    }
  });

  it('every muscle, region, intensity and duration has a label in both languages', () => {
    const keys = [
      ...MUSCLE_BASES.map((b) => `muscle.${b}`),
      ...REGION_IDS.map((r) => `region.${r}`),
      ...INTENSITIES.map((i) => `intensity.${i}`),
      ...DURATIONS.map((d) => `duration.${d}`),
    ];
    for (const k of keys) {
      expect(k in en, `en ${k}`).toBe(true);
      expect(k in zh, `zh ${k}`).toBe(true);
    }
  });

  it('Chinese is Chinese: no untranslated copies of the English text (except symbols/units)', () => {
    const allowed = new Set(['note.counter']);
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      if (allowed.has(k)) continue;
      if (zh[k] === en[k]) throw new Error(`zh.${k} is identical to English`);
    }
  });
});

describe('translate()', () => {
  it('substitutes params', () => {
    expect(translate('en', 'picks.title', { count: 3 })).toBe('Your picks (3)');
    expect(translate('zh', 'picks.title', { count: 3 })).toBe('已选 3 处');
  });
  it('falls back to the key for unknown keys', () => {
    expect(makeT('zh')('does.not.exist')).toBe('does.not.exist');
  });
});
