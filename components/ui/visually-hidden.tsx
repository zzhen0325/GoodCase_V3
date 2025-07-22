'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * VisuallyHidden组件用于创建对屏幕阅读器可见但视觉上不可见的内容
 * 这对于提高可访问性非常重要，特别是在需要提供额外上下文但不想在视觉上显示的情况下
 */
const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        'clip-[rect(0,0,0,0)] sr-only',
        className
      )}
      {...props}
    />
  );
});

VisuallyHidden.displayName = 'VisuallyHidden';

export { VisuallyHidden };