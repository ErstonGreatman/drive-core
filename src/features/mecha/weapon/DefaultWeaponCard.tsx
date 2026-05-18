import type { JSX } from 'solid-js';
import type { Mecha } from '~/types/mecha';
import type { WeaponTemplateDefinition } from '~/data';
import { updateMecha } from '~/stores/mecha';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { KeywordBadges } from './KeywordBadges';

interface DefaultWeaponCardProps {
  mecha: Mecha;
  def: WeaponTemplateDefinition;
}

export const DefaultWeaponCard = (props: DefaultWeaponCardProps): JSX.Element => {
  const displayName = () => props.mecha.defaultWeaponNames?.[props.def.id] ?? props.def.name;

  const handleNameBlur = (e: FocusEvent): void => {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const effectiveName = value || props.def.name;
    const current = { ...(props.mecha.defaultWeaponNames ?? {}) };
    if (effectiveName === props.def.name) {
      delete current[props.def.id];
    } else {
      current[props.def.id] = effectiveName;
    }
    updateMecha(props.mecha.id, {
      defaultWeaponNames: Object.keys(current).length > 0 ? current : undefined,
    });
  };

  return (
    <div class="p-3 rounded-lg border border-border/60 bg-muted/30">
      <Input
        value={displayName()}
        onBlur={handleNameBlur}
        class="-mx-1 h-auto py-0 px-1 text-sm font-medium border-transparent shadow-none hover:border-input bg-transparent"
      />
      <p class="text-[11px] text-muted-foreground mb-0.5">{props.def.name}</p>
      <div class="flex items-center gap-1.5 flex-wrap mb-1">
        <Badge variant="secondary" class="text-[10px] px-1.5 py-0 font-mono">Free</Badge>
        <KeywordBadges keywords={props.def.keywords} />
      </div>
      <p class="text-xs text-muted-foreground leading-snug">{props.def.effect}</p>
    </div>
  );
};
