import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import type { GenrePowerDefinition } from '~/data';
import { alternativesByDefaultId } from '~/lib/genrePowerRules';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';

interface DefaultSlotProps {
  pilot: Pilot;
  defaultPower: GenrePowerDefinition;
}

export const DefaultSlot = (props: DefaultSlotProps): JSX.Element => {
  const alternative = alternativesByDefaultId[props.defaultPower.id];
  const usingAlternative = () =>
    !!alternative && props.pilot.genrePowerIds.includes(alternative.id);
  const current = () => usingAlternative() ? alternative : props.defaultPower;

  const toggleAlternative = (): void => {
    if (!alternative) { return; }
    let newIds: string[];
    if (usingAlternative()) {
      newIds = props.pilot.genrePowerIds
        .filter((id) => id !== alternative.id)
        .concat(props.defaultPower.id);
    } else {
      newIds = props.pilot.genrePowerIds
        .filter((id) => id !== props.defaultPower.id)
        .concat(alternative.id);
    }
    updatePilot(props.pilot.id, { genrePowerIds: newIds });
  };

  return (
    <div class="p-3 rounded-lg border border-border bg-card space-y-1.5">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-medium">{current().name}</span>
            <Badge variant="muted" class="text-[10px] px-1.5 py-0 capitalize">{current().powerType}</Badge>
            <Show when={usingAlternative()}>
              <Badge variant="secondary" class="text-[10px] px-1.5 py-0">Alternative</Badge>
            </Show>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{current().effect}</p>
        </div>
        <Show when={!!alternative}>
          <Button
            size="sm"
            variant="ghost"
            class="shrink-0 h-7 px-2 text-xs text-muted-foreground"
            onClick={toggleAlternative}
            title={usingAlternative() ? `Switch back to ${props.defaultPower.name}` : `Swap for ${alternative.name}`}
          >
            {usingAlternative() ? '↩ Revert' : '⇄ Swap'}
          </Button>
        </Show>
      </div>
      <Show when={usingAlternative()}>
        <p class="text-xs text-muted-foreground/60 leading-snug">
          Replaces: {props.defaultPower.name}
        </p>
      </Show>
    </div>
  );
};
