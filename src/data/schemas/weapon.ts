import { z } from 'zod';

// Shared shape used both in weapon templates and on user mecha builds
export const WeaponAbilitySchema = z.object({
  abilityTemplateId: z.string().optional(),
  name: z.string(),
  description: z.string(),
  wpCost: z.number().int(),
});

// Entries in weapon-abilities.json: the selectable ability options for custom weapons
export const WeaponAbilityDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  wpCost: z.number().int(),
  sourcePageRef: z.string(),
});

// Entries in weapon-keywords.json
export const WeaponKeywordDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  sourcePageRef: z.string(),
});

// Entries in weapon-templates.json
export const WeaponTemplateDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  // IDs referencing weapon-keywords.json; always includes 'melee' or 'shooting' (not both)
  keywords: z.array(z.string()).min(1),
  // 1 for all Beam weapons (base cost before optional Boost); absent for non-Beam
  energyCost: z.number().int().positive().optional(),
  // Optional extra Energy to activate the Beam's boost effect
  boostCost: z.number().int().positive().optional(),
  // Blast radius in Zones for Blast weapons; absent for non-Blast
  blastRadius: z.number().int().positive().optional(),
  // Mechanical effect text
  effect: z.string(),
  // 0 for the two Default Weapons (CQC and Vulcans); 5 for all equippable weapons
  mpCost: z.union([z.literal(0), z.literal(5)]),
  // True only for CQC and Vulcans — every mecha has these built in at no MP cost
  isDefault: z.boolean(),
  sourcePageRef: z.string(),
});

export const WeaponAbilityDefinitionsSchema = z.array(WeaponAbilityDefinitionSchema);
export const WeaponKeywordDefinitionsSchema = z.array(WeaponKeywordDefinitionSchema);
export const WeaponTemplateDefinitionsSchema = z.array(WeaponTemplateDefinitionSchema);

export type WeaponAbility = z.infer<typeof WeaponAbilitySchema>;
export type WeaponAbilityDefinition = z.infer<typeof WeaponAbilityDefinitionSchema>;
export type WeaponKeywordDefinition = z.infer<typeof WeaponKeywordDefinitionSchema>;
export type WeaponTemplateDefinition = z.infer<typeof WeaponTemplateDefinitionSchema>;
