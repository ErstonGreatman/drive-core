import type { JSX } from 'solid-js';
import { Suspense } from 'solid-js';
import { A } from '@solidjs/router';
import { Cpu } from 'lucide-solid';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children?: JSX.Element;
}

export function Layout(props: LayoutProps): JSX.Element {
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
          <A
            href="/viewer"
            class="px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            activeClass="text-foreground"
          >
            Viewer
          </A>
          <A
            href="/changelog"
            class="px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            activeClass="text-foreground"
          >
            Changelog
          </A>
          <A
            href="/about"
            class="px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            activeClass="text-foreground"
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
