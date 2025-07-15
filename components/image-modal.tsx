"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Edit3, Save, X, Plus, FileImage, Calendar, Tag as TagIcon, Copy, Check, Trash2, Files, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageData, Prompt, Tag, PROMPT_COLORS } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PromptBlock } from './prompt-block';
import { TagManager } from './tag-manager';
import { toast } from 'sonner';
import { formatDate, formatFileSize, generateId, copyToClipboard } from '@/lib/utils';

const MODAL_STYLES = {
  dialog: "w-[95vw] max-w-7xl h-[90vh] p-0 rounded-2xl",
  content: "grid grid-cols-1 md:grid-cols-2 h-full overflow-hidden",
  imageArea: "bg-gray-50 flex items-center justify-center p-4 md:p-6 overflow-hidden",
  image: "max-w-full max-h-full object-contain rounded-xl shadow-2xl",
  imagePlaceholder: "flex flex-col items-center justify-center text-center p-8",
  infoArea: "bg-white p-6 md:p-8 flex flex-col overflow-y-auto",
  promptArea: "flex-grow mb-6",
  promptHeader: "flex items-center justify-between mb-4",
  promptList: "space-y-3",
  tagArea: "mt-auto pt-6 border-t border-gray-100",
  tagSection: "flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3",
  buttonArea: "flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100",
};

// 图片弹窗组件属性
interface ImageModalProps {
  image: ImageData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ImageData>) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (image: ImageData) => void;
  availableTags: Tag[];
  onCreateTag: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
  onCopyPrompt?: (content: string) => void;
  isPanel?: boolean;
  images?: ImageData[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onSelectImage?: (image: ImageData) => void;
}

// 图片详情弹窗组件
export function ImageModal({
  image,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  availableTags,
  onCreateTag,
  onCopyPrompt,
  isPanel = false,
  images = [],
  currentIndex = -1,
  onNavigate,
  onSelectImage
}: ImageModalProps) {

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [copyAllStatus, setCopyAllStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'confirming' | 'deleting'>('idle');
  const [duplicateStatus, setDuplicateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 初始化数据
  useEffect(() => {
    if (image && isOpen) {
      setEditedTitle(image.title);
      setPrompts([...image.prompts]);
      setTags([...image.tags]);
      setIsEditing(false);
    }
  }, [image, isOpen]);

  // 保存更改
  const saveChanges = async () => {
    if (!image) return;

    try {
      const updateData = {
        title: editedTitle,
        prompts: prompts,
        tags: tags
      };
      
      await onUpdate(image.id, updateData);
      toast.success('保存成功');
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    if (image) {
      setEditedTitle(image.title);
      setPrompts([...image.prompts]);
      setTags([...image.tags]);
    }
    setIsEditing(false);
  };

  // 添加提示词
  const addPrompt = () => {
    const newPrompt: Prompt = {
      id: generateId(),
      title: '',
      content: '',
      color: PROMPT_COLORS[Math.floor(Math.random() * PROMPT_COLORS.length)],
      order: prompts.length,
      createdAt: new Date().toISOString()
    };
    setPrompts([...prompts, newPrompt]);
  };

  // 更新提示词
  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setPrompts(prompts.map(prompt => 
      prompt.id === id ? { ...prompt, ...updates } : prompt
    ));
  };

  // 删除提示词
  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter(prompt => prompt.id !== id));
  };

  // 处理拖拽结束
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPrompts((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 复制全部提示词
  const copyAllPrompts = async () => {
    if (prompts.length === 0) {
      toast.error('没有提示词可复制');
      return;
    }

    const allPromptsText = prompts.map(p => p.content).filter(Boolean).join('\n\n');
    
    if (!allPromptsText.trim()) {
      toast.error('没有有效的提示词内容');
      return;
    }

    try {
      setCopyAllStatus('success');
      await copyToClipboard(allPromptsText);
      toast.success('所有提示词已复制到剪贴板');
      
      if (onCopyPrompt) {
        onCopyPrompt(allPromptsText);
      }
    } catch (error) {
      setCopyAllStatus('error');
      toast.error('复制失败，请重试');
    }

    setTimeout(() => setCopyAllStatus('idle'), 2000);
  };

  // 删除图片
  const handleDelete = async () => {
    if (!image || !onDelete) return;

    if (deleteStatus === 'idle') {
      setDeleteStatus('confirming');
      return;
    }

    if (deleteStatus === 'confirming') {
      try {
        setDeleteStatus('deleting');
        await onDelete(image.id);
        toast.success('图片已删除');
        onClose();
      } catch (error) {
        console.error('删除失败:', error);
        toast.error('删除失败，请重试');
        setDeleteStatus('idle');
      }
    }
  };

  // 复制图片
  const handleDuplicate = async () => {
    if (!image || !onDuplicate) return;

    try {
      setDuplicateStatus('success');
      await onDuplicate(image);
      toast.success('图片已复制');
    } catch (error) {
      setDuplicateStatus('error');
      console.error('复制失败:', error);
      toast.error('复制失败，请重试');
    } finally {
      setTimeout(() => setDuplicateStatus('idle'), 2000);
    }
  };

  // 重置状态当弹窗关闭时
  useEffect(() => {
    if (!isOpen) {
      setDeleteStatus('idle');
      setDuplicateStatus('idle');
    }
  }, [isOpen]);

  // ESC键退出功能
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!image) return null;

  // 面板模式的内容
  const panelContent = (
    <div className="h-full w-full flex flex-col rounded-3xl bg-white p-6 gap-4">
      {/* 上部分：左右两栏 */}
      <div className="flex-1 flex gap-4 max-h-[calc(100vh-12rem)] overflow-hidden">
        {/* 左栏：图片预览区域 - 50% */}
        <div className="w-[50%] flex items-center  justify-center bg-gray-50 rounded-2xl p-10 relative overflow-hidden">
          {/* 返回按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 left-4 z-10 bg-white hover:bg-white shadow-lg"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            
          </Button>
          <div className="w-full h-full flex items-center justify-center">
            {image.url ? (
              <img
                src={image.url}
                alt={image.title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <FileImage className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">暂无图片</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 右栏：详情信息 - 50% */}
        <div className="w-[50%] overflow-y-auto p-6 max-h-full flex flex-col">

           {/* 按钮区域 */}
        <div className="flex items-center justify-end gap-3 mb-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={cancelEdit}>
                取消
              </Button>
              <Button onClick={saveChanges}>
                <Save className="w-4 h-4 mr-1" />
                保存
              </Button>
            </>
          ) : (
            <>
              {prompts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllPrompts}
                  disabled={copyAllStatus !== 'idle'}
                >
                  {copyAllStatus === 'success' ? (
                    <Check className="w-4 h-4 mr-1 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copyAllStatus === 'success' ? '已复制' : '复制全部'}
                </Button>
              )}
              
              {onDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicate}
                  disabled={duplicateStatus !== 'idle'}
                >
                  {duplicateStatus === 'success' ? (
                    <Check className="w-4 h-4 mr-1 text-green-600" />
                  ) : (
                    <Files className="w-4 h-4 mr-1" />
                  )}
                  {duplicateStatus === 'success' ? '已复制' : '复制图片'}
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant={deleteStatus === 'confirming' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteStatus === 'deleting'}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {deleteStatus === 'confirming' ? '确认删除' : '删除'}
                </Button>
              )}
              
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-1" />
                编辑
              </Button>
            </>
          )}
        </div>
        {/* 标题编辑区域
        <div className="mb-4">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="输入图片标题"
              className="text-lg font-semibold"
            />
          ) : (
            <h3 className="text-lg font-semibold break-words whitespace-pre-wrap">{image.title || 'Untitled'}</h3>
          )}
        </div> */}
        
        
        
        {/* 提示词管理区域 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Prompts</h4>
            {isEditing && (
              <Button size="sm" variant="outline" onClick={addPrompt}>
                <Plus className="w-4 h-4 mr-1" />
                添加
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={prompts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {prompts.map((prompt) => (
                  <PromptBlock
                    key={prompt.id}
                    prompt={prompt}
                    isEditing={isEditing}
                    onUpdate={updatePrompt}
                    onDelete={deletePrompt}
                    onCopy={onCopyPrompt || (() => {})}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {prompts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>暂无提示词</p>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addPrompt}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加第一个提示词
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
     

        {/* 标签区域 */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <TagIcon className="w-5 h-5" />
            <span>Tags</span>
          </div>
          
          <TagManager
            tags={tags}
            selectedTags={tags}
            availableTags={availableTags}
            onTagsChange={setTags}
            onCreateTag={onCreateTag}
            isEditing={isEditing}
          />
        </div>

          {/* 图片信息 */}
        <div className="mb-4 text-sm text-gray-500 space-y-1 mt-10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(new Date(image.createdAt))}</span>
          </div>
        </div>
        </div>
      </div>
      
      {/* 底部：相邻图片缩略图通栏 */}
      <div className="h-32 overflow-x-auto p-4 bg-gray-50 rounded-2xl">
       
        <div className="flex gap-4 h-full">
          {images && images.length > 0 ? (
            images.map((img, index) => (
              <div
                key={img.id}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  img.id === image.id 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  if (img.id !== image.id && onSelectImage) {
                    onSelectImage(img);
                  }
                }}
              >
                <div className="w-20 h-20">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <FileImage className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                {img.id === image.id && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded">当前</div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <p>暂无其他图片</p>
            </div>
          )}
          
          {/* 导航按钮 */}
          {images && images.length > 1 && onNavigate && (
            <div className="flex flex-col gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 如果是面板模式，直接返回面板内容
  if (isPanel) {
    return panelContent;
  }

  // 弹窗模式
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className={MODAL_STYLES.dialog}>
            <div className={MODAL_STYLES.content}>
              {/* 关闭按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* 图片区域 */}
              <div className={MODAL_STYLES.imageArea}>
                {image?.url ? (
                  <img
                    src={image.url}
                    alt={image.title || 'Image'}
                    className={MODAL_STYLES.image}
                  />
                ) : (
                  <div className={MODAL_STYLES.imagePlaceholder}>
                    <FileImage className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-500">图片加载中...</p>
                  </div>
                )}
              </div>

              {/* 信息区域 */}
              <div className={MODAL_STYLES.infoArea}>
                {/* 提示词管理区域 */}
                <div className={MODAL_STYLES.promptArea}>
                  <div className={MODAL_STYLES.promptHeader}>
                    <h3 className="text-xl font-semibold text-gray-800">提示词</h3>
                    {!isEditing && (
                      <Button size="sm" variant="outline" onClick={addPrompt}>
                        <Plus className="w-4 h-4 mr-1" />
                        添加
                      </Button>
                    )}
                  </div>

                  <div className={`${MODAL_STYLES.promptList} -mr-3 pr-3`}>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={prompts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {prompts.map((prompt) => (
                          <PromptBlock
                             key={prompt.id}
                             prompt={prompt}
                             isEditing={isEditing}
                             onUpdate={updatePrompt}
                             onDelete={deletePrompt}
                             onCopy={onCopyPrompt || (() => {})}
                           />
                        ))}
                      </SortableContext>
                    </DndContext>

                    {prompts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>暂无提示词</p>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={addPrompt}
                            className="mt-2"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            添加第一个提示词
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 标签区域 */}
                <div className={MODAL_STYLES.tagArea}>
                  <div className={MODAL_STYLES.tagSection}>
                    <TagIcon className="w-5 h-5" />
                    <span>Tags</span>
                  </div>
                  
                  <TagManager
                     tags={tags}
                     selectedTags={tags}
                     availableTags={availableTags}
                     onTagsChange={setTags}
                     onCreateTag={onCreateTag}
                     isEditing={isEditing}
                   />
                </div>

                {/* 按钮区域 */}
                <div className={MODAL_STYLES.buttonArea}>
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={cancelEdit}>
                        取消
                      </Button>
                      <Button onClick={saveChanges}>
                        <Save className="w-4 h-4 mr-1" />
                        保存
                      </Button>
                    </>
                  ) : (
                    <>
                      {prompts.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyAllPrompts}
                          disabled={copyAllStatus !== 'idle'}
                        >
                          {copyAllStatus === 'success' ? (
                            <Check className="w-4 h-4 mr-1 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          {copyAllStatus === 'success' ? '已复制' : '复制全部'}
                        </Button>
                      )}
                      
                      {onDuplicate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDuplicate}
                          disabled={duplicateStatus !== 'idle'}
                        >
                          {duplicateStatus === 'success' ? (
                            <Check className="w-4 h-4 mr-1 text-green-600" />
                          ) : (
                            <Files className="w-4 h-4 mr-1" />
                          )}
                          {duplicateStatus === 'success' ? '已复制' : '复制图片'}
                        </Button>
                      )}
                      
                      {onDelete && (
                        <Button
                          variant={deleteStatus === 'confirming' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={handleDelete}
                          disabled={deleteStatus === 'deleting'}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deleteStatus === 'confirming' ? '确认删除' : '删除'}
                        </Button>
                      )}
                      
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit3 className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    );
}