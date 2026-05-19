'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-[13px] font-semibold tracking-tight transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)/25',
  {
    variants: {
      variant: {
        default:
          'bg-(--color-primary) text-(--color-primary-fg) shadow-[0_4px_12px_rgba(74,101,255,0.25)] hover:bg-(--color-primary-hover) hover:shadow-[0_6px_16px_rgba(74,101,255,0.35)]',
        outline:
          'border border-(--color-border) bg-(--color-card) text-(--color-fg) hover:bg-(--color-muted) hover:border-(--color-primary)/30',
        ghost: 'text-(--color-fg-soft) hover:bg-(--color-muted)',
        secondary: 'bg-(--color-primary-soft) text-(--color-primary-soft-fg) hover:bg-(--color-primary-soft)/70',
        soft: 'bg-(--color-muted) text-(--color-fg) hover:bg-(--color-muted)/70',
        danger:
          'bg-(--color-danger) text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)] hover:opacity-90',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-[12px]',
        lg: 'h-10 px-5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
