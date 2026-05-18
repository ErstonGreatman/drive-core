import type { JSX } from 'solid-js';
import { Show, For, createMemo } from 'solid-js';
import { ChevronLeft, Pencil } from 'lucide-solid';
import { ExportMenu } from '~/components/ExportMenu';
import { slugify } from '~/lib/share';
import { weaponTemplates } from '~/data';
import { totalMP, computeSpentMP } from '~/lib/mecha-costs';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';
import type { Mecha, MechaWeapon } from '~/types';
import { UpgradeEntry } from './UpgradeEntry';
import { WeaponEntry } from './WeaponEntry';

const DEFAULT_WEAPONS = weaponTemplates.filter((w) => w.isDefault);

const MECHA_ATTRS = [
  { key: 'might' as const, label: 'Might' },
  { key: 'energy' as const, label: 'Energy' },
  { key: 'guard' as const, label: 'Guard' },
  { key: 'systems' as const, label: 'Systems' },
  { key: 'threshold' as const, label: 'Threshold' },
  { key: 'speed' as const, label: 'Speed' },
];

export interface MechaSheetViewProps {
  mecha: Mecha;
  backHref?: string;
  backLabel?: string;
  editHref?: string;
}

export const MechaSheetView = (props: MechaSheetViewProps): JSX.Element => {
  const mpTotal = createMemo(() => totalMP(props.mecha.bonusMP));
  const mpSpent = createMemo(() =>
    computeSpentMP(props.mecha.attributes, props.mecha.weapons, props.mecha.upgrades),
  );

  const internalUpgrades = createMemo(() =>
    props.mecha.upgrades.filter((u) => u.upgradeType === 'internal'),
  );
  const externalUpgrades = createMemo(() =>
    props.mecha.upgrades.filter((u) => u.upgradeType === 'external'),
  );
  const separateUpgrades = createMemo(() =>
    props.mecha.upgrades.filter((u) => u.upgradeType === 'separate'),
  );

  const hasUpgrades = createMemo(() =>
    internalUpgrades().length + externalUpgrades().length + separateUpgrades().length > 0,
  );

  return (
    <div class="flex-1 overflow-y-auto py-8 pr-4 min-h-0">
      <div class="max-w-3xl space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <Show when={props.backHref}>
              {(href) => (
                <Button variant="ghost" size="sm" as="a" href={href()}>
                  <ChevronLeft /> {props.backLabel ?? 'Home'}
                </Button>
              )}
            </Show>
            <div class="ml-auto flex items-center gap-2">
              <ExportMenu data={props.mecha} filename={`${slugify(props.mecha.name)}-mecha`} />
              <Show when={props.editHref}>
                {(href) => (
                  <Button variant="outline" size="sm" as="a" href={href()}>
                    <Pencil class="size-3.5" /> Edit
                  </Button>
                )}
              </Show>
            </div>
          </div>
          <div>
            <h1 class="text-2xl font-bold">{props.mecha.name}</h1>
            <Show when={props.mecha.campaignTag}>
              <p class="text-sm text-muted-foreground mt-0.5">{props.mecha.campaignTag}</p>
            </Show>
            <Show when={props.mecha.description}>
              <p class="text-sm text-muted-foreground mt-1">{props.mecha.description}</p>
            </Show>
          </div>
          <div class="flex flex-wrap gap-2">
            <Badge
              variant="muted"
              class={cn('font-mono', (mpTotal() - mpSpent()) < 0 && 'bg-destructive/10 text-destructive')}
            >
              {mpTotal() - mpSpent()} / {mpTotal()} MP
            </Badge>
            <Badge variant="muted" class="font-mono">Guard {props.mecha.attributes.guard}</Badge>
            <Badge variant="muted" class="font-mono">THR {props.mecha.attributes.threshold}</Badge>
            <Badge variant="muted" class="font-mono">Energy {props.mecha.attributes.energy}</Badge>
            <Badge variant="muted" class="font-mono">Speed {props.mecha.attributes.speed}</Badge>
          </div>
        </div>

        {/* ── Attributes ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <For each={MECHA_ATTRS}>
                {(attr) => (
                  <div class="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                    <span class="text-sm text-muted-foreground">{attr.label}</span>
                    <span class="font-mono font-semibold tabular-nums">{props.mecha.attributes[attr.key]}</span>
                  </div>
                )}
              </For>
            </div>
          </CardContent>
        </Card>

        {/* ── Upgrades ────────────────────────────────────────────────── */}
        <Show when={hasUpgrades()}>
          <Card>
            <CardHeader>
              <CardTitle>
                Upgrades ({internalUpgrades().length + externalUpgrades().length + separateUpgrades().length})
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">

              <Show when={internalUpgrades().length > 0}>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Internal — Core ({internalUpgrades().length})
                  </p>
                  <For each={internalUpgrades()}>
                    {(u) => <UpgradeEntry upgrade={u} showArea={false} />}
                  </For>
                </div>
              </Show>

              <Show when={internalUpgrades().length > 0 && externalUpgrades().length > 0}>
                <Separator />
              </Show>

              <Show when={externalUpgrades().length > 0}>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    External ({externalUpgrades().length})
                  </p>
                  <For each={externalUpgrades()}>
                    {(u) => <UpgradeEntry upgrade={u} showArea={true} />}
                  </For>
                </div>
              </Show>

              <Show when={
                (internalUpgrades().length > 0 || externalUpgrades().length > 0) &&
                separateUpgrades().length > 0
              }>
                <Separator />
              </Show>

              <Show when={separateUpgrades().length > 0}>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Separate ({separateUpgrades().length})
                  </p>
                  <For each={separateUpgrades()}>
                    {(u) => <UpgradeEntry upgrade={u} showArea={false} />}
                  </For>
                </div>
              </Show>

            </CardContent>
          </Card>
        </Show>

        {/* ── Weapons ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Weapons ({DEFAULT_WEAPONS.length + props.mecha.weapons.length})</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">

            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Built-in — always present, free
              </p>
              <For each={DEFAULT_WEAPONS}>
                {(template) => {
                  const asWeapon: MechaWeapon = {
                    id: template.id,
                    templateId: template.id,
                    name: props.mecha.defaultWeaponNames?.[template.id] ?? template.name,
                    area: 'core',
                    keywords: template.keywords,
                    energyCost: template.energyCost,
                    abilities: [],
                    isCustom: false,
                  };
                  return <WeaponEntry weapon={asWeapon} isDefault={true} />;
                }}
              </For>
            </div>

            <Show when={props.mecha.weapons.length > 0}>
              <Separator />
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Equipped ({props.mecha.weapons.length})
                </p>
                <For each={props.mecha.weapons}>
                  {(w) => <WeaponEntry weapon={w} isDefault={false} />}
                </For>
              </div>
            </Show>

          </CardContent>
        </Card>

      </div>
    </div>
  );
};
