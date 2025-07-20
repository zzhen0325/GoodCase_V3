'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, FileImage, Plus, Search, FolderOpen, Folder, Tag as TagIcon, Check } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { ImageData, PromptBlock, Tag, TagGroup, getColorTheme } from '@/types';
import { PromptBlock as PromptBlockComponent } from './prompt-block';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { generateId } from '@/lib/utils';
import { ImageStorageService } from '@/lib/image-storage';
import { DndContext, useDroppable, DragEndEvent } from '@dnd-kit/core';

// 上传图片弹窗组件属性
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (
    file: File,
    imageName: string,
    prompts: PromptBlock[],
    tagIds?: string[]
  ) => Promise<void>;
}

// 创建标签表单组件
interface CreateTagFormProps {
  searchQuery: string;
  tagGroups: TagGroup[];
  onConfirm: (data: { name: string; categoryId?: string }) => void;
  onCancel: () => void;
  onCreateCategory: () => void;
  selectedTagIds?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  tags?: Tag[];
  onRefetch?: () => void;
}

function CreateTagForm({ searchQuery, tagGroups, onConfirm, onCancel, onCreateCategory, selectedTagIds = [], onTagsChange, tags = [], onRefetch }: CreateTagFormProps) {
  const [name, setName] = React.useState(searchQuery);
  const [categoryId, setCategoryId] = React.useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const { createTagGroup, createTag } = useTagOperations();

  React.useEffect(() => {
    if (tagGroups.length > 0) {
      setCategoryId(tagGroups[0].id);
    } else {
      setCategoryId('');
    }
  }, [tagGroups]);

  const handleSubmit = async () => {
    if (name.trim()) {
      let finalCategoryId = categoryId;
      
      // 如果选择的是新分类，先创建分类
      if (categoryId && categoryId.startsWith('new:')) {
        const newCategoryName = categoryId.replace('new:', '');
        try {
          const result = await createTagGroup({ name: newCategoryName });
          if (result.success) {
            // 使用新创建的分类ID
            finalCategoryId = result.tagGroup?.id || undefined;
          } else {
            toast.error(result.error || '创建分类失败');
            return;
          }
        } catch (error) {
          console.error('创建分类失败:', error);
          toast.error('创建分类失败');
          return;
        }
      }
      
      // 创建标签
      try {
        const availableColors = ['pink', 'cyan', 'yellow', 'green', 'purple'];
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        
        const result = await createTag({
          name: name.trim(),
          color: randomColor,
          categoryId: finalCategoryId || undefined
        });
        
        if (result.success) {
          // 刷新标签列表
          if (onRefetch) {
            onRefetch();
          }
          
          // 如果提供了onTagsChange函数，自动添加新标签到图片
          if (onTagsChange && result.tag) {
            const newTagId = result.tag.id;
            if (!selectedTagIds.includes(newTagId)) {
              onTagsChange([...selectedTagIds, newTagId]);
            }
          }
          
          toast.success('标签创建成功并已添加到图片');
          onCancel();
        } else {
          toast.error(result.error || '创建标签失败');
        }
      } catch (error) {
        console.error('创建标签失败:', error);
        toast.error('创建标签失败');
      }
    }
  };

  const handleCreateNewCategory = () => {
    setShowNewCategoryInput(true);
  };

  const handleConfirmNewCategory = () => {
    if (newCategoryName.trim()) {
      // 只是确认新分类名称，不立即创建
      setShowNewCategoryInput(false);
      // 将新分类名称设置为当前选中的分类ID（临时标记）
      setCategoryId(`new:${newCategoryName.trim()}`);
    }
  };

  const handleCancelNewCategory = () => {
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    // 如果当前选中的是新分类，重置为第一个现有分类
    if (categoryId && categoryId.startsWith('new:')) {
      setCategoryId(tagGroups.length > 0 ? tagGroups[0].id : '');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3 mt-6">
          <TagIcon className="w-4 h-4 text-accent-foreground" />
          <Label htmlFor="tag-name" className="text-sm font-medium">
            标签名称
          </Label>
        </div>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入标签名称"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Folder className="w-4 h-4 text-accent-foreground" />
          <Label htmlFor="tag-category" className="text-sm font-medium">
            所属分类
          </Label>
        </div>
        {!showNewCategoryInput ? (
          // 显示现有分类选择
          tagGroups.length > 0 ? (
            <div className="space-y-3">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                  
                    <SelectValue placeholder="选择分类" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {tagGroups.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {categoryId && categoryId.startsWith('new:') && (
                    <SelectItem value={categoryId}>
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>新分类: {categoryId.replace('new:', '')}</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateNewCategory}
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建新分类
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-full p-3 border rounded-md bg-muted text-muted-foreground text-sm flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span>暂无分类，标签将创建为未分类状态</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateNewCategory}
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建新分类
              </Button>
            </div>
          )
        ) : (
          // 显示创建新分类输入框
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <Label htmlFor="new-category-name" className="text-sm font-medium">
                创建新分类
              </Label>
            </div>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="输入新分类名称"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmNewCategory();
                } else if (e.key === 'Escape') {
                  handleCancelNewCategory();
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelNewCategory}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                取消
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmNewCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                确认
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 ">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex items-center gap-2 px-5"
        >
          <X className="w-4 h-4" />
          取消
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!name?.trim()}
          className="flex items-center gap-2 px-5"
        >
          <Plus className="w-4 h-4" />
          创建标签
        </Button>
      </div>
    </div>
  );
}

// 标签选择下拉组件
interface TagSelectorDropdownProps {
  tags: Tag[];
  tagGroups: TagGroup[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch?: () => void;
}

function TagSelectorDropdown({
  tags,
  tagGroups,
  selectedTagIds,
  onTagsChange,
  open,
  onOpenChange,
  onRefetch,
}: TagSelectorDropdownProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreateTagDialog, setShowCreateTagDialog] = React.useState(false);
  const { createTag, createTagGroup } = useTagOperations();

  // 按分类聚合标签
  const groupedTags = React.useMemo(() => {
    const grouped: { [key: string]: { group: TagGroup | null; tags: Tag[] } } = {};
    
    // 添加未分类组
    grouped['uncategorized'] = { group: null, tags: [] };
    
    // 初始化分类组
    tagGroups.forEach(group => {
      grouped[group.id] = { group, tags: [] };
    });
    
    // 分配标签到对应分类
    tags.forEach(tag => {
      const groupKey = tag.categoryId || 'uncategorized';
      if (grouped[groupKey]) {
        grouped[groupKey].tags.push(tag);
      } else {
        grouped['uncategorized'].tags.push(tag);
      }
    });
    
    return grouped;
  }, [tags, tagGroups]);

  // 过滤标签
  const filteredGroupedTags = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedTags;
    
    const filtered: typeof groupedTags = {};
    Object.entries(groupedTags).forEach(([key, { group, tags }]) => {
      const filteredTags = tags.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredTags.length > 0) {
        filtered[key] = { group, tags: filteredTags };
      }
    });
    
    return filtered;
  }, [groupedTags, searchQuery]);

  // 检查是否有匹配的标签
  const hasMatchingTags = React.useMemo(() => {
    return Object.values(filteredGroupedTags).some(({ tags }) => tags.length > 0);
  }, [filteredGroupedTags]);

  // 检查搜索的标签是否已存在
  const searchTagExists = React.useMemo(() => {
    if (!searchQuery.trim()) return false;
    return tags.some(tag => tag.name.toLowerCase() === searchQuery.toLowerCase());
  }, [tags, searchQuery]);

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (!searchQuery.trim() || searchTagExists) return;
    setShowCreateTagDialog(true);
  };

  const handleCreateTagConfirm = async (data: { name: string; categoryId?: string }) => {
    // 这个函数现在不再需要，因为CreateTagForm直接处理创建逻辑
    // 保留为空函数以保持接口兼容性
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <TagIcon className="w-4 h-4" />
            Add Tag
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-96 overflow-x-hidden" onCloseAutoFocus={(e) => e.preventDefault()}>
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto">
            {/* 显示创建新标签选项 */}
            {searchQuery.trim() && !searchTagExists && !hasMatchingTags && (
              <div>
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                  创建新标签
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleCreateTag}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>创建 "{searchQuery.trim()}"</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
            )}
            
            {Object.entries(filteredGroupedTags).map(([key, { group, tags }]) => {
              if (tags.length === 0) return null;
              
              return (
                <div key={key}>
                  {group && (
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                      {group.name}
                    </DropdownMenuLabel>
                  )}
                  {!group && tags.length > 0 && (
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                      未分类
                    </DropdownMenuLabel>
                  )}
                  {tags.map((tag) => (
                     <DropdownMenuCheckboxItem
                       key={tag.id}
                       checked={selectedTagIds.includes(tag.id)}
                       onCheckedChange={() => handleTagToggle(tag.id)}
                       onSelect={(e) => e.preventDefault()}
                       className="cursor-pointer whitespace-normal break-words"
                     >
                       <span className="break-words">{tag.name}</span>
                     </DropdownMenuCheckboxItem>
                   ))}
                  {key !== 'uncategorized' && <DropdownMenuSeparator />}
                </div>
              );
            })}
            
            {/* 当搜索有结果但没有完全匹配时，也显示创建选项 */}
            {searchQuery.trim() && !searchTagExists && hasMatchingTags && (
              <div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                  创建新标签
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleCreateTag}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>创建 "{searchQuery.trim()}"</span>
                </DropdownMenuItem>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* 创建标签对话框 */}
      <Dialog open={showCreateTagDialog} onOpenChange={setShowCreateTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建标签</DialogTitle>
          </DialogHeader>
          <CreateTagForm
            searchQuery={searchQuery}
            tagGroups={tagGroups}
            onConfirm={handleCreateTagConfirm}
            onCancel={() => setShowCreateTagDialog(false)}
            onCreateCategory={() => {
              setShowCreateTagDialog(false);
            }}
            selectedTagIds={selectedTagIds}
            onTagsChange={onTagsChange}
            tags={tags}
            onRefetch={onRefetch}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// 上传图片弹窗组件
export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [imageName, setImageName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<PromptBlock[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isEditingPrompts, setIsEditingPrompts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 标签相关状态
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  
  // 使用与image-modal.tsx相同的useTagOperations hook
  const { tags, tagGroups, refreshAll } = useTagOperations();

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // 使用 dnd-kit 的 droppable 区域
  const { setNodeRef, isOver } = useDroppable({
    id: 'file-upload-zone',
    data: {
      accepts: ['file'],
    },
  });

  // 处理文件上传
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) {
      await processFile(fileArray[0]);
    }
  };

  // 监听拖拽状态
  React.useEffect(() => {
    setDragActive(isOver);
  }, [isOver]);

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'file-upload-zone') {
      // 这里可以处理文件拖拽到上传区域的逻辑
      // 由于我们主要是为了统一使用 dnd-kit，实际的文件处理仍然通过文件选择器
      console.log('File dragged to upload zone');
    }
  };

  // 将文件转换为base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 创建默认提示词
  const createDefaultPrompts = (): PromptBlock[] => {
    return ['风格', '主体', '场景'].map((text, index) => ({
      id: generateId(),
      title: text,
      content: '',
      color: 'default'
    }));
  };

  // 处理文件
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setSelectedFile(file);
      setPreviewUrl(base64);
      setImageName(file.name.split('.').slice(0, -1).join('.'));

      if (prompts.length === 0) {
        setPrompts(createDefaultPrompts());
      }
    } catch (error) {
      console.error('文件处理失败:', error);
      alert('文件处理失败，请重试');
    }
  };

  // 触发文件选择对话框
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 清除选择的文件
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 处理上传
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('请选择图片文件');
      return;
    }

    if (!imageName.trim()) {
      toast.error('图片名称不能为空');
      return;
    }

    try {
      setIsUploading(true);

      // 立即关闭弹窗并重置表单
      const uploadData = {
        file: selectedFile,
        imageName: imageName.trim(),
        prompts: prompts,
      };

      resetForm();
      onClose();

      // 开始后台上传，传递上传数据
      await onUpload(uploadData.file, uploadData.imageName, uploadData.prompts, selectedTagIds);
    } catch (error) {
      console.error('上传失败:', error);
      toast.error(
        '上传失败: ' +
          (error instanceof Error ? error.message : '请检查网络连接后重试')
      );
    } finally {
      setIsUploading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setImageName('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrompts([]);
    setIsEditingPrompts(true);
    setSelectedTagIds([]);
    setTagDropdownOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 关闭弹窗时重置表单
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 添加新提示词
  const addPrompt = () => {
    const newPrompt: PromptBlock = {
      id: generateId(),
      title: '新提示词',
      content: '',
      color: 'default'
    };
    setPrompts([...prompts, newPrompt]);
  };

  // 更新提示词
  const updatePrompt = (id: string, updates: Partial<PromptBlock>) => {
    setPrompts(
      prompts.map((prompt) =>
        prompt.id === id
          ? { ...prompt, ...updates }
          : prompt
      )
    );
  };

  // 删除提示词
  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter((prompt) => prompt.id !== id));
  };

  // 复制提示词内容
  const copyPromptContent = (content: string) => {
    // 这里可以添加复制成功的提示
    console.log('复制提示词:', content);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[70vw] h-[75vh] p-0 flex flex-col rounded-2xl overflow-hidden gap-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
        <DndContext onDragEnd={handleDragEnd}>
          {/* 顶部标题区域 */}
          <DialogHeader className="p-6 border-b">
            <div className="flex items-center gap-4">
              {/* 标题 - 中间 */}
              <DialogTitle className="text-lg font-semibold truncate flex-1">
                上传图片
              </DialogTitle>
              
              {/* 操作按钮区域 - 最右侧 */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addPrompt}
                  disabled={!selectedFile}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Prompt
                </Button>
                <TagSelectorDropdown
                  tags={tags}
                  tagGroups={tagGroups}
                  selectedTagIds={selectedTagIds}
                  onTagsChange={setSelectedTagIds}
                  open={tagDropdownOpen}
                  onOpenChange={setTagDropdownOpen}
                  onRefetch={refreshAll}
                />
                
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button
                  onClick={handleUpload} 
                  className="bg-black px-4 hover:bg-gray-800 text-white rounded-xl"
                  disabled={!selectedFile || !imageName.trim() || isUploading}
                  size="sm"
                >
                  {isUploading ? '上传中...' : '提交'}
                </Button>
              </div>
            </div>
            <DialogDescription className="sr-only">
              上传图片并添加相关信息，包括图片名称、提示词和标签
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-full">
            {/* 图片预览区域 - 35% */}
            <div className="w-[45%] min-w-0">
              <div className="h-full flex flex-col">
                {/* 拖放区域 */}
                <div className="flex-1 p-6">
                  <div
                    ref={setNodeRef}
                    className={`
                    h-[calc(75vh-150px)] max-h-[calc(75vh-150px)] border-2 border-dashed rounded-lg
                    flex flex-col items-center justify-center
                    transition-colors duration-200
                    ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
                    ${selectedFile ? 'bg-background' : 'bg-muted/30'}
                  `}
                  >
                    {selectedFile && previewUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img
                          src={previewUrl}
                          alt="预览"
                          className="max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] object-contain rounded-md"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={clearSelectedFile}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <div className="mb-4 bg-accent p-4 rounded-full inline-block">
                          <Upload className="w-6 h-6 text-black" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">拖放图片到此处</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          支持 JPG, PNG, GIF 等常见图片格式
                        </p>
                        <Button onClick={triggerFileInput} className="bg-black px-4 hover:bg-gray-800 text-white rounded-xl">
                          <FileImage className="w-4 h-4 mr-2" />
                          选择图片
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 信息面板区域 - 65% */}
            <div className="w-[55%] border-l bg-background flex flex-col">
              {/* 提示词管理区域 */}
              <div className="flex-1 flex flex-col min-h-0 max-h-[calc(75vh-220px)]">
                {/* 提示词滚动区域 */}
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 pt-4 space-y-4">
                      {/* 提示词列表 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-md font-medium text-black">
                            Prompts
                          </label>
                        </div>

                        <div className="space-y-3">
                          {prompts.map((prompt) => (
                            <PromptBlockComponent
                              key={prompt.id}
                              prompt={{
                                id: prompt.id,
                                title: prompt.title || '新提示词',
                                content: prompt.content || '',
                                color: prompt.color || 'default'
                              }}
                              isEditing={isEditingPrompts}
                              onUpdate={(id, updates) => {
                                updatePrompt(id, {
                                  title: updates.title,
                                  content: updates.content,
                                  color: updates.color
                                });
                              }}
                              onDelete={deletePrompt}
                              onCopy={copyPromptContent}
                            />
                          ))}
                        </div>

                        {prompts.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">暂无提示词</p>
                            <p className="text-xs mt-1">点击上方按钮添加提示词</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* 底部标签信息区域 */}
              {selectedTagIds.length > 0 && (
                <div className="border-t">
                  <div className="p-6">
                    <label className="text-sm font-medium text-muted-foreground mb-3 block">
                      已选择标签
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTagIds.map((tagId) => {
                        const tag = tags.find((t: Tag) => t.id === tagId);
                        const tagGroup = tag ? tagGroups.find(g => g.id === tag.categoryId) : null;
                        const colorTheme = tagGroup ? getColorTheme(tagGroup.color || 'gray') : getColorTheme('gray');
                        return (
                          <Badge 
                            key={tagId} 
                            variant="secondary" 
                            className="text-xs border"
                            style={{
                              backgroundColor: colorTheme.bg,
                              borderColor: colorTheme.primary,
                              color: colorTheme.text
                            }}
                          >
                            {tag?.name || `Tag ${tagId}`}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DndContext>
      </DialogContent>
    </Dialog>
  );
}
