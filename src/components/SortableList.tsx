import type { Accessor, JSX } from 'solid-js';
import { For } from 'solid-js';
import type { DragEvent } from '@thisbeyond/solid-dnd';
import {
  closestCenter,
  createSortable,
  DragDropProvider,
  DragDropSensors,
  SortableProvider,
} from '@thisbeyond/solid-dnd';
import { GripVertical } from 'lucide-solid';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  children: (item: T, index: Accessor<number>) => JSX.Element;
}

const SortableItem = <T extends { id: string }>(props: {
  item: T;
  children: JSX.Element;
}): JSX.Element => {
  const sortable = createSortable(props.item.id);
  return (
    <div
      ref={sortable.ref}
      class="flex items-start gap-1.5"
      style={{ 'touch-action': 'none' }}
      classList={{ 'opacity-40': sortable.isActiveDraggable }}
    >
      <button
        {...(sortable.dragActivators as JSX.HTMLAttributes<HTMLButtonElement>)}
        type="button"
        aria-label="Drag to reorder"
        class="self-start mt-1 shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>
      <div class="flex-1 min-w-0">{props.children}</div>
    </div>
  );
};

export const SortableList = <T extends { id: string }>(props: SortableListProps<T>): JSX.Element => {
  const ids = () => props.items.map((item) => item.id);

  const onDragEnd = ({ draggable, droppable }: DragEvent): void => {
    if (!droppable || draggable.id === droppable.id) { return; }
    const from = props.items.findIndex((i) => i.id === String(draggable.id));
    const to = props.items.findIndex((i) => i.id === String(droppable.id));
    if (from < 0 || to < 0) { return; }
    const next = [...props.items];
    next.splice(to, 0, next.splice(from, 1)[0]);
    props.onReorder(next);
  };

  return (
    <DragDropProvider onDragEnd={onDragEnd} collisionDetector={closestCenter}>
      <DragDropSensors />
      <SortableProvider ids={ids()}>
        <For each={props.items}>
          {(item, i) => (
            <SortableItem item={item}>{props.children(item, i)}</SortableItem>
          )}
        </For>
      </SortableProvider>
    </DragDropProvider>
  );
};
