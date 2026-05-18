import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { mechaState } from '~/stores/mecha';
import { MechaSheetView } from './sheet/MechaSheetView';

export { MechaSheetView } from './sheet/MechaSheetView';
export type { MechaSheetViewProps } from './sheet/MechaSheetView';

const MechaSheet = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const mecha = () => mechaState.mecha.find((m) => m.id === params.id);

  return (
    <Show
      when={mecha()}
      fallback={<p class="text-muted-foreground text-sm py-8">Mecha not found.</p>}
    >
      {(m) => (
        <MechaSheetView
          mecha={m()}
          backHref="/"
          editHref={`/mecha/${params.id}`}
        />
      )}
    </Show>
  );
};

export default MechaSheet;
