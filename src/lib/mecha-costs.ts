import type { MechaAttributes } from '~/data/schemas/mecha-template';
import type { MechaWeapon, MechaUpgrade } from '~/types/mecha';

export const upgradeCostDisplay = (upgrade: MechaUpgrade): string => {
  if (upgrade.templateId === 'invincible-super-combination') {
    return `${upgrade.customMpCost ?? 0} MP`;
  }
  if (upgrade.templateId === 'superior-morphing') {
    return `${20 + Math.max(0, (upgrade.formPools?.length ?? 2) - 2) * 10} MP`;
  }
  return upgrade.mpCost > 0 ? `${upgrade.mpCost} MP` : 'Free';
};

export const totalMP = (bonusMP: number): number => 100 + bonusMP;

export const attributeCostToRank = (rank: number): number => (rank * (rank + 1)) / 2;

export const attributeIncrementalCost = (currentRank: number): number => currentRank + 1;

export const computeSpentMP = (
  attributes: MechaAttributes,
  weapons: MechaWeapon[],
  upgrades: MechaUpgrade[],
): number => {
  const attrCost = (Object.values(attributes) as number[]).reduce(
    (sum, rank) => sum + attributeCostToRank(rank),
    0,
  );
  // All weapons in weapons[] are purchased (5 MP each); default weapons (CQC/Vulcans) are implicit
  const weaponCost = weapons.length * 5;
  const upgradeCost = upgrades.reduce((sum, u) => {
    let baseCost: number;
    if (u.templateId === 'invincible-super-combination') {
      baseCost = u.customMpCost ?? 0;
    } else if (u.templateId === 'superior-morphing') {
      // Base 20 MP includes 2 forms; each additional form costs 10 MP
      baseCost = 20 + Math.max(0, (u.formPools?.length ?? 2) - 2) * 10;
    } else {
      baseCost = u.mpCost;
    }
    return sum + baseCost;
  }, 0);
  return attrCost + weaponCost + upgradeCost;
};
