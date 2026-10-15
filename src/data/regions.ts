export const REGION_IDS = [
  'neck',
  'shoulders',
  'chest',
  'abdomen',
  'upper-back',
  'lower-back',
  'arms',
  'hands',
  'hips',
  'legs',
  'feet',
] as const;
export type RegionId = (typeof REGION_IDS)[number];

export const regionNameKey = (id: RegionId) => `region.${id}` as const;
