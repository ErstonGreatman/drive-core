import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Mecha, MechaWeapon } from '~/types/mecha';
import { weaponAbilitiesById } from '~/data';
import { updateMecha } from '~/stores/mecha';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import * as DialogPrimitive from '@kobalte/core/dialog';
import { cloneWeapon } from './weaponUtils';
import {
  BASE_WP, ABILITY_GROUPS, ABILITY_KEYWORD,
  remainingWP, isBeam, beamBoostCost, hasInnateWithoutDrawback,
  canSelectAbility, canDeselectAbility, buildKeywords,
} from './weaponBuilderRules';
import type { BaseType } from './weaponBuilderRules';

interface CustomWeaponBuilderProps {
  mecha: Mecha;
  open: boolean;
  onClose: () => void;
}

export const CustomWeaponBuilder = (props: CustomWeaponBuilderProps): JSX.Element => {
  const [name, setName] = createSignal('');
  const [baseType, setBaseType] = createSignal<BaseType>('melee');
  const [selected, setSelected] = createSignal(new Set<string>());
  const [abilityLabels, setAbilityLabels] = createSignal<Record<string, string>>({});

  const wp = () => remainingWP(selected(), baseType());
  const beam = () => isBeam(selected());
  const canSave = () => name().trim() !== '' && wp() >= 0 && !hasInnateWithoutDrawback(selected());

  const toggleAbility = (id: string): void => {
    const next = new Set(selected());
    if (next.has(id)) {
      if (!canDeselectAbility(id, next, baseType())) { return; }
      next.delete(id);
    } else {
      if (!canSelectAbility(id, next, baseType())) { return; }
      next.add(id);
    }
    setSelected(next);
  };

  const handleSave = (): void => {
    const n = name().trim();
    if (!n) { return; }
    const keywords = buildKeywords(baseType(), selected());
    const abilities = [...selected()]
      .map((id) => {
        const def = weaponAbilitiesById[id];
        if (!def) { return null; }
        const label = abilityLabels()[id]?.trim() || undefined;
        return { abilityTemplateId: id, name: def.name, description: def.description, wpCost: def.wpCost, label };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);
    const newWeapon: MechaWeapon = {
      id: crypto.randomUUID(), name: n, area: 'arms', keywords,
      energyCost: beam() ? 1 : undefined, abilities, isCustom: true,
    };
    const newWeapons = [...props.mecha.weapons.map(cloneWeapon), newWeapon];
    const newSpent = computeSpentMP(props.mecha.attributes, newWeapons, props.mecha.upgrades);
    updateMecha(props.mecha.id, { weapons: newWeapons, spentMP: newSpent });
    setName('');
    setBaseType('melee');
    setSelected(new Set<string>());
    setAbilityLabels({});
    props.onClose();
  };

  return (
    <DialogPrimitive.Root open={props.open} onOpenChange={(v) => { if (!v) { props.onClose(); } }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay class="fixed inset-0 z-50 bg-black/75" />
        <DialogPrimitive.Content class={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
          'rounded-lg border border-border bg-card shadow-xl flex flex-col max-h-[85vh]',
        )}>
          <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
            <DialogPrimitive.Title class="text-base font-semibold">Build Custom Weapon</DialogPrimitive.Title>
            <DialogPrimitive.CloseButton class="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</DialogPrimitive.CloseButton>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <div class="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2.5 space-y-1 leading-relaxed">
              <p><span class="font-medium text-foreground">GM permission required.</span> Custom Weapons are ripe for exploitation — only use this system when the whole group is on board.</p>
              <p><span class="font-medium text-foreground">Justify it narratively.</span> Your weapon's quirks should make sense in the setting.</p>
              <p><span class="font-medium text-foreground">Check the premades first.</span> Many weapons in Chapter 3 are strictly stronger than anything this system can produce.</p>
            </div>

            <div class="space-y-1.5">
              <p class="text-sm font-medium">Name</p>
              <Input value={name()} onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} placeholder="Custom weapon name…" />
            </div>

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
              <span class={cn('text-sm font-mono shrink-0', wp() < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                {wp()} / {BASE_WP[baseType()]} WP
              </span>
            </div>

            <Show when={beam()}>
              <div class="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 leading-relaxed">
                Base energy 1 · Boost energy {beamBoostCost(selected())}. All abilities except Remote apply only when Boosted.
              </div>
            </Show>

            <div class="space-y-4">
              <For each={ABILITY_GROUPS}>
                {(group) => (
                  <div>
                    <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{group.label}</p>
                    <div class="space-y-0.5">
                      <For each={group.ids}>
                        {(id) => {
                          const def = weaponAbilitiesById[id];
                          if (!def) { return null; }
                          const isSelected = () => selected().has(id);
                          const isToggleable = () => isSelected() ? canDeselectAbility(id, selected(), baseType()) : canSelectAbility(id, selected(), baseType());
                          return (
                            <div>
                              <button
                                onClick={() => toggleAbility(id)}
                                disabled={!isToggleable()}
                                class={cn(
                                  'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-left transition-colors',
                                  isSelected() ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground',
                                  !isToggleable() && 'opacity-40 cursor-not-allowed',
                                )}
                              >
                                <span class="flex items-center gap-2 min-w-0 text-sm">
                                  <span class={cn(
                                    'size-4 shrink-0 rounded-sm border flex items-center justify-center text-[10px] leading-none',
                                    isSelected() ? 'bg-primary border-primary text-primary-foreground' : 'border-border',
                                  )}>
                                    {isSelected() ? '✓' : ''}
                                  </span>
                                  <span class="truncate">{def.name}</span>
                                </span>
                                <span class={cn('text-xs font-mono shrink-0', def.wpCost < 0 ? 'text-green-600 dark:text-green-400' : '')}>
                                  {def.wpCost > 0 ? `+${def.wpCost}` : def.wpCost} WP
                                </span>
                              </button>
                              <Show when={id === 'conditional-advantage' && isSelected()}>
                                <Input
                                  value={abilityLabels()['conditional-advantage'] ?? ''}
                                  onInput={(e) => setAbilityLabels({ ...abilityLabels(), 'conditional-advantage': (e.currentTarget as HTMLInputElement).value })}
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
              <p class="text-xs text-destructive">Innate Advantage requires at least one drawback.</p>
            </Show>
          </div>

          <div class="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            <Button variant="outline" size="sm" onClick={props.onClose}>Cancel</Button>
            <Button size="sm" disabled={!canSave()} onClick={handleSave}>Add Weapon</Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
