import { z } from 'zod';
import { UpgradeTypeSchema } from './common';

export const UpgradeSubcategorySchema = z.enum([
  'general',
  'active-defense',
  'restoration',
  'mobility',
  'support',
  'extra-area',
  'alternate-form',
  'combination',
  'feature',
]);

export const UpgradeTemplateDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  upgradeType: UpgradeTypeSchema,
  upgradeSubcategory: UpgradeSubcategorySchema,
  effect: z.string(),
  // undefined = special/variable cost (see conditions)
  mpCost: z.number().int().nonnegative().optional(),
  isSpecialist: z.boolean(),
  // Additional mechanical restrictions or special rules not captured by effect text
  conditions: z.string().optional(),
  sourcePageRef: z.string(),
});

export const UpgradeTemplateDefinitionsSchema = z.array(UpgradeTemplateDefinitionSchema);

export type UpgradeSubcategory = z.infer<typeof UpgradeSubcategorySchema>;
export type UpgradeTemplateDefinition = z.infer<typeof UpgradeTemplateDefinitionSchema>;
