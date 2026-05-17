import type { JSX } from 'solid-js';
import { Show, For, createMemo } from 'solid-js';
import { useParams } from '@solidjs/router';
import { ChevronLeft, Pencil } from 'lucide-solid';
import { pilotState } from '~/stores/pilots';
import { ExportMenu } from '~/components/ExportMenu';
import { slugify } from '~/lib/share';
import { skillsById, traitsById } from '~/data';
import { powerLevel, totalCP, computeSpentCP } from '~/lib/pilot-costs';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import type { Pilot } from '~/types';
import { SkillsCard } from './sheet/SkillsCard';
import { TraitsCard } from './sheet/TraitsCard';
import { GenreThemesCard } from './sheet/GenreThemesCard';
import { GenrePowersCard } from './sheet/GenrePowersCard';

const PILOT_ATTRS = [
  { key: 'fitness' as const, label: 'Fitness' },
  { key: 'awareness' as const, label: 'Awareness' },
  { key: 'intellect' as const, label: 'Intellect' },
  { key: 'willpower' as const, label: 'Willpower' },
  { key: 'charm' as const, label: 'Charm' },
  { key: 'resources' as const, label: 'Resources' },
];

export interface PilotSheetViewProps {
  pilot: Pilot;
  backHref?: string;
  backLabel?: string;
  editHref?: string;
}

export const PilotSheetView = (props: PilotSheetViewProps): JSX.Element => {
  const pl = createMemo(() => powerLevel(props.pilot.experience));
  const cpTotal = createMemo(() => totalCP(props.pilot.experience));
  const cpSpent = createMemo(() =>
    computeSpentCP(props.pilot.attributes, props.pilot.skills, props.pilot.traits, skillsById, traitsById),
  );
  const defense = () => props.pilot.attributes.awareness + 5;
  const plotArmorCap = () => props.pilot.attributes.willpower * 3;

  return (
    <div class="flex-1 overflow-y-auto py-8 pr-4 min-h-0">
      <div class="max-w-3xl space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <Show when={props.backHref}>
              {(href) => (
                <Button variant="ghost" size="sm" as="a" href={href()}>
                  <ChevronLeft /> {props.backLabel ?? 'Home'}
                </Button>
              )}
            </Show>
            <div class="ml-auto flex items-center gap-2">
              <ExportMenu data={props.pilot} filename={`${slugify(props.pilot.name)}-pilot`} />
              <Show when={props.editHref}>
                {(href) => (
                  <Button variant="outline" size="sm" as="a" href={href()}>
                    <Pencil class="size-3.5" /> Edit
                  </Button>
                )}
              </Show>
            </div>
          </div>
          <div>
            <h1 class="text-2xl font-bold">{props.pilot.name}</h1>
            <Show when={props.pilot.campaignTag}>
              <p class="text-sm text-muted-foreground mt-0.5">{props.pilot.campaignTag}</p>
            </Show>
            <Show when={props.pilot.description}>
              <p class="text-sm text-muted-foreground mt-1">{props.pilot.description}</p>
            </Show>
          </div>
          <div class="flex flex-wrap gap-2">
            <Badge variant="secondary" class="font-mono">PL {pl()}</Badge>
            <Badge
              variant="muted"
              class={cn('font-mono', (cpTotal() - cpSpent()) < 0 && 'bg-destructive/10 text-destructive')}
            >
              {cpTotal() - cpSpent()} / {cpTotal()} CP
            </Badge>
            <Badge variant="muted" class="font-mono">DEF {defense()}</Badge>
            <Badge variant="muted" class="font-mono">PA {plotArmorCap()}</Badge>
          </div>
        </div>

        {/* ── Attributes ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <For each={PILOT_ATTRS}>
                {(attr) => (
                  <div class="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                    <span class="text-sm text-muted-foreground">{attr.label}</span>
                    <span class="font-mono font-semibold tabular-nums">{props.pilot.attributes[attr.key]}</span>
                  </div>
                )}
              </For>
            </div>
            <p class="text-xs text-muted-foreground">
              Defense {defense()} (Awareness + 5) · Plot Armor cap {plotArmorCap()} ({props.pilot.attributes.willpower} × 3, across 3 layers)
            </p>
          </CardContent>
        </Card>

        <SkillsCard pilot={props.pilot} />
        <TraitsCard pilot={props.pilot} />
        <GenreThemesCard pilot={props.pilot} />
        <GenrePowersCard pilot={props.pilot} />

      </div>
    </div>
  );
};

// ── Route default export ───────────────────────────────────────────────────────

const PilotSheet = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const pilot = () => pilotState.pilots.find((p) => p.id === params.id);

  return (
    <Show
      when={pilot()}
      fallback={<p class="text-muted-foreground text-sm py-8">Pilot not found.</p>}
    >
      {(p) => (
        <PilotSheetView
          pilot={p()}
          backHref="/"
          editHref={`/pilots/${params.id}`}
        />
      )}
    </Show>
  );
};

export default PilotSheet;
