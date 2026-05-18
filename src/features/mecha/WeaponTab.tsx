import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Mecha } from '~/types/mecha';
import { weaponTemplates } from '~/data';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';
import { FILTER_TABS, matchesFilter } from './weapon/weaponUtils';
import type { WeaponFilter } from './weapon/weaponUtils';
import { DefaultWeaponCard } from './weapon/DefaultWeaponCard';
import { TakenWeaponCard } from './weapon/TakenWeaponCard';
import { WeaponRow } from './weapon/WeaponRow';
import { CustomWeaponBuilder } from './weapon/CustomWeaponBuilder';

interface WeaponTabProps {
  mecha: Mecha;
}

const DEFAULT_WEAPONS = weaponTemplates.filter((w) => w.isDefault);
const PURCHASABLE_WEAPONS = weaponTemplates.filter((w) => !w.isDefault);

export const WeaponTab = (props: WeaponTabProps): JSX.Element => {
  const [filter, setFilter] = createSignal<WeaponFilter>('all');
  const [search, setSearch] = createSignal('');
  const [builderOpen, setBuilderOpen] = createSignal(false);

  const takenWeapons = () => props.mecha.weapons.map((w, i) => ({ weapon: w, index: i }));

  const filteredAvailable = () => {
    const q = search().toLowerCase();
    return PURCHASABLE_WEAPONS.filter((def) => {
      if (!matchesFilter(def.keywords, filter())) { return false; }
      return !(q && !def.name.toLowerCase().includes(q) && !def.effect.toLowerCase().includes(q));
    });
  };

  return (
    <div class="space-y-6 pt-4">
      <div>
        <h3 class="text-sm font-semibold mb-2">Built-in</h3>
        <p class="text-xs text-muted-foreground mb-3">
          Every mecha includes CQC and Vulcans at no MP cost. They cannot be disabled by Maiming.
        </p>
        <div class="space-y-2">
          <For each={DEFAULT_WEAPONS}>
            {(def) => <DefaultWeaponCard mecha={props.mecha} def={def} />}
          </For>
        </div>
      </div>

      <Separator />

      <Show when={takenWeapons().length > 0}>
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">Equipped</h3>
          <div class="space-y-3">
            <For each={takenWeapons()}>
              {({ weapon, index }) => (
                <TakenWeaponCard mecha={props.mecha} weapon={weapon} index={index} />
              )}
            </For>
          </div>
        </div>
        <Separator />
      </Show>

      <div class="space-y-3">
        <h3 class="text-sm font-semibold">Available</h3>
        <div class="flex gap-2 flex-wrap items-center">
          <div class="flex gap-1">
            <For each={FILTER_TABS}>
              {(tab) => (
                <button
                  onClick={() => setFilter(tab.key)}
                  class={cn(
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    filter() === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                >
                  {tab.label}
                </button>
              )}
            </For>
          </div>
          <Input
            value={search()}
            onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
            placeholder="Search weapons…"
            class="h-7 text-xs flex-1 min-w-32 max-w-xs"
          />
          <Button size="sm" variant="outline" class="h-7 px-2 text-xs shrink-0" onClick={() => setBuilderOpen(true)}>
            + Custom
          </Button>
        </div>

        <For each={filteredAvailable()}>
          {(def) => <WeaponRow mecha={props.mecha} def={def} />}
        </For>

        <Show when={filteredAvailable().length === 0}>
          <p class="text-sm text-muted-foreground py-4 text-center">No weapons match this filter.</p>
        </Show>
      </div>

      <CustomWeaponBuilder mecha={props.mecha} open={builderOpen()} onClose={() => setBuilderOpen(false)} />
    </div>
  );
};
