import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import type { Pilot, PilotSkillEntry, PilotTraitEntry } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { traits, traitsById, skillsById } from '~/data';
import type { TraitDefinition } from '~/data';
import { computeSpentCP } from '~/lib/pilot-costs';
import { cloneSkillEntry, cloneTraitEntry } from '~/lib/pilotClones';
import { isDeathblowSelectable, stripGrantedDeathblowTraits } from '~/lib/skillRules';
import { cn } from '~/lib/utils';

const deathblowTraits = traits.filter((t) => t.traitCategory === 'deathblow');

interface FreeDeathblowPickerProps {
  pilot: Pilot;
  skillEntry: PilotSkillEntry;
}

export const FreeDeathblowPicker = (props: FreeDeathblowPickerProps): JSX.Element => {
  const currentFreeIds = () => props.skillEntry.freeDeathblowTraitIds ?? [];

  const toggle = (trait: TraitDefinition): void => {
    const freeIds = currentFreeIds();
    const isSelected = freeIds.includes(trait.id);

    let newFreeIds: string[];
    let newTraits: PilotTraitEntry[];

    if (isSelected) {
      newFreeIds = freeIds.filter((id) => id !== trait.id);
      newTraits = stripGrantedDeathblowTraits(props.pilot.traits, [trait.id]);
    } else {
      if (!isDeathblowSelectable(trait, freeIds)) { return; }
      newFreeIds = [...freeIds, trait.id];
      newTraits = [...props.pilot.traits.map(cloneTraitEntry), { traitId: trait.id }];
    }

    const newSkills = [...props.pilot.skills].map((s): PilotSkillEntry => {
      const base = cloneSkillEntry(s);
      if (s.skillId === props.skillEntry.skillId) {
        base.freeDeathblowTraitIds = newFreeIds;
      }
      return base;
    });

    const newSpent = computeSpentCP(props.pilot.attributes, newSkills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { skills: newSkills, traits: newTraits, spentCP: newSpent });
  };

  const fiveSelected = () => currentFreeIds().filter((id) => traitsById[id]?.cpCost === 5).length;
  const tenSelected = () => currentFreeIds().filter((id) => traitsById[id]?.cpCost === 10).length;

  return (
    <div class="mt-3 pt-3 border-t border-border space-y-2">
      <p class="text-xs font-medium text-foreground">Free Deathblow Traits</p>
      <p class="text-xs text-muted-foreground">
        Pick two 5 CP traits or one 10 CP trait ({fiveSelected()}/2 × 5 CP, {tenSelected()}/1 × 10 CP).
      </p>
      <div class="flex flex-wrap gap-1.5">
        <For each={deathblowTraits}>
          {(trait) => {
            const selected = () => currentFreeIds().includes(trait.id);
            const selectable = () => isDeathblowSelectable(trait, currentFreeIds());
            return (
              <button
                onClick={() => toggle(trait)}
                disabled={!selected() && !selectable()}
                class={cn(
                  'px-2 py-0.5 rounded text-xs border transition-colors',
                  selected()
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                  !selected() && !selectable() && 'opacity-40 cursor-not-allowed',
                )}
              >
                {trait.name} ({trait.cpCost} CP)
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
};
