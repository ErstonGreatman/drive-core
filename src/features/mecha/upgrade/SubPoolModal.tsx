import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Mecha, MechaUpgrade, MechaSubUpgrade, MechaWeapon } from '~/types/mecha';
import type { UpgradeTemplateDefinition, WeaponTemplateDefinition } from '~/data';
import { upgradeTemplatesById, weaponTemplatesById } from '~/data';
import { updateMecha } from '~/stores/mecha';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import * as DialogPrimitive from '@kobalte/core/dialog';
import { SUB_POOL_CAPACITY, cloneUpgrade, cloneSubWeapon, cloneSubUpgrade, subItemsUsedMP } from './upgradeUtils';
import { PoolItemBrowser } from './PoolItemBrowser';

interface SubPoolModalProps {
  mecha: Mecha;
  upgradeIndex: number;
}

export const SubPoolModal = (props: SubPoolModalProps): JSX.Element => {
  const [open, setOpen] = createSignal(false);

  const upgrade = () => props.mecha.upgrades[props.upgradeIndex];
  const usedMP = () => subItemsUsedMP(upgrade());
  const currentWeapons = () => upgrade().subItems?.weapons ?? [];
  const currentUpgrades = () => upgrade().subItems?.upgrades ?? [];

  const patchSubItems = (
    patcher: (items: { weapons: MechaWeapon[]; upgrades: MechaSubUpgrade[] }) => { weapons: MechaWeapon[]; upgrades: MechaSubUpgrade[] },
  ): void => {
    const current = upgrade().subItems ?? { weapons: [], upgrades: [] };
    const next = patcher({ weapons: current.weapons.map(cloneSubWeapon), upgrades: current.upgrades.map(cloneSubUpgrade) });
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade =>
      i !== props.upgradeIndex ? cloneUpgrade(u) : { ...cloneUpgrade(u), subItems: next }
    );
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
  };

  const handleAddWeapon = (def: WeaponTemplateDefinition): void => {
    patchSubItems((items) => ({
      ...items,
      weapons: [...items.weapons, {
        id: crypto.randomUUID(), templateId: def.id, name: def.name,
        description: def.description, area: 'separate' as const,
        keywords: [...def.keywords], energyCost: def.energyCost, abilities: [], isCustom: false,
      }],
    }));
  };

  const handleRemoveWeapon = (idx: number): void => {
    patchSubItems((items) => ({ ...items, weapons: items.weapons.filter((_, i) => i !== idx) }));
  };

  const handleWeaponNameBlur = (e: FocusEvent, idx: number): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    patchSubItems((items) => ({
      ...items,
      weapons: items.weapons.map((w, i): MechaWeapon => i !== idx ? w : { ...w, name: value || w.name }),
    }));
  };

  const handleAddUpgrade = (def: UpgradeTemplateDefinition): void => {
    patchSubItems((items) => ({
      ...items,
      upgrades: [...items.upgrades, {
        id: crypto.randomUUID(), templateId: def.id, name: def.name,
        description: def.description, upgradeType: def.upgradeType,
        area: def.upgradeType === 'internal' ? 'core' as const : 'separate' as const,
        effect: def.effect, mpCost: def.mpCost ?? 0,
      }],
    }));
  };

  const handleRemoveUpgrade = (idx: number): void => {
    patchSubItems((items) => ({ ...items, upgrades: items.upgrades.filter((_, i) => i !== idx) }));
  };

  const handleUpgradeNameBlur = (e: FocusEvent, idx: number): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    patchSubItems((items) => ({
      ...items,
      upgrades: items.upgrades.map((u, i): MechaSubUpgrade => i !== idx ? u : { ...u, name: value || u.name }),
    }));
  };

  return (
    <>
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
              <PoolItemBrowser capacity={SUB_POOL_CAPACITY} usedMP={usedMP} onAddWeapon={handleAddWeapon} onAddUpgrade={handleAddUpgrade} />

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

                <Show when={currentUpgrades().length > 0}>
                  <div class="space-y-1.5">
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Upgrades</p>
                    <For each={currentUpgrades()}>
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
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
};
