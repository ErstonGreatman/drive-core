import { createStore, reconcile } from 'solid-js/store';
import { makePersisted } from '@solid-primitives/storage';
import type { Mecha } from '~/types';

export const [mechaState, setMechaState] = makePersisted(
  createStore<{ mecha: Mecha[] }>({ mecha: [] }),
  { name: 'drive-core:mecha' },
);

export const createDefaultMecha = (): Mecha => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'New Mecha',
    attributes: {
      might: 0,
      energy: 0,
      guard: 0,
      systems: 0,
      threshold: 0,
      speed: 0,
    },
    bonusMP: 0,
    spentMP: 0,
    weapons: [],
    upgrades: [],
    thresholdLayers: [
      { lost: false, damageTaken: 0, genrePointAwardedThisOperation: false },
      { lost: false, damageTaken: 0, genrePointAwardedThisOperation: false },
      { lost: false, damageTaken: 0, genrePointAwardedThisOperation: false },
      { lost: false, damageTaken: 0, genrePointAwardedThisOperation: false },
    ] as Mecha['thresholdLayers'],
    coreLayer: { lost: false, damageTaken: 0, genrePointAwardedThisOperation: false },
    maimedAreas: [],
    currentEnergy: 0,
    assignedPilotIds: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const addMecha = (mecha: Mecha): void => {
  setMechaState('mecha', (prev) => [...prev, mecha]);
};

export const updateMecha = (id: string, updates: Partial<Mecha>): void => {
  const idx = mechaState.mecha.findIndex((m) => m.id === id);
  if (idx < 0) { return; }
  setMechaState(
    'mecha',
    idx,
    reconcile({ ...mechaState.mecha[idx], ...updates, updatedAt: new Date().toISOString() }),
  );
};

export const removeMecha = (id: string): void => {
  setMechaState('mecha', (prev) => prev.filter((m) => m.id !== id));
};
