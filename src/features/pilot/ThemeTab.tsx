import type { JSX } from 'solid-js';
import type { Pilot } from '~/types/pilot';
import { updatePilot } from '~/stores/pilots';
import { Textarea } from '~/components/ui/textarea';

interface ThemeTabProps {
  pilot: Pilot;
}

export const ThemeTab = (props: ThemeTabProps): JSX.Element => {
  const handleBlur = (field: 'reason' | 'typecast' | 'bane', e: FocusEvent): void => {
    const value = (e.currentTarget as HTMLTextAreaElement).value.trim();
    if (value !== props.pilot.genreThemes[field]) {
      updatePilot(props.pilot.id, {
        genreThemes: {
          reason: props.pilot.genreThemes.reason,
          typecast: props.pilot.genreThemes.typecast,
          bane: props.pilot.genreThemes.bane,
          [field]: value,
        },
      });
    }
  };

  return (
    <div class="space-y-6 max-w-lg">
      <p class="text-sm text-muted-foreground">
        Genre Themes define who your character is off the battlefield. Roleplaying them earns Genre Points, which fuel Genre Powers in combat.
      </p>

      <div class="space-y-1.5">
        <label class="text-sm font-semibold text-foreground">Reason</label>
        <p class="text-xs text-muted-foreground">
          Your personal motivation — the thing that keeps you fighting when all looks bleak.
          <span class="block mt-1 italic">e.g. Justice · Knowledge · Family · Duty · Vengeance · Fame</span>
        </p>
        <Textarea
          value={props.pilot.genreThemes.reason}
          placeholder="What drives your pilot forward?"
          onBlur={(e) => handleBlur('reason', e)}
          rows={3}
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-semibold text-foreground">Typecast</label>
        <p class="text-xs text-muted-foreground">
          The role your character plays within the team — their dynamic with allies.
          <span class="block mt-1 italic">e.g. Leadership · Rookie · Rivalry · Mentor · Loner · Cheerleader</span>
        </p>
        <Textarea
          value={props.pilot.genreThemes.typecast}
          placeholder="What role does your pilot play in the team?"
          onBlur={(e) => handleBlur('typecast', e)}
          rows={3}
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-sm font-semibold text-foreground">Bane</label>
        <p class="text-xs text-muted-foreground">
          Your character's fatal flaw — something that causes real trouble when it surfaces.
          <span class="block mt-1 italic">e.g. Addiction · Phobia · Berserker · Grandeur · Nemesis · Failing Body</span>
        </p>
        <Textarea
          value={props.pilot.genreThemes.bane}
          placeholder="What is your pilot's Achilles' heel?"
          onBlur={(e) => handleBlur('bane', e)}
          rows={3}
        />
      </div>
    </div>
  );
}
