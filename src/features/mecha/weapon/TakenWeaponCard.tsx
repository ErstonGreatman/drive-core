import type { JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Mecha, MechaWeapon } from '~/types/mecha';
import { updateMecha } from '~/stores/mecha';
import { weaponTemplatesById } from '~/data';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { WEAPON_AREAS, cloneWeapon, customBoostCost } from './weaponUtils';
import type { WeaponArea } from './weaponUtils';
import { KeywordBadges } from './KeywordBadges';

interface TakenWeaponCardProps {
  mecha: Mecha;
  weapon: MechaWeapon;
  index: number;
}

export const TakenWeaponCard = (props: TakenWeaponCardProps): JSX.Element => {
  const handleRemove = (): void => {
    const newWeapons = props.mecha.weapons
      .filter((_, i) => i !== props.index)
      .map(cloneWeapon);
    const newSpent = computeSpentMP(props.mecha.attributes, newWeapons, props.mecha.upgrades);
    updateMecha(props.mecha.id, { weapons: newWeapons, spentMP: newSpent });
  };

  const handleAreaChange = (area: WeaponArea): void => {
    const newWeapons = props.mecha.weapons.map((w, i): MechaWeapon => {
      if (i !== props.index) { return cloneWeapon(w); }
      return { ...cloneWeapon(w), area };
    });
    updateMecha(props.mecha.id, { weapons: newWeapons });
  };

  const handleNameBlur = (e: FocusEvent): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const newWeapons = props.mecha.weapons.map((w, i): MechaWeapon => {
      if (i !== props.index) { return cloneWeapon(w); }
      return { ...cloneWeapon(w), name: value || w.name };
    });
    updateMecha(props.mecha.id, { weapons: newWeapons });
  };

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
          <Show when={baseName()}>
            <p class="text-[11px] text-muted-foreground mb-2">{baseName()}</p>
          </Show>
          <div class="flex items-center gap-1.5 flex-wrap">
            <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">5 MP</Badge>
            <Show when={props.weapon.isCustom}>
              <Badge variant="outline" class="text-[10px] px-1.5 py-0">Custom</Badge>
            </Show>
            <KeywordBadges keywords={props.weapon.keywords} />
          </div>
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
};
