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
    <div className="flex flex-wrap gap-4 items-center relative">
      {/* 编辑相关按钮 */}
      {isEditing ? (
        <>

          {/* Add Prompt 按钮 */}
          <Button
            onClick={onAddPrompt}
            variant="outline"
            size="lg"
            className="px-3 text-black font-medium"
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
          

        </>
      ) : (
        <Button onClick={onEdit} variant="outline" size="lg" className="px-3 text-black font-medium">
          <Edit3 className="w-4 h-4" />
          
        </Button>
      )}
    

       
      {/* 复制全部提示词 - 编辑模式下隐藏 */}
      {!isEditing && (
        <Button
          onClick={onCopyAll}
          variant="outline"
          size="lg"
          disabled={promptBlocks.length === 0}
          className={ `bg-black border-0 rounded-xl text-white px-3 ${
            copyAllStatus === 'success' ? 'bg-white border-green-500 text-green-700' : ''
          } font-medium`
          }
        >
          {copyAllStatus === 'success' ? (
            <Check className="w-4 h-4 " />
          ) : (
            <Copy className="w-4 h-4 " />
          )}
          {copyAllStatus === 'success' ? '已复制' : 'Copy Prompt'}
        </Button>
      )}

     

      {/* 复制图片 - 编辑模式下隐藏 */}
      {!isEditing && onDuplicate && (
        <Button
          onClick={onDuplicate}
          variant="outline"
          size="lg"
          className={ `bg-black border-0 rounded-xl text-white px-3 ${
            duplicateStatus === 'success'
              ? 'border-green-500 text-green-700'
              : ''
          } font-medium`
          }
        >
          {duplicateStatus === 'success' ? (
            <Check className="w-4 h-4 " />
          ) : (
            <Files className="w-4 h-4 " />
          )}
          {duplicateStatus === 'success' ? '已复制' : 'Copy & Edit'}
        </Button>
      )}
    </div>
  );
}