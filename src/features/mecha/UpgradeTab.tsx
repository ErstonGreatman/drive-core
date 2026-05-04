import type { JSX } from 'solid-js';
import { createSignal, For, Show, onCleanup } from 'solid-js';
import type { Mecha, MechaUpgrade, MechaSubUpgrade, MechaWeapon, MechaAttributeKey } from '~/types/mecha';
import type { UpgradeType } from '~/types/mecha';
import { updateMecha } from '~/stores/mecha';
import { upgradeTemplates, upgradeTemplatesById, weaponTemplates, weaponKeywordsById } from '~/data';
import type { UpgradeTemplateDefinition } from '~/data';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

interface UpgradeTabProps {
  mecha: Mecha;
}

const EXTERNAL_AREAS = ['head', 'torso', 'arms', 'legs'] as const;
type ExternalArea = (typeof EXTERNAL_AREAS)[number];

// Attributes valid for Frame / Transformation swap
const SWAP_ATTR_OPTIONS: MechaAttributeKey[] = ['might', 'guard', 'systems', 'speed'];

const SUB_POOL_CAPACITY = 30;

const UPGRADE_TYPE_TABS: { key: UpgradeType; label: string; description: string }[] = [
  {
    key: 'internal',
    label: 'Internal',
    description: "Installed in the Core. Modify the Gear's fundamental systems and combat style.",
  },
  {
    key: 'external',
    label: 'External',
    description: 'Mounted to a specific Area (Head/Torso/Arms/Legs). Can be lost to Maiming.',
  },
  {
    key: 'separate',
    label: 'Separate',
    description: 'Stored separately and used on-demand. Support systems and tactical equipment.',
  },
];

const SUBCATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  'active-defense': 'Active Defense',
  restoration: 'Restoration',
  mobility: 'Mobility',
  support: 'Support',
  'extra-area': 'Extra Area',
  'alternate-form': 'Alternate Form',
  combination: 'Combination',
  feature: 'Features',
};

// ── Clone helpers ──────────────────────────────────────────────────────────────

function cloneSubUpgrade(u: MechaSubUpgrade): MechaSubUpgrade {
  return {
    id: u.id,
    templateId: u.templateId,
    name: u.name,
    description: u.description,
    upgradeType: u.upgradeType,
    area: u.area,
    effect: u.effect,
    mpCost: u.mpCost,
    specialistLabel: u.specialistLabel,
  };
}

function cloneSubWeapon(w: MechaWeapon): MechaWeapon {
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

function cloneUpgrade(u: MechaUpgrade): MechaUpgrade {
  return {
    id: u.id,
    templateId: u.templateId,
    name: u.name,
    description: u.description,
    upgradeType: u.upgradeType,
    area: u.area,
    effect: u.effect,
    mpCost: u.mpCost,
    specialistLabel: u.specialistLabel,
    swapAttributes: u.swapAttributes ? [u.swapAttributes[0], u.swapAttributes[1]] : undefined,
    terrainType: u.terrainType,
    customMpCost: u.customMpCost,
    subItems: u.subItems
      ? {
          weapons: u.subItems.weapons.map(cloneSubWeapon),
          upgrades: u.subItems.upgrades.map(cloneSubUpgrade),
        }
      : undefined,
  };
}

// ── Sub-item capacity helpers ─────────────────────────────────────────────────

function subItemsUsedMP(u: MechaUpgrade): number {
  if (!u.subItems) { return 0; }
  return u.subItems.weapons.length * 5 +
    u.subItems.upgrades.reduce((s, sub) => s + sub.mpCost, 0);
}

// ── Sub-pool builder ──────────────────────────────────────────────────────────

interface SubPoolBuilderProps {
  mecha: Mecha;
  upgradeIndex: number;
}

function SubPoolBuilder(props: SubPoolBuilderProps): JSX.Element {
  const [weaponSearch, setWeaponSearch] = createSignal('');
  const [upgradeSearch, setUpgradeSearch] = createSignal('');

  const upgrade = () => props.mecha.upgrades[props.upgradeIndex];
  const usedMP = () => subItemsUsedMP(upgrade());
  const remaining = () => SUB_POOL_CAPACITY - usedMP();

  function patchSubItems(
    patcher: (items: { weapons: MechaWeapon[]; upgrades: MechaSubUpgrade[] }) => {
      weapons: MechaWeapon[];
      upgrades: MechaSubUpgrade[];
    },
  ): void {
    const current = upgrade().subItems ?? { weapons: [], upgrades: [] };
    const next = patcher({
      weapons: current.weapons.map(cloneSubWeapon),
      upgrades: current.upgrades.map(cloneSubUpgrade),
    });
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.upgradeIndex) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), subItems: next };
    });
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
  }

  function handleAddSubWeapon(def: (typeof weaponTemplates)[number]): void {
    patchSubItems((items) => ({
      ...items,
      weapons: [...items.weapons, {
        id: crypto.randomUUID(),
        templateId: def.id,
        name: def.name,
        description: def.description,
        area: 'separate' as const,
        keywords: [...def.keywords],
        energyCost: def.energyCost,
        abilities: [],
        isCustom: false,
      }],
    }));
  }

  function handleRemoveSubWeapon(idx: number): void {
    patchSubItems((items) => ({
      ...items,
      weapons: items.weapons.filter((_, i) => i !== idx),
    }));
  }

  function handleAddSubUpgrade(def: UpgradeTemplateDefinition): void {
    patchSubItems((items) => ({
      ...items,
      upgrades: [...items.upgrades, {
        id: crypto.randomUUID(),
        templateId: def.id,
        name: def.name,
        description: def.description,
        upgradeType: def.upgradeType,
        area: 'separate' as const,
        effect: def.effect,
        mpCost: def.mpCost ?? 0,
      }],
    }));
  }

  function handleRemoveSubUpgrade(idx: number): void {
    patchSubItems((items) => ({
      ...items,
      upgrades: items.upgrades.filter((_, i) => i !== idx),
    }));
  }

  const availableWeapons = () => {
    const q = weaponSearch().toLowerCase();
    return weaponTemplates.filter((w) =>
      !w.isDefault && (
        !q || w.name.toLowerCase().includes(q)
      )
    );
  };

  const availableUpgrades = () => {
    const q = upgradeSearch().toLowerCase();
    return upgradeTemplates.filter((u) =>
      u.upgradeType === 'external' && (
        !q || u.name.toLowerCase().includes(q)
      )
    );
  };

  return (
    <div class="mt-3 space-y-3 border-t border-border/50 pt-3">
      {/* Capacity indicator */}
      <div class="flex items-center justify-between text-xs">
        <span class="font-medium text-muted-foreground">Pack contents</span>
        <span class={cn(
          'font-mono',
          usedMP() > SUB_POOL_CAPACITY ? 'text-destructive' : 'text-foreground',
        )}>
          {usedMP()} / {SUB_POOL_CAPACITY} MP
        </span>
      </div>

      {/* Current sub-weapons */}
      <Show when={(upgrade().subItems?.weapons.length ?? 0) > 0}>
        <div class="space-y-1">
          <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Weapons</p>
          <For each={upgrade().subItems!.weapons}>
            {(w, i) => (
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-medium flex-1 min-w-0 truncate">{w.name}</span>
                <Badge variant="muted" class="text-[10px] px-1 py-0 font-mono shrink-0">5 MP</Badge>
                <button
                  onClick={() => handleRemoveSubWeapon(i())}
                  class="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Current sub-upgrades */}
      <Show when={(upgrade().subItems?.upgrades.length ?? 0) > 0}>
        <div class="space-y-1">
          <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">External Upgrades</p>
          <For each={upgrade().subItems!.upgrades}>
            {(u, i) => (
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-medium flex-1 min-w-0 truncate">{u.name}</span>
                <Badge variant="muted" class="text-[10px] px-1 py-0 font-mono shrink-0">{u.mpCost} MP</Badge>
                <button
                  onClick={() => handleRemoveSubUpgrade(i())}
                  class="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Add weapons */}
      <div class="space-y-1.5">
        <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Add Weapon (5 MP each)</p>
        <Input
          value={weaponSearch()}
          onInput={(e) => setWeaponSearch((e.currentTarget as HTMLInputElement).value)}
          placeholder="Search weapons…"
          class="h-6 text-[11px]"
        />
        <div class="max-h-32 overflow-y-auto space-y-0.5">
          <For each={availableWeapons()}>
            {(def) => (
              <div class="flex items-center justify-between gap-2 py-0.5">
                <span class="text-xs truncate flex-1">{def.name}</span>
                <div class="flex gap-1 shrink-0">
                  <For each={def.keywords.slice(0, 2)}>
                    {(kw) => (
                      <Badge variant="outline" class="text-[9px] px-1 py-0 capitalize">
                        {weaponKeywordsById[kw]?.name ?? kw}
                      </Badge>
                    )}
                  </For>
                </div>
                <button
                  onClick={() => handleAddSubWeapon(def)}
                  class="text-[11px] px-1.5 py-0.5 rounded border transition-colors shrink-0 border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                >
                  +
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Add external upgrades */}
      <div class="space-y-1.5">
        <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Add External Upgrade</p>
        <Input
          value={upgradeSearch()}
          onInput={(e) => setUpgradeSearch((e.currentTarget as HTMLInputElement).value)}
          placeholder="Search upgrades…"
          class="h-6 text-[11px]"
        />
        <div class="max-h-32 overflow-y-auto space-y-0.5">
          <For each={availableUpgrades()}>
            {(def) => (
              <div class="flex items-center justify-between gap-2 py-0.5">
                <span class="text-xs truncate flex-1">{def.name}</span>
                <Badge variant="muted" class="text-[9px] px-1 py-0 font-mono shrink-0">{def.mpCost ?? '?'} MP</Badge>
                <button
                  onClick={() => handleAddSubUpgrade(def)}
                  class="text-[11px] px-1.5 py-0.5 rounded border transition-colors shrink-0 border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                >
                  +
                </button>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

// ── Taken Upgrade Card ─────────────────────────────────────────────────────────

interface TakenUpgradeCardProps {
  mecha: Mecha;
  upgrade: MechaUpgrade;
  index: number;
  def: UpgradeTemplateDefinition | undefined;
}

function TakenUpgradeCard(props: TakenUpgradeCardProps): JSX.Element {
  function handleRemove(): void {
    const newUpgrades = props.mecha.upgrades
      .filter((_, i) => i !== props.index)
      .map(cloneUpgrade);
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
  }

  function handleAreaChange(area: ExternalArea): void {
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), area };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
  }

  function handleLabelBlur(e: FocusEvent): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), specialistLabel: value || undefined };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
  }

  function handleSwapAttrToggle(attr: MechaAttributeKey): void {
    const current = props.upgrade.swapAttributes;
    let next: [MechaAttributeKey, MechaAttributeKey] | undefined;
    if (current?.includes(attr)) {
      // deselect — clear the pair
      next = undefined;
    } else if (!current) {
      // first selection — can't form a pair yet; store as partial by convention:
      // use same value twice to signal "one chosen" — UI prevents submitting partial
      next = [attr, attr];
    } else if (current[0] === current[1]) {
      // second selection — form the pair
      next = [current[0], attr];
    } else {
      // replace the pair with a fresh first selection
      next = [attr, attr];
    }
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), swapAttributes: next };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
  }

  function handleTerrainChange(terrain: 'water' | 'space' | 'land'): void {
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), terrainType: terrain };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
  }

  function handleCustomMpBlur(e: FocusEvent): void {
    const raw = (e.currentTarget as HTMLInputElement).value.trim();
    const value = Math.max(0, parseInt(raw, 10) || 0);
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), customMpCost: value };
    });
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
  }

  const isSwapUpgrade = () =>
    props.upgrade.templateId === 'frame' || props.upgrade.templateId === 'transformation';

  const swapAttrs = () => props.upgrade.swapAttributes;
  const isAttrSelected = (attr: MechaAttributeKey) => {
    const s = swapAttrs();
    if (!s) { return false; }
    if (s[0] === s[1]) { return s[0] === attr; } // partial selection
    return s[0] === attr || s[1] === attr;
  };
  const isSwapComplete = () => {
    const s = swapAttrs();
    return !!s && s[0] !== s[1];
  };
  const isAttrDisabled = (attr: MechaAttributeKey) => {
    if (isAttrSelected(attr)) { return false; }
    const s = swapAttrs();
    return !!s && s[0] !== s[1]; // pair is complete, nothing else selectable
  };

  const isSubPool = () =>
    props.upgrade.templateId === 'expansion-pack' ||
    props.upgrade.templateId === 'secret-equipment';

  return (
    <div class="p-3 rounded-lg border border-border bg-card space-y-2">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-medium">{props.upgrade.name}</span>
            <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">
              {props.upgrade.templateId === 'invincible-super-combination'
                ? `${props.upgrade.customMpCost ?? 0} MP`
                : props.upgrade.mpCost > 0
                  ? `${props.upgrade.mpCost} MP`
                  : 'Free'}
            </Badge>
          </div>

          {/* Area placement */}
          <Show when={props.upgrade.upgradeType === 'external'}>
            <div class="flex gap-1 mt-1.5 flex-wrap">
              <For each={EXTERNAL_AREAS}>
                {(area) => (
                  <button
                    onClick={() => handleAreaChange(area)}
                    class={cn(
                      'text-xs px-2 py-0.5 rounded border transition-colors capitalize',
                      props.upgrade.area === area
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground',
                    )}
                  >
                    {area}
                  </button>
                )}
              </For>
            </div>
          </Show>
          <Show when={props.upgrade.upgradeType !== 'external'}>
            <Badge variant="outline" class="mt-1.5 text-[10px] px-1.5 py-0">
              {props.upgrade.upgradeType === 'internal' ? 'Core' : 'Separate'}
            </Badge>
          </Show>

          {/* Specialist label */}
          <Show when={props.def?.isSpecialist}>
            <Input
              value={props.upgrade.specialistLabel ?? ''}
              placeholder="Enter specialization…"
              onBlur={handleLabelBlur}
              class="mt-1.5 h-7 text-xs"
            />
          </Show>

          {/* Frame / Transformation: swap attribute picker */}
          <Show when={isSwapUpgrade()}>
            <div class="mt-2 space-y-1">
              <p class="text-xs text-muted-foreground">
                Choose two attributes to swap values
                {isSwapComplete() ? ':' : ' (select one, then another):'}
              </p>
              <div class="flex gap-1 flex-wrap">
                <For each={SWAP_ATTR_OPTIONS}>
                  {(attr) => (
                    <button
                      onClick={() => handleSwapAttrToggle(attr)}
                      disabled={isAttrDisabled(attr)}
                      class={cn(
                        'text-xs px-2 py-0.5 rounded border transition-colors capitalize',
                        isAttrSelected(attr)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-foreground',
                        isAttrDisabled(attr) && 'opacity-40 cursor-not-allowed',
                      )}
                    >
                      {attr}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Terrain Specialist: terrain type picker */}
          <Show when={props.upgrade.templateId === 'terrain-specialist'}>
            <div class="mt-2 space-y-1">
              <p class="text-xs text-muted-foreground">Choose terrain type:</p>
              <div class="flex gap-1">
                <For each={(['water', 'space', 'land'] as const)}>
                  {(terrain) => (
                    <button
                      onClick={() => handleTerrainChange(terrain)}
                      class={cn(
                        'text-xs px-2 py-0.5 rounded border transition-colors capitalize',
                        props.upgrade.terrainType === terrain
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-foreground',
                      )}
                    >
                      {terrain}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Invincible Super Combination: variable MP cost */}
          <Show when={props.upgrade.templateId === 'invincible-super-combination'}>
            <div class="mt-2 space-y-1">
              <p class="text-xs text-muted-foreground">
                MP cost scales with Power Level (PL 0 = 20, each PL adds 10):
              </p>
              <Input
                type="number"
                min={0}
                value={props.upgrade.customMpCost ?? 0}
                onBlur={handleCustomMpBlur}
                class="h-7 text-xs w-24"
              />
            </div>
          </Show>

          {/* Expansion Pack / Secret Equipment: sub-pool builder */}
          <Show when={isSubPool()}>
            <SubPoolBuilder
              mecha={props.mecha}
              upgradeIndex={props.index}
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
    </div>
  );
}

// ── Available Upgrade Row ──────────────────────────────────────────────────────

interface UpgradeRowProps {
  mecha: Mecha;
  def: UpgradeTemplateDefinition;
  alreadyTaken: boolean;
}

function UpgradeRow(props: UpgradeRowProps): JSX.Element {
  const [justAdded, setJustAdded] = createSignal(false);
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(flashTimer));

  function handleAdd(): void {
    const area = props.def.upgradeType === 'internal' ? 'core'
      : props.def.upgradeType === 'separate' ? 'separate'
      : 'torso';
    const newUpgrade: MechaUpgrade = {
      id: crypto.randomUUID(),
      templateId: props.def.id,
      name: props.def.name,
      description: props.def.description,
      upgradeType: props.def.upgradeType,
      area,
      effect: props.def.effect,
      mpCost: props.def.mpCost ?? 0,
    };
    const newUpgrades = [...props.mecha.upgrades.map(cloneUpgrade), newUpgrade];
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
    clearTimeout(flashTimer);
    setJustAdded(true);
    flashTimer = setTimeout(() => setJustAdded(false), 2000);
  }

  const costLabel = () => {
    const cost = props.def.mpCost;
    if (cost === undefined) { return 'Variable'; }
    if (cost === 0) { return 'Free'; }
    return `${cost} MP`;
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
            {costLabel()}
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

// ── Main Component ────────────────────────────────────────────────────────────

export function UpgradeTab(props: UpgradeTabProps): JSX.Element {
  const [activeType, setActiveType] = createSignal<UpgradeType>('internal');

  const takenIds = () => new Set(props.mecha.upgrades.map((u) => u.templateId).filter(Boolean));

  const takenInType = () =>
    props.mecha.upgrades
      .map((u, i) => ({ upgrade: u, def: upgradeTemplatesById[u.templateId ?? ''], index: i }))
      .filter((x): x is typeof x & { def: UpgradeTemplateDefinition } =>
        !!x.def && x.upgrade.upgradeType === activeType(),
      );

  const availableBySubcategory = () => {
    const byType = upgradeTemplates.filter((t) => t.upgradeType === activeType());
    const map = new Map<string, UpgradeTemplateDefinition[]>();
    for (const def of byType) {
      const group = map.get(def.upgradeSubcategory) ?? [];
      group.push(def);
      map.set(def.upgradeSubcategory, group);
    }
    return map;
  };

  return (
    <div class="space-y-6 pt-4">
      {/* Type tabs */}
      <div class="flex gap-1 flex-wrap">
        <For each={UPGRADE_TYPE_TABS}>
          {(tab) => {
            const count = () => props.mecha.upgrades.filter((u) => u.upgradeType === tab.key).length;
            return (
              <button
                onClick={() => setActiveType(tab.key)}
                class={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeType() === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
              >
                {tab.label}
                <Show when={count() > 0}>
                  <span class="ml-1.5 text-xs opacity-70">({count()})</span>
                </Show>
              </button>
            );
          }}
        </For>
      </div>

      {/* Type description */}
      <For each={UPGRADE_TYPE_TABS}>
        {(tab) => (
          <Show when={activeType() === tab.key}>
            <p class="text-xs text-muted-foreground -mt-4">{tab.description}</p>
          </Show>
        )}
      </For>

      {/* Taken upgrades */}
      <Show when={takenInType().length > 0}>
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">Installed</h3>
          <div class="space-y-2">
            <For each={takenInType()}>
              {({ upgrade, def, index }) => (
                <TakenUpgradeCard
                  mecha={props.mecha}
                  upgrade={upgrade}
                  index={index}
                  def={def}
                />
              )}
            </For>
          </div>
        </div>
        <Separator />
      </Show>

      {/* Available upgrades by subcategory */}
      <div class="space-y-4">
        <h3 class="text-sm font-semibold">Available</h3>
        <For each={[...availableBySubcategory().entries()]}>
          {([subcategory, defs]) => (
            <div>
              <Show when={availableBySubcategory().size > 1}>
                <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  {SUBCATEGORY_LABELS[subcategory] ?? subcategory}
                </p>
              </Show>
              <For each={defs}>
                {(def) => (
                  <UpgradeRow
                    mecha={props.mecha}
                    def={def}
                    alreadyTaken={takenIds().has(def.id)}
                  />
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
