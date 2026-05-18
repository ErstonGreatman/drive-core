import type { JSX } from 'solid-js';
import { Show, createMemo } from 'solid-js';
import { useParams } from '@solidjs/router';
import { ChevronLeft } from 'lucide-solid';
import { pilotState, updatePilot } from '~/stores/pilots.ts';
import { skillsById, traitsById } from '~/data';
import { ExportMenu } from '../../components/ExportMenu';
import { slugify } from '~/lib/share.ts';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { InfoTab } from '../../features/pilot/InfoTab';
import { AttributeTab } from '../../features/pilot/AttributeTab';
import { SkillTab } from '../../features/pilot/SkillTab';
import { TraitTab } from '../../features/pilot/TraitTab';
import { ThemeTab } from '../../features/pilot/ThemeTab';
import { PowerTab } from '../../features/pilot/PowerTab';
import { computeSpentCP, totalCP, powerLevel } from '~/lib/pilot-costs.ts';
import { cn } from '~/lib/utils.ts';

const PilotBuilder = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const pilot = () => pilotState.pilots.find((p) => p.id === params.id);

  const pl = () => powerLevel(pilot()?.experience ?? 0);
  const cpTotal = () => totalCP(pilot()?.experience ?? 0);
  const cpSpent = createMemo(() => {
    const p = pilot();
    if (!p) { return 0; }
    return computeSpentCP(p.attributes, p.skills, p.traits, skillsById, traitsById);
  });
  const cpAvailable = () => cpTotal() - cpSpent();
  const defense = () => (pilot()?.attributes.awareness ?? 0) + 5;
  const plotArmorCap = () => (pilot()?.attributes.willpower ?? 0) * 3;

  const handleNameBlur = (e: FocusEvent): void => {
    const p = pilot();
    if (!p) { return; }
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    if (value !== p.name) {
      updatePilot(p.id, { name: value || 'New Pilot' });
    }
  };

  return (
    <Show
      when={pilot()}
      fallback={<p class="text-muted-foreground text-sm">Pilot not found.</p>}
    >
      {(p) => (
        <div class="flex-1 flex flex-col min-h-0 pt-8">
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div class="pb-4 space-y-3 shrink-0">
            <div class="flex items-center gap-2">
              <Button variant="ghost" size="sm" as="a" href="/">
                <ChevronLeft /> Back
              </Button>
              <div class="ml-auto">
                <ExportMenu data={p()} filename={`${slugify(p().name)}-pilot`} />
              </div>
            </div>

            <div class="flex items-start gap-3 flex-wrap">
              <Input
                value={p().name}
                onBlur={handleNameBlur}
                class="text-xl font-semibold h-auto py-1 px-2 border-transparent bg-transparent hover:border-border focus:border-ring flex-1 min-w-40 max-w-sm"
              />
            </div>

            {/* Stats row */}
            <div class="flex items-center gap-2 flex-wrap text-sm">
              <Badge
                variant="secondary"
                class="font-mono cursor-default"
                title={`Power Level ${pl()} — unlocks extra CP and one additional Genre Power per level. Reach the next level at ${(pl() + 1) * 30} XP.`}
              >
                PL {pl()}
              </Badge>
              <Badge
                variant="muted"
                class={cn(
                  'font-mono cursor-default',
                  cpAvailable() < 0 && 'bg-destructive/10 text-destructive',
                  cpAvailable() === 0 && 'bg-muted',
                )}
                title="Character Points — spend on Attributes, Skills, and Traits. Total = 100 + PL × 30."
              >
                {cpAvailable()} / {cpTotal()} CP left
              </Badge>
              <Badge
                variant="muted"
                class="font-mono cursor-default"
                title={`Defense ${defense()} — the DN enemies must meet to hit your pilot. Equal to Awareness (${pilot()?.attributes.awareness ?? 0}) + 5.`}
              >
                DEF {defense()}
              </Badge>
              <Badge
                variant="muted"
                class="font-mono cursor-default"
                title={`Plot Armor ${plotArmorCap()} — total damage capacity across 3 layers. Each layer absorbs up to Willpower (${pilot()?.attributes.willpower ?? 0}) damage.`}
              >
                PA {plotArmorCap()}
              </Badge>
            </div>
          </div>

          {/* ── Tabs ────────────────────────────────────────────────────────── */}
          <Tabs defaultValue="info" class="flex-1 flex flex-col min-h-0">
            <TabsList class="shrink-0">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="traits">Traits</TabsTrigger>
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="powers">Powers</TabsTrigger>
            </TabsList>

            <TabsContent value="info" class="flex-1 overflow-y-auto pb-8">
              <InfoTab pilot={p()} />
            </TabsContent>
            <TabsContent value="attributes" class="flex-1 overflow-y-auto pb-8">
              <AttributeTab pilot={p()} />
            </TabsContent>
            <TabsContent value="skills" class="flex-1 overflow-y-auto pb-8">
              <SkillTab pilot={p()} />
            </TabsContent>
            <TabsContent value="traits" class="flex-1 overflow-y-auto pb-8">
              <TraitTab pilot={p()} />
            </TabsContent>
            <TabsContent value="theme" class="flex-1 overflow-y-auto pb-8">
              <ThemeTab pilot={p()} />
            </TabsContent>
            <TabsContent value="powers" class="flex-1 overflow-y-auto pb-8">
              <PowerTab pilot={p()} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Show>
  );
};

export default PilotBuilder;
