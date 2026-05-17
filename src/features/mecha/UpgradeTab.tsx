import type { JSX } from 'solid-js';
import { createSignal, For, Show, onCleanup } from 'solid-js';
import type { Mecha, MechaUpgrade, MechaSubUpgrade, MechaWeapon, MechaAttributeKey, FormPool } from '~/types/mecha';
import type { UpgradeType } from '~/types/mecha';
import { updateMecha } from '~/stores/mecha';
import { upgradeTemplates, upgradeTemplatesById, weaponTemplates, weaponTemplatesById, weaponKeywordsById } from '~/data';
import type { UpgradeTemplateDefinition } from '~/data';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';
import * as DialogPrimitive from '@kobalte/core/dialog';

interface UpgradeTabProps {
  mecha: Mecha;
}

const EXTERNAL_AREAS = ['head', 'torso', 'arms', 'legs'] as const;
type ExternalArea = (typeof EXTERNAL_AREAS)[number];

// Attributes valid for Frame / Transformation swap
const SWAP_ATTR_OPTIONS: MechaAttributeKey[] = ['might', 'guard', 'systems', 'speed'];

const SUB_POOL_CAPACITY = 30;

const REPEATABLE_IDS = new Set(['frame', 'transformation']);
const FORM_POOL_CAPACITY = 10;

type WeaponFilter = 'all' | 'melee' | 'shooting' | 'beam';
const WEAPON_FILTER_TABS: { key: WeaponFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'melee', label: 'Melee' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'beam', label: 'Beam' },
];

type PoolItemTab = 'weapons' | 'upgrades' | 'features';
const POOL_ITEM_TABS: { key: PoolItemTab; label: string }[] = [
  { key: 'upgrades', label: 'Upgrades' },
  { key: 'features', label: 'Features' },
  { key: 'weapons', label: 'Weapons' },
];

function matchesWeaponFilter(keywords: string[], filter: WeaponFilter): boolean {
  if (filter === 'all') { return true; }
  if (filter === 'beam') { return keywords.includes('beam'); }
  return keywords.includes(filter) && !keywords.includes('beam');
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

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
      label: a.label,
    })),
    isCustom: w.isCustom,
  };
}

function cloneFormPool(p: FormPool): FormPool {
  return {
    id: p.id,
    label: p.label,
    swapAttributes: p.swapAttributes ? [p.swapAttributes[0], p.swapAttributes[1]] : undefined,
    weapons: p.weapons.map(cloneSubWeapon),
    upgrades: p.upgrades.map(cloneSubUpgrade),
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
    formPools: u.formPools ? u.formPools.map(cloneFormPool) : undefined,
  };
}

// ── Sub-item capacity helpers ─────────────────────────────────────────────────

function subItemsUsedMP(u: MechaUpgrade): number {
  if (!u.subItems) { return 0; }
  return u.subItems.weapons.length * 5 +
    u.subItems.upgrades.reduce((s, sub) => s + sub.mpCost, 0);
}

// ── Sub-pool modal (Expansion Pack / Secret Equipment) ───────────────────────

interface SubPoolModalProps {
  mecha: Mecha;
  upgradeIndex: number;
}

function SubPoolModal(props: SubPoolModalProps): JSX.Element {
  const [open, setOpen] = createSignal(false);
  const [itemTab, setItemTab] = createSignal<PoolItemTab>('upgrades');
  const [weaponFilter, setWeaponFilter] = createSignal<WeaponFilter>('all');
  const [weaponSearch, setWeaponSearch] = createSignal('');
  const [upgradeSearch, setUpgradeSearch] = createSignal('');

  const upgrade = () => props.mecha.upgrades[props.upgradeIndex];
  const usedMP = () => subItemsUsedMP(upgrade());
  const currentWeapons = () => upgrade().subItems?.weapons ?? [];
  const currentUpgrades = () => upgrade().subItems?.upgrades ?? [];

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
        id: crypto.randomUUID(), templateId: def.id, name: def.name,
        description: def.description, area: 'separate' as const,
        keywords: [...def.keywords], energyCost: def.energyCost, abilities: [], isCustom: false,
      }],
    }));
  }

  function handleRemoveSubWeapon(idx: number): void {
    patchSubItems((items) => ({ ...items, weapons: items.weapons.filter((_, i) => i !== idx) }));
  }

  function handleSubWeaponNameBlur(e: FocusEvent, idx: number): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    patchSubItems((items) => ({
      ...items,
      weapons: items.weapons.map((w, i): MechaWeapon => i !== idx ? w : { ...w, name: value || w.name }),
    }));
  }

  function handleAddSubUpgrade(def: UpgradeTemplateDefinition): void {
    patchSubItems((items) => ({
      ...items,
      upgrades: [...items.upgrades, {
        id: crypto.randomUUID(), templateId: def.id, name: def.name,
        description: def.description, upgradeType: def.upgradeType,
        area: def.upgradeType === 'internal' ? 'core' as const : 'separate' as const, effect: def.effect, mpCost: def.mpCost ?? 0,
      }],
    }));
  }

  function handleRemoveSubUpgrade(idx: number): void {
    patchSubItems((items) => ({ ...items, upgrades: items.upgrades.filter((_, i) => i !== idx) }));
  }

  function handleSubUpgradeNameBlur(e: FocusEvent, idx: number): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    patchSubItems((items) => ({
      ...items,
      upgrades: items.upgrades.map((u, i): MechaSubUpgrade => i !== idx ? u : { ...u, name: value || u.name }),
    }));
  }

  const availableWeapons = () => {
    const q = weaponSearch().toLowerCase();
    const f = weaponFilter();
    return weaponTemplates.filter((w) =>
      !w.isDefault && matchesWeaponFilter(w.keywords, f) &&
      (!q || w.name.toLowerCase().includes(q) || w.effect?.toLowerCase().includes(q))
    );
  };

  const availableUpgrades = () => {
    const q = upgradeSearch().toLowerCase();
    return upgradeTemplates.filter((u) =>
      u.upgradeType === 'external' && u.upgradeSubcategory !== 'feature' &&
      (!q || u.name.toLowerCase().includes(q) || u.effect.toLowerCase().includes(q))
    );
  };

  const availableFeatures = () => {
    const q = upgradeSearch().toLowerCase();
    return upgradeTemplates.filter((u) =>
      u.upgradeSubcategory === 'feature' &&
      (!q || u.name.toLowerCase().includes(q) || u.effect.toLowerCase().includes(q))
    );
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        class="mt-2 w-full flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/60 hover:border-foreground/30 transition-colors cursor-pointer"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="font-medium text-foreground">Pack Contents</span>
          <span class="text-muted-foreground truncate">
            {currentWeapons().length + currentUpgrades().length} item{currentWeapons().length + currentUpgrades().length !== 1 ? 's' : ''}
          </span>
        </div>
        <div class="flex items-center gap-2 shrink-0 text-muted-foreground">
          <span class={cn('font-mono', usedMP() > SUB_POOL_CAPACITY && 'text-destructive')}>
            {usedMP()} / {SUB_POOL_CAPACITY} MP
          </span>
          <span class="text-base leading-none">›</span>
        </div>
      </button>

      <DialogPrimitive.Root open={open()} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay class="fixed inset-0 z-50 bg-black/75" />
          <DialogPrimitive.Content class={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border border-border bg-card shadow-xl flex flex-col max-h-[80vh]',
          )}>
            <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
              <div>
                <DialogPrimitive.Title class="text-base font-semibold">{upgrade().name}</DialogPrimitive.Title>
                <p class={cn('text-xs mt-0.5 font-mono', usedMP() > SUB_POOL_CAPACITY ? 'text-destructive' : 'text-muted-foreground')}>
                  {usedMP()} / {SUB_POOL_CAPACITY} MP
                </p>
              </div>
              <DialogPrimitive.CloseButton class="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</DialogPrimitive.CloseButton>
            </div>

            <div class="flex flex-1 min-h-0 divide-x divide-border">
              {/* Left: tabbed available items */}
              <div class="flex-1 flex flex-col min-h-0">
                <div class="flex gap-1 px-4 pt-3 pb-2 border-b border-border shrink-0">
                  <For each={POOL_ITEM_TABS}>
                    {(tab) => (
                      <button
                        onClick={() => setItemTab(tab.key)}
                        class={cn(
                          'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
                          itemTab() === tab.key
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                        )}
                      >
                        {tab.label}
                      </button>
                    )}
                  </For>
                </div>

                <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {/* Weapons tab */}
                  <Show when={itemTab() === 'weapons'}>
                    <div class="space-y-2">
                      <div class="flex gap-1 flex-wrap">
                        <For each={WEAPON_FILTER_TABS}>
                          {(tab) => (
                            <button
                              onClick={() => setWeaponFilter(tab.key)}
                              class={cn(
                                'px-2 py-0.5 text-xs rounded border transition-colors',
                                weaponFilter() === tab.key
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                              )}
                            >
                              {tab.label}
                            </button>
                          )}
                        </For>
                      </div>
                      <Input value={weaponSearch()} onInput={(e) => setWeaponSearch((e.currentTarget as HTMLInputElement).value)} placeholder="Search weapons…" class="h-7 text-xs" />
                      <div class="space-y-0.5">
                        <For each={availableWeapons()}>
                          {(def) => (
                            <div class="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/40 transition-colors">
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <span class="text-sm font-medium">{def.name}</span>
                                  <For each={def.keywords}>
                                    {(kw) => <Badge variant="outline" class="text-[9px] px-1 py-0 capitalize">{weaponKeywordsById[kw]?.name ?? kw}</Badge>}
                                  </For>
                                </div>
                                <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{def.effect}</p>
                              </div>
                              <button
                                disabled={usedMP() + 5 > SUB_POOL_CAPACITY}
                                onClick={() => handleAddSubWeapon(def)}
                                class={cn('shrink-0 text-xs px-2 py-0.5 rounded border transition-colors mt-0.5',
                                  usedMP() + 5 > SUB_POOL_CAPACITY
                                    ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                                )}
                              >+</button>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Upgrades tab */}
                  <Show when={itemTab() === 'upgrades'}>
                    <div class="space-y-2">
                      <Input value={upgradeSearch()} onInput={(e) => setUpgradeSearch((e.currentTarget as HTMLInputElement).value)} placeholder="Search upgrades…" class="h-7 text-xs" />
                      <div class="space-y-0.5">
                        <For each={availableUpgrades()}>
                          {(def) => (
                            <div class="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/40 transition-colors">
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <span class="text-sm font-medium">{def.name}</span>
                                  <Badge variant="muted" class="text-[9px] px-1 py-0 font-mono">{def.mpCost ?? '?'} MP</Badge>
                                </div>
                                <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{def.effect}</p>
                              </div>
                              <button
                                disabled={usedMP() + (def.mpCost ?? 0) > SUB_POOL_CAPACITY}
                                onClick={() => handleAddSubUpgrade(def)}
                                class={cn('shrink-0 text-xs px-2 py-0.5 rounded border transition-colors mt-0.5',
                                  usedMP() + (def.mpCost ?? 0) > SUB_POOL_CAPACITY
                                    ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                                )}
                              >+</button>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Features tab */}
                  <Show when={itemTab() === 'features'}>
                    <div class="space-y-2">
                      <Input value={upgradeSearch()} onInput={(e) => setUpgradeSearch((e.currentTarget as HTMLInputElement).value)} placeholder="Search features…" class="h-7 text-xs" />
                      <div class="space-y-0.5">
                        <For each={availableFeatures()}>
                          {(def) => (
                            <div class="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/40 transition-colors">
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <span class="text-sm font-medium">{def.name}</span>
                                  <Badge variant="muted" class="text-[9px] px-1 py-0 font-mono">{def.mpCost ?? '?'} MP</Badge>
                                </div>
                                <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{def.effect}</p>
                              </div>
                              <button
                                disabled={usedMP() + (def.mpCost ?? 0) > SUB_POOL_CAPACITY}
                                onClick={() => handleAddSubUpgrade(def)}
                                class={cn('shrink-0 text-xs px-2 py-0.5 rounded border transition-colors mt-0.5',
                                  usedMP() + (def.mpCost ?? 0) > SUB_POOL_CAPACITY
                                    ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                                )}
                              >+</button>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Right: current pool contents */}
              <div class="w-60 shrink-0 overflow-y-auto px-4 py-4 space-y-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In Pack</p>

                <Show when={currentWeapons().length === 0 && currentUpgrades().length === 0}>
                  <p class="text-xs text-muted-foreground italic">Nothing added yet.</p>
                </Show>

                <Show when={currentWeapons().length > 0}>
                  <div class="space-y-1.5">
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Weapons</p>
                    <For each={currentWeapons()}>
                      {(w, i) => {
                        const tName = () => w.templateId ? weaponTemplatesById[w.templateId!]?.name : undefined;
                        return (
                          <div class="flex items-start gap-1.5">
                            <div class="flex-1 min-w-0">
                              <Input value={w.name} onBlur={(e) => handleSubWeaponNameBlur(e, i())} class="-mx-1 h-auto py-0 px-1 text-xs font-medium border-transparent shadow-none hover:border-input" />
                              <Show when={tName() && tName() !== w.name}>
                                <p class="text-[10px] text-muted-foreground leading-none mt-0.5">{tName()}</p>
                              </Show>
                            </div>
                            <Badge variant="muted" class="text-[10px] px-1 py-0 font-mono shrink-0">5 MP</Badge>
                            <button onClick={() => handleRemoveSubWeapon(i())} class="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none shrink-0">×</button>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>

                <Show when={currentUpgrades().length > 0}>
                  <div class="space-y-1.5">
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Upgrades</p>
                    <For each={currentUpgrades()}>
                      {(u, i) => {
                        const tName = () => u.templateId ? upgradeTemplatesById[u.templateId!]?.name : undefined;
                        return (
                          <div class="flex items-start gap-1.5">
                            <div class="flex-1 min-w-0">
                              <Input value={u.name} onBlur={(e) => handleSubUpgradeNameBlur(e, i())} class="-mx-1 h-auto py-0 px-1 text-xs font-medium border-transparent shadow-none hover:border-input" />
                              <Show when={tName() && tName() !== u.name}>
                                <p class="text-[10px] text-muted-foreground leading-none mt-0.5">{tName()}</p>
                              </Show>
                            </div>
                            <Badge variant="muted" class="text-[10px] px-1 py-0 font-mono shrink-0">{u.mpCost} MP</Badge>
                            <button onClick={() => handleRemoveSubUpgrade(i())} class="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none shrink-0">×</button>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

// ── Form Pool Modal (Superior Morphing multi-pool manager) ───────────────────

interface FormPoolModalProps {
  mecha: Mecha;
  upgradeIndex: number;
}

function FormPoolModal(props: FormPoolModalProps): JSX.Element {
  const [open, setOpen] = createSignal(false);
  const [activeIdx, setActiveIdx] = createSignal(0);
  const [labelDraft, setLabelDraft] = createSignal('');
  const [itemTab, setItemTab] = createSignal<PoolItemTab>('upgrades');
  const [weaponFilter, setWeaponFilter] = createSignal<WeaponFilter>('all');
  const [weaponSearch, setWeaponSearch] = createSignal('');
  const [upgradeSearch, setUpgradeSearch] = createSignal('');

  const upgrade = () => props.mecha.upgrades[props.upgradeIndex];
  const pools = () => upgrade().formPools ?? [];
  const poolIdx = () => { const i = activeIdx(); const ps = pools(); return i < ps.length ? i : 0; };
  const pool = () => pools()[poolIdx()];

  // Keep label draft in sync when switching forms
  const syncLabelDraft = () => setLabelDraft(pool()?.label ?? '');

  const usedMP = () =>
    (pool()?.weapons.length ?? 0) * 5 +
    (pool()?.upgrades.reduce((s, u) => s + u.mpCost, 0) ?? 0);

  const extraCost = () => Math.max(0, pools().length - 2) * 10;

  function patchPools(updater: (pools: FormPool[]) => FormPool[]): void {
    const newPools = updater(pools().map(cloneFormPool));
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade =>
      i !== props.upgradeIndex ? cloneUpgrade(u) : { ...cloneUpgrade(u), formPools: newPools },
    );
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
  }

  function patchActivePool(updater: (p: FormPool) => FormPool): void {
    patchPools((ps) => ps.map((p, i) => i !== poolIdx() ? p : updater({ ...cloneFormPool(p) })));
  }

  function handleAddPool(): void {
    const newIdx = pools().length;
    const newLabel = `Form ${newIdx + 1}`;
    patchPools((ps) => [
      ...ps,
      { id: crypto.randomUUID(), label: newLabel, weapons: [], upgrades: [] },
    ]);
    setActiveIdx(newIdx);
    setLabelDraft(newLabel);
  }

  function handleRemovePool(idx: number): void {
    patchPools((ps) => ps.filter((_, i) => i !== idx));
    if (activeIdx() >= idx) {
      const nextIdx = Math.max(0, activeIdx() - 1);
      setActiveIdx(nextIdx);
      // Sync draft to the pool that becomes active after removal
      const ps = pools();
      setLabelDraft(ps[nextIdx < ps.length ? nextIdx : 0]?.label ?? '');
    }
  }

  const swapAttrs = () => pool()?.swapAttributes;
  const isAttrSelected = (attr: MechaAttributeKey): boolean => {
    const s = swapAttrs();
    if (!s) { return false; }
    if (s[0] === s[1]) { return s[0] === attr; }
    return s[0] === attr || s[1] === attr;
  };
  const isSwapComplete = (): boolean => { const s = swapAttrs(); return !!s && s[0] !== s[1]; };
  const isAttrDisabled = (attr: MechaAttributeKey): boolean => {
    if (isAttrSelected(attr)) { return false; }
    const s = swapAttrs();
    return !!s && s[0] !== s[1];
  };

  function handleSwapToggle(attr: MechaAttributeKey): void {
    const current = pool()?.swapAttributes;
    let next: [MechaAttributeKey, MechaAttributeKey] | undefined;
    if (current?.includes(attr)) {
      next = undefined;
    } else if (!current) {
      next = [attr, attr];
    } else if (current[0] === current[1]) {
      next = [current[0], attr];
    } else {
      next = [attr, attr];
    }
    patchActivePool((p) => ({ ...p, swapAttributes: next }));
  }

  function handleLabelInput(e: InputEvent): void {
    setLabelDraft((e.currentTarget as HTMLInputElement).value);
  }

  function handleLabelBlur(): void {
    const value = labelDraft().trim();
    if (value) { patchActivePool((p) => ({ ...p, label: value })); }
    else { setLabelDraft(pool()?.label ?? ''); }
  }

  function handleAddWeapon(def: (typeof weaponTemplates)[number]): void {
    patchActivePool((p) => ({
      ...p,
      weapons: [...p.weapons, {
        id: crypto.randomUUID(), templateId: def.id, name: def.name,
        description: def.description, area: 'separate' as const,
        keywords: [...def.keywords], energyCost: def.energyCost, abilities: [], isCustom: false,
      }],
    }));
  }

  function handleRemoveWeapon(idx: number): void {
    patchActivePool((p) => ({ ...p, weapons: p.weapons.filter((_, i) => i !== idx) }));
  }

  function handleWeaponNameBlur(e: FocusEvent, idx: number): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    patchActivePool((p) => ({
      ...p,
      weapons: p.weapons.map((w, i): MechaWeapon => i !== idx ? w : { ...w, name: value || w.name }),
    }));
  }

  function handleAddUpgrade(def: UpgradeTemplateDefinition): void {
    patchActivePool((p) => ({
      ...p,
      upgrades: [...p.upgrades, {
        id: crypto.randomUUID(), templateId: def.id, name: def.name,
        description: def.description, upgradeType: def.upgradeType,
        area: def.upgradeType === 'internal' ? 'core' as const : 'separate' as const, effect: def.effect, mpCost: def.mpCost ?? 0,
      }],
    }));
  }

  function handleRemoveUpgrade(idx: number): void {
    patchActivePool((p) => ({ ...p, upgrades: p.upgrades.filter((_, i) => i !== idx) }));
  }

  function handleUpgradeNameBlur(e: FocusEvent, idx: number): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    patchActivePool((p) => ({
      ...p,
      upgrades: p.upgrades.map((u, i): MechaSubUpgrade => i !== idx ? u : { ...u, name: value || u.name }),
    }));
  }

  const availableWeapons = () => {
    const q = weaponSearch().toLowerCase();
    const f = weaponFilter();
    return weaponTemplates.filter((w) =>
      !w.isDefault && matchesWeaponFilter(w.keywords, f) &&
      (!q || w.name.toLowerCase().includes(q) || w.effect?.toLowerCase().includes(q))
    );
  };

  const availableUpgrades = () => {
    const q = upgradeSearch().toLowerCase();
    return upgradeTemplates.filter((u) =>
      u.upgradeType === 'external' && u.upgradeSubcategory !== 'feature' &&
      (!q || u.name.toLowerCase().includes(q) || u.effect.toLowerCase().includes(q))
    );
  };

  const availableFeatures = () => {
    const q = upgradeSearch().toLowerCase();
    return upgradeTemplates.filter((u) =>
      u.upgradeSubcategory === 'feature' &&
      (!q || u.name.toLowerCase().includes(q) || u.effect.toLowerCase().includes(q))
    );
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => { syncLabelDraft(); setOpen(true); }}
        class="mt-2 w-full flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/60 hover:border-foreground/30 transition-colors cursor-pointer"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="font-medium text-foreground">Alternate Forms</span>
          <span class="text-muted-foreground">
            {pools().length} form{pools().length !== 1 ? 's' : ''}
          </span>
        </div>
        <div class="flex items-center gap-2 shrink-0 text-muted-foreground">
          <span class="font-mono">
            20 MP base{extraCost() > 0 ? ` + ${extraCost()} MP` : ''}
          </span>
          <span class="text-base leading-none">›</span>
        </div>
      </button>

      <DialogPrimitive.Root open={open()} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay class="fixed inset-0 z-50 bg-black/75" />
          <DialogPrimitive.Content class={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border border-border bg-card shadow-xl flex flex-col max-h-[85vh]',
          )}>
            {/* Header */}
            <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
              <div>
                <DialogPrimitive.Title class="text-base font-semibold">
                  {upgrade().name} — Alternate Forms
                </DialogPrimitive.Title>
                <p class="text-xs mt-0.5 text-muted-foreground font-mono">
                  {pools().length} form{pools().length !== 1 ? 's' : ''} · 20 MP base
                  {extraCost() > 0 ? ` + ${extraCost()} MP extra` : ''}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Button size="sm" variant="outline" class="h-7 text-xs" onClick={handleAddPool}>
                  + Add Form (+10 MP)
                </Button>
                <DialogPrimitive.CloseButton class="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</DialogPrimitive.CloseButton>
              </div>
            </div>

            {/* Form tabs */}
            <div class="flex gap-1 px-4 py-2.5 border-b border-border shrink-0 overflow-x-auto">
              <For each={pools()}>
                {(p, i) => (
                  <button
                    onClick={() => {
                      setActiveIdx(i());
                      setLabelDraft(pools()[i()]?.label ?? '');
                      setWeaponSearch('');
                      setUpgradeSearch('');
                    }}
                    class={cn(
                      'px-3 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap',
                      poolIdx() === i()
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                    )}
                  >
                    {poolIdx() === i() ? labelDraft() || p.label : p.label}
                  </button>
                )}
              </For>
            </div>

            {/* Two-column content */}
            <div class="flex flex-1 min-h-0 divide-x divide-border">
              {/* Left: tabbed available items */}
              <div class="flex-1 flex flex-col min-h-0">
                <div class="flex gap-1 px-4 pt-3 pb-2 border-b border-border shrink-0">
                  <For each={POOL_ITEM_TABS}>
                    {(tab) => (
                      <button
                        onClick={() => setItemTab(tab.key)}
                        class={cn(
                          'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
                          itemTab() === tab.key
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                        )}
                      >
                        {tab.label}
                      </button>
                    )}
                  </For>
                </div>

                <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {/* Weapons tab */}
                  <Show when={itemTab() === 'weapons'}>
                    <div class="space-y-2">
                      <div class="flex gap-1 flex-wrap">
                        <For each={WEAPON_FILTER_TABS}>
                          {(tab) => (
                            <button
                              onClick={() => setWeaponFilter(tab.key)}
                              class={cn(
                                'px-2 py-0.5 text-xs rounded border transition-colors',
                                weaponFilter() === tab.key
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                              )}
                            >
                              {tab.label}
                            </button>
                          )}
                        </For>
                      </div>
                      <Input value={weaponSearch()} onInput={(e) => setWeaponSearch((e.currentTarget as HTMLInputElement).value)} placeholder="Search weapons…" class="h-7 text-xs" />
                      <div class="space-y-0.5">
                        <For each={availableWeapons()}>
                          {(def) => (
                            <div class="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/40 transition-colors">
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <span class="text-sm font-medium">{def.name}</span>
                                  <For each={def.keywords}>
                                    {(kw) => <Badge variant="outline" class="text-[9px] px-1 py-0 capitalize">{weaponKeywordsById[kw]?.name ?? kw}</Badge>}
                                  </For>
                                </div>
                                <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{def.effect}</p>
                              </div>
                              <button
                                disabled={usedMP() + 5 > FORM_POOL_CAPACITY}
                                onClick={() => handleAddWeapon(def)}
                                class={cn('shrink-0 text-xs px-2 py-0.5 rounded border transition-colors mt-0.5',
                                  usedMP() + 5 > FORM_POOL_CAPACITY
                                    ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                                )}
                              >+</button>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Upgrades tab */}
                  <Show when={itemTab() === 'upgrades'}>
                    <div class="space-y-2">
                      <Input value={upgradeSearch()} onInput={(e) => setUpgradeSearch((e.currentTarget as HTMLInputElement).value)} placeholder="Search upgrades…" class="h-7 text-xs" />
                      <div class="space-y-0.5">
                        <For each={availableUpgrades()}>
                          {(def) => (
                            <div class="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/40 transition-colors">
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <span class="text-sm font-medium">{def.name}</span>
                                  <Badge variant="muted" class="text-[9px] px-1 py-0 font-mono">{def.mpCost ?? '?'} MP</Badge>
                                </div>
                                <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{def.effect}</p>
                              </div>
                              <button
                                disabled={usedMP() + (def.mpCost ?? 0) > FORM_POOL_CAPACITY}
                                onClick={() => handleAddUpgrade(def)}
                                class={cn('shrink-0 text-xs px-2 py-0.5 rounded border transition-colors mt-0.5',
                                  usedMP() + (def.mpCost ?? 0) > FORM_POOL_CAPACITY
                                    ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                                )}
                              >+</button>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Features tab */}
                  <Show when={itemTab() === 'features'}>
                    <div class="space-y-2">
                      <Input value={upgradeSearch()} onInput={(e) => setUpgradeSearch((e.currentTarget as HTMLInputElement).value)} placeholder="Search features…" class="h-7 text-xs" />
                      <div class="space-y-0.5">
                        <For each={availableFeatures()}>
                          {(def) => (
                            <div class="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/40 transition-colors">
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                  <span class="text-sm font-medium">{def.name}</span>
                                  <Badge variant="muted" class="text-[9px] px-1 py-0 font-mono">{def.mpCost ?? '?'} MP</Badge>
                                </div>
                                <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{def.effect}</p>
                              </div>
                              <button
                                disabled={usedMP() + (def.mpCost ?? 0) > FORM_POOL_CAPACITY}
                                onClick={() => handleAddUpgrade(def)}
                                class={cn('shrink-0 text-xs px-2 py-0.5 rounded border transition-colors mt-0.5',
                                  usedMP() + (def.mpCost ?? 0) > FORM_POOL_CAPACITY
                                    ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                                )}
                              >+</button>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Right: current form contents */}
              <div class="w-64 shrink-0 overflow-y-auto px-4 py-4 space-y-4">
                {/* Form name */}
                <div class="space-y-1">
                  <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Form Name</p>
                  <Input
                    value={labelDraft()}
                    onInput={handleLabelInput}
                    onBlur={handleLabelBlur}
                    class="-mx-1 h-auto py-0 px-1 text-xs font-semibold border-transparent shadow-none hover:border-input"
                  />
                </div>

                {/* MP capacity */}
                <p class={cn('text-xs font-mono', usedMP() > FORM_POOL_CAPACITY ? 'text-destructive' : 'text-muted-foreground')}>
                  {usedMP()} / {FORM_POOL_CAPACITY} MP
                </p>

                {/* Attribute swap */}
                <div class="space-y-1.5">
                  <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Attribute Swap {isSwapComplete() ? ':' : '(optional)'}
                  </p>
                  <div class="flex gap-1 flex-wrap">
                    <For each={SWAP_ATTR_OPTIONS}>
                      {(attr) => (
                        <button
                          onClick={() => handleSwapToggle(attr)}
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
                    <Show when={swapAttrs()}>
                      <button
                        onClick={() => patchActivePool((p) => ({ ...p, swapAttributes: undefined }))}
                        class="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                      >
                        Clear
                      </button>
                    </Show>
                  </div>
                  <Show when={isSwapComplete()}>
                    <p class="text-xs text-primary">{cap(swapAttrs()![0])} ↔ {cap(swapAttrs()![1])}</p>
                  </Show>
                </div>

                <Show when={(pool()?.weapons.length ?? 0) === 0 && (pool()?.upgrades.length ?? 0) === 0}>
                  <p class="text-xs text-muted-foreground italic">Nothing added yet.</p>
                </Show>

                <Show when={(pool()?.weapons.length ?? 0) > 0}>
                  <div class="space-y-1.5">
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Weapons</p>
                    <For each={pool()?.weapons ?? []}>
                      {(w, i) => {
                        const tName = () => w.templateId ? weaponTemplatesById[w.templateId!]?.name : undefined;
                        return (
                          <div class="flex items-start gap-1.5">
                            <div class="flex-1 min-w-0">
                              <Input value={w.name} onBlur={(e) => handleWeaponNameBlur(e, i())} class="-mx-1 h-auto py-0 px-1 text-xs font-medium border-transparent shadow-none hover:border-input" />
                              <Show when={tName() && tName() !== w.name}>
                                <p class="text-[10px] text-muted-foreground leading-none mt-0.5">{tName()}</p>
                              </Show>
                            </div>
                            <Badge variant="muted" class="text-[10px] px-1 py-0 font-mono shrink-0">5 MP</Badge>
                            <button onClick={() => handleRemoveWeapon(i())} class="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none shrink-0">×</button>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>

                <Show when={(pool()?.upgrades.length ?? 0) > 0}>
                  <div class="space-y-1.5">
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Upgrades</p>
                    <For each={pool()?.upgrades ?? []}>
                      {(u, i) => {
                        const tName = () => u.templateId ? upgradeTemplatesById[u.templateId!]?.name : undefined;
                        return (
                          <div class="flex items-start gap-1.5">
                            <div class="flex-1 min-w-0">
                              <Input value={u.name} onBlur={(e) => handleUpgradeNameBlur(e, i())} class="-mx-1 h-auto py-0 px-1 text-xs font-medium border-transparent shadow-none hover:border-input" />
                              <Show when={tName() && tName() !== u.name}>
                                <p class="text-[10px] text-muted-foreground leading-none mt-0.5">{tName()}</p>
                              </Show>
                            </div>
                            <Badge variant="muted" class="text-[10px] px-1 py-0 font-mono shrink-0">{u.mpCost} MP</Badge>
                            <button onClick={() => handleRemoveUpgrade(i())} class="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none shrink-0">×</button>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>

                {/* Remove this form (3rd+ forms only) */}
                <Show when={pools().length > 2 && poolIdx() >= 2}>
                  <button
                    onClick={() => handleRemovePool(poolIdx())}
                    class="mt-2 w-full text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                  >
                    Remove this form
                  </button>
                </Show>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

// ── Taken Upgrade Card ─────────────────────────────────────────────────────────

interface TakenUpgradeCardProps {
  mecha: Mecha;
  upgrade: MechaUpgrade;
  index: number;
  def: UpgradeTemplateDefinition | undefined;
  hasSuperiorMorphing: boolean;
}

function TakenUpgradeCard(props: TakenUpgradeCardProps): JSX.Element {
  function handleRemove(): void {
    const newUpgrades = props.mecha.upgrades
      .filter((_, i) => i !== props.index)
      .map(cloneUpgrade);
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
  }

  function handleNameBlur(e: FocusEvent): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), name: value || u.name };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
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
    <div class="p-4 rounded-lg border border-border bg-card space-y-2">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <Input
            value={props.upgrade.name}
            onBlur={handleNameBlur}
            class="-mx-1 mb-0.5 h-auto py-0 px-1 text-sm font-medium border-transparent shadow-none hover:border-input"
          />
          <Show when={props.def && props.upgrade.name !== props.def.name}>
            <p class="text-[11px] text-muted-foreground mb-0.5">{props.def!.name}</p>
          </Show>
          <div class="flex items-center gap-1.5 flex-wrap">
            <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">
              {props.upgrade.templateId === 'invincible-super-combination'
                ? `${props.upgrade.customMpCost ?? 0} MP`
                : props.upgrade.templateId === 'superior-morphing'
                  ? `${20 + Math.max(0, (props.upgrade.formPools?.length ?? 2) - 2) * 10} MP`
                  : props.upgrade.mpCost > 0
                    ? `${props.upgrade.mpCost} MP`
                    : 'Free'}
            </Badge>
          </div>

          {/* Area placement */}
          <Show when={props.upgrade.upgradeType === 'external'}>
            <div class="flex gap-1 mt-2 flex-wrap">
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

          {/* Warning: standalone Frame/Transformation with Superior Morphing present */}
          <Show when={isSwapUpgrade() && props.hasSuperiorMorphing}>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Superior Morphing is present — manage this form through its builder instead.
            </p>
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

          {/* Expansion Pack / Secret Equipment: sub-pool modal */}
          <Show when={isSubPool()}>
            <SubPoolModal mecha={props.mecha} upgradeIndex={props.index} />
          </Show>

          {/* Superior Morphing: form pool modal */}
          <Show when={props.upgrade.templateId === 'superior-morphing'}>
            <FormPoolModal mecha={props.mecha} upgradeIndex={props.index} />
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
  hasSuperiorMorphing: boolean;
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
      formPools: props.def.id === 'superior-morphing' ? [
        { id: crypto.randomUUID(), label: 'Form 1', weapons: [], upgrades: [] },
        { id: crypto.randomUUID(), label: 'Form 2', weapons: [], upgrades: [] },
      ] : undefined,
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
    props.def.isSpecialist || REPEATABLE_IDS.has(props.def.id) || !props.alreadyTaken;

  const buttonLabel = () => {
    if (justAdded()) { return '✓ Added'; }
    if (props.alreadyTaken && !props.def.isSpecialist && !REPEATABLE_IDS.has(props.def.id)) { return '✓'; }
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
        <Show when={props.hasSuperiorMorphing && (props.def.id === 'frame' || props.def.id === 'transformation')}>
          <p class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Superior Morphing is present — add forms through its builder instead.
          </p>
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

  const hasSuperiorMorphing = () =>
    props.mecha.upgrades.some((u) => u.templateId === 'superior-morphing');

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
          <div class="space-y-3">
            <For each={takenInType()}>
              {({ upgrade, def, index }) => (
                <TakenUpgradeCard
                  mecha={props.mecha}
                  upgrade={upgrade}
                  index={index}
                  def={def}
                  hasSuperiorMorphing={hasSuperiorMorphing()}
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
                    hasSuperiorMorphing={hasSuperiorMorphing()}
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
