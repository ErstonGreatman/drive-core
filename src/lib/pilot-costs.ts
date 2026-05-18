import type { PilotAttributes, PilotSkillEntry, PilotTraitEntry } from '~/types/pilot';
import type { SkillDefinition } from '~/data/schemas/skill';
import type { TraitDefinition } from '~/data/schemas/trait';

export const powerLevel = (experience: number): number => Math.floor(experience / 30);

export const totalCP = (experience: number): number => 100 + powerLevel(experience) * 30;

// Total CP cost to reach `rank` from 0 (triangular number formula)
export const attributeCostToRank = (rank: number): number => (rank * (rank + 1)) / 2;

// Incremental CP cost to go from `currentRank` to `currentRank + 1`
export const attributeIncrementalCost = (currentRank: number): number => currentRank + 1;

export const skillCost = (def: SkillDefinition, type: 'generalist' | 'specialist'): number => {
  if (def.isMiracle) {
    return type === 'generalist' ? 20 : 10;
  }
  return type === 'generalist' ? 10 : 5;
};

// Determines if an offensive miracle skill entry qualifies for free Deathblow traits.
// Generalist always qualifies; specialist qualifies only when the label enables Offensive Tests.
export const qualifiesForFreeDeathblows = (entry: PilotSkillEntry, def: SkillDefinition): boolean => {
  if (!def.isOffensiveMiracle) { return false; }
  if (entry.type === 'generalist') { return true; }
  return (entry.specialistLabel ?? '').toLowerCase().includes('offensive');
};

export const computeSpentCP = (
  attributes: PilotAttributes,
  skills: PilotSkillEntry[],
  traits: PilotTraitEntry[],
  skillsById: Record<string, SkillDefinition>,
  traitsById: Record<string, TraitDefinition>,
): number => {
  const attrCost =
    attributeCostToRank(attributes.fitness) +
    attributeCostToRank(attributes.awareness) +
    attributeCostToRank(attributes.intellect) +
    attributeCostToRank(attributes.willpower) +
    attributeCostToRank(attributes.charm) +
    attributeCostToRank(attributes.resources);

  const skillsCost = skills.reduce((sum, entry) => {
    const def = skillsById[entry.skillId];
    return def ? sum + skillCost(def, entry.type) : sum;
  }, 0);

  // Count free Deathblow trait instances from offensive Miracles
  const freeCount = new Map<string, number>();
  for (const entry of skills) {
    for (const id of (entry.freeDeathblowTraitIds ?? [])) {
      freeCount.set(id, (freeCount.get(id) ?? 0) + 1);
    }
  }

  // Track remaining free instances as we consume them
  const remaining = new Map(freeCount);
  const traitsCost = traits.reduce((sum, entry) => {
    const free = remaining.get(entry.traitId) ?? 0;
    if (free > 0) {
      remaining.set(entry.traitId, free - 1);
      return sum;
    }
    const def = traitsById[entry.traitId];
    return def ? sum + def.cpCost : sum;
  }, 0);

  return attrCost + skillsCost + traitsCost;
};
