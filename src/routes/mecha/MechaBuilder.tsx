import type { JSX } from 'solid-js';
import { Show, createMemo } from 'solid-js';
import { useParams } from '@solidjs/router';
import { ChevronLeft } from 'lucide-solid';
import { mechaState, updateMecha } from '~/stores/mecha.ts';
import { ExportMenu } from '../../components/ExportMenu';
import { slugify } from '~/lib/share.ts';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { InfoTab } from '../../features/mecha/InfoTab';
import { AttributeTab } from '../../features/mecha/AttributeTab';
import { UpgradeTab } from '../../features/mecha/UpgradeTab';
import { WeaponTab } from '../../features/mecha/WeaponTab';
import { computeSpentMP, totalMP } from '~/lib/mecha-costs.ts';
import { cn } from '~/lib/utils.ts';

const MechaBuilder = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const mecha = () => mechaState.mecha.find((m) => m.id === params.id);

  const mpSpent = createMemo(() => {
    const m = mecha();
    if (!m) { return 0; }
    return computeSpentMP(m.attributes, m.weapons, m.upgrades);
  });
  const mpTotal = () => totalMP(mecha()?.bonusMP ?? 0);
  const mpAvailable = () => mpTotal() - mpSpent();

  const guard = () => mecha()?.attributes.guard ?? 0;
  const threshold = () => mecha()?.attributes.threshold ?? 0;
  const energy = () => mecha()?.attributes.energy ?? 0;
  const speed = () => mecha()?.attributes.speed ?? 0;

  const handleNameBlur = (e: FocusEvent): void => {
    const m = mecha();
    if (!m) { return; }
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    if (value !== m.name) {
      updateMecha(m.id, { name: value || 'New Mecha' });
    }
  };

  return (
    <Show
      when={mecha()}
      fallback={<p class="text-muted-foreground text-sm">Mecha not found.</p>}
    >
      {(m) => (
        <div class="flex-1 flex flex-col min-h-0 pt-8">
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div class="pb-4 space-y-3 shrink-0">
            <div class="flex items-center gap-2">
              <Button variant="ghost" size="sm" as="a" href="/">
                <ChevronLeft /> Back
              </Button>
              <div class="ml-auto">
                <ExportMenu data={m()} filename={`${slugify(m().name)}-mecha`} />
              </div>
            </div>

            <div class="flex items-start gap-3 flex-wrap">
              <Input
                value={m().name}
                onBlur={handleNameBlur}
                class="text-xl font-semibold h-auto py-1 px-2 border-transparent bg-transparent hover:border-border focus:border-ring flex-1 min-w-40 max-w-sm"
              />
            </div>

            {/* Stats row */}
            <div class="flex items-center gap-2 flex-wrap text-sm">
              <Badge
                variant="muted"
                class={cn(
                  'font-mono cursor-default',
                  mpAvailable() < 0 && 'bg-destructive/10 text-destructive',
                  mpAvailable() === 0 && 'bg-muted',
                )}
                title="Mech Points — spend on Attributes, Weapons, and Upgrades. Total = 100 + Bonus MP."
              >
                {mpAvailable()} / {mpTotal()} MP left
              </Badge>
              <Badge
                variant="muted"
                class="font-mono cursor-default"
                title={`Guard ${guard()} — defensive strength. Increases damage absorbed by active defenses and resistance to suppression.`}
              >
                Guard {guard()}
              </Badge>
              <Badge
                variant="muted"
                class="font-mono cursor-default"
                title={`Threshold ${threshold()} — damage capacity per layer. Your mecha has 4 standard layers plus a Core layer, each absorbing up to ${threshold()} damage before being lost.`}
              >
                THR {threshold()}
              </Badge>
              <Badge
                variant="muted"
                class="font-mono cursor-default"
                title={`Energy ${energy()} — available Energy per Turn. Spent activating Beam weapons and certain Upgrades. Resets at the start of your Turn.`}
              >
                Energy {energy()}
              </Badge>
              <Badge
                variant="muted"
                class="font-mono cursor-default"
                title={`Speed ${speed()} — movement Zones available per Action.`}
              >
                Speed {speed()}
              </Badge>
            </div>
          </div>

          {/* ── Tabs ────────────────────────────────────────────────────────── */}
          <Tabs defaultValue="info" class="flex-1 flex flex-col min-h-0">
            <TabsList class="shrink-0">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
              <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
              <TabsTrigger value="weapons">Weapons</TabsTrigger>
            </TabsList>

            <TabsContent value="info" class="flex-1 overflow-y-auto pb-8">
              <InfoTab mecha={m()} />
            </TabsContent>
            <TabsContent value="attributes" class="flex-1 overflow-y-auto pb-8">
              <AttributeTab mecha={m()} />
            </TabsContent>
            <TabsContent value="upgrades" class="flex-1 overflow-y-auto pb-8">
              <UpgradeTab mecha={m()} />
            </TabsContent>
            <TabsContent value="weapons" class="flex-1 overflow-y-auto pb-8">
              <WeaponTab mecha={m()} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Show>
  );
};

export default MechaBuilder;
