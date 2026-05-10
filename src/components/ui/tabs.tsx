import type { JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import * as TabsPrimitive from '@kobalte/core/tabs';
import { cn } from '~/lib/utils';

export const Tabs = TabsPrimitive.Root;

// ── List ──────────────────────────────────────────────────────────────────────

type TabsListProps = TabsPrimitive.TabsListProps & { class?: string };

export function TabsList(props: TabsListProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <TabsPrimitive.List
      class={cn('flex items-center gap-0 border-b border-border w-full overflow-x-auto scrollbar-hide', local.class)}
      {...rest}
    />
  );
}

// ── Trigger ───────────────────────────────────────────────────────────────────

type TabsTriggerProps = TabsPrimitive.TabsTriggerProps & { class?: string };

export function TabsTrigger(props: TabsTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <TabsPrimitive.Trigger
      class={cn(
        'inline-flex items-center justify-center whitespace-nowrap px-3 pb-2 pt-1.5 text-sm font-medium',
        'text-muted-foreground transition-colors',
        'border-b-2 border-transparent -mb-px',
        'hover:text-foreground',
        'data-[selected]:border-primary data-[selected]:text-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        local.class,
      )}
      {...rest}
    />
  );
}

// ── Content ───────────────────────────────────────────────────────────────────

type TabsContentProps = TabsPrimitive.TabsContentProps & { class?: string };

export function TabsContent(props: TabsContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <TabsPrimitive.Content
      class={cn('mt-6 pr-2 outline-none', local.class)}
      {...rest}
    />
  );
}
