import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { traits, traitsById } from '~/data';
import { buildFreeDeathblowMap, enrichTraitsWithMeta } from '~/lib/traitRules';
import { TakenTraitCard } from './trait/TakenTraitCard';
import { TraitRow } from './trait/TraitRow';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

interface TraitTabProps {
  pilot: Pilot;
}

const CATEGORIES = [
  { key: 'general' as const, label: 'General Traits' },
  { key: 'equipment' as const, label: 'Equipment Traits' },
  { key: 'deathblow' as const, label: 'Deathblow Traits' },
  { key: 'anomaly' as const, label: 'Anomaly Traits' },
];

export const TraitTab = (props: TraitTabProps): JSX.Element => {
  const [activeCategory, setActiveCategory] = createSignal<string>('general');

  const takenTraitsWithMeta = () =>
    enrichTraitsWithMeta(props.pilot.traits, buildFreeDeathblowMap(props.pilot.skills));

  const takenIds = () => new Set(props.pilot.traits.map((t) => t.traitId));

  const categoryTraits = () =>
    traits.filter((t) => t.traitCategory === activeCategory());

  const takenInCategory = () =>
    takenTraitsWithMeta().filter((x) => x.def.traitCategory === activeCategory());

  return (
    <div class="space-y-6">
      {/* Category tabs */}
      <div class="flex gap-1 flex-wrap">
        <For each={CATEGORIES}>
          {(cat) => {
            const count = () => props.pilot.traits.filter(
              (t) => traitsById[t.traitId]?.traitCategory === cat.key
            ).length;
            return (
              <button
                onClick={() => setActiveCategory(cat.key)}
                class={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeCategory() === cat.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
              >
                {cat.label}
                <Show when={count() > 0}>
                  <span class="ml-1.5 text-xs opacity-70">({count()})</span>
                </Show>
              </button>
            );
          }}
        </For>
      </div>

      {/* Taken traits in this category */}
      <Show when={takenInCategory().length > 0}>
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">Acquired</h3>
          <div class="space-y-2">
            <For each={takenInCategory()}>
              {({ entry, def, index, isFree }) => (
                <TakenTraitCard
                  pilot={props.pilot}
                  entry={entry}
                  def={def}
                  index={index}
                  isFreeDeathblow={isFree}
                />
              )}
            </For>
          </div>
        </div>
        <Separator />
      </Show>

      {/* Available traits in this category */}
      <div class="space-y-2">
        <h3 class="text-sm font-semibold">Available</h3>
        <Show when={activeCategory() === 'anomaly'}>
          <p class="text-xs text-muted-foreground">
            Anomaly traits cost 0 CP but carry significant downsides. Alien Anomalies grant a free Miracle skill — purchase that skill later to remove the Anomaly's penalties.
          </p>
        </Show>
        <Show when={activeCategory() === 'deathblow'}>
          <p class="text-xs text-muted-foreground">
            Each Deathblow may only be used once per Episode. A 5 CP Deathblow grants +1 Advantage; a 10 CP Deathblow grants +2. Mecha are immune to Deathblows.
          </p>
        </Show>
        <For each={categoryTraits()}>
          {(def) => (
            <TraitRow
              pilot={props.pilot}
              def={def}
              alreadyTaken={takenIds().has(def.id)}
            />
          )}
        </For>
      </div>
    </div>
  );
};
