import type { JSX } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';
import { Download, Clipboard, Share2 } from 'lucide-solid';
import * as DropdownMenu from '@kobalte/core/dropdown-menu';
import { downloadJSON, copyJSONToClipboard } from '../lib/share';

interface ExportMenuProps {
  data: unknown;
  filename: string;
  /** When true renders a square icon-only trigger instead of the labeled button */
  compact?: boolean;
}

export function ExportMenu(props: ExportMenuProps): JSX.Element {
  const [copied, setCopied] = createSignal(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(copyTimer));

  function handleDownload(): void {
    downloadJSON(props.data, props.filename);
  }

  function handleCopy(): void {
    copyJSONToClipboard(props.data).then(() => {
      clearTimeout(copyTimer);
      setCopied(true);
      copyTimer = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Clipboard unavailable — nothing to do
    });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        title="Export"
        class={props.compact
          ? 'inline-flex size-8 items-center justify-center rounded-md text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          : 'inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-transparent text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'}
      >
        <Share2 class="size-3.5 shrink-0" />
        {!props.compact && 'Export'}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="z-50 min-w-[11rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1 animate-in fade-in-0 zoom-in-95">
          <DropdownMenu.Item
            onSelect={handleDownload}
            class="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
          >
            <Download class="size-4 shrink-0" />
            Download JSON
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={handleCopy}
            class="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
          >
            <Clipboard class="size-4 shrink-0" />
            {copied() ? '✓ Copied!' : 'Copy to Clipboard'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
