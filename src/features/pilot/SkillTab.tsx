import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Pilot, PilotSkillEntry } from '~/types/pilot';
import { skills, skillsById } from '~/data';
import type { SkillDefinition } from '~/data';
import { filterSkillsByQuery } from '~/lib/skillRules';
import { TrainedSkillCard } from './skill/TrainedSkillCard';
import { SkillRow } from './skill/SkillRow';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';

interface SkillTabProps {
  pilot: Pilot;
}

const regularSkills = skills.filter((s) => !s.isMiracle);
const miracleSkills = skills.filter((s) => s.isMiracle);

export const SkillTab = (props: SkillTabProps): JSX.Element => {
  const [search, setSearch] = createSignal('');

  const trainedIds = () => new Set(props.pilot.skills.map((s) => s.skillId));

  const filteredRegular = () => filterSkillsByQuery(regularSkills, search()).filter((s) => !trainedIds().has(s.id));
  const filteredMiracle = () => filterSkillsByQuery(miracleSkills, search()).filter((s) => !trainedIds().has(s.id));

  const trainedEntries = () =>
    props.pilot.skills.map((entry) => ({
      entry,
      def: skillsById[entry.skillId],
    })).filter((x): x is { entry: PilotSkillEntry; def: SkillDefinition } => !!x.def);

  return (
    <div class="space-y-6">
      {/* Trained skills */}
      <Show when={trainedEntries().length > 0}>
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">Trained Skills</h3>
          <div class="space-y-2">
            <For each={trainedEntries()}>
              {({ entry, def }) => (
                <TrainedSkillCard pilot={props.pilot} entry={entry} def={def} />
              )}
            </For>
          </div>
        </div>
        <Separator />
      </Show>

      {/* Available skills */}
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <h3 class="text-sm font-semibold flex-1">Available Skills</h3>
          <Input
            value={search()}
            onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
            placeholder="Search…"
            class="h-8 w-40 text-xs"
          />
        </div>

        <div>
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Regular Skills</p>
          <Show
            when={filteredRegular().length > 0}
            fallback={<p class="text-sm text-muted-foreground">All regular skills trained.</p>}
          >
            <For each={filteredRegular()}>
              {(def) => <SkillRow pilot={props.pilot} def={def} />}
            </For>
          </Show>
        </div>

        <div>
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Miracle Skills</p>
          <p class="text-xs text-muted-foreground mb-2">
            Using a Miracle deals damage equal to 1 + (result ÷ 5) to your Plot Armor.
            Offensive Miracles (marked ★) grant free Deathblow traits when purchased.
          </p>
          <Show
            when={filteredMiracle().length > 0}
            fallback={<p class="text-sm text-muted-foreground">All miracle skills trained.</p>}
          >
            <For each={filteredMiracle()}>
              {(def) => <SkillRow pilot={props.pilot} def={def} />}
            </For>
          </Show>
        </div>
      </div>

      <p class="text-xs text-muted-foreground">
        +G = Add as Generalist (advantage on all uses). +S = Add as Specialist (advantage on chosen specialization only). CP cost shown next to each button.
      </p>
    </div>
  );
};
