import designFlawsRaw from './raw/design-flaws.json';
import genrePowersRaw from './raw/genre-powers.json';
import mechaTemplatesRaw from './raw/mecha-templates.json';
import skillsRaw from './raw/skills.json';
import traitsRaw from './raw/traits.json';
import upgradeTemplatesRaw from './raw/upgrade-templates.json';
import weaponAbilitiesRaw from './raw/weapon-abilities.json';
import weaponKeywordsRaw from './raw/weapon-keywords.json';
import weaponTemplatesRaw from './raw/weapon-templates.json';

import {
  DesignFlawDefinitionsSchema,
  GenrePowerDefinitionsSchema,
  MechaTemplateDefinitionsSchema,
  SkillDefinitionsSchema,
  TraitDefinitionsSchema,
  UpgradeTemplateDefinitionsSchema,
  WeaponAbilityDefinitionsSchema,
  WeaponKeywordDefinitionsSchema,
  WeaponTemplateDefinitionsSchema,
} from './schemas';

// All JSON is parsed at module load. A schema mismatch throws immediately,
// catching data errors before they reach the UI.
export const skills = SkillDefinitionsSchema.parse(skillsRaw);
export const traits = TraitDefinitionsSchema.parse(traitsRaw);
export const genrePowers = GenrePowerDefinitionsSchema.parse(genrePowersRaw);
export const designFlaws = DesignFlawDefinitionsSchema.parse(designFlawsRaw);
export const weaponKeywords = WeaponKeywordDefinitionsSchema.parse(weaponKeywordsRaw);
export const weaponAbilities = WeaponAbilityDefinitionsSchema.parse(weaponAbilitiesRaw);
export const weaponTemplates = WeaponTemplateDefinitionsSchema.parse(weaponTemplatesRaw);
export const upgradeTemplates = UpgradeTemplateDefinitionsSchema.parse(upgradeTemplatesRaw);
export const mechaTemplates = MechaTemplateDefinitionsSchema.parse(mechaTemplatesRaw);

// Convenience lookup maps
export const skillsById = Object.fromEntries(skills.map((s) => [s.id, s]));
export const traitsById = Object.fromEntries(traits.map((t) => [t.id, t]));
export const genrePowersById = Object.fromEntries(genrePowers.map((p) => [p.id, p]));
export const designFlawsById = Object.fromEntries(designFlaws.map((f) => [f.id, f]));
export const weaponKeywordsById = Object.fromEntries(weaponKeywords.map((k) => [k.id, k]));
export const weaponAbilitiesById = Object.fromEntries(weaponAbilities.map((a) => [a.id, a]));
export const weaponTemplatesById = Object.fromEntries(weaponTemplates.map((w) => [w.id, w]));
export const upgradeTemplatesById = Object.fromEntries(upgradeTemplates.map((u) => [u.id, u]));
export const mechaTemplatesById = Object.fromEntries(mechaTemplates.map((m) => [m.id, m]));

// The 6 default genre powers every pilot starts with
export const defaultGenrePowers = genrePowers.filter((p) => p.isDefault);

// Re-export types so consumers import from a single location
export type { DesignFlawDefinition } from './schemas/design-flaw';
export type { GenrePowerDefinition } from './schemas/genre-power';
export type { MechaAttributes, MechaTemplateDefinition } from './schemas/mecha-template';
export type { SkillDefinition } from './schemas/skill';
export type { TraitDefinition } from './schemas/trait';
export type { UpgradeTemplateDefinition } from './schemas/upgrade';
export type {
  WeaponAbility,
  WeaponAbilityDefinition,
  WeaponKeywordDefinition,
  WeaponTemplateDefinition,
} from './schemas/weapon';
