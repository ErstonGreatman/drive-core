import type { JSX } from 'solid-js';
import { Show, For } from 'solid-js';
import type { MechaWeapon } from '~/types/mecha';
import { weaponTemplatesById } from '~/data';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';
import { keywordName, areaLabel } from './mechaSheetUtils';

export const WeaponEntry = (props: { weapon: MechaWeapon; isDefault?: boolean }): JSX.Element => {
  const w = () => props.weapon;
  const templateName = () => w().templateId ? weaponTemplatesById[w().templateId!]?.name : undefined;

  return (
    <div class="py-2 border-b border-border/40 last:border-0">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span class="text-sm font-medium">{w().name}</span>
          <For each={w().keywords}>
            {(kw) => (
              <Badge
                variant="muted"
                class={cn(
                  'text-[10px] px-1.5 py-0',
                  kw === 'beam' && 'bg-primary/10 text-primary',
                )}
              >
                {keywordName(kw)}
              </Badge>
            )}
          </For>
          <Show when={!props.isDefault}>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize">
              {areaLabel(w().area)}
            </Badge>
          </Show>
        </div>
        <Show when={!props.isDefault}>
          <Badge variant="muted" class="font-mono text-[10px] px-1.5 py-0 shrink-0">5 MP</Badge>
        </Show>
      </div>
      <Show when={templateName() && templateName() !== w().name}>
        <p class="text-[11px] text-muted-foreground">{templateName()}</p>
      </Show>
      <Show when={w().energyCost}>
        <p class="text-xs text-muted-foreground mt-0.5">Energy cost: {w().energyCost}</p>
      </Show>
      <Show when={w().abilities.length > 0}>
        <div class="mt-1 space-y-0.5">
          <For each={w().abilities}>
            {(ability) => (
              <p class="text-xs text-muted-foreground leading-snug">
                <span class="font-medium text-foreground">{ability.name}</span>
                {ability.label && <span class="text-foreground"> ({ability.label})</span>}
                {ability.wpCost !== 0 && <span class="font-mono"> ({ability.wpCost > 0 ? `+${ability.wpCost}` : ability.wpCost} WP)</span>}
                {ability.description && ` — ${ability.description}`}
              </p>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
