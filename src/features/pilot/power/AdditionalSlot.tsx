import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { genrePowersById } from '~/data';
import { POWER_CATEGORIES, defaultAndAlternativeIds, additionalPowerPool } from '~/lib/genrePowerRules';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface AdditionalSlotProps {
  pilot: Pilot;
  slotIndex: number;
}

export const AdditionalSlot = (props: AdditionalSlotProps): JSX.Element => {
  const [open, setOpen] = createSignal(false);

  const additionalIds = () =>
    props.pilot.genrePowerIds.filter((id) => !defaultAndAlternativeIds.has(id));

  const selectedId = () => additionalIds()[props.slotIndex];
  const selected = () => selectedId() ? genrePowersById[selectedId()] : undefined;

  const handleSelect = (powerId: string): void => {
    const current = additionalIds();
    const newAdditional = [...current];
    newAdditional[props.slotIndex] = powerId;
    const basePowerIds = props.pilot.genrePowerIds.filter((id) => defaultAndAlternativeIds.has(id));
    updatePilot(props.pilot.id, { genrePowerIds: [...basePowerIds, ...newAdditional] });
    setOpen(false);
  };

  const handleClear = (): void => {
    const current = additionalIds();
    const newAdditional = current.filter((_, i) => i !== props.slotIndex);
    const basePowerIds = props.pilot.genrePowerIds.filter((id) => defaultAndAlternativeIds.has(id));
    updatePilot(props.pilot.id, { genrePowerIds: [...basePowerIds, ...newAdditional] });
  };

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
};
