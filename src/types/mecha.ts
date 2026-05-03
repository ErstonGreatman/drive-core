import { z } from 'zod';
import { MechaAreaKeySchema, MechaAttributeKeySchema, UpgradeTypeSchema } from '~/data/schemas/common';
import { MechaAttributesSchema } from '~/data/schemas/mecha-template';
import { WeaponAbilitySchema } from '~/data/schemas';

// ── Weapons ───────────────────────────────────────────────────────────────────

export const MechaWeaponSchema = z.object({
  id: z.string(),
  // Set when cloned from weapon-templates.json; absent for fully custom weapons
  templateId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  // Weapons cannot be placed in Core
  area: MechaAreaKeySchema.exclude(['core']),
  // Must include 'melee' or 'ranged' (not both)
  keywords: z.array(z.string()).min(1),
  // Energy drained from the mecha's pool when used, if applicable
  energyCost: z.number().int().nonnegative().optional(),
  abilities: z.array(WeaponAbilitySchema),
  // True when built via the custom weapon builder (no templateId constraint)
  isCustom: z.boolean(),
  // sum(abilities[].wpCost) >= 0 enforced in UI; schema records but does not re-validate
});

// ── Upgrades ──────────────────────────────────────────────────────────────────

// Flat upgrade shape used inside Expansion Pack / Secret Equipment sub-pools.
// Intentionally omits nested sub-items to avoid circular schema references.
export const MechaSubUpgradeSchema = z.object({
  id: z.string(),
  templateId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  upgradeType: UpgradeTypeSchema,
  area: MechaAreaKeySchema,
  effect: z.string(),
  mpCost: z.number().int().nonnegative(),
  specialistLabel: z.string().optional(),
});

export const MechaUpgradeSchema = z.object({
  id: z.string(),
  templateId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  upgradeType: UpgradeTypeSchema,
  // internal → 'core' (auto); separate → 'separate' (auto); external → user-chosen
  area: MechaAreaKeySchema,
  effect: z.string(),
  mpCost: z.number().int().nonnegative(),
  // For specialist upgrades: the specialty this particular purchase covers
  specialistLabel: z.string().optional(),
  // Frame / Transformation: which two attributes (from might/guard/systems/speed) swap values
  swapAttributes: z.tuple([MechaAttributeKeySchema, MechaAttributeKeySchema]).optional(),
  // Terrain Specialist: the chosen environment
  terrainType: z.enum(['water', 'space', 'land']).optional(),
  // Invincible Super Combination: variable cost (scales with Power Level)
  customMpCost: z.number().int().nonnegative().optional(),
  // Expansion Pack / Secret Equipment: weapons and external upgrades in the sub-pool
  subItems: z.object({
    weapons: z.array(MechaWeaponSchema),
    upgrades: z.array(MechaSubUpgradeSchema),
  }).optional(),
});

// ── Threshold Layers ──────────────────────────────────────────────────────────

export const ThresholdLayerSchema = z.object({
  lost: z.boolean(),
  damageTaken: z.number().int().nonnegative(),
  // Resets to false at the start of each Operation; tracks Genre Point award eligibility
  // Only layers 1–3 award GP; the Core layer never does
  genrePointAwardedThisOperation: z.boolean(),
  // capacity = mecha.attributes.threshold — computed at read time, not stored
});

// ── Mecha ─────────────────────────────────────────────────────────────────────

export const MechaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  campaignTag: z.string().optional(),

  attributes: MechaAttributesSchema,

  // totalMP = 100 + bonusMP; availableMP = totalMP - spentMP
  // bonusMP is manually editable in Phase 1; in Phase 2 auto-suggested from pilot's Exp
  bonusMP: z.number().int().nonnegative(),
  spentMP: z.number().int().nonnegative(),

  // Purchased weapons only (5 MP each, allocated to External Areas).
  // Default Weapons (CQC and Vulcans) are implicit — always present, free, and Internal.
  weapons: z.array(MechaWeaponSchema),
  upgrades: z.array(MechaUpgradeSchema),

  // Live play state ────────────────────────────────────────────────────────────

  // Layers 1–4 (standard threshold layers); Core is a 5th separate layer
  thresholdLayers: z.tuple([
    ThresholdLayerSchema,
    ThresholdLayerSchema,
    ThresholdLayerSchema,
    ThresholdLayerSchema,
  ]),
  // 5th and final protection layer; same damage capacity as standard layers (= Threshold attr)
  // Has Guard and Systems stats; 0 in all others. Destroying it routes damage to the pilot.
  coreLayer: ThresholdLayerSchema,

  // Tracks which Areas are currently Maimed (all items in a Maimed area are disabled)
  maimedAreas: z.array(MechaAreaKeySchema),

  // Current Energy; max = attributes.energy; resets to max at start of each mecha turn
  currentEnergy: z.number().int().nonnegative(),

  // Many-to-many: a mecha may be assigned to multiple pilots (e.g. grunt mecha)
  assignedPilotIds: z.array(z.string()),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MechaWeapon = z.infer<typeof MechaWeaponSchema>;
export type MechaSubUpgrade = z.infer<typeof MechaSubUpgradeSchema>;
export type MechaUpgrade = z.infer<typeof MechaUpgradeSchema>;
export type ThresholdLayer = z.infer<typeof ThresholdLayerSchema>;
export type Mecha = z.infer<typeof MechaSchema>;
export type { MechaAttributes } from '../data/schemas/mecha-template';
export type { MechaAreaKey, MechaAttributeKey, UpgradeType } from '../data/schemas/common';
