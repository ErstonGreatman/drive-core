import type { SkillDefinition, TraitDefinition } from '~/data';
import { traitsById } from '~/data';
import type { PilotTraitEntry } from '~/types/pilot';
import { cloneTraitEntry } from '~/lib/pilotClones';

export const isDeathblowSelectable = (
  trait: TraitDefinition,
  currentFreeIds: string[],
): boolean => {
  if (currentFreeIds.includes(trait.id)) { return true; }
  const fiveCpCount = currentFreeIds.filter((id) => traitsById[id]?.cpCost === 5).length;
  const tenCpCount = currentFreeIds.filter((id) => traitsById[id]?.cpCost === 10).length;
  if (tenCpCount > 0) { return false; }
  if (trait.cpCost === 10 && fiveCpCount > 0) { return false; }
  return !(trait.cpCost === 5 && fiveCpCount >= 2);
};

export const stripGrantedDeathblowTraits = (
  pilotTraits: PilotTraitEntry[],
  freeIds: string[],
): PilotTraitEntry[] => {
  const result = pilotTraits.map(cloneTraitEntry);
  for (const id of freeIds) {
    const idx = result.findIndex((t) => t.traitId === id);
    if (idx >= 0) { result.splice(idx, 1); }
  }
  return result;
};

export const filterSkillsByQuery = (list: SkillDefinition[], query: string): SkillDefinition[] => {
  const q = query.toLowerCase();
  if (!q) { return list; }
  return list.filter(
    (s) => s.name.toLowerCase().includes(q) || s.defaultAttribute.includes(q),
  );
};
