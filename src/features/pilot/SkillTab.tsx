import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Pilot, PilotSkillEntry, PilotTraitEntry } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { skills, traits, skillsById, traitsById } from '~/data';
import type { SkillDefinition, TraitDefinition } from '~/data';
import { computeSpentCP, skillCost, qualifiesForFreeDeathblows } from '~/lib/pilot-costs';
import { cloneSkillEntry, cloneTraitEntry } from '~/lib/pilotClones';
import { isDeathblowSelectable, filterSkillsByQuery } from '~/lib/skillRules';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

interface SkillTabProps {
  pilot: Pilot;
}

const deathblowTraits = traits.filter((t) => t.traitCategory === 'deathblow');
const regularSkills = skills.filter((s) => !s.isMiracle);
const miracleSkills = skills.filter((s) => s.isMiracle);


// ── Free Deathblow Picker ─────────────────────────────────────────────────────

interface FreeDeathblowPickerProps {
  pilot: Pilot;
  skillEntry: PilotSkillEntry;
}

const FreeDeathblowPicker = (props: FreeDeathblowPickerProps): JSX.Element => {
  const currentFreeIds = () => props.skillEntry.freeDeathblowTraitIds ?? [];

  const toggle = (trait: TraitDefinition): void => {
    const freeIds = currentFreeIds();
    const isSelected = freeIds.includes(trait.id);

    let newFreeIds: string[];
    let newTraits: PilotTraitEntry[];

    if (isSelected) {
      newFreeIds = freeIds.filter((id) => id !== trait.id);
      let removed = false;
      newTraits = [...props.pilot.traits].reduce<PilotTraitEntry[]>((acc, t) => {
        if (!removed && t.traitId === trait.id) {
          removed = true;
          return acc;
        }
        return [...acc, cloneTraitEntry(t)];
      }, []);
    } else {
      if (!isDeathblowSelectable(trait, freeIds)) { return; }
      newFreeIds = [...freeIds, trait.id];
      newTraits = [
        ...[...props.pilot.traits].map(cloneTraitEntry),
        { traitId: trait.id },
      ];
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
  }

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
}

// ── Trained Skill Card ────────────────────────────────────────────────────────

interface TrainedSkillCardProps {
  pilot: Pilot;
  entry: PilotSkillEntry;
  def: SkillDefinition;
}

const TrainedSkillCard = (props: TrainedSkillCardProps): JSX.Element => {
  const handleRemove = (): void => {
    const freeIds = props.entry.freeDeathblowTraitIds ?? [];
    let newTraits = [...props.pilot.traits].map(cloneTraitEntry);
    for (const freeId of freeIds) {
      const idx = newTraits.findIndex((t) => t.traitId === freeId);
      if (idx >= 0) { newTraits.splice(idx, 1); }
    }
    const newSkills = [...props.pilot.skills]
      .filter((s) => s.skillId !== props.entry.skillId)
      .map(cloneSkillEntry);
    const newSpent = computeSpentCP(props.pilot.attributes, newSkills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { skills: newSkills, traits: newTraits, spentCP: newSpent });
  }

  const handleTypeChange = (newType: 'generalist' | 'specialist'): void => {
    const oldEntry = props.entry;
    const wasOffensive = qualifiesForFreeDeathblows(oldEntry, props.def);
    const newEntry: PilotSkillEntry = cloneSkillEntry(oldEntry);
    newEntry.type = newType;
    if (newType === 'generalist') { newEntry.specialistLabel = undefined; }

    let newTraits = [...props.pilot.traits].map(cloneTraitEntry);
    // If switching away from a type that granted free deathblows, remove them
    const willBeOffensive = qualifiesForFreeDeathblows(newEntry, props.def);
    if (wasOffensive && !willBeOffensive) {
      for (const freeId of (oldEntry.freeDeathblowTraitIds ?? [])) {
        const idx = newTraits.findIndex((t) => t.traitId === freeId);
        if (idx >= 0) { newTraits.splice(idx, 1); }
      }
      newEntry.freeDeathblowTraitIds = undefined;
    }

    const newSkills = [...props.pilot.skills].map((s): PilotSkillEntry => {
      return s.skillId === oldEntry.skillId ? newEntry : cloneSkillEntry(s);
    });
    const newSpent = computeSpentCP(props.pilot.attributes, newSkills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { skills: newSkills, traits: newTraits, spentCP: newSpent });
  }

  const handleLabelBlur = (e: FocusEvent): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    if (value === props.entry.specialistLabel) { return; }
    const wasOffensive = qualifiesForFreeDeathblows(props.entry, props.def);
    const newEntry: PilotSkillEntry = { ...cloneSkillEntry(props.entry), specialistLabel: value || undefined };
    let newTraits = [...props.pilot.traits].map(cloneTraitEntry);
    const willBeOffensive = qualifiesForFreeDeathblows(newEntry, props.def);
    if (wasOffensive && !willBeOffensive) {
      for (const freeId of (props.entry.freeDeathblowTraitIds ?? [])) {
        const idx = newTraits.findIndex((t) => t.traitId === freeId);
        if (idx >= 0) { newTraits.splice(idx, 1); }
      }
      newEntry.freeDeathblowTraitIds = undefined;
    }
    const newSkills = [...props.pilot.skills].map((s): PilotSkillEntry => {
      return s.skillId === props.entry.skillId ? newEntry : cloneSkillEntry(s);
    });
    const newSpent = computeSpentCP(props.pilot.attributes, newSkills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { skills: newSkills, traits: newTraits, spentCP: newSpent });
  }

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
}

// ── Available Skill Row ───────────────────────────────────────────────────────

interface SkillRowProps {
  pilot: Pilot;
  def: SkillDefinition;
}

const SkillRow = (props: SkillRowProps): JSX.Element => {
  const addSkill = (type: 'generalist' | 'specialist'): void => {
    const newEntry: PilotSkillEntry = { skillId: props.def.id, type };
    const newSkills = [...props.pilot.skills.map(cloneSkillEntry), newEntry];
    const newSpent = computeSpentCP(props.pilot.attributes, newSkills, props.pilot.traits, skillsById, traitsById);
    updatePilot(props.pilot.id, { skills: newSkills, spentCP: newSpent });
  }

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
}

// ── Main Component ────────────────────────────────────────────────────────────

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
}
