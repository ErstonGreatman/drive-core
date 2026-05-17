import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import { weaponKeywordsById } from '~/data';
import { Badge } from '~/components/ui/badge';
import { primaryKeyword } from './weaponUtils';

interface KeywordBadgesProps {
  keywords: string[];
}

export const KeywordBadges = (props: KeywordBadgesProps): JSX.Element => {
  const primary = () => primaryKeyword(props.keywords);
  const secondary = () => props.keywords.filter((k) => k !== 'melee' && k !== 'shooting' && k !== 'beam');

  return (
    <span class="flex items-center gap-1 flex-wrap">
      <Badge
        variant={primary() === 'beam' ? 'secondary' : 'outline'}
        class="text-[10px] px-1.5 py-0 capitalize"
      >
        {weaponKeywordsById[primary()]?.name ?? primary()}
      </Badge>
      <For each={secondary()}>
        {(kw) => (
          <Badge variant="outline" class="text-[10px] px-1.5 py-0 capitalize">
            {weaponKeywordsById[kw]?.name ?? kw}
          </Badge>
        )}
      </For>
    </span>
  );
};
