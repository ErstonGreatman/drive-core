import { createStore } from 'solid-js/store';
import { makePersisted } from '@solid-primitives/storage';
import type { Pilot, Mecha } from '~/types';

export const [viewerState, setViewerState] = makePersisted(
  createStore<{ pilots: Pilot[]; mecha: Mecha[] }>({ pilots: [], mecha: [] }),
  { name: 'drive-core:viewer' },
);

export const addViewerPilot = (pilot: Pilot): void => {
  setViewerState('pilots', (prev) => [...prev, pilot]);
};

export const removeViewerPilot = (id: string): void => {
  setViewerState('pilots', (prev) => prev.filter((p) => p.id !== id));
};

export const addViewerMecha = (mecha: Mecha): void => {
  setViewerState('mecha', (prev) => [...prev, mecha]);
};

export const removeViewerMecha = (id: string): void => {
  setViewerState('mecha', (prev) => prev.filter((m) => m.id !== id));
};
