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
    // Invincible Super Combination uses a variable PL-scaled cost instead of its stored mpCost
    const baseCost = u.templateId === 'invincible-super-combination'
      ? (u.customMpCost ?? 0)
      : u.mpCost;
    // Expansion Pack and Secret Equipment sub-items are self-contained within the upgrade cost
    return sum + baseCost;
  }, 0);
  return attrCost + weaponCost + upgradeCost;
}
