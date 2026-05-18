import type { JSX } from 'solid-js';
import { Cpu, Github, ExternalLink, Scale } from 'lucide-solid';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const About = (): JSX.Element => {
  return (
    <div class="flex-1 overflow-y-auto py-8 min-h-0">
      <div class="max-w-2xl space-y-6">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <Cpu class="size-8 text-primary" />
            <h1 class="text-2xl font-bold tracking-tight">Drive Core</h1>
          </div>
          <p class="text-muted-foreground">
            A free, community-built character and mecha builder for{' '}
            <a
              href="https://gimmicklabs.itch.io/bcgremastered"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary underline-offset-4 hover:underline"
            >
              Battle Century G Remastered
            </a>
            . No accounts, no servers — everything lives in your browser.
            Build your pilots, kit out your mecha, bring them to the table.
          </p>
        </div>

        {/* ── The Game ──────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>The Game</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Battle Century G Remastered is a tabletop RPG about giant robots, dramatic battles,
              and the pilots who push past their limits for the people they care about.
              If giant mech anime is your thing, it probably already has your heart.
            </p>
            <a
              href="https://gimmicklabs.itch.io/bcgremastered"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
            >
              Grab it on itch.io <ExternalLink class="size-3" />
            </a>
          </CardContent>
        </Card>

        {/* ── Open Source ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Open Source</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <p class="text-sm text-muted-foreground">
              Drive Core is open source. Got a bug, a feature idea, or want to pitch in?
              Pull requests are welcome.
            </p>
            <a
              href="https://github.com/ErstonGreatman/drive-core"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
            >
              <Github class="size-4" />
              ErstonGreatman/drive-core
            </a>
            <p class="text-sm text-muted-foreground">
              Built with SolidJS, Tailwind CSS, and a lot of enthusiasm for giant robot games.
              Inspired by{' '}
              <a
                href="https://github.com/fultimator/fultimator"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary underline-offset-4 hover:underline"
              >
                Fultimator
              </a>
              , the community builder for Fabula Ultima.
            </p>
          </CardContent>
        </Card>

        {/* ── License ───────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Scale class="size-4" />
              License
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3 text-sm text-muted-foreground">
            <p>
              Rules text, game data, and other content from Battle Century G Remastered used in
              this app belongs to its author and is used here under its original license:
            </p>
            <blockquote class="border-l-2 border-border pl-3 space-y-1">
              <p>
                Battle Century G is licensed under the{' '}
                <a
                  href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary underline-offset-4 hover:underline"
                >
                  Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License
                </a>
                .
              </p>
              <p>© 2022 Juan Herrera. Some Rights Reserved.</p>
              <p class="font-mono text-xs">Rules Version 1.84</p>
            </blockquote>
            <p>
              Drive Core's source code is separately licensed under the{' '}
              <a
                href="https://github.com/ErstonGreatman/drive-core/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary underline-offset-4 hover:underline"
              >
                MIT License
              </a>
              .
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default About;
