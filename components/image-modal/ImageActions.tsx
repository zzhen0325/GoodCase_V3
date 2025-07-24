import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Edit3, 
  Save, 
  Copy, 
  Check, 
  Trash2, 
  Files, 
  Plus 
} from 'lucide-react';
import { PromptBlock, Tag, TagCategory } from '@/types';
import { TagSelectorDropdown } from './TagSelectorDropdown';

interface ImageActionsProps {
  isEditing: boolean;
  promptBlocks: PromptBlock[];
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCopyAll: () => void;
  onDuplicate?: () => void;
  copyAllStatus: 'idle' | 'success' | 'error';
  duplicateStatus: 'idle' | 'success' | 'error';
  onAddPrompt?: () => void;
  tags?: Tag[];
  tagCategories?: TagCategory[];
  editedTagIds?: string[];
  onTagIdsChange?: (tagIds: string[]) => void;
  onRefetch?: () => void;
  tagSelectorOpen?: boolean;
  setTagSelectorOpen?: (open: boolean) => void;
  onDelete?: () => void;
  deleteStatus: 'idle' | 'confirming' | 'deleting';
}

export function ImageActions({
  isEditing,
  promptBlocks,
  onEdit,
  onSave,
  onCancel,
  onCopyAll,
  onDuplicate,
  copyAllStatus,
  duplicateStatus,
  onAddPrompt,
  tags,
  tagCategories,
  editedTagIds,
  onTagIdsChange,
  onRefetch,
  tagSelectorOpen,
  setTagSelectorOpen,
  onDelete,
  deleteStatus,
}: ImageActionsProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDeleteClick = () => {
    if (!isConfirming) {
      setIsConfirming(true);
    } else {
      setIsConfirming(false);
      onDelete?.();
    }
  };

  // 重置确认状态当删除状态改变时
  React.useEffect(() => {
    if (deleteStatus === 'idle') {
      setIsConfirming(false);
    }
  }, [deleteStatus]);

  return (
    <div className="flex flex-wrap gap-2 items-center relative">
      {/* 编辑相关按钮 */}
      {isEditing ? (
        <>
          {/* 删除按钮 - 编辑模式第一个 */}
          {onDelete && (
            <Button
              onClick={handleDeleteClick}
              variant="destructive"
              size="sm"
              disabled={deleteStatus === 'deleting'}
            >
              <Trash2 className="w-4 h-4" />
              {deleteStatus === 'deleting'
                ? '删除中...'
                : isConfirming
                  ? '确认删除？'
                  : '删除'}
            </Button>
          )}
          <Separator orientation="vertical" className="h-6 mx-4" />
          {/* Add Prompt 按钮 */}
          <Button
            onClick={onAddPrompt}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 text-black" />
            Add Prompt
          </Button>
          
          {/* Add Tag 下拉按钮 */}
          {tags && tagCategories && editedTagIds && onTagIdsChange && onRefetch && (
            <TagSelectorDropdown
              tags={tags}
              tagCategories={tagCategories}
              selectedTagIds={editedTagIds}
              onTagsChange={onTagIdsChange}
              open={tagSelectorOpen || false}
              onOpenChange={setTagSelectorOpen || (() => {})}
              onRefetch={onRefetch}
            />
          )}
          
          <Separator orientation="vertical" className="h-6 mx-4" />
          
          {/* Save 按钮 */}
          <Button
            key="save"
            onClick={onSave}
            size="sm"
            className="bg-black hover:bg-black text-white px-4"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          
          {/* Cancel 按钮 */}
          <Button
            key="cancel"
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit3 className="w-4 h-4" />
          Edit
        </Button>
      )}

      {/* 复制全部提示词 - 编辑模式下隐藏 */}
      {!isEditing && (
        <Button
          onClick={onCopyAll}
          variant="outline"
          size="sm"
          disabled={promptBlocks.length === 0}
          className={
            copyAllStatus === 'success' ? 'border-green-500 text-green-700' : ''
          }
        >
          {copyAllStatus === 'success' ? (
            <Check className="w-4 h-4 " />
          ) : (
            <Copy className="w-4 h-4 " />
          )}
          {copyAllStatus === 'success' ? '已复制' : '复制全部'}
        </Button>
      )}

      {/* 复制图片 - 编辑模式下隐藏 */}
      {!isEditing && onDuplicate && (
        <Button
          onClick={onDuplicate}
          variant="outline"
          size="sm"
          className={
            duplicateStatus === 'success'
              ? 'border-green-500 text-green-700'
              : ''
          }
        >
          {duplicateStatus === 'success' ? (
            <Check className="w-4 h-4 " />
          ) : (
            <Files className="w-4 h-4 " />
          )}
          {duplicateStatus === 'success' ? '已复制' : '复制图片'}
        </Button>
      )}
    </div>
  );
}