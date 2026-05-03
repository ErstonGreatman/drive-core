import type { JSX } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { powerLevel } from '~/lib/pilot-costs';

interface InfoTabProps {
  pilot: Pilot;
}

export function InfoTab(props: InfoTabProps): JSX.Element {
  function handleTagBlur(e: FocusEvent): void {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    const current = props.pilot.campaignTag ?? '';
    if (value !== current) {
      updatePilot(props.pilot.id, { campaignTag: value || undefined });
    }
  }

  function handleDescBlur(e: FocusEvent): void {
    const value = (e.currentTarget as HTMLTextAreaElement).value;
    const current = props.pilot.description ?? '';
    if (value !== current) {
      updatePilot(props.pilot.id, { description: value || undefined });
    }
  }

  function handleExperienceInput(e: InputEvent): void {
    const raw = (e.currentTarget as HTMLInputElement).value;
    const value = parseInt(raw, 10);
    if (!isNaN(value) && value >= 0) {
      updatePilot(props.pilot.id, { experience: value });
    }
  }

  return (
    <div class="space-y-5 max-w-lg">
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">Campaign Tag</label>
        <Input
          value={props.pilot.campaignTag ?? ''}
          placeholder="e.g. Lunaknight Campaign, Season 2"
          onBlur={handleTagBlur}
        />
        <p class="text-xs text-muted-foreground">Short label shown on the pilot card at home.</p>
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">Description</label>
        <Textarea
          value={props.pilot.description ?? ''}
          placeholder="Character background, appearance, personality notes…"
          onBlur={handleDescBlur}
          rows={5}
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">Experience Points</label>
        <p class="text-xs text-muted-foreground">
          Every 30 XP grants one Power Level. PL raises the CP budget by 30 and unlocks one additional Genre Power.
          Current PL: <span class="font-semibold text-foreground">{powerLevel(props.pilot.experience)}</span>
        </p>
        <Input
          type="number"
          min="0"
          step="1"
          value={props.pilot.experience}
          onInput={handleExperienceInput}
          class="w-32"
        />
      </div>
    </div>
  );
}
