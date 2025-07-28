import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, Save } from 'lucide-react';
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
  onSave?: () => void;
  onCancel?: () => void;
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
  onSave,
  onCancel,
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
                  <TooltipProvider key={tag.id} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="px-3 h-8 py-4 text-xs font-medium rounded-xl border cursor-help transition-all duration-200"
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
                              className="ml-1 h-4 w-4 bg-transparent hover:bg-transparent"
                              style={{
                                color: colorTheme.text
                              }}
                              onClick={() => removeTag(tag.id)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded shadow-lg">
                        <p>{tagCategory ? `分类: ${tagCategory.name}` : '未分类'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null;
              })}
              {editedTagIds.length === 0 && (
                <span className="text-xs text-black">暂无标签</span>
              )}
            </div>
          </div>
 
          {/* 编辑模式下的保存和取消按钮 */}
          {isEditing && (onSave || onCancel) && (
            <>
             
              <div className="flex gap-3 justify-end">
                {/* Cancel 按钮 */}
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    size="lg"
                    className="border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    Cancel
                  </Button>
                )}
                
                {/* Save 按钮 */}
                {onSave && (
                  <Button
                    onClick={onSave}
                    size="lg"
                    className="bg-black hover:bg-black text-white px-4"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}