import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import type { Mecha } from '~/types/mecha';
import { updateMecha } from '~/stores/mecha';
import { designFlaws } from '~/data';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Badge } from '~/components/ui/badge';

interface InfoTabProps {
  mecha: Mecha;
}

export function InfoTab(props: InfoTabProps): JSX.Element {
  function handleDescBlur(e: FocusEvent): void {
    const value = (e.currentTarget as HTMLTextAreaElement).value.trim();
    if (value !== (props.mecha.description ?? '')) {
      updateMecha(props.mecha.id, { description: value || undefined });
    }
  }

  function handleTagBlur(e: FocusEvent): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    if (value !== (props.mecha.campaignTag ?? '')) {
      updateMecha(props.mecha.id, { campaignTag: value || undefined });
    }
  }

  function handleBonusMPBlur(e: FocusEvent): void {
    const raw = (e.currentTarget as HTMLInputElement).value.trim();
    const value = Math.max(0, parseInt(raw, 10) || 0);
    if (value !== props.mecha.bonusMP) {
      updateMecha(props.mecha.id, { bonusMP: value });
    }
  }

  return (
    <div class="space-y-6 pt-4">
      <div class="space-y-4">
        <div>
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Campaign Tag</label>
          <Input
            value={props.mecha.campaignTag ?? ''}
            placeholder="e.g. Operation Crimson Tide"
            onBlur={handleTagBlur}
            class="mt-1.5"
          />
        </div>
        <div>
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
          <Textarea
            value={props.mecha.description ?? ''}
            placeholder="Notes about this mecha…"
            onBlur={handleDescBlur}
            rows={4}
            class="mt-1.5"
          />
        </div>
        <div>
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bonus MP</label>
          <p class="text-xs text-muted-foreground mt-0.5 mb-1.5">
            Total bonus MP from Design Flaws or GM grants. Base total is always 100 MP.
          </p>
          <Input
            type="number"
            min={0}
            value={props.mecha.bonusMP}
            onBlur={handleBonusMPBlur}
            class="w-28"
          />
        </div>
      </div>

      <div>
        <h3 class="text-sm font-semibold mb-1">Design Flaws</h3>
        <p class="text-xs text-muted-foreground mb-3">
          Taking a flaw adds the listed bonus MP. Enter your total above.
        </p>
        <div class="space-y-2">
          <For each={designFlaws}>
            {(flaw) => (
              <div class="p-3 rounded-lg border border-border bg-card space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{flaw.name}</span>
                  <Badge variant="secondary" class="font-mono text-[10px] px-1.5 py-0">
                    +{flaw.mpBonus} MP
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground leading-snug">{flaw.effect}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
