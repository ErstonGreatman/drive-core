import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';

interface GenreThemesCardProps {
  pilot: Pilot;
}

export const GenreThemesCard = (props: GenreThemesCardProps): JSX.Element => {
  return (
    <Card>
      <CardHeader><CardTitle>Genre Themes</CardTitle></CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</p>
          <Show
            when={props.pilot.genreThemes.reason}
            fallback={<p class="text-sm text-muted-foreground italic">Not set.</p>}
          >
            <p class="text-sm">{props.pilot.genreThemes.reason}</p>
          </Show>
        </div>
        <Separator />
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Typecast</p>
          <Show
            when={props.pilot.genreThemes.typecast}
            fallback={<p class="text-sm text-muted-foreground italic">Not set.</p>}
          >
            <p class="text-sm">{props.pilot.genreThemes.typecast}</p>
          </Show>
        </div>
        <Separator />
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bane</p>
          <Show
            when={props.pilot.genreThemes.bane}
            fallback={<p class="text-sm text-muted-foreground italic">Not set.</p>}
          >
            <p class="text-sm">{props.pilot.genreThemes.bane}</p>
          </Show>
        </div>
      </CardContent>
    </Card>
  );
};
