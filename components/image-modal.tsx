"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Edit3, Save, X, Plus, FileImage, Calendar, Tag as TagIcon, Copy, Check, Trash2, Files } from 'lucide-react';
import { ImageData, Prompt, Tag, PROMPT_COLORS } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PromptBlock } from './prompt-block';
import { TagManager } from './tag-manager';
import { useToastContext } from '@/components/toast-provider';
import { formatDate, formatFileSize, generateId, copyToClipboard } from '@/lib/utils';

// 弹窗样式配置 - 简化布局，避免覆盖问题
const MODAL_STYLES = {
  // 弹窗容器 - 2xl圆角，隐藏默认关闭按钮
  dialog: "w-[90vw] max-w-6xl h-[85vh] p-0 rounded-2xl [&>button]:hidden",

  // 主内容区域（左右分栏1:1）
  content: "flex flex-1 min-h-0 h-full",

  // 图片区域（左侧）
  imageArea: "flex-1 p-6 flex items-center justify-center bg-muted/20",
  image: "max-w-full max-h-full object-contain rounded-lg shadow-lg",
  imagePlaceholder: "text-center",

  // 信息区域（右侧）
  infoArea: "flex-1 p-8 border-l bg-background overflow-y-auto flex flex-col relative",

  // 提示词区域
  promptArea: "flex flex-col h-auto mb-4 ",
  promptHeader: "flex items-center justify-between mb-3 text-black",
  promptList: "h-auto overflow-y-auto -mr-3 pr-3 max-h-[60vh] ",
  
  // 标签区域
  tagArea: "mb-6",
  tagSection: "flex items-center gap-2 text-xl font-bold text-black mb-2 mt-6 ",  

  // 底部按钮区域
  buttonArea: "flex items-center justify-end gap-2 mt-auto pt-4 border-t"
};

// 图片详情弹窗组件属性
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
  onCopyPrompt
}: ImageModalProps) {
  const { toast } = useToastContext();
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
      setIsEditing(false); // 重置编辑状态
    }
  }, [image, isOpen]);

  // 保存更改
  const saveChanges = async () => {
    if (!image) return;

    const toastId = toast.loading('保存中...', '正在更新图片信息');
    
    try {
      await onUpdate(image.id, {
        title: editedTitle,
        prompts: prompts,
        tags: tags
      });
      
      toast.resolve(toastId, '保存成功', '图片信息已更新');
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
      toast.reject(toastId, '保存失败', '请稍后重试');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    if (!image) return;

    setEditedTitle(image.title);
    setPrompts([...image.prompts]);
    setTags([...image.tags]);
    setIsEditing(false);
  };

  // 添加新提示词
  const addPrompt = () => {
    const newPrompt: Prompt = {
      id: generateId(),
      title: 'new',
      content: '',
      color: PROMPT_COLORS[Math.floor(Math.random() * PROMPT_COLORS.length)],
      order: prompts.length
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

    if (over && active.id !== over.id) {
      setPrompts((items) => {
        const oldIndex = items.findIndex(item => item.id === String(active.id));
        const newIndex = items.findIndex(item => item.id === String(over.id));

        const newItems = arrayMove(items, oldIndex, newIndex);
        // 更新order字段
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  // 复制全部提示词
  const copyAllPrompts = async () => {
    const allPromptsText = prompts
      .sort((a, b) => a.order - b.order)
      .map(prompt => prompt.content)
      .filter(content => content.trim())
      .join(', ');

    if (allPromptsText) {
      const success = await copyToClipboard(allPromptsText);
      if (success) {
        setCopyAllStatus('success');
        onCopyPrompt?.(allPromptsText);
        // 2秒后重置状态
        setTimeout(() => setCopyAllStatus('idle'), 2000);
      } else {
        setCopyAllStatus('error');
        // 2秒后重置状态
        setTimeout(() => setCopyAllStatus('idle'), 2000);
      }
    }
  };

  // 复制提示词回调
  const handleCopyPrompt = (content: string) => {
    onCopyPrompt?.(content);
  };

  // 删除图片
  const handleDelete = async () => {
    if (deleteStatus === 'idle') {
      setDeleteStatus('confirming');
      // 3秒后自动取消确认状态
      setTimeout(() => {
        setDeleteStatus(prev => prev === 'confirming' ? 'idle' : prev);
      }, 3000);
    } else if (deleteStatus === 'confirming') {
      if (image && onDelete) {
        setDeleteStatus('deleting');
        
        const toastId = toast.loading('删除中...', '正在删除图片');
        
        try {
          await onDelete(image.id);
          toast.resolve(toastId, '删除成功', '图片已从图库中移除');
          onClose();
        } catch (error) {
          console.error('删除失败:', error);
          toast.reject(toastId, '删除失败', '请稍后重试');
          setDeleteStatus('idle');
        }
      }
    }
  };

  // 复制图片
  const handleDuplicate = async () => {
    if (image && onDuplicate) {
      try {
        onDuplicate(image);
        setDuplicateStatus('success');
        // 复制成功后自动进入编辑模式
        setIsEditing(true);
        // 2秒后重置状态
        setTimeout(() => setDuplicateStatus('idle'), 2000);
      } catch (error) {
        setDuplicateStatus('error');
        // 2秒后重置状态
        setTimeout(() => setDuplicateStatus('idle'), 2000);
      }
    }
  };

  // 重置状态当弹窗关闭时
  useEffect(() => {
    if (!isOpen) {
      setDeleteStatus('idle');
      setDuplicateStatus('idle');
    }
  }, [isOpen]);

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={MODAL_STYLES.dialog}>
        {/* 主内容区域 - 左右分栏 */}
        <div className={MODAL_STYLES.content}>
          {/* 左侧 - 图片区域 */}
          <div className={MODAL_STYLES.imageArea}>
            {image.url ? (
              <img
                src={image.url}
                alt={image.title}
                className={MODAL_STYLES.image}
              />
            ) : (
              <div className={MODAL_STYLES.imagePlaceholder}>
                <FileImage className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无图片</p>
              </div>
            )}
          </div>

          {/* 右侧 - 信息区域 */}
          <div className={MODAL_STYLES.infoArea}>

            {/* 提示词管理区域 */}
            <div className={MODAL_STYLES.promptArea}>
              <div className={MODAL_STYLES.promptHeader}>
                <h3 className="text-xl font-bold text-bold">
                  Prompt 
                </h3>
                {isEditing && (
                  <Button size="sm" variant="outline" onClick={addPrompt}>
                    <Plus className="w-4 h-4 mr-1" />
                    添加
                  </Button>
                )}
              </div>

              <div className={MODAL_STYLES.promptList}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  accessibility={{
                    announcements: {
                      onDragStart: () => '',
                      onDragMove: () => '',
                      onDragOver: () => '',
                      onDragEnd: () => '',
                      onDragCancel: () => ''
                    }
                  }}
                >
                  <SortableContext
                    items={prompts.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {prompts
                        .sort((a, b) => a.order - b.order)
                        .map((prompt) => (
                          <PromptBlock
                            key={prompt.id}
                            prompt={prompt}
                            isEditing={isEditing}
                            onUpdate={updatePrompt}
                            onDelete={deletePrompt}
                            onCopy={handleCopyPrompt}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* 标签管理区域 */}
            <div className={MODAL_STYLES.tagArea}>
              <div className={MODAL_STYLES.tagSection}>
                
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

            {/* 底部按钮区域 */}
            <div className={MODAL_STYLES.buttonArea}>
              {isEditing ? (
                <>
                  {/* 删除按钮 - 只在编辑模式下显示 */}
                  <div className="relative mr-auto">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleDelete}
                      className={`transition-colors ${
                        deleteStatus === 'confirming' ? 'border-red-500 text-red-600 bg-red-50' :
                        deleteStatus === 'deleting' ? 'border-red-500 text-red-600' :
                        'hover:border-red-500 hover:text-red-600'
                      }`}
                      disabled={deleteStatus === 'deleting'}
                      title={
                        deleteStatus === 'confirming' ? '再次点击确认删除' :
                        deleteStatus === 'deleting' ? '删除中...' :
                        'Delete'
                      }
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deleteStatus === 'confirming' ? 'Confirm' : 'Delete'}
                    </Button>
                    {deleteStatus === 'confirming' && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-10 bg-red-500">
                        Confirming delete
                      </div>
                    )}
                  </div>

                  <Button size="sm" onClick={saveChanges}>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    取消
                  </Button>
                </>
              ) : (
                <>
                 {/* 编辑按钮 */}
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {/* 复制图片按钮 - 黑底白字 */}
                  <div className="relative">
                    <Button 
                      size="sm" 
                      onClick={handleDuplicate}
                      className={`bg-black text-white hover:bg-gray-800 border-black transition-colors ${
                        duplicateStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                        duplicateStatus === 'error' ? 'bg-red-600 hover:bg-red-700' :
                        ''
                      }`}
                      title={
                        duplicateStatus === 'success' ? 'Successful' :
                        duplicateStatus === 'error' ? 'Failed' :
                        '复制图片'
                      }
                    >
                      {duplicateStatus === 'success' ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : duplicateStatus === 'error' ? (
                        <X className="w-4 h-4 mr-1" />
                      ) : (
                        <Files className="w-4 h-4 mr-1" />
                      )}
                      Copy And Edit
                    </Button>
                    {duplicateStatus !== 'idle' && (
                      <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-10 ${
                        duplicateStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {duplicateStatus === 'success' ? '复制成功' : '复制失败'}
                      </div>
                    )}
                  </div>

                  {/* 复制提示词按钮 - 黑底白字 */}
                  <div className="relative">
                    <Button 
                      size="sm" 
                      onClick={copyAllPrompts}
                      className={`bg-black text-white hover:bg-gray-800 border-black transition-colors ${
                        copyAllStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                        copyAllStatus === 'error' ? 'bg-red-600 hover:bg-red-700' :
                        ''
                      }`}
                      title={
                        copyAllStatus === 'success' ? '复制成功' :
                        copyAllStatus === 'error' ? '复制失败' :
                        '复制全部提示词'
                      }
                    >
                      {copyAllStatus === 'success' ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : copyAllStatus === 'error' ? (
                        <X className="w-4 h-4 mr-1" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copy All Prompt
                    </Button>
                    {copyAllStatus !== 'idle' && (
                      <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-10 ${
                        copyAllStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {copyAllStatus === 'success' ? '复制成功' : '复制失败'}
                      </div>
                    )}
                  </div>

                 
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}