import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Bot, Clipboard, Eye, Pencil, Plus, Trash2, Upload, User } from 'lucide-solid';
import * as DropdownMenu from '@kobalte/core/dropdown-menu';
import type { Pilot, Mecha } from '~/types';
import { pilotState, createDefaultPilot, addPilot, removePilot } from '../stores/pilots';
import { mechaState, createDefaultMecha, addMecha, removeMecha } from '../stores/mecha';
import { parsePilotJSON, parseMechaJSON, slugify } from '../lib/share';
import { ExportMenu } from '../components/ExportMenu';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

// ── Delete target state ───────────────────────────────────────────────────────

type DeleteTarget = { type: 'pilot' | 'mecha'; id: string; name: string };

// ── Pilot card ────────────────────────────────────────────────────────────────

interface PilotCardProps {
  pilot: Pilot;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PilotCard(props: PilotCardProps): JSX.Element {
  const powerLevel = () => Math.floor(props.pilot.experience / 30);

  return (
    <Card>
      <CardHeader>
        <div class="flex items-start justify-between gap-2">
          <CardTitle class="truncate">{props.pilot.name}</CardTitle>
          <Badge variant="muted" class="shrink-0 font-mono">PL {powerLevel()}</Badge>
        </div>
        <Show when={props.pilot.campaignTag}>
          <CardDescription>{props.pilot.campaignTag}</CardDescription>
        </Show>
      </CardHeader>
      <CardFooter class="gap-2">
        <Button class="flex-1" size="sm" variant="secondary" onClick={props.onView}>
          <Eye /> Sheet
        </Button>
        <ExportMenu data={props.pilot} filename={`${slugify(props.pilot.name)}-pilot`} compact />
        <Button size="sm" variant="ghost" onClick={props.onEdit} title="Edit">
          <Pencil />
        </Button>
        <Button size="sm" variant="ghost" class="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={props.onDelete} title="Delete">
          <Trash2 />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Mecha card ────────────────────────────────────────────────────────────────

interface MechaCardProps {
  mecha: Mecha;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MechaCard(props: MechaCardProps): JSX.Element {
  const totalMP = () => 100 + props.mecha.bonusMP;
  const availableMP = () => totalMP() - props.mecha.spentMP;

  return (
    <Card>
      <CardHeader>
        <div class="flex items-start justify-between gap-2">
          <CardTitle class="truncate">{props.mecha.name}</CardTitle>
          <Badge variant="muted" class="shrink-0 font-mono">
            {availableMP()} / {totalMP()} MP
          </Badge>
        </div>
        <Show when={props.mecha.campaignTag}>
          <CardDescription>{props.mecha.campaignTag}</CardDescription>
        </Show>
      </CardHeader>
      <CardFooter class="gap-2">
        <Button class="flex-1" size="sm" variant="secondary" onClick={props.onView}>
          <Eye /> Sheet
        </Button>
        <ExportMenu data={props.mecha} filename={`${slugify(props.mecha.name)}-mecha`} compact />
        <Button size="sm" variant="ghost" onClick={props.onEdit} title="Edit">
          <Pencil />
        </Button>
        <Button size="sm" variant="ghost" class="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={props.onDelete} title="Delete">
          <Trash2 />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────

// ── Import dropdown ───────────────────────────────────────────────────────────

const ITEM_CLASS = 'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';

interface ImportMenuProps {
  onFromFile: () => void;
  onFromClipboard: () => void;
}

function ImportMenu(props: ImportMenuProps): JSX.Element {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-transparent text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Upload class="size-3.5 shrink-0" />
        Import
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="z-50 min-w-44 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1 animate-in fade-in-0 zoom-in-95">
          <DropdownMenu.Item onSelect={props.onFromFile} class={ITEM_CLASS}>
            <Upload class="size-4 shrink-0" /> From File
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={props.onFromClipboard} class={ITEM_CLASS}>
            <Clipboard class="size-4 shrink-0" /> Paste from Clipboard
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────

export default function Home(): JSX.Element {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = createSignal<DeleteTarget | null>(null);
  const [pilotImportError, setPilotImportError] = createSignal<string | null>(null);
  const [mechaImportError, setMechaImportError] = createSignal<string | null>(null);

  let pilotFileRef!: HTMLInputElement;
  let mechaFileRef!: HTMLInputElement;

  function showPilotError(msg: string): void {
    setPilotImportError(msg);
    setTimeout(() => setPilotImportError(null), 6000);
  }

  function showMechaError(msg: string): void {
    setMechaImportError(msg);
    setTimeout(() => setMechaImportError(null), 6000);
  }

  function importPilot(text: string): void {
    const result = parsePilotJSON(text);
    if (!result.ok) { showPilotError(result.error); return; }
    const pilot: Pilot = { ...result.data, id: crypto.randomUUID(), assignedMechaIds: [] };
    addPilot(pilot);
    navigate(`/pilots/${pilot.id}`);
  }

  function importMecha(text: string): void {
    const result = parseMechaJSON(text);
    if (!result.ok) { showMechaError(result.error); return; }
    const mecha: Mecha = { ...result.data, id: crypto.randomUUID(), assignedPilotIds: [] };
    addMecha(mecha);
    navigate(`/mecha/${mecha.id}`);
  }

  function handlePilotFileChange(e: Event & { currentTarget: HTMLInputElement }): void {
    const file = e.currentTarget.files?.[0];
    if (!file) { return; }
    file.text().then((text) => {
      importPilot(text);
    }).catch(() => showPilotError('Could not read the file.'));
    e.currentTarget.value = '';
  }

  function handleMechaFileChange(e: Event & { currentTarget: HTMLInputElement }): void {
    const file = e.currentTarget.files?.[0];
    if (!file) { return; }
    file.text().then((text) => {
      importMecha(text);
    }).catch(() => showMechaError('Could not read the file.'));
    e.currentTarget.value = '';
  }

  function handlePilotClipboard(): void {
    navigator.clipboard.readText().then((text) => {
      importPilot(text);
    }).catch(() => showPilotError('Could not read clipboard. Try importing from a file instead.'));
  }

  function handleMechaClipboard(): void {
    navigator.clipboard.readText().then((text) => {
      importMecha(text);
    }).catch(() => showMechaError('Could not read clipboard. Try importing from a file instead.'));
  }

  function handleNewPilot(): void {
    const pilot = createDefaultPilot();
    addPilot(pilot);
    navigate(`/pilots/${pilot.id}`);
  }

  function handleNewMecha(): void {
    const mecha = createDefaultMecha();
    addMecha(mecha);
    navigate(`/mecha/${mecha.id}`);
  }

  function confirmDelete(): void {
    const target = deleteTarget();
    if (!target) { return; }
    if (target.type === 'pilot') { removePilot(target.id); }
    else { removeMecha(target.id); }
  }

  return (
    <div class="flex-1 overflow-y-auto py-8 min-h-0">
      {/* Hidden file inputs */}
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
              <ImportMenu
                onFromFile={() => pilotFileRef.click()}
                onFromClipboard={handlePilotClipboard}
              />
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
              <ImportMenu
                onFromFile={() => mechaFileRef.click()}
                onFromClipboard={handleMechaClipboard}
              />
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
}
