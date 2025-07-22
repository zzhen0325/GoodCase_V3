import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getColorTheme, Tag, TagGroup, ImageData } from '@/types';
export interface ImageInfoProps {
  image: any
  isEditing: boolean
  onDelete?: () => void
  deleteStatus?: string
  onUpdate?: () => void
  tags: any[]
  editedTitle?: string
  editedTagIds: string[]
  onTitleChange?: (val: string) => void
  onTagIdsChange: (val: string[]) => void
  onRefetch?: () => void
  tagSelectorOpen?: boolean
  setTagSelectorOpen?: (open: boolean) => void
}

export function ImageInfo(props: ImageInfoProps) {
  const {
    image, isEditing, onDelete, deleteStatus, onUpdate, tags, editedTitle, editedTagIds, onTitleChange,
    onTagIdsChange, onRefetch, tagSelectorOpen, setTagSelectorOpen
  } = props;
  const tagGroups = image?.tagGroups || [];
  const removeTag = (tagId: string) => {
    onTagIdsChange(editedTagIds.filter((id) => id !== tagId));
  };
  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-black mb-6">Tags</label>
        <div className="flex flex-wrap gap-2 mt-4">
          {editedTagIds?.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            const tagGroup = tag ? tagGroups.find((g: TagGroup) => g.id === tag.categoryId) : null;
            const colorTheme = tagGroup ? getColorTheme(tagGroup.color || 'gray') : getColorTheme('gray');
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
          {(!editedTagIds || editedTagIds.length === 0) && <span className="text-xs text-black">暂无标签</span>}
        </div>
      </div>
    </div>
  );
}
