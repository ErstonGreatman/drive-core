import type { JSX } from 'solid-js';
import { createSignal, For, Show, onCleanup } from 'solid-js';
import type { Mecha, MechaWeapon } from '~/types/mecha';
import { updateMecha } from '~/stores/mecha';
import { weaponTemplates, weaponKeywordsById, weaponTemplatesById } from '~/data';
import type { WeaponTemplateDefinition } from '~/data';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

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

function matchesFilter(keywords: string[], filter: WeaponFilter): boolean {
  if (filter === 'all') { return true; }
  if (filter === 'beam') { return keywords.includes('beam'); }
  // melee/shooting: primary type but not beam
  return keywords.includes(filter) && !keywords.includes('beam');
}

function primaryKeyword(keywords: string[]): string {
  if (keywords.includes('beam')) { return 'beam'; }
  if (keywords.includes('melee')) { return 'melee'; }
  return 'shooting';
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

  return (
    <div class="p-4 rounded-lg border border-border bg-card space-y-2">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <Input
            value={props.weapon.name}
            onBlur={handleNameBlur}
            class="-mx-1 mb-1 h-auto py-0 px-1 text-sm font-medium border-transparent shadow-none hover:border-input"
          />
          <Show when={props.weapon.templateId && weaponTemplatesById[props.weapon.templateId]?.name !== props.weapon.name}>
            <p class="text-[11px] text-muted-foreground mb-2">
              {weaponTemplatesById[props.weapon.templateId!]?.name}
            </p>
          </Show>
          <div class="flex items-center gap-1.5 flex-wrap">
            <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">5 MP</Badge>
            <KeywordBadges keywords={props.weapon.keywords} />
          </div>
          <Show when={props.weapon.energyCost !== undefined}>
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

// ── Main Component ────────────────────────────────────────────────────────────

export function WeaponTab(props: WeaponTabProps): JSX.Element {
  const [filter, setFilter] = createSignal<WeaponFilter>('all');
  const [search, setSearch] = createSignal('');

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
            {(def) => (
              <div class="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-sm font-medium">{def.name}</span>
                  <Badge variant="secondary" class="text-[10px] px-1.5 py-0 font-mono">Free</Badge>
                  <KeywordBadges keywords={def.keywords} />
                </div>
                <p class="text-xs text-muted-foreground leading-snug">{def.effect}</p>
              </div>
            )}
          </For>
        </div>
      </div>

      <Separator />

      {/* Taken purchased weapons */}
      <Show when={takenWeapons().length > 0}>
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">Equipped</h3>
          <div class="space-y-3">
            <For each={takenWeapons()}>
              {({ weapon, index }) => (
                <TakenWeaponCard
                  mecha={props.mecha}
                  weapon={weapon}
                  index={index}
                />
              )}
            </For>
          </div>
        </div>
        <Separator />
      </Show>

      {/* Available weapons */}
      <div class="space-y-3">
        <h3 class="text-sm font-semibold">Available</h3>

        {/* Filter + search */}
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
        </div>

        <For each={filteredAvailable()}>
          {(def) => (
            <WeaponRow
              mecha={props.mecha}
              def={def}
            />
          )}
        </For>

        <Show when={filteredAvailable().length === 0}>
          <p class="text-sm text-muted-foreground py-4 text-center">No weapons match this filter.</p>
        </Show>
      </div>
    </div>
  );
}
