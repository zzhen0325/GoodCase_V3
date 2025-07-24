import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagCategory } from '@/types';

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; categoryId?: string }) => void;
  tagCategories: TagCategory[];
  defaultCategoryId?: string;
}

export function CreateTagDialog({ open, onOpenChange, onConfirm, tagCategories, defaultCategoryId }: CreateTagDialogProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  React.useEffect(() => {
    if (tagCategories.length > 0) {
      setCategoryId(defaultCategoryId || tagCategories[0].id);
    } else {
      setCategoryId('');
    }
  }, [tagCategories, defaultCategoryId]);

  React.useEffect(() => {
    if (open) {
      setName('');
      if (tagCategories.length > 0) {
        setCategoryId(defaultCategoryId || tagCategories[0].id);
      } else {
        setCategoryId('');
      }
    }
  }, [open, tagCategories, defaultCategoryId]);

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm({ name: name.trim(), categoryId: categoryId || undefined });
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建标签</DialogTitle>
          <DialogDescription>在指定分类中创建一个新标签。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tag-name">标签名称</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入标签名称"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <Label htmlFor="tag-category">所属分类</Label>
            {tagCategories.length > 0 ? (
              <select
                id="tag-tagCategory"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {tagCategories.map((tagCategory) => (
                  <option key={tagCategory.id} value={tagCategory.id}>
                    {tagCategory.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-2 border rounded-md bg-muted text-muted-foreground text-sm">
                暂无分类，标签将创建为未分类状态
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name?.trim()}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
