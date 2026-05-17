import type { JSX } from 'solid-js';
import { createSignal, Show, onCleanup } from 'solid-js';
import type { Mecha, MechaUpgrade } from '~/types/mecha';
import type { UpgradeTemplateDefinition } from '~/data';
import { updateMecha } from '~/stores/mecha';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { REPEATABLE_IDS, cloneUpgrade } from './upgradeUtils';

interface UpgradeRowProps {
  mecha: Mecha;
  def: UpgradeTemplateDefinition;
  alreadyTaken: boolean;
  hasSuperiorMorphing: boolean;
}

export const UpgradeRow = (props: UpgradeRowProps): JSX.Element => {
  const [justAdded, setJustAdded] = createSignal(false);
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(flashTimer));

  const handleAdd = (): void => {
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
  };

  const costLabel = () => {
    const cost = props.def.mpCost;
    if (cost === undefined) { return 'Variable'; }
    if (cost === 0) { return 'Free'; }
    return `${cost} MP`;
  };

  const canAdd = () => props.def.isSpecialist || REPEATABLE_IDS.has(props.def.id) || !props.alreadyTaken;

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
          <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">{costLabel()}</Badge>
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
};
