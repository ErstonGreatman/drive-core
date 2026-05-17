import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { Mecha } from '~/types/mecha';
import type { UpgradeType } from '~/types/mecha';
import { upgradeTemplates, upgradeTemplatesById } from '~/data';
import type { UpgradeTemplateDefinition } from '~/data';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';
import { TakenUpgradeCard } from './upgrade/TakenUpgradeCard';
import { UpgradeRow } from './upgrade/UpgradeRow';

interface UpgradeTabProps {
  mecha: Mecha;
}

const UPGRADE_TYPE_TABS: { key: UpgradeType; label: string; description: string }[] = [
  { key: 'internal', label: 'Internal', description: "Installed in the Core. Modify the Gear's fundamental systems and combat style." },
  { key: 'external', label: 'External', description: 'Mounted to a specific Area (Head/Torso/Arms/Legs). Can be lost to Maiming.' },
  { key: 'separate', label: 'Separate', description: 'Stored separately and used on-demand. Support systems and tactical equipment.' },
];

const SUBCATEGORY_LABELS: Record<string, string> = {
  general: 'General', 'active-defense': 'Active Defense', restoration: 'Restoration',
  mobility: 'Mobility', support: 'Support', 'extra-area': 'Extra Area',
  'alternate-form': 'Alternate Form', combination: 'Combination', feature: 'Features',
};

export const UpgradeTab = (props: UpgradeTabProps): JSX.Element => {
  const [activeType, setActiveType] = createSignal<UpgradeType>('internal');

  const hasSuperiorMorphing = () => props.mecha.upgrades.some((u) => u.templateId === 'superior-morphing');

  const takenIds = () => new Set(props.mecha.upgrades.map((u) => u.templateId).filter(Boolean));

  const takenInType = () =>
    props.mecha.upgrades
      .map((u, i) => ({ upgrade: u, def: upgradeTemplatesById[u.templateId ?? ''], index: i }))
      .filter((x): x is typeof x & { def: UpgradeTemplateDefinition } =>
        !!x.def && x.upgrade.upgradeType === activeType()
      );

  const availableBySubcategory = () => {
    const byType = upgradeTemplates.filter((t) => t.upgradeType === activeType());
    const map = new Map<string, UpgradeTemplateDefinition[]>();
    for (const def of byType) {
      const group = map.get(def.upgradeSubcategory) ?? [];
      group.push(def);
      map.set(def.upgradeSubcategory, group);
    }
    return map;
  };

  return (
    <div class="space-y-6 pt-4">
      <div class="flex gap-1 flex-wrap">
        <For each={UPGRADE_TYPE_TABS}>
          {(tab) => {
            const count = () => props.mecha.upgrades.filter((u) => u.upgradeType === tab.key).length;
            return (
              <button
                onClick={() => setActiveType(tab.key)}
                class={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeType() === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
              >
                {tab.label}
                <Show when={count() > 0}>
                  <span class="ml-1.5 text-xs opacity-70">({count()})</span>
                </Show>
              </button>
            );
          }}
        </For>
      </div>

      <For each={UPGRADE_TYPE_TABS}>
        {(tab) => (
          <Show when={activeType() === tab.key}>
            <p class="text-xs text-muted-foreground -mt-4">{tab.description}</p>
          </Show>
        )}
      </For>

      <Show when={takenInType().length > 0}>
        <div class="space-y-2">
          <h3 class="text-sm font-semibold">Installed</h3>
          <div class="space-y-3">
            <For each={takenInType()}>
              {({ upgrade, def, index }) => (
                <TakenUpgradeCard mecha={props.mecha} upgrade={upgrade} index={index} def={def} hasSuperiorMorphing={hasSuperiorMorphing()} />
              )}
            </For>
          </div>
        </div>
        <Separator />
      </Show>

      <div class="space-y-4">
        <h3 class="text-sm font-semibold">Available</h3>
        <For each={[...availableBySubcategory().entries()]}>
          {([subcategory, defs]) => (
            <div>
              <Show when={availableBySubcategory().size > 1}>
                <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  {SUBCATEGORY_LABELS[subcategory] ?? subcategory}
                </p>
              </Show>
              <For each={defs}>
                {(def) => (
                  <UpgradeRow mecha={props.mecha} def={def} alreadyTaken={takenIds().has(def.id)} hasSuperiorMorphing={hasSuperiorMorphing()} />
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
