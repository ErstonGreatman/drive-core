import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { Eye, Pencil, Trash2 } from 'lucide-solid';
import type { Pilot } from '~/types';
import { totalCP } from '~/lib/pilot-costs';
import { slugify } from '~/lib/share';
import { ExportMenu } from '~/components/ExportMenu';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface PilotCardProps {
  pilot: Pilot;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const PilotCard = (props: PilotCardProps): JSX.Element => {
  const powerLevel = () => Math.floor(props.pilot.experience / 30);
  const cpTotal = () => totalCP(props.pilot.experience);
  const cpAvailable = () => cpTotal() - (props.pilot.spentCP ?? 0);

  return (
    <Card>
      <CardHeader>
        <div class="flex items-start justify-between gap-2">
          <CardTitle class="truncate">{props.pilot.name}</CardTitle>
          <div class="flex items-center gap-1 shrink-0">
            <Badge variant="muted" class="font-mono">PL {powerLevel()}</Badge>
            <Badge variant="muted" class={cn('font-mono', cpAvailable() < 0 && 'bg-destructive/10 text-destructive')}>
              {cpAvailable()} / {cpTotal()} CP
            </Badge>
          </div>
        </div>
        <Show when={props.pilot.campaignTag}>
          <CardDescription>{props.pilot.campaignTag}</CardDescription>
        </Show>
      </CardHeader>
      <CardFooter class="gap-2">
        <Button class="flex-1" size="sm" variant="secondary" onClick={props.onView}>
          <Eye /> Sheet
        </Button>
        <ExportMenu data={props.pilot} filename={`${slugify(props.pilot.name)}-pilot`} compact />
        <Button size="sm" variant="ghost" onClick={props.onEdit} title="Edit">
          <Pencil />
        </Button>
        <Button size="sm" variant="ghost" class="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={props.onDelete} title="Delete">
          <Trash2 />
        </Button>
      </CardFooter>
    </Card>
  );
};
