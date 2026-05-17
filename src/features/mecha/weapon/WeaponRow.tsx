import type { JSX } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';
import type { Mecha, MechaWeapon } from '~/types/mecha';
import type { WeaponTemplateDefinition } from '~/data';
import { updateMecha } from '~/stores/mecha';
import { computeSpentMP } from '~/lib/mecha-costs';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { cloneWeapon } from './weaponUtils';
import { KeywordBadges } from './KeywordBadges';

interface WeaponRowProps {
  mecha: Mecha;
  def: WeaponTemplateDefinition;
}

export const WeaponRow = (props: WeaponRowProps): JSX.Element => {
  const [justAdded, setJustAdded] = createSignal(false);
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(flashTimer));

  const handleAdd = (): void => {
    const newWeapon: MechaWeapon = {
      id: crypto.randomUUID(),
      templateId: props.def.id,
      name: props.def.name,
      description: props.def.description,
      area: 'arms',
      keywords: [...props.def.keywords],
      energyCost: props.def.energyCost,
      abilities: [],
      isCustom: false,
    };
    const newWeapons = [...props.mecha.weapons.map(cloneWeapon), newWeapon];
    const newSpent = computeSpentMP(props.mecha.attributes, newWeapons, props.mecha.upgrades);
    updateMecha(props.mecha.id, { weapons: newWeapons, spentMP: newSpent });
    clearTimeout(flashTimer);
    setJustAdded(true);
    flashTimer = setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div class="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-sm font-medium">{props.def.name}</span>
          <Badge variant="muted" class="text-[10px] px-1.5 py-0 font-mono">5 MP</Badge>
          <KeywordBadges keywords={props.def.keywords} />
        </div>
        <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{props.def.effect}</p>
      </div>
      <Button
        size="sm"
        variant={justAdded() ? 'secondary' : 'outline'}
        class="h-7 px-2 text-xs shrink-0 transition-all"
        onClick={handleAdd}
      >
        {justAdded() ? '✓ Added' : '+'}
      </Button>
    </div>
  );
};
