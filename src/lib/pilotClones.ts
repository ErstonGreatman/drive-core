import type { PilotSkillEntry, PilotTraitEntry } from '~/types/pilot';

export const cloneSkillEntry = (s: PilotSkillEntry): PilotSkillEntry => ({
  skillId: s.skillId,
  type: s.type,
  specialistLabel: s.specialistLabel,
  freeDeathblowTraitIds: s.freeDeathblowTraitIds ? [...s.freeDeathblowTraitIds] : undefined,
});

export const cloneTraitEntry = (t: PilotTraitEntry): PilotTraitEntry => ({
  traitId: t.traitId,
  specialistLabel: t.specialistLabel,
  chosenMiracleSkillId: t.chosenMiracleSkillId,
  miracleTier: t.miracleTier,
});
