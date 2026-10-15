export const INTENSITIES = ['light', 'medium', 'firm', 'deep'] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const DURATIONS = [15, 30, 45, 60] as const;
export type Duration = (typeof DURATIONS)[number];

export const DEFAULT_INTENSITY: Intensity = 'medium';
export const DEFAULT_DURATION: Duration = 15;

/** Maximum characters in an injury / pressure note. */
export const NOTE_MAX = 200;
/** Maximum characters in a favorite's name. */
export const FAVORITE_NAME_MAX = 40;

export const isIntensity = (v: unknown): v is Intensity =>
  typeof v === 'string' && (INTENSITIES as readonly string[]).includes(v);
export const isDuration = (v: unknown): v is Duration =>
  typeof v === 'number' && (DURATIONS as readonly number[]).includes(v);
