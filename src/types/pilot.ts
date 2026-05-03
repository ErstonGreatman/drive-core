import { z } from 'zod';
import { PilotAttributeKeySchema } from '~/data/schemas/common';

// ── Attributes ────────────────────────────────────────────────────────────────

export const PilotAttributesSchema = z.object({
  fitness: z.number().int().min(0).max(10),
  awareness: z.number().int().min(0).max(10),
  intellect: z.number().int().min(0).max(10),
  willpower: z.number().int().min(0).max(10),
  charm: z.number().int().min(0).max(10),
  resources: z.number().int().min(0).max(10),
});

// ── Skills ────────────────────────────────────────────────────────────────────

export const PilotSkillEntrySchema = z.object({
  skillId: z.string(),
  type: z.enum(['specialist', 'generalist']),
  // For specialist entries, the specific specialty this purchase covers
  specialistLabel: z.string().optional(),
  // Offensive Miracle only: IDs of Deathblow Traits gained for free from this skill
  freeDeathblowTraitIds: z.array(z.string()).optional(),
});

// ── Traits ────────────────────────────────────────────────────────────────────

export const PilotTraitEntrySchema = z.object({
  traitId: z.string(),
  // Specialist traits only: the chosen specialization for this purchase
  specialistLabel: z.string().optional(),
  // Alien Anomaly only: which of the two offered Miracle Skill IDs the player chose
  chosenMiracleSkillId: z.string().optional(),
  // Alien Anomaly only: whether the player took the miracle as Specialist or Generalist
  // (determines Disadvantage severity: 1 for specialist, 2 for generalist)
  miracleTier: z.enum(['specialist', 'generalist']).optional(),
});

// ── Genre Themes ──────────────────────────────────────────────────────────────

export const GenreThemesSchema = z.object({
  reason: z.string(),
  typecast: z.string(),
  bane: z.string(),
});

// ── Plot Armor ────────────────────────────────────────────────────────────────

export const PlotArmorLayerSchema = z.object({
  intact: z.boolean(),
  damageTaken: z.number().int().nonnegative(),
  // capacity = pilot.attributes.willpower — computed at read time, not stored
});

export const PlotArmorStateSchema = z.object({
  layers: z.tuple([PlotArmorLayerSchema, PlotArmorLayerSchema, PlotArmorLayerSchema]),
});

// ── Pilot ─────────────────────────────────────────────────────────────────────

export const PilotSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  campaignTag: z.string().optional(),

  attributes: PilotAttributesSchema,

  // totalCP = 100 + PL × 30 where PL = floor(experience / 30); availableCP = totalCP - spentCP
  experience: z.number().int().nonnegative(),
  spentCP: z.number().int().nonnegative(),

  skills: z.array(PilotSkillEntrySchema),
  traits: z.array(PilotTraitEntrySchema),
  genreThemes: GenreThemesSchema,

  // IDs of selected genre powers. The 6 default power IDs are always present.
  // Additional selections: one per Power Level (floor(experience / 30)).
  genrePowerIds: z.array(z.string()),

  // Live play state ────────────────────────────────────────────────────────────

  // Default = powerLevel at episode start; no maximum cap during play
  currentGenrePoints: z.number().int(),
  plotArmor: PlotArmorStateSchema,

  // Many-to-many: a pilot may be assigned to multiple mecha
  assignedMechaIds: z.array(z.string()),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PilotAttributes = z.infer<typeof PilotAttributesSchema>;
export type PilotAttributeKey = z.infer<typeof PilotAttributeKeySchema>;
export type PilotSkillEntry = z.infer<typeof PilotSkillEntrySchema>;
export type PilotTraitEntry = z.infer<typeof PilotTraitEntrySchema>;
export type GenreThemes = z.infer<typeof GenreThemesSchema>;
export type PlotArmorLayer = z.infer<typeof PlotArmorLayerSchema>;
export type PlotArmorState = z.infer<typeof PlotArmorStateSchema>;
export type Pilot = z.infer<typeof PilotSchema>;
