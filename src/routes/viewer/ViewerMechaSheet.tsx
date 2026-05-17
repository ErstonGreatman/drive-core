import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { viewerState } from '~/stores/viewer.ts';
import { MechaSheetView } from '../mecha/MechaSheet';

const ViewerMechaSheet = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const mecha = () => viewerState.mecha.find((m) => m.id === params.id);

  return (
    <Show
      when={mecha()}
      fallback={<p class="text-muted-foreground text-sm py-8">Mecha not found.</p>}
    >
      {(m) => (
        <MechaSheetView
          mecha={m()}
          backHref="/viewer"
          backLabel="Viewer"
        />
      )}
    </Show>
  );
};

export default ViewerMechaSheet;
