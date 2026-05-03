import type { Component, ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:   'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline:   'text-foreground',
        muted:     'border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
);

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

const Badge: Component<BadgeProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'variant']);
  return (
    <span class={cn(badgeVariants({ variant: local.variant }), local.class)} {...others} />
  );
};

export { Badge, badgeVariants };
export type { BadgeProps };
