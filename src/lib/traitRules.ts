import type { PilotSkillEntry, PilotTraitEntry } from '~/types/pilot';
import type { TraitDefinition } from '~/data';
import { traitsById } from '~/data';

export const buildFreeDeathblowMap = (skills: PilotSkillEntry[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const entry of skills) {
    for (const id of (entry.freeDeathblowTraitIds ?? [])) {
      map.set(id, (map.get(id) ?? 0) + 1);
    }
  }
  return map;
};

export const enrichTraitsWithMeta = (
  pilotTraits: PilotTraitEntry[],
  freeDeathblowMap: Map<string, number>,
): Array<{ entry: PilotTraitEntry; def: TraitDefinition; index: number; isFree: boolean }> => {
  const remaining = new Map(freeDeathblowMap);
  return pilotTraits.map((entry, index) => {
    const def = traitsById[entry.traitId];
    let isFree = false;
    const count = remaining.get(entry.traitId) ?? 0;
    if (count > 0 && def?.traitCategory === 'deathblow') {
      isFree = true;
      remaining.set(entry.traitId, count - 1);
    }
    return { entry, def, index, isFree };
  }).filter((x): x is typeof x & { def: TraitDefinition } => !!x.def);
};
