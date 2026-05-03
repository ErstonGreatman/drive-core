import { z } from 'zod';
import { PilotAttributeKeySchema } from './common';

export const SkillDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultAttribute: PilotAttributeKeySchema,
  description: z.string(),
  // Example specializations from the rulebook — used for autocomplete in the builder
  specializations: z.array(z.string()).optional(),
  isMiracle: z.boolean(),
  // Miracle skills that support Offensive Tests grant free Deathblow Traits on purchase
  isOffensiveMiracle: z.boolean().optional(),
  sourcePageRef: z.string(),
});

export const SkillDefinitionsSchema = z.array(SkillDefinitionSchema);

export type SkillDefinition = z.infer<typeof SkillDefinitionSchema>;
