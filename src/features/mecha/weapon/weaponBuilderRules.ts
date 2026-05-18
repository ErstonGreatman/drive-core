import { weaponAbilitiesById } from '~/data';

export const BASE_WP = { melee: 2, shooting: 1 } as const;
export type BaseType = keyof typeof BASE_WP;

export const ABILITY_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'Advantages', ids: ['conditional-advantage', 'innate-advantage', 'additional-disadvantage-when-suppressing'] },
  { label: 'Range & Area', ids: ['long-range', 'blast-1', 'blast-2', 'blast-3', 'line'] },
  { label: 'Special', ids: ['crippling', 'beam', 'remote'] },
  { label: 'Drawbacks', ids: ['slow', 'one-shot', 'unreliable', 'overheating'] },
];

export const AREA_EXCLUSIVE_IDS = new Set(['blast-1', 'blast-2', 'blast-3', 'line']);
export const DRAWBACK_IDS = ['slow', 'one-shot', 'unreliable', 'overheating'];

export const ABILITY_KEYWORD: Record<string, string> = {
  'beam': 'beam', 'long-range': 'long-range',
  'blast-1': 'blast', 'blast-2': 'blast', 'blast-3': 'blast',
  'line': 'line', 'crippling': 'crippling', 'slow': 'slow',
  'one-shot': 'one-shot', 'unreliable': 'unreliable',
  'overheating': 'overheating', 'remote': 'remote',
};

export const remainingWP = (selected: Set<string>, baseType: BaseType): number => {
  const spent = [...selected].reduce((sum, id) => sum + (weaponAbilitiesById[id]?.wpCost ?? 0), 0);
  return BASE_WP[baseType] - spent;
};

export const isBeam = (selected: Set<string>): boolean => selected.has('beam');

export const beamBoostCost = (selected: Set<string>): number =>
  1 + [...selected].filter((id) => id !== 'beam' && (weaponAbilitiesById[id]?.wpCost ?? 0) >= 0).length;

export const hasInnateWithoutDrawback = (selected: Set<string>): boolean =>
  selected.has('innate-advantage') && !DRAWBACK_IDS.some((id) => selected.has(id));

export const canSelectAbility = (id: string, selected: Set<string>, baseType: BaseType): boolean => {
  const def = weaponAbilitiesById[id];
  if (!def) { return false; }
  if (remainingWP(selected, baseType) - def.wpCost < 0) { return false; }
  if (AREA_EXCLUSIVE_IDS.has(id) && [...selected].some((s) => AREA_EXCLUSIVE_IDS.has(s))) { return false; }
  if (id === 'slow' && selected.has('one-shot')) { return false; }
  return !(id === 'one-shot' && selected.has('slow'));
};

export const canDeselectAbility = (id: string, selected: Set<string>, baseType: BaseType): boolean => {
  const def = weaponAbilitiesById[id];
  if (!def) { return true; }
  return remainingWP(selected, baseType) + def.wpCost >= 0;
};

export const buildKeywords = (baseType: BaseType, selected: Set<string>): string[] => {
  const keywords: string[] = [baseType];
  for (const id of selected) {
    const kw = ABILITY_KEYWORD[id];
    if (kw && !keywords.includes(kw)) { keywords.push(kw); }
  }
  return keywords;
};
