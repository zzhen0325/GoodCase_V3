import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, Edit3, Check, Copy, Plus, Trash2, Files } from 'lucide-react';
import type { Prompt, Tag, TagGroup } from '@/types';
import { TagSelectorDropdown } from './TagSelectorDropdown';

export interface ImageActionsProps {
  isEditing: boolean;
  prompts: any[];
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onCopyAll?: () => void;
  onDuplicate?: () => void;
  copyAllStatus?: string;
  duplicateStatus?: string;
  onAddPrompt?: () => void;
  tags?: any[];
  tagGroups?: any[];
  editedTagIds?: string[];
  onTagIdsChange?: (arr: string[]) => void;
  onRefetch?: () => void;
  tagSelectorOpen?: boolean;
  setTagSelectorOpen?: (open: boolean) => void;
  onDelete?: () => void;
  deleteStatus?: string;
}

export function ImageActions(props: ImageActionsProps) {
  const {
    isEditing, prompts, onEdit, onSave, onCancel, onCopyAll, onDuplicate,
    copyAllStatus, duplicateStatus, onAddPrompt, tags, tagGroups,
    editedTagIds, onTagIdsChange, onRefetch, tagSelectorOpen, setTagSelectorOpen, onDelete, deleteStatus
  } = props;

  return (
    <div className="flex flex-wrap gap-2 items-center relative">
      {isEditing ? (
        <>
          {onDelete && (
            <Button
              onClick={onDelete}
              variant="destructive"
              size="sm"
              disabled={deleteStatus === 'deleting'}
            >
              <Trash2 className="w-4 h-4" />
              {deleteStatus === 'confirming' ? '确认删除' : deleteStatus === 'deleting' ? '删除中...' : '删除'}
            </Button>
          )}
          <Separator orientation="vertical" className="h-6 mx-4" />
          <Button onClick={onAddPrompt} variant="outline" size="sm">
            <Plus className="w-4 h-4 text-black" />Add Prompt
          </Button>
          {tags && tagGroups && editedTagIds && onTagIdsChange && onRefetch && (
            <TagSelectorDropdown
              tags={tags}
              tagGroups={tagGroups}
              selectedTagIds={editedTagIds}
              onTagsChange={onTagIdsChange}
              open={tagSelectorOpen || false}
              onOpenChange={setTagSelectorOpen || (()=>{})}
              onRefetch={onRefetch}
            />
          )}
          <Separator orientation="vertical" className="h-6 mx-4" />
          <Button key="save" onClick={onSave} size="sm" className="bg-black hover:bg-black text-white px-4" >
            <Save className="w-4 h-4" />Save
          </Button>
          <Button key="cancel" onClick={onCancel} variant="outline" size="sm" className="border-red-200 hover:bg-red-50 hover:text-red-600" >
            Cancel
          </Button>
        </>
      ) : (
        <Button onClick={onEdit} variant="outline" size="sm"><Edit3 className="w-4 h-4" />Edit</Button>
      )}
      {!isEditing && (
        <Button onClick={onCopyAll} variant="outline" size="sm" disabled={!prompts || prompts.length===0} className={copyAllStatus==='success' ? 'border-green-500 text-green-700' : ''}>
          {copyAllStatus==='success'?<Check className="w-4 h-4" />:<Copy className="w-4 h-4" />}
          {copyAllStatus==='success'?'复制成功':'复制全部'}
        </Button>
      )}
      {!isEditing && onDuplicate && (
        <Button onClick={onDuplicate} variant="outline" size="sm" className={duplicateStatus==='success'?'border-green-500 text-green-700':''}>
          {duplicateStatus==='success'?<Check className="w-4 h-4" />:<Files className="w-4 h-4" />}
          {duplicateStatus==='success'?'已生成副本':'生成副本'}
        </Button>
      )}
    </div>
  );
}
