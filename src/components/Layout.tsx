import type { JSX } from 'solid-js';
import { Suspense } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { Cpu } from 'lucide-solid';
import { cn } from '~/lib/utils.ts';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children?: JSX.Element;
}

const NAV_LINK = 'px-2 py-1 text-sm transition-colors rounded-md hover:bg-accent';
const ACTIVE = 'text-foreground';
const INACTIVE = 'text-muted-foreground hover:text-foreground';

const SEG_ITEM = 'px-3 py-1 text-xs font-medium rounded-[5px] transition-colors';
const SEG_ACTIVE = 'bg-background text-foreground shadow-sm';
const SEG_INACTIVE = 'text-muted-foreground hover:text-foreground';

export function Layout(props: LayoutProps): JSX.Element {
  const location = useLocation();

  const builderActive = () => {
    const p = location.pathname;
    return p === '/' || p.startsWith('/pilots') || p.startsWith('/mecha');
  };

  const viewerActive = () => location.pathname.startsWith('/viewer');

  return (
    <div class="h-full bg-background text-foreground flex flex-col overflow-hidden">
      <header class="shrink-0 border-b border-border px-6 py-3 flex items-center gap-3">
        <Cpu class="size-5 text-primary" />
        <A
          href="/"
          class="text-base font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          Drive Core
        </A>
        <span class="text-xs text-muted-foreground font-mono">BCG-R Builder</span>
        <nav class="ml-auto flex items-center gap-1">
          <div class="flex items-center rounded-md bg-muted p-0.5 gap-0.5">
            <A href="/" class={cn(SEG_ITEM, builderActive() ? SEG_ACTIVE : SEG_INACTIVE)}>
              Builder
            </A>
            <A href="/viewer" class={cn(SEG_ITEM, viewerActive() ? SEG_ACTIVE : SEG_INACTIVE)}>
              Viewer
            </A>
          </div>
          <A
            href="/changelog"
            class={cn(NAV_LINK, INACTIVE)}
            activeClass={ACTIVE}
          >
            Changelog
          </A>
          <A
            href="/about"
            class={cn(NAV_LINK, INACTIVE)}
            activeClass={ACTIVE}
          >
            About
          </A>
          <ThemeToggle />
        </nav>
      </header>
      <main class="flex-1 overflow-hidden max-w-5xl w-full mx-auto px-6 flex flex-col min-h-0">
        <Suspense fallback={<p class="text-muted-foreground text-sm py-8">Loading…</p>}>
          {props.children}
        </Suspense>
      </main>
    </div>
  );
}
