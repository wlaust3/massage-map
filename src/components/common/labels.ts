import { MUSCLE_BY_ID } from '../../data/muscles';
import type { Params } from '../../i18n';

type T = (key: string, params?: Params) => string;

/** "Front of thigh (left)" for a muscle id. */
export function muscleLabel(t: T, id: string): string {
  const m = MUSCLE_BY_ID.get(id);
  if (!m) return id;
  return t('muscle.withSide', { name: t(m.nameKey), side: t(`side.${m.side}`) });
}

/** Everyday description of a muscle id, e.g. "Front of upper arm". */
export function musclePlain(t: T, id: string): string {
  const m = MUSCLE_BY_ID.get(id);
  return m ? t(m.plainKey) : '';
}
