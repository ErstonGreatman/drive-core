import type { JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { defaultGenrePowers } from '~/data';
import { powerLevel } from '~/lib/pilot-costs';
import { Separator } from '~/components/ui/separator';
import { DefaultSlot } from './power/DefaultSlot';
import { AdditionalSlot } from './power/AdditionalSlot';

interface PowerTabProps {
  pilot: Pilot;
}

export const PowerTab = (props: PowerTabProps): JSX.Element => {
  const pl = () => powerLevel(props.pilot.experience);
  const additionalSlots = () => pl();

  return (
    <div class="space-y-6">
      <p class="text-sm text-muted-foreground">
        All pilots start with the 6 Default Powers. Each can be swapped for its Alternative. You also get one additional Genre Power per Power Level.
      </p>

      <div class="space-y-2">
        <h3 class="text-sm font-semibold">Default Powers (6)</h3>
        <div class="space-y-2">
          <For each={defaultGenrePowers}>
            {(power) => <DefaultSlot pilot={props.pilot} defaultPower={power} />}
          </For>
        </div>
      </div>

      <Show when={additionalSlots() > 0}>
        <Separator />
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">
            Additional Powers ({additionalSlots()} from PL {pl()})
          </h3>
          <For each={Array.from({ length: additionalSlots() })}>
            {(_, i) => <AdditionalSlot pilot={props.pilot} slotIndex={i()} />}
          </For>
        </div>
      </Show>

      <Show when={pl() === 0}>
        <p class="text-sm text-muted-foreground">
          Reach Power Level 1 (30 XP) to unlock additional Genre Powers.
        </p>
      </Show>
    </div>
  );
};
