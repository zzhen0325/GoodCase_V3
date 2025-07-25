'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BaseForm } from '../forms/BaseForm';

interface CreateCategoryFormProps {
  onConfirm: (data: { name: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CreateCategoryForm({
  onConfirm,
  onCancel,
  isLoading = false
}: CreateCategoryFormProps) {
  const [name, setName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onConfirm({ name: name.trim() });
  };

  return (
    <BaseForm
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitText="创建分类"
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="category-name">分类名称</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入分类名称"
          autoFocus
        />
      </div>
    </BaseForm>
  );
}