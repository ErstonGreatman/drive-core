import type { JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Mecha, MechaUpgrade, MechaAttributeKey } from '~/types/mecha';
import type { UpgradeTemplateDefinition } from '~/data';
import { updateMecha } from '~/stores/mecha';
import { computeSpentMP, upgradeCostDisplay } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import {
  EXTERNAL_AREAS, SWAP_ATTR_OPTIONS, REPEATABLE_IDS, cloneUpgrade,
  isAttrSelected, isSwapComplete, isAttrDisabled, nextSwapState,
} from './upgradeUtils';
import type { ExternalArea } from './upgradeUtils';
import { SubPoolModal } from './SubPoolModal';
import { FormPoolModal } from './FormPoolModal';

interface TakenUpgradeCardProps {
  mecha: Mecha;
  upgrade: MechaUpgrade;
  index: number;
  def: UpgradeTemplateDefinition | undefined;
  hasSuperiorMorphing: boolean;
}

export const TakenUpgradeCard = (props: TakenUpgradeCardProps): JSX.Element => {
  const handleRemove = (): void => {
    const newUpgrades = props.mecha.upgrades.filter((_, i) => i !== props.index).map(cloneUpgrade);
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
  };

  const handleNameBlur = (e: FocusEvent): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), name: value || u.name };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
  };

  const handleAreaChange = (area: ExternalArea): void => {
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), area };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
  };

  const handleLabelBlur = (e: FocusEvent): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), specialistLabel: value || undefined };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
  };

  const handleSwapAttrToggle = (attr: MechaAttributeKey): void => {
    const next = nextSwapState(props.upgrade.swapAttributes, attr);
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), swapAttributes: next };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
  };

  const handleTerrainChange = (terrain: 'water' | 'space' | 'land'): void => {
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), terrainType: terrain };
    });
    updateMecha(props.mecha.id, { upgrades: newUpgrades });
  };

  const handleCustomMpBlur = (e: FocusEvent): void => {
    const raw = (e.currentTarget as HTMLInputElement).value.trim();
    const value = Math.max(0, parseInt(raw, 10) || 0);
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade => {
      if (i !== props.index) { return cloneUpgrade(u); }
      return { ...cloneUpgrade(u), customMpCost: value };
    });
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
  };

  const isSwapUpgrade = () =>
    props.upgrade.templateId === 'frame' || props.upgrade.templateId === 'transformation';

  const swapAttrs = () => props.upgrade.swapAttributes;

  const isSubPool = () =>
    props.upgrade.templateId === 'expansion-pack' || props.upgrade.templateId === 'secret-equipment';

  // Suppress unused import warning — REPEATABLE_IDS is exported from upgradeUtils
  void REPEATABLE_IDS;

  return (
    <div class="p-4 rounded-lg border border-border bg-card space-y-2">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <Input value={props.upgrade.name} onBlur={handleNameBlur} class="-mx-1 mb-0.5 h-auto py-0 px-1 text-sm font-medium border-transparent shadow-none hover:border-input" />
          <Show when={props.def && props.upgrade.name !== props.def.name}>
            <p class="text-[11px] text-muted-foreground mb-0.5">{props.def!.name}</p>
          </Show>
          <div class="flex items-center gap-1.5 flex-wrap">
            <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">{upgradeCostDisplay(props.upgrade)}</Badge>
          </div>

          <Show when={props.upgrade.upgradeType === 'external'}>
            <div class="flex gap-1 mt-2 flex-wrap">
              <For each={EXTERNAL_AREAS}>
                {(area) => (
                  <button
                    onClick={() => handleAreaChange(area)}
                    class={cn(
                      'text-xs px-2 py-0.5 rounded border transition-colors capitalize',
                      props.upgrade.area === area ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground',
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

          <Show when={props.def?.isSpecialist}>
            <Input value={props.upgrade.specialistLabel ?? ''} placeholder="Enter specialization…" onBlur={handleLabelBlur} class="mt-1.5 h-7 text-xs" />
          </Show>

          <Show when={isSwapUpgrade() && props.hasSuperiorMorphing}>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Superior Morphing is present — manage this form through its builder instead.
            </p>
          </Show>

          <Show when={isSwapUpgrade()}>
            <div class="mt-2 space-y-1">
              <p class="text-xs text-muted-foreground">
                Choose two attributes to swap values{isSwapComplete(swapAttrs()) ? ':' : ' (select one, then another):'}
              </p>
              <div class="flex gap-1 flex-wrap">
                <For each={SWAP_ATTR_OPTIONS}>
                  {(attr) => (
                    <button
                      onClick={() => handleSwapAttrToggle(attr)}
                      disabled={isAttrDisabled(swapAttrs(), attr)}
                      class={cn(
                        'text-xs px-2 py-0.5 rounded border transition-colors capitalize',
                        isAttrSelected(swapAttrs(), attr) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground',
                        isAttrDisabled(swapAttrs(), attr) && 'opacity-40 cursor-not-allowed',
                      )}
                    >
                      {attr}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

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
                        props.upgrade.terrainType === terrain ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground',
                      )}
                    >
                      {terrain}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <Show when={props.upgrade.templateId === 'invincible-super-combination'}>
            <div class="mt-2 space-y-1">
              <p class="text-xs text-muted-foreground">MP cost scales with Power Level (PL 0 = 20, each PL adds 10):</p>
              <Input type="number" min={0} value={props.upgrade.customMpCost ?? 0} onBlur={handleCustomMpBlur} class="h-7 text-xs w-24" />
            </div>
          </Show>

          <Show when={isSubPool()}>
            <SubPoolModal mecha={props.mecha} upgradeIndex={props.index} />
          </Show>

          <Show when={props.upgrade.templateId === 'superior-morphing'}>
            <FormPoolModal mecha={props.mecha} upgradeIndex={props.index} />
          </Show>
        </div>

        <Button size="icon" variant="ghost" class="size-7 text-muted-foreground hover:text-destructive shrink-0" onClick={handleRemove}>
          ×
        </Button>
      </div>
    </div>
  );
};
