import LZString from 'lz-string';
import { DURATIONS, INTENSITIES, NOTE_MAX } from '../data/options';
import { MUSCLES, MUSCLE_BY_ID } from '../data/muscles';
import { isLang, type Lang } from '../i18n';
import { isSelected, noteLength, selectedIds, type Selection } from '../state/selection';

/**
 * Share payload (version 2), before compression:
 *   [2, "en" | "zh", [[muscleId, intensityIndex, durationIndex, note?], ...]]
 * It is compressed with lz-string into URL-safe characters and placed in the URL hash as `#v2=<data>`.
 * The hash fragment is never sent to a server by browsers.
 *
 * Version 1 links (`#v1=`, third field = minutes 15/30/45/60) still decode; their time becomes "normal".
 */
export const SHARE_VERSION = 2;
const V1_MINUTES = [15, 30, 45, 60];
export const HASH_PREFIX = `v${SHARE_VERSION}=`;
/** Reject absurdly long hashes before decompressing (a plan with every note full is far below this). */
export const MAX_ENCODED_LENGTH = 12000;
export const MAX_JSON_LENGTH = 60000;

export interface SharedPlan {
  lang: Lang;
  selection: Selection;
}

export type DecodeError = 'not-a-share-link' | 'unsupported-version' | 'too-large' | 'corrupt' | 'invalid' | 'empty';
export type DecodeResult = ({ ok: true } & SharedPlan) | { ok: false; error: DecodeError };

export function encodePlan(selection: Selection, lang: Lang): string {
  const items = selectedIds(selection).map((id) => {
    const e = selection[id];
    const row: (string | number)[] = [id, INTENSITIES.indexOf(e.intensity), DURATIONS.indexOf(e.duration)];
    if (e.note) row.push(e.note);
    return row;
  });
  return LZString.compressToEncodedURIComponent(JSON.stringify([SHARE_VERSION, lang, items]));
}

/** `#v2=...` fragment for the plan. */
export const encodeHash = (selection: Selection, lang: Lang): string => `#${HASH_PREFIX}${encodePlan(selection, lang)}`;

export function buildShareUrl(selection: Selection, lang: Lang, pageUrl: string): string {
  const base = pageUrl.split('#')[0];
  return base + encodeHash(selection, lang);
}

/** Does this hash look like an attempted share link (so a failure should show the friendly error)? */
export const looksLikeShareHash = (hash: string): boolean => /^#v\d+=/.test(hash);

export function decodeHash(hash: string): DecodeResult {
  const m = /^#?v(\d+)=(.*)$/s.exec(hash);
  if (!m) return { ok: false, error: 'not-a-share-link' };
  const version = Number(m[1]);
  if (version !== SHARE_VERSION && version !== 1) return { ok: false, error: 'unsupported-version' };
  return decodePlan(m[2], version);
}

export function decodePlan(data: string, expectVersion: number = SHARE_VERSION): DecodeResult {
  if (data.length > MAX_ENCODED_LENGTH) return { ok: false, error: 'too-large' };
  if (!data) return { ok: false, error: 'corrupt' };
  let json: string | null;
  try {
    json = LZString.decompressFromEncodedURIComponent(data);
  } catch {
    return { ok: false, error: 'corrupt' };
  }
  if (!json) return { ok: false, error: 'corrupt' };
  if (json.length > MAX_JSON_LENGTH) return { ok: false, error: 'too-large' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'corrupt' };
  }
  if (!Array.isArray(parsed) || parsed.length !== 3) return { ok: false, error: 'invalid' };
  const [version, lang, items] = parsed as [unknown, unknown, unknown];
  if (version !== expectVersion) return { ok: false, error: 'unsupported-version' };
  if (!isLang(lang) || !Array.isArray(items)) return { ok: false, error: 'invalid' };
  if (items.length > MUSCLES.length) return { ok: false, error: 'invalid' };
  const selection: Selection = {};
  for (const row of items as unknown[]) {
    if (!Array.isArray(row) || row.length < 3 || row.length > 4) return { ok: false, error: 'invalid' };
    const [id, ii, dur, note = ''] = row as [unknown, unknown, unknown, unknown];
    if (typeof id !== 'string' || !MUSCLE_BY_ID.has(id) || isSelected(selection, id)) {
      return { ok: false, error: 'invalid' };
    }
    if (typeof ii !== 'number' || !Number.isInteger(ii) || ii < 0 || ii >= INTENSITIES.length) {
      return { ok: false, error: 'invalid' };
    }
    let duration: (typeof DURATIONS)[number];
    if (version === 1) {
      if (!V1_MINUTES.includes(dur as number)) return { ok: false, error: 'invalid' };
      duration = 'normal';
    } else {
      if (typeof dur !== 'number' || !Number.isInteger(dur) || dur < 0 || dur >= DURATIONS.length) {
        return { ok: false, error: 'invalid' };
      }
      duration = DURATIONS[dur];
    }
    if (typeof note !== 'string' || noteLength(note) > NOTE_MAX) return { ok: false, error: 'invalid' };
    selection[id] = { intensity: INTENSITIES[ii], duration, note };
  }
  if (items.length === 0) return { ok: false, error: 'empty' };
  return { ok: true, lang, selection };
}
