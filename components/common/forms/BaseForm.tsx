'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface BaseFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  className?: string;
}

export function BaseForm({
  onSubmit,
  onCancel,
  children,
  submitText = '确认',
  cancelText = '取消',
  isLoading = false,
  className
}: BaseFormProps) {
  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="space-y-4">
        {children}
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '处理中...' : submitText}
        </Button>
      </div>
    </form>
  );
}