import { weaponKeywordsById } from '~/data';

export const keywordName = (kw: string): string =>
  weaponKeywordsById[kw]?.name ?? (kw.charAt(0).toUpperCase() + kw.slice(1));

export const areaLabel = (area: string): string =>
  area.charAt(0).toUpperCase() + area.slice(1);

export const SWAP_ATTR_LABELS: Record<string, string> = {
  might: 'Might', guard: 'Guard', systems: 'Systems', speed: 'Speed',
};

export const TERRAIN_LABELS: Record<string, string> = {
  water: 'Water', space: 'Space', land: 'Land',
};
