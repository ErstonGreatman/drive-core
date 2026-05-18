import type { JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { skillsById, traitsById } from '~/data';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface SkillsCardProps {
  pilot: Pilot;
}

export const SkillsCard = (props: SkillsCardProps): JSX.Element => {
  return (
    <Show when={props.pilot.skills.length > 0}>
      <Card>
        <CardHeader><CardTitle>Skills ({props.pilot.skills.length})</CardTitle></CardHeader>
        <CardContent class="space-y-1">
          <For each={props.pilot.skills}>
            {(entry) => {
              const def = skillsById[entry.skillId];
              if (!def) { return null; }
              const freeNames = (entry.freeDeathblowTraitIds ?? [])
                .map((id) => traitsById[id]?.name)
                .filter(Boolean);
              return (
                <div class="py-2 border-b border-border/50 last:border-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-sm font-medium">{def.name}</span>
                    <Show when={def.isMiracle}>
                      <Badge variant="secondary" class="text-[10px] px-1.5 py-0">Miracle</Badge>
                    </Show>
                    <Badge
                      variant="muted"
                      class={cn(
                        'text-[10px] px-1.5 py-0 capitalize',
                        entry.type === 'specialist' && 'bg-primary/10 text-primary',
                      )}
                    >
                      {entry.type}
                    </Badge>
                    <Show when={entry.type === 'specialist' && entry.specialistLabel}>
                      <span class="text-xs text-muted-foreground">— {entry.specialistLabel}</span>
                    </Show>
                  </div>
                  <Show when={freeNames.length > 0}>
                    <p class="text-xs text-muted-foreground mt-0.5">
                      Free deathblows: {freeNames.join(', ')}
                    </p>
                  </Show>
                </div>
              );
            }}
          </For>
        </CardContent>
      </Card>
    </Show>
  );
};
