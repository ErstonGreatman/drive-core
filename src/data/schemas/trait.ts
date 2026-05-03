import { z } from 'zod';
import { PilotAttributeKeySchema } from './common';

export const TraitCategorySchema = z.enum([
  'general',
  'equipment',
  'deathblow',
  'anomaly',
]);

export const TraitDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  traitCategory: TraitCategorySchema,
  cpCost: z.union([z.literal(0), z.literal(5), z.literal(10)]),
  // Mechanical effect text (the "Effect:" section from the rulebook)
  effect: z.string(),
  // Flavor description text
  description: z.string(),
  // Specialist traits may be purchased multiple times, each with a unique specialty
  isSpecialist: z.boolean(),
  specializations: z.array(z.string()).optional(),
  // True for Anomaly-category traits that grant free Miracle Skills and can be bought off
  isAlienAnomaly: z.boolean(),
  // Alien Anomaly only: the player picks one of these two Miracle Skill IDs to gain for free
  grantedMiracleSkillIds: z.array(z.string()).min(2).max(2).optional(),
  // Alien Anomaly only: the Attribute that suffers Disadvantages (1 as Specialist, 2 as Generalist)
  anomalyPenaltyAttribute: PilotAttributeKeySchema.optional(),
  // Any conditional restrictions on when the trait applies
  conditions: z.string().optional(),
  sourcePageRef: z.string(),
});

export const TraitDefinitionsSchema = z.array(TraitDefinitionSchema);

export type TraitCategory = z.infer<typeof TraitCategorySchema>;
export type TraitDefinition = z.infer<typeof TraitDefinitionSchema>;
