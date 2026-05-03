import { z } from 'zod';

export const PowerCategorySchema = z.enum([
  'default',
  'alternative',
  'champion',
  'trickster',
  'tactician',
  'miscellaneous',
  'rush',
  'restoration',
  'boost',
  'limit',
]);

// Reaction Powers respond to events; Setup Powers are activated proactively
export const PowerTypeSchema = z.enum(['reaction', 'setup']);

export const GenrePowerDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  powerType: PowerTypeSchema,
  powerCategory: PowerCategorySchema,
  // Flavor text (character vignettes from the rulebook)
  description: z.string(),
  // Mechanical effect text (the "Effect:" section from the rulebook)
  effect: z.string(),
  // True only for the 6 Default Powers every pilot starts with at no CP cost
  isDefault: z.boolean(),
  // Specialist powers may be taken multiple times for different weapons/configurations
  isSpecialist: z.boolean(),
  // Alternative Powers only: the ID of the Default Power this replaces
  alternativeFor: z.string().optional(),
  sourcePageRef: z.string(),
});

export const GenrePowerDefinitionsSchema = z.array(GenrePowerDefinitionSchema);

export type PowerCategory = z.infer<typeof PowerCategorySchema>;
export type PowerType = z.infer<typeof PowerTypeSchema>;
export type GenrePowerDefinition = z.infer<typeof GenrePowerDefinitionSchema>;
