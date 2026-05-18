import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { Eye, Pencil, Trash2 } from 'lucide-solid';
import type { Mecha } from '~/types';
import { slugify } from '~/lib/share';
import { ExportMenu } from '~/components/ExportMenu';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface MechaCardProps {
  mecha: Mecha;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const MechaCard = (props: MechaCardProps): JSX.Element => {
  const totalMP = () => 100 + props.mecha.bonusMP;
  const availableMP = () => totalMP() - props.mecha.spentMP;

  return (
    <Card>
      <CardHeader>
        <div class="flex items-start justify-between gap-2">
          <CardTitle class="truncate">{props.mecha.name}</CardTitle>
          <Badge variant="muted" class={cn('shrink-0 font-mono', availableMP() < 0 && 'bg-destructive/10 text-destructive')}>
            {availableMP()} / {totalMP()} MP
          </Badge>
        </div>
        <Show when={props.mecha.campaignTag}>
          <CardDescription>{props.mecha.campaignTag}</CardDescription>
        </Show>
      </CardHeader>
      <CardFooter class="gap-2">
        <Button class="flex-1" size="sm" variant="secondary" onClick={props.onView}>
          <Eye /> Sheet
        </Button>
        <ExportMenu data={props.mecha} filename={`${slugify(props.mecha.name)}-mecha`} compact />
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
