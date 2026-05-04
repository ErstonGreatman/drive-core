import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import type { Mecha } from '~/types/mecha';
import type { MechaAttributes } from '~/data';
import { updateMecha } from '~/stores/mecha';
import { computeSpentMP, attributeCostToRank, attributeIncrementalCost } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';

interface AttributeTabProps {
  mecha: Mecha;
}

type AttrKey = keyof MechaAttributes;

const ATTRIBUTE_ROWS: { key: AttrKey; label: string; description: string }[] = [
  { key: 'might', label: 'Might', description: 'Offensive power — damage dealt and melee strength.' },
  { key: 'energy', label: 'Energy', description: 'Available Energy per Turn for Beam weapons and active upgrades.' },
  { key: 'guard', label: 'Guard', description: 'Defensive strength — damage absorbed and evasion.' },
  { key: 'systems', label: 'Systems', description: 'Sensor range and accuracy at distance.' },
  { key: 'threshold', label: 'Threshold', description: 'Damage capacity per Threshold Layer (×4 standard + Core).' },
  { key: 'speed', label: 'Speed', description: 'Movement Zones available per Action.' },
];

export function AttributeTab(props: AttributeTabProps): JSX.Element {
  function handleIncrement(key: AttrKey): void {
    const current = props.mecha.attributes[key];
    if (current >= 10) { return; }
    const newAttrs: MechaAttributes = { ...props.mecha.attributes, [key]: current + 1 };
    const newSpent = computeSpentMP(newAttrs, props.mecha.weapons, props.mecha.upgrades);
    updateMecha(props.mecha.id, { attributes: newAttrs, spentMP: newSpent });
  }

  function handleDecrement(key: AttrKey): void {
    const current = props.mecha.attributes[key];
    if (current <= 0) { return; }
    const newAttrs: MechaAttributes = { ...props.mecha.attributes, [key]: current - 1 };
    const newSpent = computeSpentMP(newAttrs, props.mecha.weapons, props.mecha.upgrades);
    updateMecha(props.mecha.id, { attributes: newAttrs, spentMP: newSpent });
  }

  return (
    <div class="space-y-0 pt-4">
      <For each={ATTRIBUTE_ROWS}>
        {(row) => {
          const rank = () => props.mecha.attributes[row.key];
          const nextCost = () => attributeIncrementalCost(rank());
          const canIncrease = () => rank() < 10;

          return (
            <div class="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-sm font-medium">{row.label}</span>
                  <Badge variant="muted" class="font-mono text-[10px] px-1.5 py-0">
                    {attributeCostToRank(rank())} MP
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground mt-0.5">{row.description}</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <Button
                  size="icon"
                  variant="outline"
                  class="size-7"
                  disabled={rank() <= 0}
                  onClick={() => handleDecrement(row.key)}
                  title={rank() > 0 ? `Refund ${attributeIncrementalCost(rank() - 1)} MP` : undefined}
                >
                  −
                </Button>
                <span class="w-6 text-center text-sm font-semibold tabular-nums">{rank()}</span>
                <Button
                  size="icon"
                  variant="outline"
                  class="size-7"
                  disabled={!canIncrease()}
                  onClick={() => handleIncrement(row.key)}
                  title={canIncrease() ? `Costs ${nextCost()} MP` : undefined}
                >
                  +
                </Button>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
