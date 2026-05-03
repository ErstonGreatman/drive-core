import { z } from 'zod';

export const DesignFlawDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  effect: z.string(),
  // MP added to the initial Mecha Points pool (always positive)
  mpBonus: z.number().int().positive(),
  sourcePageRef: z.string(),
});

export const DesignFlawDefinitionsSchema = z.array(DesignFlawDefinitionSchema);

export type DesignFlawDefinition = z.infer<typeof DesignFlawDefinitionSchema>;
