import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import type { Pilot, PilotSkillEntry } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { skillsById, traitsById } from '~/data';
import type { SkillDefinition } from '~/data';
import { computeSpentCP, skillCost } from '~/lib/pilot-costs';
import { cloneSkillEntry } from '~/lib/pilotClones';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';

interface SkillRowProps {
  pilot: Pilot;
  def: SkillDefinition;
}

export const SkillRow = (props: SkillRowProps): JSX.Element => {
  const addSkill = (type: 'generalist' | 'specialist'): void => {
    const newEntry: PilotSkillEntry = { skillId: props.def.id, type };
    const newSkills = [...props.pilot.skills.map(cloneSkillEntry), newEntry];
    const newSpent = computeSpentCP(props.pilot.attributes, newSkills, props.pilot.traits, skillsById, traitsById);
    updatePilot(props.pilot.id, { skills: newSkills, spentCP: newSpent });
  };

  const genCost = () => skillCost(props.def, 'generalist');
  const specCost = () => skillCost(props.def, 'specialist');

  return (
    <div class="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-sm font-medium">{props.def.name}</span>
          <span class="text-xs text-muted-foreground">{props.def.defaultAttribute}</span>
          <Show when={props.def.isMiracle}>
            <Badge variant="secondary" class="text-[10px] px-1.5 py-0">Miracle</Badge>
          </Show>
        </div>
        <Show when={props.def.specializations?.length}>
          <p class="text-xs text-muted-foreground mt-0.5">
            e.g. {props.def.specializations!.join(' · ')}
          </p>
        </Show>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="outline"
          class="h-7 px-2 text-xs"
          onClick={() => addSkill('specialist')}
        >
          +S {specCost()}
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="h-7 px-2 text-xs"
          onClick={() => addSkill('generalist')}
        >
          +G {genCost()}
        </Button>
      </div>
    </div>
  );
};
