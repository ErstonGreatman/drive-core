import type { JSX } from 'solid-js';
import { createSignal, For, Show, onCleanup } from 'solid-js';
import type { Mecha, MechaWeapon } from '~/types/mecha';
import { updateMecha } from '~/stores/mecha';
import { weaponAbilitiesById, weaponTemplates, weaponKeywordsById, weaponTemplatesById } from '~/data';
import type { WeaponTemplateDefinition } from '~/data';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';
import * as DialogPrimitive from '@kobalte/core/dialog';

// ── Constants ──────────────────────────────────────────────────────────────────

interface WeaponTabProps {
  mecha: Mecha;
}

const WEAPON_AREAS = ['head', 'torso', 'arms', 'legs'] as const;
type WeaponArea = (typeof WEAPON_AREAS)[number];

const DEFAULT_WEAPONS = weaponTemplates.filter((w) => w.isDefault);
const PURCHASABLE_WEAPONS = weaponTemplates.filter((w) => !w.isDefault);

type WeaponFilter = 'all' | 'melee' | 'shooting' | 'beam';

const FILTER_TABS: { key: WeaponFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'melee', label: 'Melee' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'beam', label: 'Beam' },
];

// Custom weapon builder
const BASE_WP = { melee: 2, shooting: 1 } as const;
type BaseType = keyof typeof BASE_WP;

const ABILITY_GROUPS: { label: string; ids: string[] }[] = [
  {
    label: 'Advantages',
    ids: ['conditional-advantage', 'innate-advantage', 'additional-disadvantage-when-suppressing'],
  },
  {
    label: 'Range & Area',
    ids: ['long-range', 'blast-1', 'blast-2', 'blast-3', 'line'],
  },
  {
    label: 'Special',
    ids: ['crippling', 'beam', 'remote'],
  },
  {
    label: 'Drawbacks',
    ids: ['slow', 'one-shot', 'unreliable', 'overheating'],
  },
];

const AREA_EXCLUSIVE_IDS = new Set(['blast-1', 'blast-2', 'blast-3', 'line']);
const DRAWBACK_IDS = ['slow', 'one-shot', 'unreliable', 'overheating'];

// Maps ability IDs to the keyword they grant on the weapon
const ABILITY_KEYWORD: Record<string, string> = {
  'beam': 'beam',
  'long-range': 'long-range',
  'blast-1': 'blast',
  'blast-2': 'blast',
  'blast-3': 'blast',
  'line': 'line',
  'crippling': 'crippling',
  'slow': 'slow',
  'one-shot': 'one-shot',
  'unreliable': 'unreliable',
  'overheating': 'overheating',
  'remote': 'remote',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function matchesFilter(keywords: string[], filter: WeaponFilter): boolean {
  if (filter === 'all') { return true; }
  if (filter === 'beam') { return keywords.includes('beam'); }
  return keywords.includes(filter) && !keywords.includes('beam');
}

function primaryKeyword(keywords: string[]): string {
  if (keywords.includes('beam')) { return 'beam'; }
  if (keywords.includes('melee')) { return 'melee'; }
  return 'shooting';
}

// Boost energy cost for a custom Beam weapon: 1 + count of non-negative non-Beam abilities
function customBoostCost(abilities: MechaWeapon['abilities']): number {
  return 1 + abilities.filter((a) => a.wpCost >= 0 && a.abilityTemplateId !== 'beam').length;
}

// ── Clone helper ───────────────────────────────────────────────────────────────

function cloneWeapon(w: MechaWeapon): MechaWeapon {
  return {
    id: w.id,
    templateId: w.templateId,
    name: w.name,
    description: w.description,
    area: w.area,
    keywords: [...w.keywords],
    energyCost: w.energyCost,
    abilities: w.abilities.map((a) => ({
      abilityTemplateId: a.abilityTemplateId,
      name: a.name,
      description: a.description,
      wpCost: a.wpCost,
      label: a.label,
    })),
    isCustom: w.isCustom,
  };
}

// ── Keyword badge strip ────────────────────────────────────────────────────────

function KeywordBadges(props: { keywords: string[] }): JSX.Element {
  const primary = () => primaryKeyword(props.keywords);
  const secondary = () => props.keywords.filter((k) => k !== 'melee' && k !== 'shooting' && k !== 'beam');

  return (
    <span class="flex items-center gap-1 flex-wrap">
      <Badge
        variant={primary() === 'beam' ? 'secondary' : 'outline'}
        class="text-[10px] px-1.5 py-0 capitalize"
      >
        {weaponKeywordsById[primary()]?.name ?? primary()}
      </Badge>
      <For each={secondary()}>
        {(kw) => (
          <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize">
            {weaponKeywordsById[kw]?.name ?? kw}
          </Badge>
        )}
      </For>
    </span>
  );
}

// ── Default Weapon Card ───────────────────────────────────────────────────────

interface DefaultWeaponCardProps {
  mecha: Mecha;
  def: WeaponTemplateDefinition;
}

function DefaultWeaponCard(props: DefaultWeaponCardProps): JSX.Element {
  const displayName = () => props.mecha.defaultWeaponNames?.[props.def.id] ?? props.def.name;

  function handleNameBlur(e: FocusEvent): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const effectiveName = value || props.def.name;
    const current = { ...(props.mecha.defaultWeaponNames ?? {}) };
    if (effectiveName === props.def.name) {
      delete current[props.def.id];
    } else {
      current[props.def.id] = effectiveName;
    }
    updateMecha(props.mecha.id, {
      defaultWeaponNames: Object.keys(current).length > 0 ? current : undefined,
    });
  }

  return (
    <div class="p-3 rounded-lg border border-border/60 bg-muted/30">
      <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
        <Input
          value={displayName()}
          onBlur={handleNameBlur}
          class="-mx-1 h-auto py-0 px-1 text-sm font-medium border-transparent shadow-none hover:border-input bg-transparent"
        />
        <Show when={displayName() !== props.def.name}>
          <p class="text-[11px] text-muted-foreground">{props.def.name}</p>
        </Show>
      </div>
      <div class="flex items-center gap-1.5 flex-wrap mb-1">
        <Badge variant="secondary" class="text-[10px] px-1.5 py-0 font-mono">Free</Badge>
        <KeywordBadges keywords={props.def.keywords} />
      </div>
      <p class="text-xs text-muted-foreground leading-snug">{props.def.effect}</p>
    </div>
  );
}

// ── Taken Weapon Card ──────────────────────────────────────────────────────────

interface TakenWeaponCardProps {
  mecha: Mecha;
  weapon: MechaWeapon;
  index: number;
}

function TakenWeaponCard(props: TakenWeaponCardProps): JSX.Element {
  function handleRemove(): void {
    const newWeapons = props.mecha.weapons
      .filter((_, i) => i !== props.index)
      .map(cloneWeapon);
    const newSpent = computeSpentMP(props.mecha.attributes, newWeapons, props.mecha.upgrades);
    updateMecha(props.mecha.id, { weapons: newWeapons, spentMP: newSpent });
  }

  function handleAreaChange(area: WeaponArea): void {
    const newWeapons = props.mecha.weapons.map((w, i): MechaWeapon => {
      if (i !== props.index) { return cloneWeapon(w); }
      return { ...cloneWeapon(w), area };
    });
    updateMecha(props.mecha.id, { weapons: newWeapons });
  }

  function handleNameBlur(e: FocusEvent): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const newWeapons = props.mecha.weapons.map((w, i): MechaWeapon => {
      if (i !== props.index) { return cloneWeapon(w); }
      return { ...cloneWeapon(w), name: value || w.name };
    });
    updateMecha(props.mecha.id, { weapons: newWeapons });
  }

  const baseName = () =>
    props.weapon.templateId ? weaponTemplatesById[props.weapon.templateId]?.name : undefined;

  const isBeam = () => props.weapon.keywords.includes('beam');

  return (
    <div class="p-4 rounded-lg border border-border bg-card space-y-2">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <Input
            value={props.weapon.name}
            onBlur={handleNameBlur}
            class="-mx-1 mb-1 h-auto py-0 px-1 text-sm font-medium border-transparent shadow-none hover:border-input"
          />
          <Show when={baseName() && baseName() !== props.weapon.name}>
            <p class="text-[11px] text-muted-foreground mb-2">{baseName()}</p>
          </Show>
          <div class="flex items-center gap-1.5 flex-wrap">
            <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">5 MP</Badge>
            <Show when={props.weapon.isCustom}>
              <Badge variant="outline" class="text-[10px] px-1.5 py-0">Custom</Badge>
            </Show>
            <KeywordBadges keywords={props.weapon.keywords} />
          </div>
          {/* Energy cost: computed for custom Beam weapons, stored for template Beam weapons */}
          <Show when={props.weapon.isCustom && isBeam()}>
            <p class="text-xs text-muted-foreground mt-0.5">
              Energy 1 · Boost {customBoostCost(props.weapon.abilities)}
            </p>
          </Show>
          <Show when={!props.weapon.isCustom && props.weapon.energyCost !== undefined}>
            <p class="text-xs text-muted-foreground mt-0.5">
              Energy cost: {props.weapon.energyCost}
            </p>
          </Show>
          <div class="flex gap-1 mt-2 flex-wrap">
            <For each={WEAPON_AREAS}>
              {(area) => (
                <button
                  onClick={() => handleAreaChange(area)}
                  class={cn(
                    'text-xs px-2 py-0.5 rounded border transition-colors capitalize',
                    props.weapon.area === area
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground',
                  )}
                >
                  {area}
                </button>
              )}
            </For>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          class="size-7 text-muted-foreground hover:text-destructive shrink-0 self-start"
          onClick={handleRemove}
        >
          ×
        </Button>
      </div>
    </div>
  );
}

// ── Available Weapon Row ──────────────────────────────────────────────────────

interface WeaponRowProps {
  mecha: Mecha;
  def: WeaponTemplateDefinition;
}

function WeaponRow(props: WeaponRowProps): JSX.Element {
  const [justAdded, setJustAdded] = createSignal(false);
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(flashTimer));

  function handleAdd(): void {
    const newWeapon: MechaWeapon = {
      id: crypto.randomUUID(),
      templateId: props.def.id,
      name: props.def.name,
      description: props.def.description,
      area: 'arms',
      keywords: [...props.def.keywords],
      energyCost: props.def.energyCost,
      abilities: [],
      isCustom: false,
    };
    const newWeapons = [...props.mecha.weapons.map(cloneWeapon), newWeapon];
    const newSpent = computeSpentMP(props.mecha.attributes, newWeapons, props.mecha.upgrades);
    updateMecha(props.mecha.id, { weapons: newWeapons, spentMP: newSpent });
    clearTimeout(flashTimer);
    setJustAdded(true);
    flashTimer = setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div class="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-sm font-medium">{props.def.name}</span>
          <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">5 MP</Badge>
          <KeywordBadges keywords={props.def.keywords} />
        </div>
        <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{props.def.effect}</p>
      </div>
      <Button
        size="sm"
        variant={justAdded() ? 'secondary' : 'outline'}
        class="h-7 px-2 text-xs shrink-0 transition-all"
        onClick={handleAdd}
      >
        {justAdded() ? '✓ Added' : '+'}
      </Button>
    </div>
  );
}

// ── Custom Weapon Builder ─────────────────────────────────────────────────────

interface CustomWeaponBuilderProps {
  mecha: Mecha;
  open: boolean;
  onClose: () => void;
}

function CustomWeaponBuilder(props: CustomWeaponBuilderProps): JSX.Element {
  const [name, setName] = createSignal('');
  const [baseType, setBaseType] = createSignal<BaseType>('melee');
  const [selected, setSelected] = createSignal(new Set<string>());
  const [abilityLabels, setAbilityLabels] = createSignal<Record<string, string>>({});

  const remainingWP = () => {
    const spent = [...selected()].reduce(
      (sum, id) => sum + (weaponAbilitiesById[id]?.wpCost ?? 0),
      0,
    );
    return BASE_WP[baseType()] - spent;
  };

  const isBeam = () => selected().has('beam');

  const boostCost = () =>
    1 + [...selected()].filter(
      (id) => id !== 'beam' && (weaponAbilitiesById[id]?.wpCost ?? 0) >= 0,
    ).length;

  const hasInnateWithoutDrawback = () =>
    selected().has('innate-advantage') &&
    !DRAWBACK_IDS.some((id) => selected().has(id));

  const canSave = () =>
    name().trim() !== '' && remainingWP() >= 0 && !hasInnateWithoutDrawback();

  function canSelectAbility(id: string): boolean {
    const def = weaponAbilitiesById[id];
    if (!def) { return false; }
    if (remainingWP() - def.wpCost < 0) { return false; }
    if (AREA_EXCLUSIVE_IDS.has(id) && [...selected()].some((s) => AREA_EXCLUSIVE_IDS.has(s))) {
      return false;
    }
    if (id === 'slow' && selected().has('one-shot')) { return false; }
    return !(id === 'one-shot' && selected().has('slow'));
  }

  function canDeselectAbility(id: string): boolean {
    const def = weaponAbilitiesById[id];
    if (!def) { return true; }
    // Removing a drawback (negative wpCost) reduces remaining WP — guard against going negative
    return remainingWP() + def.wpCost >= 0;
  }

  function toggleAbility(id: string): void {
    const next = new Set(selected());
    if (next.has(id)) {
      if (!canDeselectAbility(id)) { return; }
      next.delete(id);
    } else {
      if (!canSelectAbility(id)) { return; }
      next.add(id);
    }
    setSelected(next);
  }

  function handleSave(): void {
    const n = name().trim();
    if (!n) { return; }

    const keywords: string[] = [baseType()];
    for (const id of selected()) {
      const kw = ABILITY_KEYWORD[id];
      if (kw && !keywords.includes(kw)) { keywords.push(kw); }
    }

    const abilities = [...selected()]
      .map((id) => {
        const def = weaponAbilitiesById[id];
        if (!def) { return null; }
        const label = abilityLabels()[id]?.trim() || undefined;
        return { abilityTemplateId: id, name: def.name, description: def.description, wpCost: def.wpCost, label };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    const newWeapon: MechaWeapon = {
      id: crypto.randomUUID(),
      name: n,
      area: 'arms',
      keywords,
      energyCost: isBeam() ? 1 : undefined,
      abilities,
      isCustom: true,
    };

    const newWeapons = [...props.mecha.weapons.map(cloneWeapon), newWeapon];
    const newSpent = computeSpentMP(props.mecha.attributes, newWeapons, props.mecha.upgrades);
    updateMecha(props.mecha.id, { weapons: newWeapons, spentMP: newSpent });

    // Reset for next use
    setName('');
    setBaseType('melee');
    setSelected(new Set<string>());
    setAbilityLabels({});
    props.onClose();
  }

  return (
    <DialogPrimitive.Root open={props.open} onOpenChange={(v) => { if (!v) { props.onClose(); } }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay class="fixed inset-0 z-50 bg-black/75" />
        <DialogPrimitive.Content class={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
          'rounded-lg border border-border bg-card shadow-xl',
          'flex flex-col max-h-[85vh]',
        )}>
          {/* Header */}
          <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
            <DialogPrimitive.Title class="text-base font-semibold">
              Build Custom Weapon
            </DialogPrimitive.Title>
            <DialogPrimitive.CloseButton class="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">
              ×
            </DialogPrimitive.CloseButton>
          </div>

          {/* Scrollable body */}
          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Disclaimer */}
            <div class="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2.5 space-y-1 leading-relaxed">
              <p><span class="font-medium text-foreground">GM permission required.</span> Custom Weapons are ripe for exploitation — only use this system when the whole group is on board.</p>
              <p><span class="font-medium text-foreground">Justify it narratively.</span> Your weapon's quirks should make sense in the setting.</p>
              <p><span class="font-medium text-foreground">Check the premades first.</span> Many weapons in Chapter 3 are strictly stronger than anything this system can produce.</p>
            </div>

            {/* Name */}
            <div class="space-y-1.5">
              <p class="text-sm font-medium">Name</p>
              <Input
                value={name()}
                onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
                placeholder="Custom weapon name…"
              />
            </div>

            {/* Base type + WP counter */}
            <div class="flex items-center justify-between gap-4">
              <div class="flex gap-1">
                <For each={(['melee', 'shooting'] as const)}>
                  {(type) => (
                    <button
                      onClick={() => setBaseType(type)}
                      class={cn(
                        'px-3 py-1 rounded text-sm font-medium transition-colors capitalize',
                        baseType() === type
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {type}
                    </button>
                  )}
                </For>
              </div>
              <span class={cn(
                'text-sm font-mono shrink-0',
                remainingWP() < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground',
              )}>
                {remainingWP()} / {BASE_WP[baseType()]} WP
              </span>
            </div>

            {/* Beam callout */}
            <Show when={isBeam()}>
              <div class="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 leading-relaxed">
                Base energy 1 · Boost energy {boostCost()}. All abilities except Remote apply only when Boosted.
              </div>
            </Show>

            {/* Ability groups */}
            <div class="space-y-4">
              <For each={ABILITY_GROUPS}>
                {(group) => (
                  <div>
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      {group.label}
                    </p>
                    <div class="space-y-0.5">
                      <For each={group.ids}>
                        {(id) => {
                          const def = weaponAbilitiesById[id];
                          if (!def) { return null; }
                          const isSelected = () => selected().has(id);
                          const isToggleable = () =>
                            isSelected() ? canDeselectAbility(id) : canSelectAbility(id);

                          return (
                            <div>
                              <button
                                onClick={() => toggleAbility(id)}
                                disabled={!isToggleable()}
                                class={cn(
                                  'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-left transition-colors',
                                  isSelected()
                                    ? 'bg-primary/10 text-foreground'
                                    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground',
                                  !isToggleable() && 'opacity-40 cursor-not-allowed',
                                )}
                              >
                                <span class="flex items-center gap-2 min-w-0 text-sm">
                                  <span class={cn(
                                    'size-4 shrink-0 rounded-sm border flex items-center justify-center text-[10px] leading-none',
                                    isSelected()
                                      ? 'bg-primary border-primary text-primary-foreground'
                                      : 'border-border',
                                  )}>
                                    {isSelected() ? '✓' : ''}
                                  </span>
                                  <span class="truncate">{def.name}</span>
                                </span>
                                <span class={cn(
                                  'text-xs font-mono shrink-0',
                                  def.wpCost < 0 ? 'text-green-600 dark:text-green-400' : '',
                                )}>
                                  {def.wpCost > 0 ? `+${def.wpCost}` : def.wpCost} WP
                                </span>
                              </button>
                              <Show when={id === 'conditional-advantage' && isSelected()}>
                                <Input
                                  value={abilityLabels()['conditional-advantage'] ?? ''}
                                  onInput={(e) => setAbilityLabels({
                                    ...abilityLabels(),
                                    'conditional-advantage': (e.currentTarget as HTMLInputElement).value,
                                  })}
                                  placeholder="Condition (e.g. target has lost 2+ Threshold levels)…"
                                  class="mt-1 h-7 text-xs ml-6"
                                />
                              </Show>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <Show when={hasInnateWithoutDrawback()}>
              <p class="text-xs text-destructive">
                Innate Advantage requires at least one drawback.
              </p>
            </Show>
          </div>

          {/* Footer */}
          <div class="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            <Button variant="outline" size="sm" onClick={props.onClose}>Cancel</Button>
            <Button size="sm" disabled={!canSave()} onClick={handleSave}>Add Weapon</Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function WeaponTab(props: WeaponTabProps): JSX.Element {
  const [filter, setFilter] = createSignal<WeaponFilter>('all');
  const [search, setSearch] = createSignal('');
  const [builderOpen, setBuilderOpen] = createSignal(false);

  const takenWeapons = () =>
    props.mecha.weapons.map((w, i) => ({ weapon: w, index: i }));

  const filteredAvailable = () => {
    const q = search().toLowerCase();
    return PURCHASABLE_WEAPONS.filter((def) => {
      if (!matchesFilter(def.keywords, filter())) { return false; }
      return !(q && !def.name.toLowerCase().includes(q) && !def.effect.toLowerCase().includes(q));
    });
  };

  return (
    <div class="space-y-6 pt-4">
      {/* Default weapons */}
      <div>
        <h3 class="text-sm font-semibold mb-2">Built-in</h3>
        <p class="text-xs text-muted-foreground mb-3">
          Every mecha includes CQC and Vulcans at no MP cost. They cannot be disabled by Maiming.
        </p>
        <div class="space-y-2">
          <For each={DEFAULT_WEAPONS}>
            {(def) => <DefaultWeaponCard mecha={props.mecha} def={def} />}
          </For>
        </div>
      </div>

      <Separator />

      {/* Equipped weapons */}
      <Show when={takenWeapons().length > 0}>
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">Equipped</h3>
          <div class="space-y-3">
            <For each={takenWeapons()}>
              {({ weapon, index }) => (
                <TakenWeaponCard mecha={props.mecha} weapon={weapon} index={index} />
              )}
            </For>
          </div>
        </div>
        <Separator />
      </Show>

      {/* Available weapons */}
      <div class="space-y-3">
        <h3 class="text-sm font-semibold">Available</h3>

        {/* Filter + search + custom builder */}
        <div class="flex gap-2 flex-wrap items-center">
          <div class="flex gap-1">
            <For each={FILTER_TABS}>
              {(tab) => (
                <button
                  onClick={() => setFilter(tab.key)}
                  class={cn(
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    filter() === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                >
                  {tab.label}
                </button>
              )}
            </For>
          </div>
          <Input
            value={search()}
            onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
            placeholder="Search weapons…"
            class="h-7 text-xs flex-1 min-w-32 max-w-xs"
          />
          <Button
            size="sm"
            variant="outline"
            class="h-7 px-2 text-xs shrink-0"
            onClick={() => setBuilderOpen(true)}
          >
            + Custom
          </Button>
        </div>

        <For each={filteredAvailable()}>
          {(def) => <WeaponRow mecha={props.mecha} def={def} />}
        </For>

        <Show when={filteredAvailable().length === 0}>
          <p class="text-sm text-muted-foreground py-4 text-center">No weapons match this filter.</p>
        </Show>
      </div>

      <CustomWeaponBuilder
        mecha={props.mecha}
        open={builderOpen()}
        onClose={() => setBuilderOpen(false)}
      />
    </div>
  );
}
