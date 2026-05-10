import { createStore } from 'solid-js/store';
import { makePersisted } from '@solid-primitives/storage';
import type { Pilot, Mecha } from '~/types';

export const [viewerState, setViewerState] = makePersisted(
  createStore<{ pilots: Pilot[]; mecha: Mecha[] }>({ pilots: [], mecha: [] }),
  { name: 'drive-core:viewer' },
);

export function addViewerPilot(pilot: Pilot): void {
  setViewerState('pilots', (prev) => [...prev, pilot]);
}

export function removeViewerPilot(id: string): void {
  setViewerState('pilots', (prev) => prev.filter((p) => p.id !== id));
}

export function addViewerMecha(mecha: Mecha): void {
  setViewerState('mecha', (prev) => [...prev, mecha]);
}

export function removeViewerMecha(id: string): void {
  setViewerState('mecha', (prev) => prev.filter((m) => m.id !== id));
}
