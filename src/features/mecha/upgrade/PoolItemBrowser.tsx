import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { upgradeTemplates, weaponTemplates, weaponKeywordsById } from '~/data';
import type { UpgradeTemplateDefinition, WeaponTemplateDefinition } from '~/data';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { POOL_ITEM_TABS, WEAPON_FILTER_TABS, matchesWeaponFilter } from './upgradeUtils';
import type { PoolItemTab, WeaponFilter } from './upgradeUtils';

interface PoolItemBrowserProps {
  capacity: number;
  usedMP: () => number;
  onAddWeapon: (def: WeaponTemplateDefinition) => void;
  onAddUpgrade: (def: UpgradeTemplateDefinition) => void;
}

export const PoolItemBrowser = (props: PoolItemBrowserProps): JSX.Element => {
  const [itemTab, setItemTab] = createSignal<PoolItemTab>('upgrades');
  const [weaponFilter, setWeaponFilter] = createSignal<WeaponFilter>('all');
  const [weaponSearch, setWeaponSearch] = createSignal('');
  const [upgradeSearch, setUpgradeSearch] = createSignal('');

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

  const addBtnClass = (cost: number) => cn(
    'shrink-0 text-xs px-2 py-0.5 rounded border transition-colors mt-0.5',
    props.usedMP() + cost > props.capacity
      ? 'border-border text-muted-foreground/40 cursor-not-allowed'
      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
  );

  return (
    <div class="flex-1 flex flex-col min-h-0">
      {/* Item type tabs */}
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
                    <button disabled={props.usedMP() + (def.mpCost ?? 0) > props.capacity} onClick={() => props.onAddUpgrade(def)} class={addBtnClass(def.mpCost ?? 0)}>+</button>
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
                    <button disabled={props.usedMP() + (def.mpCost ?? 0) > props.capacity} onClick={() => props.onAddUpgrade(def)} class={addBtnClass(def.mpCost ?? 0)}>+</button>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

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
                    <button disabled={props.usedMP() + 5 > props.capacity} onClick={() => props.onAddWeapon(def)} class={addBtnClass(5)}>+</button>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
