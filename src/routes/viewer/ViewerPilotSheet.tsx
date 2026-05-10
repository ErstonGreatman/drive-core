import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { viewerState } from '~/stores/viewer.ts';
import { PilotSheetView } from '../pilots/PilotSheet';

export default function ViewerPilotSheet(): JSX.Element {
  const params = useParams<{ id: string }>();
  const pilot = () => viewerState.pilots.find((p) => p.id === params.id);

  return (
    <Show
      when={pilot()}
      fallback={<p class="text-muted-foreground text-sm py-8">Pilot not found.</p>}
    >
      {(p) => (
        <PilotSheetView
          pilot={p()}
          backHref="/viewer"
          backLabel="Viewer"
        />
      )}
    </Show>
  );
}
