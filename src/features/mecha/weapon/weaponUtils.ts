import type { MechaWeapon } from '~/types/mecha';

export const WEAPON_AREAS = ['head', 'torso', 'arms', 'legs'] as const;
export type WeaponArea = (typeof WEAPON_AREAS)[number];

export type WeaponFilter = 'all' | 'melee' | 'shooting' | 'beam';

export const FILTER_TABS: { key: WeaponFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'melee', label: 'Melee' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'beam', label: 'Beam' },
];

export const matchesFilter = (keywords: string[], filter: WeaponFilter): boolean => {
  if (filter === 'all') { return true; }
  if (filter === 'beam') { return keywords.includes('beam'); }
  return keywords.includes(filter) && !keywords.includes('beam');
};

export const primaryKeyword = (keywords: string[]): string => {
  if (keywords.includes('beam')) { return 'beam'; }
  if (keywords.includes('melee')) { return 'melee'; }
  return 'shooting';
};

export const customBoostCost = (abilities: MechaWeapon['abilities']): number =>
  1 + abilities.filter((a) => a.wpCost >= 0 && a.abilityTemplateId !== 'beam').length;

export const cloneWeapon = (w: MechaWeapon): MechaWeapon => ({
  id: w.id,
  templateId: w.templateId,
  name: w.name,
  description: w.description,
  area: w.area,
  keywords: [...w.keywords],
  energyCost: w.energyCost,
  abilities: w.abilities.map((a) => ({
    abilityTemplateId: a.abilityTemplateId,
    name: a.name,
    description: a.description,
    wpCost: a.wpCost,
    label: a.label,
  })),
  isCustom: w.isCustom,
});
