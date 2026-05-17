import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import type { Pilot, PilotSkillEntry } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { skillsById, traitsById } from '~/data';
import type { SkillDefinition } from '~/data';
import { computeSpentCP, qualifiesForFreeDeathblows } from '~/lib/pilot-costs';
import { cloneSkillEntry, cloneTraitEntry } from '~/lib/pilotClones';
import { stripGrantedDeathblowTraits } from '~/lib/skillRules';
import { FreeDeathblowPicker } from './FreeDeathblowPicker';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

interface TrainedSkillCardProps {
  pilot: Pilot;
  entry: PilotSkillEntry;
  def: SkillDefinition;
}

export const TrainedSkillCard = (props: TrainedSkillCardProps): JSX.Element => {
  const handleRemove = (): void => {
    const freeIds = props.entry.freeDeathblowTraitIds ?? [];
    const newTraits = stripGrantedDeathblowTraits(props.pilot.traits, freeIds);
    const newSkills = [...props.pilot.skills]
      .filter((s) => s.skillId !== props.entry.skillId)
      .map(cloneSkillEntry);
    const newSpent = computeSpentCP(props.pilot.attributes, newSkills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { skills: newSkills, traits: newTraits, spentCP: newSpent });
  };

  const handleTypeChange = (newType: 'generalist' | 'specialist'): void => {
    const oldEntry = props.entry;
    const wasOffensive = qualifiesForFreeDeathblows(oldEntry, props.def);
    const newEntry: PilotSkillEntry = cloneSkillEntry(oldEntry);
    newEntry.type = newType;
    if (newType === 'generalist') { newEntry.specialistLabel = undefined; }

    const willBeOffensive = qualifiesForFreeDeathblows(newEntry, props.def);
    let newTraits = [...props.pilot.traits].map(cloneTraitEntry);
    if (wasOffensive && !willBeOffensive) {
      newTraits = stripGrantedDeathblowTraits(props.pilot.traits, oldEntry.freeDeathblowTraitIds ?? []);
      newEntry.freeDeathblowTraitIds = undefined;
    }

    const newSkills = [...props.pilot.skills].map((s): PilotSkillEntry => {
      return s.skillId === oldEntry.skillId ? newEntry : cloneSkillEntry(s);
    });
    const newSpent = computeSpentCP(props.pilot.attributes, newSkills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { skills: newSkills, traits: newTraits, spentCP: newSpent });
  };

  const handleLabelBlur = (e: FocusEvent): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    if (value === props.entry.specialistLabel) { return; }
    const wasOffensive = qualifiesForFreeDeathblows(props.entry, props.def);
    const newEntry: PilotSkillEntry = { ...cloneSkillEntry(props.entry), specialistLabel: value || undefined };
    const willBeOffensive = qualifiesForFreeDeathblows(newEntry, props.def);
    let newTraits = [...props.pilot.traits].map(cloneTraitEntry);
    if (wasOffensive && !willBeOffensive) {
      newTraits = stripGrantedDeathblowTraits(props.pilot.traits, props.entry.freeDeathblowTraitIds ?? []);
      newEntry.freeDeathblowTraitIds = undefined;
    }
    const newSkills = [...props.pilot.skills].map((s): PilotSkillEntry => {
      return s.skillId === props.entry.skillId ? newEntry : cloneSkillEntry(s);
    });
    const newSpent = computeSpentCP(props.pilot.attributes, newSkills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { skills: newSkills, traits: newTraits, spentCP: newSpent });
  };

  const showDeathblowPicker = () =>
    props.def.isOffensiveMiracle && qualifiesForFreeDeathblows(props.entry, props.def);

  return (
    <div class="p-3 rounded-lg border border-border bg-card space-y-2">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-medium">{props.def.name}</span>
            <Show when={props.def.isMiracle}>
              <Badge variant="secondary" class="text-[10px] px-1.5 py-0">Miracle</Badge>
            </Show>
          </div>
          <div class="flex items-center gap-2 mt-1.5">
            <button
              onClick={() => handleTypeChange('generalist')}
              class={cn(
                'text-xs px-2 py-0.5 rounded border transition-colors',
                props.entry.type === 'generalist'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground',
              )}
            >
              Generalist ({props.def.isMiracle ? 20 : 10} CP)
            </button>
            <button
              onClick={() => handleTypeChange('specialist')}
              class={cn(
                'text-xs px-2 py-0.5 rounded border transition-colors',
                props.entry.type === 'specialist'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground',
              )}
            >
              Specialist ({props.def.isMiracle ? 10 : 5} CP)
            </button>
          </div>
          <Show when={props.entry.type === 'specialist'}>
            <Input
              value={props.entry.specialistLabel ?? ''}
              placeholder={props.def.specializations?.join(' · ') ?? 'Enter specialization…'}
              onBlur={handleLabelBlur}
              class="mt-1.5 h-7 text-xs"
            />
          </Show>
        </div>
        <Button
          size="icon"
          variant="ghost"
          class="size-7 text-muted-foreground hover:text-destructive shrink-0"
          onClick={handleRemove}
        >
          ×
        </Button>
      </div>
      <Show when={showDeathblowPicker()}>
        <FreeDeathblowPicker pilot={props.pilot} skillEntry={props.entry} />
      </Show>
    </div>
  );
};
