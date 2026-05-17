import type { MechaUpgrade, MechaSubUpgrade, MechaWeapon, FormPool, MechaAttributeKey } from '~/types/mecha';

export const EXTERNAL_AREAS = ['head', 'torso', 'arms', 'legs'] as const;
export type ExternalArea = (typeof EXTERNAL_AREAS)[number];

export const SWAP_ATTR_OPTIONS: MechaAttributeKey[] = ['might', 'guard', 'systems', 'speed'];

export const SUB_POOL_CAPACITY = 30;
export const REPEATABLE_IDS = new Set(['frame', 'transformation']);
export const FORM_POOL_CAPACITY = 10;

export type WeaponFilter = 'all' | 'melee' | 'shooting' | 'beam';
export const WEAPON_FILTER_TABS: { key: WeaponFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'melee', label: 'Melee' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'beam', label: 'Beam' },
];

export type PoolItemTab = 'weapons' | 'upgrades' | 'features';
export const POOL_ITEM_TABS: { key: PoolItemTab; label: string }[] = [
  { key: 'upgrades', label: 'Upgrades' },
  { key: 'features', label: 'Features' },
  { key: 'weapons', label: 'Weapons' },
];

export const matchesWeaponFilter = (keywords: string[], filter: WeaponFilter): boolean => {
  if (filter === 'all') { return true; }
  if (filter === 'beam') { return keywords.includes('beam'); }
  return keywords.includes(filter) && !keywords.includes('beam');
};

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export const cloneSubUpgrade = (u: MechaSubUpgrade): MechaSubUpgrade => ({
  id: u.id, templateId: u.templateId, name: u.name, description: u.description,
  upgradeType: u.upgradeType, area: u.area, effect: u.effect, mpCost: u.mpCost,
  specialistLabel: u.specialistLabel,
});

export const cloneSubWeapon = (w: MechaWeapon): MechaWeapon => ({
  id: w.id, templateId: w.templateId, name: w.name, description: w.description,
  area: w.area, keywords: [...w.keywords], energyCost: w.energyCost,
  abilities: w.abilities.map((a) => ({
    abilityTemplateId: a.abilityTemplateId, name: a.name,
    description: a.description, wpCost: a.wpCost, label: a.label,
  })),
  isCustom: w.isCustom,
});

export const cloneFormPool = (p: FormPool): FormPool => ({
  id: p.id, label: p.label,
  swapAttributes: p.swapAttributes ? [p.swapAttributes[0], p.swapAttributes[1]] : undefined,
  weapons: p.weapons.map(cloneSubWeapon),
  upgrades: p.upgrades.map(cloneSubUpgrade),
});

export const cloneUpgrade = (u: MechaUpgrade): MechaUpgrade => ({
  id: u.id, templateId: u.templateId, name: u.name, description: u.description,
  upgradeType: u.upgradeType, area: u.area, effect: u.effect, mpCost: u.mpCost,
  specialistLabel: u.specialistLabel,
  swapAttributes: u.swapAttributes ? [u.swapAttributes[0], u.swapAttributes[1]] : undefined,
  terrainType: u.terrainType, customMpCost: u.customMpCost,
  subItems: u.subItems
    ? { weapons: u.subItems.weapons.map(cloneSubWeapon), upgrades: u.subItems.upgrades.map(cloneSubUpgrade) }
    : undefined,
  formPools: u.formPools ? u.formPools.map(cloneFormPool) : undefined,
});

export const subItemsUsedMP = (u: MechaUpgrade): number => {
  if (!u.subItems) { return 0; }
  return u.subItems.weapons.length * 5 + u.subItems.upgrades.reduce((s, sub) => s + sub.mpCost, 0);
};
