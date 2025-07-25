'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tag, TagCategory } from '@/types';
import { useTags } from '@/hooks/data/useTags';
import { toast } from 'sonner';
import { BaseForm } from '../forms/BaseForm';

interface CreateTagFormProps {
  searchQuery: string;
  tagCategories: TagCategory[];
  onConfirm: (data: { name: string; categoryId?: string }) => void;
  onCancel: () => void;
  onCreateCategory: () => void;
  selectedTagIds?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  tags?: Tag[];
  onRefetch?: () => void;
}

export function CreateTagForm({
  searchQuery,
  tagCategories,
  onConfirm,
  onCancel,
  onCreateCategory,
  selectedTagIds = [],
  onTagsChange,
  tags = [],
  onRefetch,
}: CreateTagFormProps) {
  const [name, setName] = React.useState(searchQuery);
  const [categoryId, setCategoryId] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { createTag } = useTags();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const result = await createTag({
        name: name.trim(),
        categoryId: categoryId || tagCategories[0]?.id || "",
      });

      if (result.success) {
        // 刷新标签列表
        if (onRefetch) {
          onRefetch();
        }

        // 如果有选择回调，自动选中新创建的标签
        if (onTagsChange && result.tag) {
          onTagsChange([...selectedTagIds, result.tag.id]);
        }

        toast.success('标签创建成功');
        onCancel(); // 关闭对话框
      } else {
        toast.error(result.error || '创建标签失败');
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      toast.error('创建标签失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseForm
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitText="创建标签"
      isLoading={isLoading}
    >
      <div className="space-y-2">
        <Label htmlFor="tag-name">标签名称</Label>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入标签名称"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="tag-category">分类</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCreateCategory}
          >
            新建分类
          </Button>
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {tagCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </BaseForm>
  );
}