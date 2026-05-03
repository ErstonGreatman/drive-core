import type { JSX } from 'solid-js';
import { Show, For, createMemo } from 'solid-js';
import { useParams } from '@solidjs/router';
import { ChevronLeft, Pencil } from 'lucide-solid';
import { pilotState } from '~/stores/pilots.ts';
import { ExportMenu } from '../../components/ExportMenu';
import { slugify } from '~/lib/share.ts';
import {
  skillsById,
  traitsById,
  genrePowers,
  defaultGenrePowers,
  genrePowersById,
} from '~/data';
import type { GenrePowerDefinition, TraitDefinition } from '~/data';
import { powerLevel, totalCP, computeSpentCP } from '~/lib/pilot-costs.ts';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { cn } from '~/lib/utils.ts';

// ── Module-level data ──────────────────────────────────────────────────────────

const alternativesByDefaultId: Record<string, GenrePowerDefinition> = {};
const defaultAndAlternativeIds = new Set<string>();
for (const p of genrePowers) {
  if (p.isDefault) { defaultAndAlternativeIds.add(p.id); }
  if (p.alternativeFor) {
    alternativesByDefaultId[p.alternativeFor] = p;
    defaultAndAlternativeIds.add(p.id);
  }
}

const PILOT_ATTRS = [
  { key: 'fitness' as const, label: 'Fitness' },
  { key: 'awareness' as const, label: 'Awareness' },
  { key: 'intellect' as const, label: 'Intellect' },
  { key: 'willpower' as const, label: 'Willpower' },
  { key: 'charm' as const, label: 'Charm' },
  { key: 'resources' as const, label: 'Resources' },
];

const TRAIT_CATEGORIES: { key: string; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'deathblow', label: 'Deathblow' },
  { key: 'anomaly', label: 'Anomaly' },
];

// ── PilotSheet ─────────────────────────────────────────────────────────────────

export default function PilotSheet(): JSX.Element {
  const params = useParams<{ id: string }>();
  const pilot = () => pilotState.pilots.find((p) => p.id === params.id);

  const pl = createMemo(() => powerLevel(pilot()?.experience ?? 0));
  const cpTotal = createMemo(() => totalCP(pilot()?.experience ?? 0));
  const cpSpent = createMemo(() => {
    const p = pilot();
    if (!p) { return 0; }
    return computeSpentCP(p.attributes, p.skills, p.traits, skillsById, traitsById);
  });
  const defense = () => (pilot()?.attributes.awareness ?? 0) + 5;
  const plotArmorCap = () => (pilot()?.attributes.willpower ?? 0) * 3;

  const freeDeathblowMap = createMemo(() => {
    const map = new Map<string, number>();
    for (const s of (pilot()?.skills ?? [])) {
      for (const id of (s.freeDeathblowTraitIds ?? [])) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return map;
  });

  const traitsWithMeta = createMemo(() => {
    const p = pilot();
    if (!p) { return []; }
    const remaining = new Map(freeDeathblowMap());
    return p.traits.map((entry) => {
      const def = traitsById[entry.traitId] as TraitDefinition | undefined;
      if (!def) { return null; }
      let isFree = false;
      const count = remaining.get(entry.traitId) ?? 0;
      if (count > 0 && def.traitCategory === 'deathblow') {
        isFree = true;
        remaining.set(entry.traitId, count - 1);
      }
      return { entry, def, isFree };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  });

  const additionalPowerIds = createMemo(() =>
    (pilot()?.genrePowerIds ?? []).filter((id) => !defaultAndAlternativeIds.has(id)),
  );

  return (
    <Show
      when={pilot()}
      fallback={<p class="text-muted-foreground text-sm py-8">Pilot not found.</p>}
    >
      {(p) => (
        <div class="flex-1 overflow-y-auto py-8 min-h-0">
          <div class="max-w-3xl space-y-6">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <Button variant="ghost" size="sm" as="a" href="/">
                  <ChevronLeft /> Home
                </Button>
                <div class="ml-auto flex items-center gap-2">
                  <ExportMenu data={p()} filename={`${slugify(p().name)}-pilot`} />
                  <Button variant="outline" size="sm" as="a" href={`/pilots/${params.id}`}>
                    <Pencil class="size-3.5" /> Edit
                  </Button>
                </div>
              </div>
              <div>
                <h1 class="text-2xl font-bold">{p().name}</h1>
                <Show when={p().campaignTag}>
                  <p class="text-sm text-muted-foreground mt-0.5">{p().campaignTag}</p>
                </Show>
                <Show when={p().description}>
                  <p class="text-sm text-muted-foreground mt-1">{p().description}</p>
                </Show>
              </div>
              <div class="flex flex-wrap gap-2">
                <Badge variant="secondary" class="font-mono">PL {pl()}</Badge>
                <Badge
                  variant="muted"
                  class={cn('font-mono', (cpTotal() - cpSpent()) < 0 && 'bg-destructive/10 text-destructive')}
                >
                  {cpTotal() - cpSpent()} / {cpTotal()} CP
                </Badge>
                <Badge variant="muted" class="font-mono">DEF {defense()}</Badge>
                <Badge variant="muted" class="font-mono">PA {plotArmorCap()}</Badge>
              </div>
            </div>

            {/* ── Attributes ──────────────────────────────────────────────── */}
            <Card>
              <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
              <CardContent class="space-y-3">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <For each={PILOT_ATTRS}>
                    {(attr) => (
                      <div class="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                        <span class="text-sm text-muted-foreground">{attr.label}</span>
                        <span class="font-mono font-semibold tabular-nums">{p().attributes[attr.key]}</span>
                      </div>
                    )}
                  </For>
                </div>
                <p class="text-xs text-muted-foreground">
                  Defense {defense()} (Awareness + 5) · Plot Armor cap {plotArmorCap()} ({p().attributes.willpower} × 3, across 3 layers)
                </p>
              </CardContent>
            </Card>

            {/* ── Skills ──────────────────────────────────────────────────── */}
            <Show when={p().skills.length > 0}>
              <Card>
                <CardHeader><CardTitle>Skills ({p().skills.length})</CardTitle></CardHeader>
                <CardContent class="space-y-1">
                  <For each={p().skills}>
                    {(entry) => {
                      const def = skillsById[entry.skillId];
                      if (!def) { return null; }
                      const freeNames = (entry.freeDeathblowTraitIds ?? [])
                        .map((id) => traitsById[id]?.name)
                        .filter(Boolean);
                      return (
                        <div class="py-2 border-b border-border/50 last:border-0">
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-sm font-medium">{def.name}</span>
                            <Show when={def.isMiracle}>
                              <Badge variant="secondary" class="text-[10px] px-1.5 py-0">Miracle</Badge>
                            </Show>
                            <Badge
                              variant="muted"
                              class={cn(
                                'text-[10px] px-1.5 py-0 capitalize',
                                entry.type === 'specialist' && 'bg-primary/10 text-primary',
                              )}
                            >
                              {entry.type}
                            </Badge>
                            <Show when={entry.type === 'specialist' && entry.specialistLabel}>
                              <span class="text-xs text-muted-foreground">— {entry.specialistLabel}</span>
                            </Show>
                          </div>
                          <Show when={freeNames.length > 0}>
                            <p class="text-xs text-muted-foreground mt-0.5">
                              Free deathblows: {freeNames.join(', ')}
                            </p>
                          </Show>
                        </div>
                      );
                    }}
                  </For>
                </CardContent>
              </Card>
            </Show>

            {/* ── Traits ──────────────────────────────────────────────────── */}
            <Show when={traitsWithMeta().length > 0}>
              <Card>
                <CardHeader><CardTitle>Traits ({traitsWithMeta().length})</CardTitle></CardHeader>
                <CardContent class="space-y-4">
                  <For each={TRAIT_CATEGORIES}>
                    {(cat, catIdx) => {
                      const items = () => traitsWithMeta().filter((x) => x.def.traitCategory === cat.key);
                      return (
                        <Show when={items().length > 0}>
                          <Show when={catIdx() > 0}>
                            <Separator />
                          </Show>
                          <div class="space-y-1.5">
                            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {cat.label}
                            </p>
                            <For each={items()}>
                              {({ entry, def, isFree }) => (
                                <div class="py-1.5 border-b border-border/40 last:border-0">
                                  <div class="flex items-center gap-1.5 flex-wrap">
                                    <span class="text-sm font-medium">{def.name}</span>
                                    <Badge variant={isFree ? 'secondary' : 'muted'} class="text-[10px] px-1.5 py-0 font-mono">
                                      {isFree ? 'Free' : (def.cpCost === 0 ? '0 CP' : `${def.cpCost} CP`)}
                                    </Badge>
                                    <Show when={def.isSpecialist && entry.specialistLabel}>
                                      <span class="text-xs text-muted-foreground">— {entry.specialistLabel}</span>
                                    </Show>
                                  </div>
                                  <Show when={def.isAlienAnomaly && entry.chosenMiracleSkillId}>
                                    <p class="text-xs text-muted-foreground mt-0.5">
                                      Miracle: {skillsById[entry.chosenMiracleSkillId!]?.name ?? entry.chosenMiracleSkillId}
                                      {entry.miracleTier && ` (${entry.miracleTier})`}
                                    </p>
                                  </Show>
                                </div>
                              )}
                            </For>
                          </div>
                        </Show>
                      );
                    }}
                  </For>
                </CardContent>
              </Card>
            </Show>

            {/* ── Genre Themes ────────────────────────────────────────────── */}
            <Card>
              <CardHeader><CardTitle>Genre Themes</CardTitle></CardHeader>
              <CardContent class="space-y-4">
                <div class="space-y-1">
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</p>
                  <Show
                    when={p().genreThemes.reason}
                    fallback={<p class="text-sm text-muted-foreground italic">Not set.</p>}
                  >
                    <p class="text-sm">{p().genreThemes.reason}</p>
                  </Show>
                </div>
                <Separator />
                <div class="space-y-1">
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Typecast</p>
                  <Show
                    when={p().genreThemes.typecast}
                    fallback={<p class="text-sm text-muted-foreground italic">Not set.</p>}
                  >
                    <p class="text-sm">{p().genreThemes.typecast}</p>
                  </Show>
                </div>
                <Separator />
                <div class="space-y-1">
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bane</p>
                  <Show
                    when={p().genreThemes.bane}
                    fallback={<p class="text-sm text-muted-foreground italic">Not set.</p>}
                  >
                    <p class="text-sm">{p().genreThemes.bane}</p>
                  </Show>
                </div>
              </CardContent>
            </Card>

            {/* ── Genre Powers ────────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>Genre Powers</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                {/* Default slots */}
                <div class="space-y-1.5">
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Default (6)</p>
                  <div class="space-y-2">
                    <For each={defaultGenrePowers}>
                      {(defaultPower) => {
                        const alt = alternativesByDefaultId[defaultPower.id];
                        const usingAlt = alt && p().genrePowerIds.includes(alt.id);
                        const current = usingAlt ? alt : defaultPower;
                        return (
                          <div class="rounded-md border border-border bg-card/50 px-3 py-2 space-y-0.5">
                            <div class="flex items-center gap-1.5 flex-wrap">
                              <span class="text-sm font-medium">{current.name}</span>
                              <Badge variant="muted" class="text-[10px] px-1.5 py-0 capitalize">{current.powerType}</Badge>
                              <Show when={usingAlt}>
                                <Badge variant="secondary" class="text-[10px] px-1.5 py-0">Alt</Badge>
                              </Show>
                            </div>
                            <p class="text-xs text-muted-foreground leading-snug">{current.effect}</p>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>

                {/* Additional slots */}
                <Show when={additionalPowerIds().length > 0}>
                  <Separator />
                  <div class="space-y-1.5">
                    <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Additional ({additionalPowerIds().length} from PL {pl()})
                    </p>
                    <div class="space-y-2">
                      <For each={additionalPowerIds()}>
                        {(id) => {
                          const power = genrePowersById[id];
                          if (!power) { return null; }
                          return (
                            <div class="rounded-md border border-border bg-card/50 px-3 py-2 space-y-0.5">
                              <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="text-sm font-medium">{power.name}</span>
                                <Badge variant="muted" class="text-[10px] px-1.5 py-0 capitalize">{power.powerType}</Badge>
                                <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize">{power.powerCategory}</Badge>
                              </div>
                              <p class="text-xs text-muted-foreground leading-snug">{power.effect}</p>
                            </div>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                </Show>
              </CardContent>
            </Card>

          </div>
        </div>
      )}
    </Show>
  );
}
