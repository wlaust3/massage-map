export const INTENSITIES = ['light', 'medium', 'firm', 'deep'] as const;
export type Intensity = (typeof INTENSITIES)[number];

/** Time categories rather than minutes. 'none' means "skip this area" (e.g. an injury): the masseuse should not work it. */
export const DURATIONS = ['none', 'less', 'normal', 'extra'] as const;
export type Duration = (typeof DURATIONS)[number];

export const DEFAULT_INTENSITY: Intensity = 'medium';
export const DEFAULT_DURATION: Duration = 'normal';

/** Maximum characters in an injury / pressure note. */
export const NOTE_MAX = 200;
/** Maximum characters in a favorite's name. */
export const FAVORITE_NAME_MAX = 40;

export const isIntensity = (v: unknown): v is Intensity =>
  typeof v === 'string' && (INTENSITIES as readonly string[]).includes(v);
export const isDuration = (v: unknown): v is Duration =>
  typeof v === 'string' && (DURATIONS as readonly string[]).includes(v);
