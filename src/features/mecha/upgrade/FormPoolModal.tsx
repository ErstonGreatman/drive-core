import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Mecha, MechaUpgrade, MechaSubUpgrade, MechaWeapon, FormPool, MechaAttributeKey } from '~/types/mecha';
import type { UpgradeTemplateDefinition, WeaponTemplateDefinition } from '~/data';
import { upgradeTemplatesById, weaponTemplatesById } from '~/data';
import { updateMecha } from '~/stores/mecha';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import * as DialogPrimitive from '@kobalte/core/dialog';
import {
  FORM_POOL_CAPACITY, SWAP_ATTR_OPTIONS, cloneUpgrade, cloneSubWeapon, cloneSubUpgrade, cloneFormPool, cap,
  isAttrSelected, isSwapComplete, isAttrDisabled, nextSwapState,
} from './upgradeUtils';
import { PoolItemBrowser } from './PoolItemBrowser';
import { SortableList } from '~/components/SortableList';

interface FormPoolModalProps {
  mecha: Mecha;
  upgradeIndex: number;
}

export const FormPoolModal = (props: FormPoolModalProps): JSX.Element => {
  const [open, setOpen] = createSignal(false);
  const [activeIdx, setActiveIdx] = createSignal(0);
  const [labelDraft, setLabelDraft] = createSignal('');

  const upgrade = () => props.mecha.upgrades[props.upgradeIndex];
  const pools = () => upgrade().formPools ?? [];
  const poolIdx = () => { const i = activeIdx(); const ps = pools(); return i < ps.length ? i : 0; };
  const pool = () => pools()[poolIdx()];

  const syncLabelDraft = () => setLabelDraft(pool()?.label ?? '');

  const usedMP = () =>
    (pool()?.weapons.length ?? 0) * 5 +
    (pool()?.upgrades.reduce((s, u) => s + u.mpCost, 0) ?? 0);

  const extraCost = () => Math.max(0, pools().length - 2) * 10;

  const patchPools = (updater: (pools: FormPool[]) => FormPool[]): void => {
    const newPools = updater(pools().map(cloneFormPool));
    const newUpgrades = props.mecha.upgrades.map((u, i): MechaUpgrade =>
      i !== props.upgradeIndex ? cloneUpgrade(u) : { ...cloneUpgrade(u), formPools: newPools }
    );
    const newSpent = computeSpentMP(props.mecha.attributes, props.mecha.weapons, newUpgrades);
    updateMecha(props.mecha.id, { upgrades: newUpgrades, spentMP: newSpent });
  };

  const patchActivePool = (updater: (p: FormPool) => FormPool): void => {
    patchPools((ps) => ps.map((p, i) => i !== poolIdx() ? p : updater({ ...cloneFormPool(p) })));
  };

  const handleAddPool = (): void => {
    const newIdx = pools().length;
    const newLabel = `Form ${newIdx + 1}`;
    patchPools((ps) => [...ps, { id: crypto.randomUUID(), label: newLabel, weapons: [], upgrades: [] }]);
    setActiveIdx(newIdx);
    setLabelDraft(newLabel);
  };

  const handleRemovePool = (idx: number): void => {
    patchPools((ps) => ps.filter((_, i) => i !== idx));
    if (activeIdx() >= idx) {
      const nextIdx = Math.max(0, activeIdx() - 1);
      setActiveIdx(nextIdx);
      const ps = pools();
      setLabelDraft(ps[nextIdx < ps.length ? nextIdx : 0]?.label ?? '');
    }
  };

  const swapAttrs = () => pool()?.swapAttributes;

  const handleSwapToggle = (attr: MechaAttributeKey): void => {
    patchActivePool((p) => ({ ...p, swapAttributes: nextSwapState(p.swapAttributes, attr) }));
  };

  const handleLabelInput = (e: InputEvent): void => {
    setLabelDraft((e.currentTarget as HTMLInputElement).value);
  };

  const handleLabelBlur = (): void => {
    const value = labelDraft().trim();
    if (value) { patchActivePool((p) => ({ ...p, label: value })); }
    else { setLabelDraft(pool()?.label ?? ''); }
  };

  const handleAddWeapon = (def: WeaponTemplateDefinition): void => {
    patchActivePool((p) => ({
      ...p,
      weapons: [...p.weapons, {
        id: crypto.randomUUID(), templateId: def.id, name: def.name,
        description: def.description, area: 'separate' as const,
        keywords: [...def.keywords], energyCost: def.energyCost, abilities: [], isCustom: false,
      }],
    }));
  };

  const handleRemoveWeapon = (idx: number): void => {
    patchActivePool((p) => ({ ...p, weapons: p.weapons.filter((_, i) => i !== idx) }));
  };

  const handleWeaponNameBlur = (e: FocusEvent, idx: number): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    patchActivePool((p) => ({
      ...p,
      weapons: p.weapons.map((w, i): MechaWeapon => i !== idx ? w : { ...w, name: value || w.name }),
    }));
  };

  const handleAddUpgrade = (def: UpgradeTemplateDefinition): void => {
    patchActivePool((p) => ({
      ...p,
      upgrades: [...p.upgrades, {
        id: crypto.randomUUID(), templateId: def.id, name: def.name,
        description: def.description, upgradeType: def.upgradeType,
        area: def.upgradeType === 'internal' ? 'core' as const : 'separate' as const,
        effect: def.effect, mpCost: def.mpCost ?? 0,
      }],
    }));
  };

  const handleRemoveUpgrade = (idx: number): void => {
    patchActivePool((p) => ({ ...p, upgrades: p.upgrades.filter((_, i) => i !== idx) }));
  };

  const handleUpgradeNameBlur = (e: FocusEvent, idx: number): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    patchActivePool((p) => ({
      ...p,
      upgrades: p.upgrades.map((u, i): MechaSubUpgrade => i !== idx ? u : { ...u, name: value || u.name }),
    }));
  };

  const handleReorderWeapons = (newWeapons: MechaWeapon[]): void => {
    patchActivePool((p) => ({ ...p, weapons: newWeapons }));
  };

  const handleReorderUpgrades = (newUpgrades: MechaSubUpgrade[]): void => {
    patchActivePool((p) => ({ ...p, upgrades: newUpgrades }));
  };

  return (
    <>
      <button
        onClick={() => { syncLabelDraft(); setOpen(true); }}
        class="mt-2 w-full flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/60 hover:border-foreground/30 transition-colors cursor-pointer"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="font-medium text-foreground">Alternate Forms</span>
          <span class="text-muted-foreground">{pools().length} form{pools().length !== 1 ? 's' : ''}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0 text-muted-foreground">
          <span class="font-mono">20 MP base{extraCost() > 0 ? ` + ${extraCost()} MP` : ''}</span>
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
            <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
              <div>
                <DialogPrimitive.Title class="text-base font-semibold">{upgrade().name} — Alternate Forms</DialogPrimitive.Title>
                <p class="text-xs mt-0.5 text-muted-foreground font-mono">
                  {pools().length} form{pools().length !== 1 ? 's' : ''} · 20 MP base{extraCost() > 0 ? ` + ${extraCost()} MP extra` : ''}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Button size="sm" variant="outline" class="h-7 text-xs" onClick={handleAddPool}>+ Add Form (+10 MP)</Button>
                <DialogPrimitive.CloseButton class="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</DialogPrimitive.CloseButton>
              </div>
            </div>

            {/* Form tabs */}
            <div class="flex gap-1 px-4 py-2.5 border-b border-border shrink-0 overflow-x-auto">
              <For each={pools()}>
                {(p, i) => (
                  <button
                    onClick={() => { setActiveIdx(i()); setLabelDraft(pools()[i()]?.label ?? ''); }}
                    class={cn(
                      'px-3 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap',
                      poolIdx() === i() ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                    )}
                  >
                    {poolIdx() === i() ? labelDraft() || p.label : p.label}
                  </button>
                )}
              </For>
            </div>

            <div class="flex flex-1 min-h-0 divide-x divide-border">
              <PoolItemBrowser capacity={FORM_POOL_CAPACITY} usedMP={usedMP} onAddWeapon={handleAddWeapon} onAddUpgrade={handleAddUpgrade} />

              {/* Right: current form contents */}
              <div class="w-64 shrink-0 overflow-y-auto px-4 py-4 space-y-4">
                <div class="space-y-1">
                  <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Form Name</p>
                  <Input value={labelDraft()} onInput={handleLabelInput} onBlur={handleLabelBlur} class="-mx-1 h-auto py-0 px-1 text-xs font-semibold border-transparent shadow-none hover:border-input" />
                </div>

                <p class={cn('text-xs font-mono', usedMP() > FORM_POOL_CAPACITY ? 'text-destructive' : 'text-muted-foreground')}>
                  {usedMP()} / {FORM_POOL_CAPACITY} MP
                </p>

                <Show
                  when={poolIdx() !== 0}
                  fallback={
                    <p class="text-xs text-muted-foreground italic">Base Form — no attribute swap.</p>
                  }
                >
                  <div class="space-y-1.5">
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Attribute Swap {isSwapComplete(swapAttrs()) ? ':' : '(optional)'}
                    </p>
                    <div class="flex gap-1 flex-wrap">
                      <For each={SWAP_ATTR_OPTIONS}>
                        {(attr) => (
                          <button
                            onClick={() => handleSwapToggle(attr)}
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
                      <Show when={swapAttrs()}>
                        <button onClick={() => patchActivePool((p) => ({ ...p, swapAttributes: undefined }))} class="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors">
                          Clear
                        </button>
                      </Show>
                    </div>
                    <Show when={isSwapComplete(swapAttrs())}>
                      <p class="text-xs text-primary">{cap(swapAttrs()![0])} ↔ {cap(swapAttrs()![1])}</p>
                    </Show>
                  </div>
                </Show>

                <Show when={(pool()?.weapons.length ?? 0) === 0 && (pool()?.upgrades.length ?? 0) === 0}>
                  <p class="text-xs text-muted-foreground italic">Nothing added yet.</p>
                </Show>

                <Show when={(pool()?.weapons.length ?? 0) > 0}>
                  <div class="space-y-1.5">
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Weapons</p>
                    <SortableList items={pool()?.weapons ?? []} onReorder={handleReorderWeapons}>
                      {(w, i) => {
                        const tName = () => w.templateId ? weaponTemplatesById[w.templateId!]?.name : undefined;
                        return (
                          <div class="flex items-start gap-1.5">
                            <div class="flex-1 min-w-0">
                              <Input value={w.name} onBlur={(e) => handleWeaponNameBlur(e, i())} class="-mx-1 h-auto py-0 px-1 text-xs font-medium border-transparent shadow-none hover:border-input" />
                              <Show when={tName()}>
                                <p class="text-[10px] text-muted-foreground leading-none mt-0.5">{tName()}</p>
                              </Show>
                            </div>
                            <Badge variant="muted" class="text-[10px] px-1 py-0 font-mono shrink-0">5 MP</Badge>
                            <button onClick={() => handleRemoveWeapon(i())} class="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none shrink-0">×</button>
                          </div>
                        );
                      }}
                    </SortableList>
                  </div>
                </Show>

                <Show when={(pool()?.upgrades.length ?? 0) > 0}>
                  <div class="space-y-1.5">
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Upgrades</p>
                    <SortableList items={pool()?.upgrades ?? []} onReorder={handleReorderUpgrades}>
                      {(u, i) => {
                        const tName = () => u.templateId ? upgradeTemplatesById[u.templateId!]?.name : undefined;
                        return (
                          <div class="flex items-start gap-1.5">
                            <div class="flex-1 min-w-0">
                              <Input value={u.name} onBlur={(e) => handleUpgradeNameBlur(e, i())} class="-mx-1 h-auto py-0 px-1 text-xs font-medium border-transparent shadow-none hover:border-input" />
                              <Show when={tName()}>
                                <p class="text-[10px] text-muted-foreground leading-none mt-0.5">{tName()}</p>
                              </Show>
                            </div>
                            <Badge variant="muted" class="text-[10px] px-1 py-0 font-mono shrink-0">{u.mpCost} MP</Badge>
                            <button onClick={() => handleRemoveUpgrade(i())} class="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none shrink-0">×</button>
                          </div>
                        );
                      }}
                    </SortableList>
                  </div>
                </Show>

                <Show when={pools().length > 2 && poolIdx() >= 2}>
                  <button onClick={() => handleRemovePool(poolIdx())} class="mt-2 w-full text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors">
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
};
