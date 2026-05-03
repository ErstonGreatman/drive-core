import type { JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import * as SeparatorPrimitive from '@kobalte/core/separator';
import { cn } from '~/lib/utils';

type SeparatorProps = SeparatorPrimitive.SeparatorRootProps & {
  class?: string;
  orientation?: 'horizontal' | 'vertical';
};

export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class', 'orientation']);
  return (
    <SeparatorPrimitive.Root
      orientation={local.orientation ?? 'horizontal'}
      class={cn(
        'shrink-0 bg-border',
        local.orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        local.class,
      )}
      {...rest}
    />
  );
}
