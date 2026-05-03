import type { JSX } from 'solid-js';
import { For, Show, Switch, Match } from 'solid-js';
import { Sun, Moon, Monitor, Check } from 'lucide-solid';
import * as DropdownMenu from '@kobalte/core/dropdown-menu';
import { theme, setTheme } from '../stores/theme';
import type { Theme } from '../stores/theme';
import { cn } from '../lib/utils';

interface ThemeOption {
  value: Theme;
  label: string;
  Icon: (props: { class?: string }) => JSX.Element;
}

const OPTIONS: ThemeOption[] = [
  { value: 'system', label: 'System', Icon: (p) => <Monitor {...p} /> },
  { value: 'light',  label: 'Light',  Icon: (p) => <Sun {...p} /> },
  { value: 'dark',   label: 'Dark',   Icon: (p) => <Moon {...p} /> },
];

export function ThemeToggle(): JSX.Element {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="inline-flex size-8 items-center justify-center rounded-md text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Switch>
          <Match when={theme() === 'light'}><Sun class="size-4" /></Match>
          <Match when={theme() === 'dark'}><Moon class="size-4" /></Match>
          <Match when={theme() === 'system'}><Monitor class="size-4" /></Match>
        </Switch>
        <span class="sr-only">Toggle theme</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1 animate-in fade-in-0 zoom-in-95">
          <For each={OPTIONS}>
            {(option) => (
              <DropdownMenu.Item
                onSelect={() => setTheme(option.value)}
                class={cn(
                  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                  'focus:bg-accent focus:text-accent-foreground',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                )}
              >
                <option.Icon class="size-4 shrink-0" />
                <span>{option.label}</span>
                <Show when={theme() === option.value}>
                  <Check class="ml-auto size-3 shrink-0" />
                </Show>
              </DropdownMenu.Item>
            )}
          </For>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
