import { genrePowers } from '~/data';
import type { GenrePowerDefinition } from '~/data';

export const POWER_CATEGORIES: Record<string, string> = {
  champion: 'Champion',
  trickster: 'Trickster',
  tactician: 'Tactician',
  miscellaneous: 'Miscellaneous',
  rush: 'Rush',
  restoration: 'Restoration',
  boost: 'Boost',
  limit: 'Limit',
};

// Built once at module load from static game data
export const alternativesByDefaultId: Record<string, GenrePowerDefinition> = {};
export const defaultAndAlternativeIds = new Set<string>();

for (const p of genrePowers) {
  if (p.isDefault) { defaultAndAlternativeIds.add(p.id); }
  if (p.alternativeFor) {
    alternativesByDefaultId[p.alternativeFor] = p;
    defaultAndAlternativeIds.add(p.id);
  }
}

export const additionalPowerPool: GenrePowerDefinition[] = genrePowers.filter(
  (p) => !defaultAndAlternativeIds.has(p.id),
);
