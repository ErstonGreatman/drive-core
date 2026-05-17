import type { JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Pilot, PilotTraitEntry } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { traitsById, skillsById } from '~/data';
import type { TraitDefinition } from '~/data';
import { computeSpentCP } from '~/lib/pilot-costs';
import { cloneTraitEntry } from '~/lib/pilotClones';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

interface TakenTraitCardProps {
  pilot: Pilot;
  entry: PilotTraitEntry;
  def: TraitDefinition;
  index: number;
  isFreeDeathblow: boolean;
}

export const TakenTraitCard = (props: TakenTraitCardProps): JSX.Element => {
  const handleRemove = (): void => {
    const newTraits = props.pilot.traits
      .filter((_, i) => i !== props.index)
      .map(cloneTraitEntry);
    const newSpent = computeSpentCP(props.pilot.attributes, props.pilot.skills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { traits: newTraits, spentCP: newSpent });
  };

  const handleLabelBlur = (e: FocusEvent): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const newTraits = props.pilot.traits.map((t, i): PilotTraitEntry => {
      if (i === props.index) {
        return { ...cloneTraitEntry(t), specialistLabel: value || undefined };
      }
      return cloneTraitEntry(t);
    });
    updatePilot(props.pilot.id, { traits: newTraits });
  };

  const handleMiracleChange = (skillId: string): void => {
    const newTraits = props.pilot.traits.map((t, i): PilotTraitEntry => {
      if (i === props.index) {
        return { ...cloneTraitEntry(t), chosenMiracleSkillId: skillId };
      }
      return cloneTraitEntry(t);
    });
    updatePilot(props.pilot.id, { traits: newTraits });
  };

  const handleTierChange = (tier: 'specialist' | 'generalist'): void => {
    const newTraits = props.pilot.traits.map((t, i): PilotTraitEntry => {
      if (i === props.index) {
        return { ...cloneTraitEntry(t), miracleTier: tier };
      }
      return cloneTraitEntry(t);
    });
    updatePilot(props.pilot.id, { traits: newTraits });
  };

  return (
    <div class="p-3 rounded-lg border border-border bg-card space-y-2">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-medium">{props.def.name}</span>
            <Badge
              variant={props.isFreeDeathblow ? 'secondary' : 'muted'}
              class="text-[10px] px-1.5 py-0"
            >
              {props.isFreeDeathblow ? 'Free' : `${props.def.cpCost} CP`}
            </Badge>
            <Show when={props.def.traitCategory === 'anomaly'}>
              <Badge variant="outline" class="text-[10px] px-1.5 py-0">Anomaly</Badge>
            </Show>
          </div>

          <Show when={props.def.isSpecialist}>
            <Input
              value={props.entry.specialistLabel ?? ''}
              placeholder={props.def.specializations?.join(' · ') ?? 'Enter specialization…'}
              onBlur={handleLabelBlur}
              class="mt-1.5 h-7 text-xs"
            />
          </Show>

          <Show when={props.def.isAlienAnomaly && props.def.grantedMiracleSkillIds}>
            <div class="mt-2 space-y-2">
              <p class="text-xs text-muted-foreground">Choose your free Miracle skill:</p>
              <div class="flex gap-2 flex-wrap">
                <For each={props.def.grantedMiracleSkillIds!}>
                  {(skillId) => {
                    const skillDef = skillsById[skillId];
                    return (
                      <button
                        onClick={() => handleMiracleChange(skillId)}
                        class={cn(
                          'text-xs px-2 py-0.5 rounded border transition-colors',
                          props.entry.chosenMiracleSkillId === skillId
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground hover:border-foreground',
                        )}
                      >
                        {skillDef?.name ?? skillId}
                      </button>
                    );
                  }}
                </For>
              </div>
              <p class="text-xs text-muted-foreground">As Specialist (1 Disadvantage) or Generalist (2 Disadvantages):</p>
              <div class="flex gap-2">
                <For each={(['specialist', 'generalist'] as const)}>
                  {(tier) => (
                    <button
                      onClick={() => handleTierChange(tier)}
                      class={cn(
                        'text-xs px-2 py-0.5 rounded border transition-colors capitalize',
                        props.entry.miracleTier === tier
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-foreground',
                      )}
                    >
                      {tier}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>

        <Show when={!props.isFreeDeathblow}>
          <Button
            size="icon"
            variant="ghost"
            class="size-7 text-muted-foreground hover:text-destructive shrink-0"
            onClick={handleRemove}
          >
            ×
          </Button>
        </Show>
        <Show when={props.isFreeDeathblow}>
          <span class="text-[10px] text-muted-foreground shrink-0 pt-1">via skill</span>
        </Show>
      </div>
    </div>
  );
};
