import { z } from 'zod';
import { MechaAreaKeySchema } from './common';

// Shared attribute object used by both mecha templates and user mecha builds
export const MechaAttributesSchema = z.object({
  might: z.number().int().min(0).max(10),
  energy: z.number().int().min(0).max(10),
  guard: z.number().int().min(0).max(10),
  systems: z.number().int().min(0).max(10),
  threshold: z.number().int().min(0).max(10),
  speed: z.number().int().min(0).max(10),
});

// A weapon slot in a mecha template: references a weapon template and assigns an area
const MechaTemplateWeaponRefSchema = z.object({
  templateId: z.string(),
  area: MechaAreaKeySchema.exclude(['core']), // weapons cannot go in Core
});

// An upgrade slot in a mecha template: references an upgrade template and assigns an area
const MechaTemplateUpgradeRefSchema = z.object({
  templateId: z.string(),
  // For specialist upgrades, the specialty this slot represents
  specialistLabel: z.string().optional(),
  // internal → Core (auto); separate → Separate (auto); external → as specified
  area: MechaAreaKeySchema,
});

export const MechaTemplateDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  attributes: MechaAttributesSchema,
  // First two entries are treated as the free default weapons when cloned
  weapons: z.array(MechaTemplateWeaponRefSchema),
  upgrades: z.array(MechaTemplateUpgradeRefSchema),
  sourcePageRef: z.string(),
});

export const MechaTemplateDefinitionsSchema = z.array(MechaTemplateDefinitionSchema);

export type MechaAttributes = z.infer<typeof MechaAttributesSchema>;
export type MechaTemplateDefinition = z.infer<typeof MechaTemplateDefinitionSchema>;
