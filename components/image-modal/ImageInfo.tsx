import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { ImageData, Tag, TagCategory } from '@/types';
import { getColorTheme } from '@/types';
// TagSelectorDropdown 在 ImageActions 中使用，这里不需要导入

interface ImageInfoProps {
  image: ImageData;
  isEditing: boolean;
  onDelete?: () => void;
  deleteStatus: 'idle' | 'confirming' | 'deleting';
  tags: Tag[];
  tagCategories: TagCategory[];
  editedTitle: string;
  editedTagIds: string[];
  onTitleChange: (title: string) => void;
  onTagIdsChange: (tagIds: string[]) => void;
  onRefetch: () => void;
  tagSelectorOpen: boolean;
  setTagSelectorOpen: (open: boolean) => void;
}

export function ImageInfo({
  image,
  isEditing,
  onDelete,
  deleteStatus,
  tags,
  tagCategories,
  editedTitle,
  editedTagIds,
  onTitleChange,
  onTagIdsChange,
  onRefetch,
  tagSelectorOpen,
  setTagSelectorOpen,
}: ImageInfoProps) {
  // 移除标签
  const removeTag = (tagId: string) => {
    onTagIdsChange(editedTagIds.filter((id) => id !== tagId));
  };

  return (
    <div className="border-t flex-shrink-0">
      <ScrollArea className="max-h-60">
        <div className="p-6 space-y-6">
          {/* 标签显示 */}
          <div>
            <label className="text-sm font-medium text-black mb-6">
              Tags
            </label>

            {/* 当前标签显示 */}
            <div className="flex flex-wrap gap-2 mt-4">
              {editedTagIds.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                const tagCategory = tag ? tagCategories.find(g => g.id === tag.categoryId) : null;
                const colorTheme = tagCategory ? getColorTheme(tagCategory.color || 'gray') : getColorTheme('pink');
                return tag ? (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="h-8 py-4 text-xs font-medium rounded-xl border"
                    style={{
                      backgroundColor: colorTheme.bg,
                      borderColor: colorTheme.primary,
                      color: colorTheme.text
                    }}
                  >
                    {tag.name}
                    {isEditing && (
                      <Button
                        size="icon"
                        className="ml-2 h-5 w-5 bg-white/40 hover:bg-white"
                        onClick={() => removeTag(tag.id)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    )}
                  </Badge>
                ) : null;
              })}
              {editedTagIds.length === 0 && (
                <span className="text-xs text-black">暂无标签</span>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
} 