"use client"

import React, { useState, useRef } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { Tag, COLOR_THEMES, getColorTheme } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateId } from '@/lib/utils';

// 标签管理组件属性
interface TagManagerProps {
  tags: Tag[];
  selectedTags: Tag[];
  availableTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
  isEditing?: boolean;
}

// 标签管理组件
export function TagManager({ 
  tags, 
  selectedTags, 
  availableTags, 
  onTagsChange, 
  onCreateTag,
  isEditing = false 
}: TagManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 添加已存在的标签
  const addExistingTag = (tag: Tag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    setShowDropdown(false);
  };

  // 创建新标签（不立即保存到数据库）
  const createNewTag = () => {
    if (!newTagName.trim()) return;
    
    // 检查是否已存在同名标签
    const existingTag = availableTags.find(
      tag => tag.name.toLowerCase() === newTagName.toLowerCase()
    );
    
    if (existingTag) {
      addExistingTag(existingTag);
      setNewTagName('');
      setIsCreating(false);
      return;
    }

    // 随机选择颜色主题
    const randomTheme = COLOR_THEMES[Math.floor(Math.random() * COLOR_THEMES.length)];
    const randomColor = randomTheme.name;
    
    // 创建临时标签对象（使用临时ID）
    const newTag: Tag = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newTagName.trim(),
      color: randomColor
    };
    
    onTagsChange([...selectedTags, newTag]);
    setNewTagName('');
    setIsCreating(false);
  };

  // 删除标签
  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  // 获取可选择的标签（排除已选择的）
  const selectableTags = (availableTags || []).filter(
    tag => !selectedTags.find(selected => selected.id === tag.id)
  );

  return (
    <div className="space-y-3">
      {/* 已选择的标签 */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => {
          const tagTheme = getColorTheme(tag.color);
          return (
            <div
              key={tag.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-sm border"
              style={{ 
                backgroundColor: tagTheme.bg,
                color: tagTheme.text,
                borderColor: tagTheme.text
              }}
            >
              <span>{tag.name}</span>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTag(tag.id)}
                  className="ml-1 h-auto p-0.5 hover:bg-black/10"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* 添加标签区域 */}
      {isEditing && (
        <div className="space-y-2">
          {/* 创建新标签输入框 */}
          {isCreating ? (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入标签名称"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createNewTag();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewTagName('');
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={createNewTag}
                disabled={!newTagName.trim()}
              >
                确定
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewTagName('');
                }}
              >
                取消
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {/* 选择已有标签按钮 */}
              {selectableTags.length > 0 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1"
                  >
                    选择标签
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  
                  {/* 标签下拉列表 */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-background border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {selectableTags.map((tag) => {
                        const tagTheme = getColorTheme(tag.color);
                        return (
                          <Button
                            key={tag.id}
                            variant="ghost"
                            onClick={() => addExistingTag(tag)}
                            className="w-full justify-start px-3 py-2 h-auto font-normal"
                          >
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ 
                                backgroundColor: tagTheme.bg,
                                borderColor: tagTheme.text
                              }}
                            />
                            <span className="text-sm">{tag.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* 创建新标签按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                新建标签
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}