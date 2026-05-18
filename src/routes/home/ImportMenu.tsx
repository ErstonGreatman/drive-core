import type { JSX } from 'solid-js';
import { Upload, Clipboard } from 'lucide-solid';
import * as DropdownMenu from '@kobalte/core/dropdown-menu';

const ITEM_CLASS = 'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';

interface ImportMenuProps {
  onFromFile: () => void;
  onFromClipboard: () => void;
}

export const ImportMenu = (props: ImportMenuProps): JSX.Element => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-transparent text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Upload class="size-3.5 shrink-0" />
        Import
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="z-50 min-w-44 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1 animate-in fade-in-0 zoom-in-95">
          <DropdownMenu.Item onSelect={props.onFromFile} class={ITEM_CLASS}>
            <Upload class="size-4 shrink-0" /> From File
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={props.onFromClipboard} class={ITEM_CLASS}>
            <Clipboard class="size-4 shrink-0" /> Paste from Clipboard
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
