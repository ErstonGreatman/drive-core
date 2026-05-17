import type { MechaAttributes } from '~/data/schemas/mecha-template';
import type { MechaWeapon, MechaUpgrade } from '~/types/mecha';

export function totalMP(bonusMP: number): number {
  return 100 + bonusMP;
}

export function attributeCostToRank(rank: number): number {
  return (rank * (rank + 1)) / 2;
}

export function attributeIncrementalCost(currentRank: number): number {
  return currentRank + 1;
}

export function computeSpentMP(
  attributes: MechaAttributes,
  weapons: MechaWeapon[],
  upgrades: MechaUpgrade[],
): number {
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
}
