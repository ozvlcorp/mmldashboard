'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 max-w-[280px] rounded-lg bg-[#1b1d21] text-white text-[12px] leading-snug px-3 py-2 shadow-lg',
        'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';

/** Готовый info-индикатор с tooltip. Удобно для подсказок к заголовкам. */
export function InfoHint({ text, className }: { text: string; className?: string }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Подсказка"
          className={cn(
            'inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-(--color-muted) text-(--color-muted-fg) text-[9px] font-bold hover:bg-(--color-primary)/15 hover:text-(--color-primary) transition-colors',
            className,
          )}
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
