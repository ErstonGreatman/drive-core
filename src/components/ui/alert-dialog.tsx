import type { ComponentProps, JSX, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';
import * as AlertDialogPrimitive from '@kobalte/core/alert-dialog';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import { cn } from '~/lib/utils';
import { buttonVariants } from './button';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

// ── Overlay ───────────────────────────────────────────────────────────────────

type AlertDialogOverlayProps<T extends ValidComponent = 'div'> =
  AlertDialogPrimitive.AlertDialogOverlayProps<T> & { class?: string };

const AlertDialogOverlay = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, AlertDialogOverlayProps<T>>,
): JSX.Element => {
  const [local, others] = splitProps(props as AlertDialogOverlayProps, ['class']);
  return (
    <AlertDialogPrimitive.Overlay
      class={cn('fixed inset-0 z-50 bg-black/75', local.class)}
      {...others}
    />
  );
};

// ── Content ───────────────────────────────────────────────────────────────────

type AlertDialogContentProps<T extends ValidComponent = 'div'> =
  AlertDialogPrimitive.AlertDialogContentProps<T> & {
    class?: string;
    children?: JSX.Element;
  };

const AlertDialogContent = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, AlertDialogContentProps<T>>,
): JSX.Element => {
  const [local, others] = splitProps(props as AlertDialogContentProps, ['class', 'children']);
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        class={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
          'rounded-lg border border-border bg-card p-6 shadow-xl',
          local.class,
        )}
        {...others}
      >
        {local.children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
};

// ── Header / Footer ───────────────────────────────────────────────────────────

const AlertDialogHeader = (props: ComponentProps<'div'>): JSX.Element => {
  const [local, others] = splitProps(props, ['class']);
  return <div class={cn('flex flex-col gap-1.5 mb-5', local.class)} {...others} />;
};

const AlertDialogFooter = (props: ComponentProps<'div'>): JSX.Element => {
  const [local, others] = splitProps(props, ['class']);
  return <div class={cn('flex justify-end gap-2', local.class)} {...others} />;
};

// ── Title ─────────────────────────────────────────────────────────────────────

type AlertDialogTitleProps<T extends ValidComponent = 'h2'> =
  AlertDialogPrimitive.AlertDialogTitleProps<T> & { class?: string };

const AlertDialogTitle = <T extends ValidComponent = 'h2'>(
  props: PolymorphicProps<T, AlertDialogTitleProps<T>>,
): JSX.Element => {
  const [local, others] = splitProps(props as AlertDialogTitleProps, ['class']);
  return (
    <AlertDialogPrimitive.Title
      class={cn('text-base font-semibold text-foreground', local.class)}
      {...others}
    />
  );
};

// ── Description ───────────────────────────────────────────────────────────────

type AlertDialogDescriptionProps<T extends ValidComponent = 'p'> =
  AlertDialogPrimitive.AlertDialogDescriptionProps<T> & { class?: string };

const AlertDialogDescription = <T extends ValidComponent = 'p'>(
  props: PolymorphicProps<T, AlertDialogDescriptionProps<T>>,
): JSX.Element => {
  const [local, others] = splitProps(props as AlertDialogDescriptionProps, ['class']);
  return (
    <AlertDialogPrimitive.Description
      class={cn('text-sm text-muted-foreground', local.class)}
      {...others}
    />
  );
};

// ── Cancel ────────────────────────────────────────────────────────────────────

type AlertDialogCancelProps<T extends ValidComponent = 'button'> =
  AlertDialogPrimitive.AlertDialogCloseButtonProps<T> & {
    class?: string;
    children?: JSX.Element;
  };

const AlertDialogCancel = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, AlertDialogCancelProps<T>>,
): JSX.Element => {
  const [local, others] = splitProps(props as AlertDialogCancelProps, ['class']);
  return (
    <AlertDialogPrimitive.CloseButton
      class={cn(buttonVariants({ variant: 'outline' }), local.class)}
      {...others}
    />
  );
};

// ── Action (confirm) ──────────────────────────────────────────────────────────
// Uses CloseButton so Kobalte closes the dialog automatically after onClick.

type AlertDialogActionProps<T extends ValidComponent = 'button'> =
  AlertDialogPrimitive.AlertDialogCloseButtonProps<T> & {
    class?: string;
    children?: JSX.Element;
  };

const AlertDialogAction = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, AlertDialogActionProps<T>>,
): JSX.Element => {
  const [local, others] = splitProps(props as AlertDialogActionProps, ['class']);
  return (
    <AlertDialogPrimitive.CloseButton
      class={cn(buttonVariants({ variant: 'destructive' }), local.class)}
      {...others}
    />
  );
};

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
};
