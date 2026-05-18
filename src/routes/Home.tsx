import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Bot, Plus, User } from 'lucide-solid';
import type { Pilot, Mecha } from '~/types';
import { pilotState, createDefaultPilot, addPilot, removePilot } from '~/stores/pilots';
import { mechaState, createDefaultMecha, addMecha, removeMecha } from '~/stores/mecha';
import { parsePilotJSON, parseMechaJSON } from '~/lib/share';
import { PilotCard } from './home/PilotCard';
import { MechaCard } from './home/MechaCard';
import { ImportMenu } from './home/ImportMenu';
import { Button } from '~/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';

type DeleteTarget = { type: 'pilot' | 'mecha'; id: string; name: string };

const Home = (): JSX.Element => {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = createSignal<DeleteTarget | null>(null);
  const [pilotImportError, setPilotImportError] = createSignal<string | null>(null);
  const [mechaImportError, setMechaImportError] = createSignal<string | null>(null);

  let pilotFileRef!: HTMLInputElement;
  let mechaFileRef!: HTMLInputElement;

  const showPilotError = (msg: string): void => {
    setPilotImportError(msg);
    setTimeout(() => setPilotImportError(null), 6000);
  };

  const showMechaError = (msg: string): void => {
    setMechaImportError(msg);
    setTimeout(() => setMechaImportError(null), 6000);
  };

  const importPilot = (text: string): void => {
    const result = parsePilotJSON(text);
    if (!result.ok) { showPilotError(result.error); return; }
    const pilot: Pilot = { ...result.data, id: crypto.randomUUID(), assignedMechaIds: [] };
    addPilot(pilot);
    navigate(`/pilots/${pilot.id}`);
  };

  const importMecha = (text: string): void => {
    const result = parseMechaJSON(text);
    if (!result.ok) { showMechaError(result.error); return; }
    const mecha: Mecha = { ...result.data, id: crypto.randomUUID(), assignedPilotIds: [] };
    addMecha(mecha);
    navigate(`/mecha/${mecha.id}`);
  };

  const handlePilotFileChange = (e: Event & { currentTarget: HTMLInputElement }): void => {
    const file = e.currentTarget.files?.[0];
    if (!file) { return; }
    file.text().then((text) => { importPilot(text); }).catch(() => showPilotError('Could not read the file.'));
    e.currentTarget.value = '';
  };

  const handleMechaFileChange = (e: Event & { currentTarget: HTMLInputElement }): void => {
    const file = e.currentTarget.files?.[0];
    if (!file) { return; }
    file.text().then((text) => { importMecha(text); }).catch(() => showMechaError('Could not read the file.'));
    e.currentTarget.value = '';
  };

  const handlePilotClipboard = (): void => {
    navigator.clipboard.readText().then((text) => { importPilot(text); })
      .catch(() => showPilotError('Could not read clipboard. Try importing from a file instead.'));
  };

  const handleMechaClipboard = (): void => {
    navigator.clipboard.readText().then((text) => { importMecha(text); })
      .catch(() => showMechaError('Could not read clipboard. Try importing from a file instead.'));
  };

  const handleNewPilot = (): void => {
    const pilot = createDefaultPilot();
    addPilot(pilot);
    navigate(`/pilots/${pilot.id}`);
  };

  const handleNewMecha = (): void => {
    const mecha = createDefaultMecha();
    addMecha(mecha);
    navigate(`/mecha/${mecha.id}`);
  };

  const confirmDelete = (): void => {
    const target = deleteTarget();
    if (!target) { return; }
    if (target.type === 'pilot') { removePilot(target.id); }
    else { removeMecha(target.id); }
  };

  return (
    <div class="flex-1 overflow-y-auto py-8 min-h-0">
      <input ref={pilotFileRef} type="file" accept=".json" class="sr-only" onChange={handlePilotFileChange} />
      <input ref={mechaFileRef} type="file" accept=".json" class="sr-only" onChange={handleMechaFileChange} />

      <div class="space-y-10">
        {/* Pilots ─────────────────────────────────────────── */}
        <section>
          <div class="flex items-center justify-between mb-1">
            <h2 class="flex items-center gap-2 text-base font-semibold">
              <User class="size-4 text-muted-foreground" /> Pilots
            </h2>
            <div class="flex items-center gap-2">
              <ImportMenu onFromFile={() => pilotFileRef.click()} onFromClipboard={handlePilotClipboard} />
              <Button size="sm" onClick={handleNewPilot}>
                <Plus /> New Pilot
              </Button>
            </div>
          </div>
          <Show when={pilotImportError()}>
            <p class="text-xs text-destructive mb-3">{pilotImportError()}</p>
          </Show>
          <Show
            when={pilotState.pilots.length > 0}
            fallback={
              <div class="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p class="text-sm text-muted-foreground">No pilots yet.</p>
                <Button variant="link" size="sm" class="mt-1" onClick={handleNewPilot}>
                  Create your first pilot →
                </Button>
              </div>
            }
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <For each={pilotState.pilots}>
                {(pilot) => (
                  <PilotCard
                    pilot={pilot}
                    onView={() => navigate(`/pilots/${pilot.id}/sheet`)}
                    onEdit={() => navigate(`/pilots/${pilot.id}`)}
                    onDelete={() => setDeleteTarget({ type: 'pilot', id: pilot.id, name: pilot.name })}
                  />
                )}
              </For>
            </div>
          </Show>
        </section>

        {/* Mecha ──────────────────────────────────────────── */}
        <section>
          <div class="flex items-center justify-between mb-1">
            <h2 class="flex items-center gap-2 text-base font-semibold">
              <Bot class="size-4 text-muted-foreground" /> Mecha
            </h2>
            <div class="flex items-center gap-2">
              <ImportMenu onFromFile={() => mechaFileRef.click()} onFromClipboard={handleMechaClipboard} />
              <Button size="sm" onClick={handleNewMecha}>
                <Plus /> New Mecha
              </Button>
            </div>
          </div>
          <Show when={mechaImportError()}>
            <p class="text-xs text-destructive mb-3">{mechaImportError()}</p>
          </Show>
          <Show
            when={mechaState.mecha.length > 0}
            fallback={
              <div class="rounded-lg border border-dashed border-border px-6 py-10 text-center">
                <p class="text-sm text-muted-foreground">No mecha yet.</p>
                <Button variant="link" size="sm" class="mt-1" onClick={handleNewMecha}>
                  Build your first mecha →
                </Button>
              </div>
            }
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <For each={mechaState.mecha}>
                {(mecha) => (
                  <MechaCard
                    mecha={mecha}
                    onView={() => navigate(`/mecha/${mecha.id}/sheet`)}
                    onEdit={() => navigate(`/mecha/${mecha.id}`)}
                    onDelete={() => setDeleteTarget({ type: 'mecha', id: mecha.id, name: mecha.name })}
                  />
                )}
              </For>
            </div>
          </Show>
        </section>
      </div>

      {/* Delete confirmation dialog ──────────────────────── */}
      <AlertDialog
        open={deleteTarget() !== null}
        onOpenChange={(open) => { if (!open) { setDeleteTarget(null); } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget()?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This {deleteTarget()?.type} will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Home;
