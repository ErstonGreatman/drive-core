import { z } from 'zod';

export const PilotAttributeKeySchema = z.enum([
  'fitness',
  'awareness',
  'intellect',
  'willpower',
  'charm',
  'resources',
]);

export const MechaAttributeKeySchema = z.enum([
  'might',
  'energy',
  'guard',
  'systems',
  'threshold',
  'speed',
]);

export const MechaAreaKeySchema = z.enum([
  'core',
  'head',
  'torso',
  'arms',
  'legs',
  'separate',
]);

export const UpgradeTypeSchema = z.enum(['internal', 'external', 'separate']);

export type PilotAttributeKey = z.infer<typeof PilotAttributeKeySchema>;
export type MechaAttributeKey = z.infer<typeof MechaAttributeKeySchema>;
export type MechaAreaKey = z.infer<typeof MechaAreaKeySchema>;
export type UpgradeType = z.infer<typeof UpgradeTypeSchema>;
