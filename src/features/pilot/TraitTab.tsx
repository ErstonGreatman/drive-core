import type { JSX } from 'solid-js';
import { createSignal, For, Show, onCleanup } from 'solid-js';
import type { Pilot, PilotTraitEntry } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { traits, traitsById, skillsById } from '~/data';
import type { TraitDefinition } from '~/data';
import { computeSpentCP } from '~/lib/pilot-costs';
import { cloneTraitEntry } from '~/lib/pilotClones';
import { buildFreeDeathblowMap, enrichTraitsWithMeta } from '~/lib/traitRules';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

interface TraitTabProps {
  pilot: Pilot;
}

// ── Taken Trait Card ──────────────────────────────────────────────────────────

interface TakenTraitCardProps {
  pilot: Pilot;
  entry: PilotTraitEntry;
  def: TraitDefinition;
  index: number;
  isFreeDeathblow: boolean;
}

const TakenTraitCard = (props: TakenTraitCardProps): JSX.Element => {
  const handleRemove = (): void => {
    const newTraits = props.pilot.traits
      .filter((_, i) => i !== props.index)
      .map(cloneTraitEntry);
    const newSpent = computeSpentCP(props.pilot.attributes, props.pilot.skills, newTraits, skillsById, traitsById);
    updatePilot(props.pilot.id, { traits: newTraits, spentCP: newSpent });
  }

  const handleLabelBlur = (e: FocusEvent): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const newTraits = props.pilot.traits.map((t, i): PilotTraitEntry => {
      if (i === props.index) {
        return { ...cloneTraitEntry(t), specialistLabel: value || undefined };
      }
      return cloneTraitEntry(t);
    });
    updatePilot(props.pilot.id, { traits: newTraits });
  }

  const handleMiracleChange = (skillId: string): void => {
    const newTraits = props.pilot.traits.map((t, i): PilotTraitEntry => {
      if (i === props.index) {
        return { ...cloneTraitEntry(t), chosenMiracleSkillId: skillId };
      }
      return cloneTraitEntry(t);
    });
    updatePilot(props.pilot.id, { traits: newTraits });
  }

  const handleTierChange = (tier: 'specialist' | 'generalist'): void => {
    const newTraits = props.pilot.traits.map((t, i): PilotTraitEntry => {
      if (i === props.index) {
        return { ...cloneTraitEntry(t), miracleTier: tier };
      }
      return cloneTraitEntry(t);
    });
    updatePilot(props.pilot.id, { traits: newTraits });
  }

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
}

// ── Available Trait Row ───────────────────────────────────────────────────────

interface TraitRowProps {
  pilot: Pilot;
  def: TraitDefinition;
  alreadyTaken: boolean;
}

const TraitRow = (props: TraitRowProps): JSX.Element => {
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
  }

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
}

// ── Category Section ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'general' as const, label: 'General Traits' },
  { key: 'equipment' as const, label: 'Equipment Traits' },
  { key: 'deathblow' as const, label: 'Deathblow Traits' },
  { key: 'anomaly' as const, label: 'Anomaly Traits' },
];

// ── Main Component ────────────────────────────────────────────────────────────

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
}
