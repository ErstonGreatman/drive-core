import { createStore, reconcile } from 'solid-js/store';
import { makePersisted } from '@solid-primitives/storage';
import type { Pilot } from '~/types';
import { defaultGenrePowers } from '~/data';

export const [pilotState, setPilotState] = makePersisted(
  createStore<{ pilots: Pilot[] }>({ pilots: [] }),
  { name: 'drive-core:pilots' },
);

export function createDefaultPilot(): Pilot {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'New Pilot',
    attributes: {
      fitness: 0,
      awareness: 0,
      intellect: 0,
      willpower: 0,
      charm: 0,
      resources: 0,
    },
    experience: 0,
    spentCP: 0,
    skills: [],
    traits: [],
    genreThemes: { reason: '', typecast: '', bane: '' },
    genrePowerIds: defaultGenrePowers.map((p) => p.id),
    currentGenrePoints: 0,
    plotArmor: {
      layers: [
        { intact: true, damageTaken: 0 },
        { intact: true, damageTaken: 0 },
        { intact: true, damageTaken: 0 },
      ] as Pilot['plotArmor']['layers'],
    },
    assignedMechaIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addPilot(pilot: Pilot): void {
  setPilotState('pilots', (prev) => [...prev, pilot]);
}

export function updatePilot(id: string, updates: Partial<Pilot>): void {
  const idx = pilotState.pilots.findIndex((p) => p.id === id);
  if (idx < 0) { return; }
  setPilotState(
    'pilots',
    idx,
    reconcile({ ...pilotState.pilots[idx], ...updates, updatedAt: new Date().toISOString() }),
  );
}

export function removePilot(id: string): void {
  setPilotState('pilots', (prev) => prev.filter((p) => p.id !== id));
}
