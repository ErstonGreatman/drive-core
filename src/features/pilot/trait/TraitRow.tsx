import type { JSX } from 'solid-js';
import { createSignal, Show, onCleanup } from 'solid-js';
import type { Pilot, PilotTraitEntry } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { skillsById, traitsById } from '~/data';
import type { TraitDefinition } from '~/data';
import { computeSpentCP } from '~/lib/pilot-costs';
import { cloneTraitEntry } from '~/lib/pilotClones';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface TraitRowProps {
  pilot: Pilot;
  def: TraitDefinition;
  alreadyTaken: boolean;
}

export const TraitRow = (props: TraitRowProps): JSX.Element => {
  const [justAdded, setJustAdded] = createSignal(false);
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(flashTimer));

  const handleAdd = (): void => {
    const newEntry: PilotTraitEntry = { traitId: props.def.id };
    const newTraits = [...props.pilot.traits.map(cloneTraitEntry), newEntry];
    const newSpent = computeSpentCP(props.pilot.attributes, props.pilot.skills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { traits: newTraits, spentCP: newSpent });
    clearTimeout(flashTimer);
    setJustAdded(true);
    flashTimer = setTimeout(() => setJustAdded(false), 2000);
  };

  const canAdd = () =>
    props.def.isSpecialist || !props.alreadyTaken;

  const buttonLabel = () => {
    if (justAdded()) { return '✓ Added'; }
    if (props.alreadyTaken && !props.def.isSpecialist) { return '✓'; }
    return '+';
  };

  return (
    <div class="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-sm font-medium">{props.def.name}</span>
          <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">
            {props.def.cpCost === 0 ? 'Free' : `${props.def.cpCost} CP`}
          </Badge>
          <Show when={props.def.isSpecialist}>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0">Specialist</Badge>
          </Show>
        </div>
        <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{props.def.effect}</p>
        <Show when={props.def.conditions}>
          <p class="text-xs text-destructive/80 mt-0.5">{props.def.conditions}</p>
        </Show>
      </div>
      <Button
        size="sm"
        variant={justAdded() ? 'secondary' : 'outline'}
        class="h-7 px-2 text-xs shrink-0 transition-all"
        disabled={!canAdd()}
        onClick={handleAdd}
      >
        {buttonLabel()}
      </Button>
    </div>
  );
};
