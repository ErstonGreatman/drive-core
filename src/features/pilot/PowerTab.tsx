import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { genrePowers, genrePowersById, defaultGenrePowers } from '~/data';
import type { GenrePowerDefinition } from '~/data';
import { powerLevel } from '~/lib/pilot-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

interface PowerTabProps {
  pilot: Pilot;
}

// Build the alternative→default lookup once at module level
const alternativesByDefaultId: Record<string, GenrePowerDefinition> = {};
const defaultAndAlternativeIds = new Set<string>();

for (const p of genrePowers) {
  if (p.isDefault) { defaultAndAlternativeIds.add(p.id); }
  if (p.alternativeFor) {
    alternativesByDefaultId[p.alternativeFor] = p;
    defaultAndAlternativeIds.add(p.id);
  }
}

// Non-default, non-alternative powers grouped by category
const additionalPowerPool = genrePowers.filter((p) => !defaultAndAlternativeIds.has(p.id));

const POWER_CATEGORIES: Record<string, string> = {
  champion: 'Champion',
  trickster: 'Trickster',
  tactician: 'Tactician',
  miscellaneous: 'Miscellaneous',
  rush: 'Rush',
  restoration: 'Restoration',
  boost: 'Boost',
  limit: 'Limit',
};

// ── Default Power Slot ────────────────────────────────────────────────────────

interface DefaultSlotProps {
  pilot: Pilot;
  defaultPower: GenrePowerDefinition;
}

function DefaultSlot(props: DefaultSlotProps): JSX.Element {
  const alternative = alternativesByDefaultId[props.defaultPower.id];
  const usingAlternative = () =>
    !!alternative && props.pilot.genrePowerIds.includes(alternative.id);
  const current = () => usingAlternative() ? alternative : props.defaultPower;

  function toggleAlternative(): void {
    if (!alternative) { return; }
    let newIds: string[];
    if (usingAlternative()) {
      newIds = props.pilot.genrePowerIds
        .filter((id) => id !== alternative.id)
        .concat(props.defaultPower.id);
    } else {
      newIds = props.pilot.genrePowerIds
        .filter((id) => id !== props.defaultPower.id)
        .concat(alternative.id);
    }
    updatePilot(props.pilot.id, { genrePowerIds: newIds });
  }

  return (
    <div class="p-3 rounded-lg border border-border bg-card space-y-1.5">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-medium">{current().name}</span>
            <Badge variant="muted" class="text-[10px] px-1.5 py-0 capitalize">{current().powerType}</Badge>
            <Show when={usingAlternative()}>
              <Badge variant="secondary" class="text-[10px] px-1.5 py-0">Alternative</Badge>
            </Show>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{current().effect}</p>
        </div>
        <Show when={!!alternative}>
          <Button
            size="sm"
            variant="ghost"
            class="shrink-0 h-7 px-2 text-xs text-muted-foreground"
            onClick={toggleAlternative}
            title={usingAlternative() ? `Switch back to ${props.defaultPower.name}` : `Swap for ${alternative.name}`}
          >
            {usingAlternative() ? '↩ Revert' : '⇄ Swap'}
          </Button>
        </Show>
      </div>
      <Show when={usingAlternative()}>
        <p class="text-xs text-muted-foreground/60 leading-snug">
          Replaces: {props.defaultPower.name}
        </p>
      </Show>
    </div>
  );
}

// ── Additional Power Slot ─────────────────────────────────────────────────────

interface AdditionalSlotProps {
  pilot: Pilot;
  slotIndex: number;
}

function AdditionalSlot(props: AdditionalSlotProps): JSX.Element {
  const [open, setOpen] = createSignal(false);

  // The IDs in genrePowerIds that are NOT defaults or alternatives are the additional powers
  const additionalIds = () =>
    props.pilot.genrePowerIds.filter((id) => !defaultAndAlternativeIds.has(id));

  const selectedId = () => additionalIds()[props.slotIndex];
  const selected = () => selectedId() ? genrePowersById[selectedId()] : undefined;

  function handleSelect(powerId: string): void {
    const current = additionalIds();
    const newAdditional = [...current];
    newAdditional[props.slotIndex] = powerId;
    const basePowerIds = props.pilot.genrePowerIds.filter((id) => defaultAndAlternativeIds.has(id));
    updatePilot(props.pilot.id, { genrePowerIds: [...basePowerIds, ...newAdditional] });
    setOpen(false);
  }

  function handleClear(): void {
    const current = additionalIds();
    const newAdditional = current.filter((_, i) => i !== props.slotIndex);
    const basePowerIds = props.pilot.genrePowerIds.filter((id) => defaultAndAlternativeIds.has(id));
    updatePilot(props.pilot.id, { genrePowerIds: [...basePowerIds, ...newAdditional] });
  }

  const pickedAdditionalIds = () => new Set(additionalIds());

  return (
    <div class="space-y-2">
      <Show
        when={selected()}
        fallback={
          <div class="p-3 rounded-lg border border-dashed border-border bg-card/50">
            <button
              onClick={() => setOpen((v) => !v)}
              class="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              + Choose a Genre Power for this slot
            </button>
          </div>
        }
      >
        {(power) => (
          <div class="p-3 rounded-lg border border-border bg-card space-y-1.5">
            <div class="flex items-start gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-sm font-medium">{power().name}</span>
                  <Badge variant="muted" class="text-[10px] px-1.5 py-0 capitalize">{power().powerType}</Badge>
                  <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize">{POWER_CATEGORIES[power().powerCategory] ?? power().powerCategory}</Badge>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{power().effect}</p>
              </div>
              <div class="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  class="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => setOpen((v) => !v)}
                >
                  ⇄
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  class="size-7 text-muted-foreground hover:text-destructive"
                  onClick={handleClear}
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}
      </Show>

      <Show when={open()}>
        <div class="rounded-lg border border-border bg-card p-3 space-y-3">
          <For each={Object.entries(POWER_CATEGORIES)}>
            {([catKey, catLabel]) => {
              const categoryPowers = additionalPowerPool.filter(
                (p) => p.powerCategory === catKey,
              );
              return (
                <Show when={categoryPowers.length > 0}>
                  <div class="space-y-1">
                    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{catLabel}</p>
                    <div class="space-y-0.5">
                      <For each={categoryPowers}>
                        {(p) => {
                          const isPicked = () =>
                            pickedAdditionalIds().has(p.id) && selectedId() !== p.id;
                          return (
                            <button
                              onClick={() => !isPicked() && handleSelect(p.id)}
                              disabled={isPicked()}
                              class={cn(
                                'w-full text-left px-2 py-1.5 rounded text-sm transition-colors',
                                selectedId() === p.id
                                  ? 'bg-primary/10 text-primary'
                                  : isPicked()
                                  ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                                  : 'hover:bg-secondary text-foreground',
                              )}
                            >
                              <span class="font-medium">{p.name}</span>
                              <span class="ml-2 text-xs text-muted-foreground capitalize">{p.powerType}</span>
                            </button>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                </Show>
              );
            }}
          </For>
          <Button
            size="sm"
            variant="ghost"
            class="text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </Show>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function PowerTab(props: PowerTabProps): JSX.Element {
  const pl = () => powerLevel(props.pilot.experience);
  const additionalSlots = () => pl();

  return (
    <div class="space-y-6">
      <p class="text-sm text-muted-foreground">
        All pilots start with the 6 Default Powers. Each can be swapped for its Alternative. You also get one additional Genre Power per Power Level.
      </p>

      <div class="space-y-2">
        <h3 class="text-sm font-semibold">Default Powers (6)</h3>
        <div class="space-y-2">
          <For each={defaultGenrePowers}>
            {(power) => <DefaultSlot pilot={props.pilot} defaultPower={power} />}
          </For>
        </div>
      </div>

      <Show when={additionalSlots() > 0}>
        <Separator />
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">
            Additional Powers ({additionalSlots()} from PL {pl()})
          </h3>
          <For each={Array.from({ length: additionalSlots() })}>
            {(_, i) => <AdditionalSlot pilot={props.pilot} slotIndex={i()} />}
          </For>
        </div>
      </Show>

      <Show when={pl() === 0}>
        <p class="text-sm text-muted-foreground">
          Reach Power Level 1 (30 XP) to unlock additional Genre Powers.
        </p>
      </Show>
    </div>
  );
}
