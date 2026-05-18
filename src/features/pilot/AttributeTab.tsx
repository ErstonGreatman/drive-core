import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import type { Pilot, PilotAttributes } from '~/types/pilot';
import type { PilotAttributeKey } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { skillsById, traitsById } from '~/data';
import {
  attributeCostToRank,
  attributeIncrementalCost,
  computeSpentCP,
} from '~/lib/pilot-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface AttributeTabProps {
  pilot: Pilot;
}

const ATTRIBUTES: { key: PilotAttributeKey; label: string; description: string }[] = [
  { key: 'fitness', label: 'Fitness', description: 'Strength, reflexes, endurance. Combat & physical feats.' },
  { key: 'awareness', label: 'Awareness', description: 'Senses and instincts. Adds to Defense (rank + 5).' },
  { key: 'intellect', label: 'Intellect', description: 'Knowledge and technical skill. Many skills depend on it.' },
  { key: 'willpower', label: 'Willpower', description: 'Stubbornness and resolve. Each Plot Armor layer absorbs this much damage.' },
  { key: 'charm', label: 'Charm', description: 'Charisma and social grace. Diplomacy, Deception, Presence.' },
  { key: 'resources', label: 'Resources', description: 'Money, contacts, and influence. Can substitute for almost any skill.' },
];

export const AttributeTab = (props: AttributeTabProps): JSX.Element => {
  const attrTotalCost = (): number => {
    const a = props.pilot.attributes;
    return (
      attributeCostToRank(a.fitness) +
      attributeCostToRank(a.awareness) +
      attributeCostToRank(a.intellect) +
      attributeCostToRank(a.willpower) +
      attributeCostToRank(a.charm) +
      attributeCostToRank(a.resources)
    );
  };

  const handleChange = (key: PilotAttributeKey, delta: number): void => {
    const current = props.pilot.attributes[key];
    const next = current + delta;
    if (next < 0 || next > 10) { return; }
    const newAttrs: PilotAttributes = {
      fitness: props.pilot.attributes.fitness,
      awareness: props.pilot.attributes.awareness,
      intellect: props.pilot.attributes.intellect,
      willpower: props.pilot.attributes.willpower,
      charm: props.pilot.attributes.charm,
      resources: props.pilot.attributes.resources,
      [key]: next,
    };
    const newSpent = computeSpentCP(
      newAttrs,
      props.pilot.skills,
      props.pilot.traits,
      skillsById,
      traitsById,
    );
    updatePilot(props.pilot.id, { attributes: newAttrs, spentCP: newSpent });
  }

  return (
    <div class="space-y-6 max-w-lg">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">Attribute CP spent</span>
        <Badge variant="muted" class="font-mono">{attrTotalCost()} CP</Badge>
      </div>

      <div class="space-y-2">
        <For each={ATTRIBUTES}>
          {(attr) => {
            const rank = () => props.pilot.attributes[attr.key];
            const nextCost = () => attributeIncrementalCost(rank());
            const canIncrease = () => rank() < 10;
            const canDecrease = () => rank() > 0;

            return (
              <div class="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium">{attr.label}</div>
                  <div class="text-xs text-muted-foreground leading-snug mt-0.5">{attr.description}</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="size-7 text-base"
                    onClick={() => handleChange(attr.key, -1)}
                    disabled={!canDecrease()}
                  >
                    −
                  </Button>
                  <span class={cn(
                    'w-6 text-center font-mono font-semibold text-sm',
                    rank() === 0 && 'text-muted-foreground',
                  )}>
                    {rank()}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    class="size-7 text-base"
                    onClick={() => handleChange(attr.key, 1)}
                    disabled={!canIncrease()}
                  >
                    +
                  </Button>
                  <span class="text-xs text-muted-foreground w-14 text-right">
                    {rank() < 10 ? `+${nextCost()} CP` : 'max'}
                  </span>
                </div>
              </div>
            );
          }}
        </For>
      </div>

      <p class="text-xs text-muted-foreground">
        Rank costs: 1 → 2 → 3 → 4 → 5 → … CP per step. Total to reach rank N: N×(N+1)÷2.
      </p>
    </div>
  );
}
