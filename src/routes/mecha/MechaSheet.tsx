import type { JSX } from 'solid-js';
import { Show, For, createMemo } from 'solid-js';
import { useParams } from '@solidjs/router';
import { ChevronLeft, Pencil } from 'lucide-solid';
import { mechaState } from '~/stores/mecha.ts';
import { ExportMenu } from '../../components/ExportMenu';
import { slugify } from '~/lib/share.ts';
import { weaponTemplates, weaponKeywordsById, weaponTemplatesById, upgradeTemplatesById } from '~/data';
import { totalMP, computeSpentMP, upgradeCostDisplay } from '~/lib/mecha-costs.ts';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { cn } from '~/lib/utils.ts';
import type { Mecha, MechaUpgrade, MechaWeapon } from '~/types';

// ── Module-level data ──────────────────────────────────────────────────────────

const DEFAULT_WEAPONS = weaponTemplates.filter((w) => w.isDefault);

const MECHA_ATTRS = [
  { key: 'might' as const, label: 'Might' },
  { key: 'energy' as const, label: 'Energy' },
  { key: 'guard' as const, label: 'Guard' },
  { key: 'systems' as const, label: 'Systems' },
  { key: 'threshold' as const, label: 'Threshold' },
  { key: 'speed' as const, label: 'Speed' },
];

const SWAP_ATTR_LABELS: Record<string, string> = {
  might: 'Might', guard: 'Guard', systems: 'Systems', speed: 'Speed',
};

const TERRAIN_LABELS: Record<string, string> = {
  water: 'Water', space: 'Space', land: 'Land',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const keywordName = (kw: string): string =>
  weaponKeywordsById[kw]?.name ?? (kw.charAt(0).toUpperCase() + kw.slice(1));

const areaLabel = (area: string): string =>
  area.charAt(0).toUpperCase() + area.slice(1);

// ── Sub-components ─────────────────────────────────────────────────────────────

const UpgradeEntry = (props: { upgrade: MechaUpgrade; showArea: boolean }): JSX.Element => {
  const u = () => props.upgrade;
  const templateName = () => u().templateId ? upgradeTemplatesById[u().templateId!]?.name : undefined;

  return (
    <div class="py-2 border-b border-border/40 last:border-0">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span class="text-sm font-medium">{u().name}</span>
          <Show when={props.showArea && u().area !== 'separate' && u().area !== 'core'}>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize">{areaLabel(u().area)}</Badge>
          </Show>
          <Show when={u().specialistLabel}>
            <span class="text-xs text-muted-foreground">— {u().specialistLabel}</span>
          </Show>
        </div>
        <Badge variant="muted" class="font-mono text-[10px] px-1.5 py-0 shrink-0">{upgradeCostDisplay(u())}</Badge>
      </div>
      <Show when={templateName() && templateName() !== u().name}>
        <p class="text-[11px] text-muted-foreground">{templateName()}</p>
      </Show>
      <p class="text-xs text-muted-foreground mt-0.5 leading-snug">{u().effect}</p>

      {/* Frame / Transformation: swap indicator */}
      <Show when={u().swapAttributes}>
        <p class="text-xs text-primary mt-0.5">
          Swaps: {SWAP_ATTR_LABELS[u().swapAttributes![0]] ?? u().swapAttributes![0]}
          {' ↔ '}
          {SWAP_ATTR_LABELS[u().swapAttributes![1]] ?? u().swapAttributes![1]}
        </p>
      </Show>

      {/* Terrain Specialist */}
      <Show when={u().terrainType}>
        <p class="text-xs text-muted-foreground mt-0.5">
          Terrain: {TERRAIN_LABELS[u().terrainType!] ?? u().terrainType}
        </p>
      </Show>

      {/* Superior Morphing form pools */}
      <Show when={u().formPools && u().formPools!.length > 0}>
        <div class="mt-1.5 pl-3 border-l border-border space-y-2">
          <For each={u().formPools!}>
            {(pool) => (
              <div class="space-y-0.5">
                <p class="text-xs font-medium text-foreground">{pool.label}</p>
                <Show when={pool.swapAttributes && pool.swapAttributes[0] !== pool.swapAttributes[1]}>
                  <p class="text-xs text-primary">
                    {SWAP_ATTR_LABELS[pool.swapAttributes![0]] ?? pool.swapAttributes![0]}
                    {' ↔ '}
                    {SWAP_ATTR_LABELS[pool.swapAttributes![1]] ?? pool.swapAttributes![1]}
                  </p>
                </Show>
                <For each={pool.weapons}>
                  {(w) => (
                    <div class="text-xs text-muted-foreground">
                      <span class="font-medium text-foreground">{w.name}</span>
                      {' · '}{w.keywords.map(keywordName).join(' / ')}
                    </div>
                  )}
                </For>
                <For each={pool.upgrades}>
                  {(sub) => (
                    <div class="text-xs text-muted-foreground">
                      <span class="font-medium text-foreground">{sub.name}</span>
                      {' · '}{sub.mpCost} MP
                    </div>
                  )}
                </For>
                <Show when={pool.weapons.length === 0 && pool.upgrades.length === 0 && !pool.swapAttributes}>
                  <p class="text-[11px] text-muted-foreground italic">Empty form</p>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Expansion Pack / Secret Equipment sub-items */}
      <Show when={u().subItems && (u().subItems!.weapons.length > 0 || u().subItems!.upgrades.length > 0)}>
        <div class="mt-1.5 pl-3 border-l border-border space-y-0.5">
          <For each={u().subItems!.weapons}>
            {(w) => {
              const tName = w.templateId ? weaponTemplatesById[w.templateId!]?.name : undefined;
              return (
                <div class="text-xs text-muted-foreground">
                  <span class="font-medium text-foreground">{w.name}</span>
                  <Show when={tName && tName !== w.name}>
                    <span class="text-[10px]"> ({tName})</span>
                  </Show>
                  {' · '}{w.keywords.map(keywordName).join(' / ')}
                </div>
              );
            }}
          </For>
          <For each={u().subItems!.upgrades}>
            {(sub) => {
              const tName = sub.templateId ? upgradeTemplatesById[sub.templateId!]?.name : undefined;
              return (
                <div class="text-xs text-muted-foreground">
                  <span class="font-medium text-foreground">{sub.name}</span>
                  <Show when={tName && tName !== sub.name}>
                    <span class="text-[10px]"> ({tName})</span>
                  </Show>
                  {sub.specialistLabel && ` (${sub.specialistLabel})`}
                  {' · '}{sub.mpCost} MP
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}

const WeaponEntry = (props: { weapon: MechaWeapon; isDefault?: boolean }): JSX.Element => {
  const w = () => props.weapon;
  const templateName = () => w().templateId ? weaponTemplatesById[w().templateId!]?.name : undefined;
  return (
    <div class="py-2 border-b border-border/40 last:border-0">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span class="text-sm font-medium">{w().name}</span>
          <For each={w().keywords}>
            {(kw) => (
              <Badge
                variant="muted"
                class={cn(
                  'text-[10px] px-1.5 py-0',
                  kw === 'beam' && 'bg-primary/10 text-primary',
                )}
              >
                {keywordName(kw)}
              </Badge>
            )}
          </For>
          <Show when={!props.isDefault}>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize">
              {areaLabel(w().area)}
            </Badge>
          </Show>
        </div>
        <Show when={!props.isDefault}>
          <Badge variant="muted" class="font-mono text-[10px] px-1.5 py-0 shrink-0">5 MP</Badge>
        </Show>
      </div>
      <Show when={templateName() && templateName() !== w().name}>
        <p class="text-[11px] text-muted-foreground">{templateName()}</p>
      </Show>
      <Show when={w().energyCost}>
        <p class="text-xs text-muted-foreground mt-0.5">Energy cost: {w().energyCost}</p>
      </Show>
      <Show when={w().abilities.length > 0}>
        <div class="mt-1 space-y-0.5">
          <For each={w().abilities}>
            {(ability) => (
              <p class="text-xs text-muted-foreground leading-snug">
                <span class="font-medium text-foreground">{ability.name}</span>
                {ability.label && <span class="text-foreground"> ({ability.label})</span>}
                {ability.wpCost !== 0 && <span class="font-mono"> ({ability.wpCost > 0 ? `+${ability.wpCost}` : ability.wpCost} WP)</span>}
                {ability.description && ` — ${ability.description}`}
              </p>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

// ── MechaSheetView ─────────────────────────────────────────────────────────────

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

            {/* Built-in defaults */}
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

// ── Route default export ───────────────────────────────────────────────────────

const MechaSheet = (): JSX.Element => {
  const params = useParams<{ id: string }>();
  const mecha = () => mechaState.mecha.find((m) => m.id === params.id);

  return (
    <Show
      when={mecha()}
      fallback={<p class="text-muted-foreground text-sm py-8">Mecha not found.</p>}
    >
      {(m) => (
        <MechaSheetView
          mecha={m()}
          backHref="/"
          editHref={`/mecha/${params.id}`}
        />
      )}
    </Show>
  );
};

export default MechaSheet;
