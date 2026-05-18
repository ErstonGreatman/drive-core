import type { JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { traitsById, skillsById } from '~/data';
import { buildFreeDeathblowMap, enrichTraitsWithMeta } from '~/lib/traitRules';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

const TRAIT_CATEGORIES: { key: string; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'deathblow', label: 'Deathblow' },
  { key: 'anomaly', label: 'Anomaly' },
];

interface TraitsCardProps {
  pilot: Pilot;
}

export const TraitsCard = (props: TraitsCardProps): JSX.Element => {
  const traitsWithMeta = () =>
    enrichTraitsWithMeta(props.pilot.traits, buildFreeDeathblowMap(props.pilot.skills));

  return (
    <Show when={traitsWithMeta().length > 0}>
      <Card>
        <CardHeader><CardTitle>Traits ({traitsWithMeta().length})</CardTitle></CardHeader>
        <CardContent class="space-y-4">
          <For each={TRAIT_CATEGORIES}>
            {(cat, catIdx) => {
              const items = () => traitsWithMeta().filter((x) => x.def.traitCategory === cat.key);
              return (
                <Show when={items().length > 0}>
                  <Show when={catIdx() > 0}>
                    <Separator />
                  </Show>
                  <div class="space-y-1.5">
                    <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {cat.label}
                    </p>
                    <For each={items()}>
                      {({ entry, def, isFree }) => (
                        <div class="py-1.5 border-b border-border/40 last:border-0">
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-sm font-medium">{def.name}</span>
                            <Badge variant={isFree ? 'secondary' : 'muted'} class="text-[10px] px-1.5 py-0 font-mono">
                              {isFree ? 'Free' : (def.cpCost === 0 ? '0 CP' : `${def.cpCost} CP`)}
                            </Badge>
                            <Show when={def.isSpecialist && entry.specialistLabel}>
                              <span class="text-xs text-muted-foreground">— {entry.specialistLabel}</span>
                            </Show>
                          </div>
                          <Show when={def.isAlienAnomaly && entry.chosenMiracleSkillId}>
                            <p class="text-xs text-muted-foreground mt-0.5">
                              Miracle: {skillsById[entry.chosenMiracleSkillId!]?.name ?? entry.chosenMiracleSkillId}
                              {entry.miracleTier && ` (${entry.miracleTier})`}
                            </p>
                          </Show>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              );
            }}
          </For>
        </CardContent>
      </Card>
    </Show>
  );
};
