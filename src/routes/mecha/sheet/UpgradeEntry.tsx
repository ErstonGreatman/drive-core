import type { JSX } from 'solid-js';
import { Show, For } from 'solid-js';
import type { MechaUpgrade } from '~/types/mecha';
import { weaponTemplatesById, upgradeTemplatesById } from '~/data';
import { upgradeCostDisplay } from '~/lib/mecha-costs';
import { Badge } from '~/components/ui/badge';
import { keywordName, areaLabel, SWAP_ATTR_LABELS, TERRAIN_LABELS } from './mechaSheetUtils';

export const UpgradeEntry = (props: { upgrade: MechaUpgrade; showArea: boolean }): JSX.Element => {
  const u = () => props.upgrade;
  const templateName = () => u().templateId ? upgradeTemplatesById[u().templateId!]?.name : undefined;

  return (
    <div class="py-2 border-b border-border/40 last:border-0">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span class="text-sm font-medium">{u().name}</span>
          <Show when={props.showArea && u().area !== 'separate' && u().area !== 'core'}>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize">{areaLabel(u().area)}</Badge>
          </Show>
          <Show when={u().specialistLabel}>
            <span class="text-xs text-muted-foreground">— {u().specialistLabel}</span>
          </Show>
        </div>
        <Badge variant="muted" class="font-mono text-[10px] px-1.5 py-0 shrink-0">{upgradeCostDisplay(u())}</Badge>
      </div>
      <Show when={templateName() && templateName() !== u().name}>
        <p class="text-[11px] text-muted-foreground">{templateName()}</p>
      </Show>
      <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{u().effect}</p>

      <Show when={u().swapAttributes}>
        <p class="text-xs text-primary mt-0.5">
          Swaps: {SWAP_ATTR_LABELS[u().swapAttributes![0]] ?? u().swapAttributes![0]}
          {' ↔ '}
          {SWAP_ATTR_LABELS[u().swapAttributes![1]] ?? u().swapAttributes![1]}
        </p>
      </Show>

      <Show when={u().terrainType}>
        <p class="text-xs text-muted-foreground mt-0.5">
          Terrain: {TERRAIN_LABELS[u().terrainType!] ?? u().terrainType}
        </p>
      </Show>

      <Show when={u().formPools && u().formPools!.length > 0}>
        <div class="mt-1.5 pl-3 border-l border-border space-y-2">
          <For each={u().formPools!}>
            {(pool) => (
              <div class="space-y-0.5">
                <p class="text-xs font-medium text-foreground">{pool.label}</p>
                <Show when={pool.swapAttributes && pool.swapAttributes[0] !== pool.swapAttributes[1]}>
                  <p class="text-xs text-primary">
                    {SWAP_ATTR_LABELS[pool.swapAttributes![0]] ?? pool.swapAttributes![0]}
                    {' ↔ '}
                    {SWAP_ATTR_LABELS[pool.swapAttributes![1]] ?? pool.swapAttributes![1]}
                  </p>
                </Show>
                <For each={pool.weapons}>
                  {(w) => (
                    <div class="text-xs text-muted-foreground">
                      <span class="font-medium text-foreground">{w.name}</span>
                      {' · '}{w.keywords.map(keywordName).join(' / ')}
                    </div>
                  )}
                </For>
                <For each={pool.upgrades}>
                  {(sub) => (
                    <div class="text-xs text-muted-foreground">
                      <span class="font-medium text-foreground">{sub.name}</span>
                      {' · '}{sub.mpCost} MP
                    </div>
                  )}
                </For>
                <Show when={pool.weapons.length === 0 && pool.upgrades.length === 0 && !pool.swapAttributes}>
                  <p class="text-[11px] text-muted-foreground italic">Empty form</p>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={u().subItems && (u().subItems!.weapons.length > 0 || u().subItems!.upgrades.length > 0)}>
        <div class="mt-1.5 pl-3 border-l border-border space-y-0.5">
          <For each={u().subItems!.weapons}>
            {(w) => {
              const tName = w.templateId ? weaponTemplatesById[w.templateId!]?.name : undefined;
              return (
                <div class="text-xs text-muted-foreground">
                  <span class="font-medium text-foreground">{w.name}</span>
                  <Show when={tName && tName !== w.name}>
                    <span class="text-[10px]"> ({tName})</span>
                  </Show>
                  {' · '}{w.keywords.map(keywordName).join(' / ')}
                </div>
              );
            }}
          </For>
          <For each={u().subItems!.upgrades}>
            {(sub) => {
              const tName = sub.templateId ? upgradeTemplatesById[sub.templateId!]?.name : undefined;
              return (
                <div class="text-xs text-muted-foreground">
                  <span class="font-medium text-foreground">{sub.name}</span>
                  <Show when={tName && tName !== sub.name}>
                    <span class="text-[10px]"> ({tName})</span>
                  </Show>
                  {sub.specialistLabel && ` (${sub.specialistLabel})`}
                  {' · '}{sub.mpCost} MP
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
