import type { JSX } from 'solid-js';
import { createSignal, createMemo, createEffect, onCleanup, For, Show } from 'solid-js';
import { Upload, Clipboard, X, ChevronLeft } from 'lucide-solid';
import { cn } from '~/lib/utils.ts';
import { viewerState, addViewerPilot, removeViewerPilot, addViewerMecha, removeViewerMecha } from '~/stores/viewer.ts';
import { PilotSchema } from '~/types/pilot';
import { MechaSchema } from '~/types/mecha';
import { PilotSheetView } from '../pilots/PilotSheet';
import { MechaSheetView } from '../mecha/MechaSheet';
import { Button } from '~/components/ui/button';

type Selection = { type: 'pilot'; id: string } | { type: 'mecha'; id: string } | null;

const ViewerHome = (): JSX.Element => {
  const [sidebarOpen, setSidebarOpen] = createSignal(true);
  const [selection, setSelection] = createSignal<Selection>(null);
  const [importError, setImportError] = createSignal('');
  const [importSuccess, setImportSuccess] = createSignal('');

  let successTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(successTimer));

  // Auto-select first available item when nothing is selected
  createEffect(() => {
    if (selection() !== null) { return; }
    if (viewerState.pilots.length > 0) {
      setSelection({ type: 'pilot', id: viewerState.pilots[0].id });
    } else if (viewerState.mecha.length > 0) {
      setSelection({ type: 'mecha', id: viewerState.mecha[0].id });
    }
  });

  // Clear selection when the selected item is removed
  createEffect(() => {
    const sel = selection();
    if (!sel) { return; }
    const exists = sel.type === 'pilot'
      ? viewerState.pilots.some((p) => p.id === sel.id)
      : viewerState.mecha.some((m) => m.id === sel.id);
    if (!exists) { setSelection(null); }
  });

  const selectedPilot = createMemo(() => {
    const sel = selection();
    if (sel?.type !== 'pilot') { return null; }
    return viewerState.pilots.find((p) => p.id === sel.id) ?? null;
  });

  const selectedMecha = createMemo(() => {
    const sel = selection();
    if (sel?.type !== 'mecha') { return null; }
    return viewerState.mecha.find((m) => m.id === sel.id) ?? null;
  });

  const flashSuccess = (msg: string): void => {
    clearTimeout(successTimer);
    setImportSuccess(msg);
    setImportError('');
    successTimer = setTimeout(() => setImportSuccess(''), 2000);
  };

  const tryImport = (raw: unknown): void => {
    const newId = crypto.randomUUID();

    const pilotResult = PilotSchema.safeParse(raw);
    if (pilotResult.success) {
      addViewerPilot({ ...pilotResult.data, id: newId });
      setSelection({ type: 'pilot', id: newId });
      flashSuccess('Pilot imported');
      return;
    }

    const mechaResult = MechaSchema.safeParse(raw);
    if (mechaResult.success) {
      addViewerMecha({ ...mechaResult.data, id: newId });
      setSelection({ type: 'mecha', id: newId });
      flashSuccess('Mecha imported');
      return;
    }

    setImportError('Not a valid pilot or mecha export.');
    setImportSuccess('');
  };

  const handleImportFile = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          tryImport(JSON.parse(e.target?.result as string));
        } catch {
          setImportError('Could not parse file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handlePasteImport = (): void => {
    setImportError('');
    navigator.clipboard.readText().then((text) => {
      try {
        tryImport(JSON.parse(text));
      } catch {
        setImportError('Clipboard is not valid JSON.');
      }
    }).catch(() => {
      setImportError('Cannot read clipboard. Try importing a file.');
    });
  };

  return (
    <div class="flex-1 min-h-0 flex flex-col overflow-hidden">

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div class="shrink-0 flex items-center gap-2 py-3 border-b border-border">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          class="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle list"
        >
          <ChevronLeft
            class={cn('size-4 transition-transform duration-300', !sidebarOpen() && 'rotate-180')}
          />
          List
        </button>
        <div class="ml-auto flex items-center gap-2">
          <Show when={importError()}>
            <p class="text-xs text-destructive">{importError()}</p>
          </Show>
          <Show when={importSuccess()}>
            <p class="text-xs text-green-600 dark:text-green-400">{importSuccess()}</p>
          </Show>
          <Button variant="outline" size="sm" onClick={handleImportFile}>
            <Upload class="size-3.5" /> Import file
          </Button>
          <Button variant="outline" size="sm" onClick={handlePasteImport}>
            <Clipboard class="size-3.5" /> Paste JSON
          </Button>
        </div>
      </div>

      {/* ── Split view ───────────────────────────────────────────────── */}
      <div class="flex-1 min-h-0 flex overflow-hidden -mx-6">

        {/* Sidebar */}
        <div
          class={cn(
            'shrink-0 border-r border-border flex flex-col overflow-hidden',
            'transition-all duration-300 ease-in-out',
            sidebarOpen() ? 'w-52' : 'w-0',
          )}
        >
          {/* min-w prevents content from squishing during animation */}
          <div class="flex-1 overflow-y-auto p-3 pl-6 space-y-5 min-w-52">

            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-2 mb-1.5">
                Pilots ({viewerState.pilots.length})
              </p>
              <Show
                when={viewerState.pilots.length > 0}
                fallback={<p class="text-xs text-muted-foreground px-2 italic">None imported.</p>}
              >
                <For each={viewerState.pilots}>
                  {(pilot) => {
                    const isSelected = () =>
                      selection()?.type === 'pilot' && selection()?.id === pilot.id;
                    return (
                      <div class="flex items-center gap-0.5 group">
                        <button
                          class={cn(
                            'flex-1 min-w-0 text-left text-xs rounded-md px-2 py-2 transition-colors truncate',
                            isSelected()
                              ? 'bg-accent text-accent-foreground font-medium'
                              : 'text-foreground hover:bg-accent/60',
                          )}
                          onClick={() => setSelection({ type: 'pilot', id: pilot.id })}
                        >
                          {pilot.name}
                        </button>
                        <button
                          class="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-colors"
                          aria-label={`Remove ${pilot.name}`}
                          onClick={() => removeViewerPilot(pilot.id)}
                        >
                          <X class="size-3" />
                        </button>
                      </div>
                    );
                  }}
                </For>
              </Show>
            </div>

            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-2 mb-1.5">
                Mecha ({viewerState.mecha.length})
              </p>
              <Show
                when={viewerState.mecha.length > 0}
                fallback={<p class="text-xs text-muted-foreground px-2 italic">None imported.</p>}
              >
                <For each={viewerState.mecha}>
                  {(mecha) => {
                    const isSelected = () =>
                      selection()?.type === 'mecha' && selection()?.id === mecha.id;
                    return (
                      <div class="flex items-center gap-0.5 group">
                        <button
                          class={cn(
                            'flex-1 min-w-0 text-left text-xs rounded-md px-2 py-2 transition-colors truncate',
                            isSelected()
                              ? 'bg-accent text-accent-foreground font-medium'
                              : 'text-foreground hover:bg-accent/60',
                          )}
                          onClick={() => setSelection({ type: 'mecha', id: mecha.id })}
                        >
                          {mecha.name}
                        </button>
                        <button
                          class="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-colors"
                          aria-label={`Remove ${mecha.name}`}
                          onClick={() => removeViewerMecha(mecha.id)}
                        >
                          <X class="size-3" />
                        </button>
                      </div>
                    );
                  }}
                </For>
              </Show>
            </div>

          </div>
        </div>

        {/* Main content */}
        <div class="flex-1 min-w-0 flex flex-col overflow-hidden px-6">
          <Show when={selectedPilot()}>
            {(pilot) => <PilotSheetView pilot={pilot()} />}
          </Show>
          <Show when={selectedMecha()}>
            {(mecha) => <MechaSheetView mecha={mecha()} />}
          </Show>
          <Show when={!selectedPilot() && !selectedMecha()}>
            <div class="flex-1 flex items-center justify-center text-center">
              <div class="space-y-1">
                <p class="text-sm font-medium">No builds imported yet</p>
                <p class="text-xs text-muted-foreground">
                  Import a file or paste exported JSON to view a sheet here.
                </p>
              </div>
            </div>
          </Show>
        </div>

      </div>
    </div>
  );
};

export default ViewerHome;
