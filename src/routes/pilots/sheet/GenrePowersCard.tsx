import type { JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { defaultGenrePowers, genrePowersById } from '~/data';
import { powerLevel } from '~/lib/pilot-costs';
import { alternativesByDefaultId, defaultAndAlternativeIds } from '~/lib/genrePowerRules';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';

interface GenrePowersCardProps {
  pilot: Pilot;
}

export const GenrePowersCard = (props: GenrePowersCardProps): JSX.Element => {
  const pl = () => powerLevel(props.pilot.experience);
  const additionalPowerIds = () =>
    props.pilot.genrePowerIds.filter((id) => !defaultAndAlternativeIds.has(id));

  return (
    <Card>
      <CardHeader><CardTitle>Genre Powers</CardTitle></CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-1.5">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Default (6)</p>
          <div class="space-y-2">
            <For each={defaultGenrePowers}>
              {(defaultPower) => {
                const alt = alternativesByDefaultId[defaultPower.id];
                const usingAlt = alt && props.pilot.genrePowerIds.includes(alt.id);
                const current = usingAlt ? alt : defaultPower;
                return (
                  <div class="rounded-md border border-border bg-card/50 px-3 py-2 space-y-0.5">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-sm font-medium">{current.name}</span>
                      <Badge variant="muted" class="text-[10px] px-1.5 py-0 capitalize">{current.powerType}</Badge>
                      <Show when={usingAlt}>
                        <Badge variant="secondary" class="text-[10px] px-1.5 py-0">Alt</Badge>
                      </Show>
                    </div>
                    <p class="text-xs text-muted-foreground leading-snug">{current.effect}</p>
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        <Show when={additionalPowerIds().length > 0}>
          <Separator />
          <div class="space-y-1.5">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Additional ({additionalPowerIds().length} from PL {pl()})
            </p>
            <div class="space-y-2">
              <For each={additionalPowerIds()}>
                {(id) => {
                  const power = genrePowersById[id];
                  if (!power) { return null; }
                  return (
                    <div class="rounded-md border border-border bg-card/50 px-3 py-2 space-y-0.5">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-sm font-medium">{power.name}</span>
                        <Badge variant="muted" class="text-[10px] px-1.5 py-0 capitalize">{power.powerType}</Badge>
                        <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize">{power.powerCategory}</Badge>
                      </div>
                      <p class="text-xs text-muted-foreground leading-snug">{power.effect}</p>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </Show>
      </CardContent>
    </Card>
  );
};
