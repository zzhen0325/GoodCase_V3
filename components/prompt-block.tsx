'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Trash2, Palette, Check, X } from 'lucide-react';
import { type PromptBlock, COLOR_THEMES, getColorTheme, ThemeColor } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { copyToClipboard, cn } from '@/lib/utils/common';

// 提示词块组件属性
interface PromptBlockProps {
  promptBlock: {
    id: string;
    title?: string;
    content: string;
    color?: ThemeColor;
  };
  isEditing: boolean;
  onUpdate: (id: string, updates: { title?: string; content?: string; color?: ThemeColor }) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
  onEnterEditMode?: () => void;
  showDragHandle?: boolean;
  disabled?: boolean;
}

// 提示词块组件
export function PromptBlock({
  promptBlock,
  isEditing,
  onUpdate,
  onDelete,
  onCopy,
  onEnterEditMode,
  showDragHandle = false,
  disabled = false,
}: PromptBlockProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempTitle, setTempTitle] = useState(promptBlock.title || '新提示词');
  const [tempContent, setTempContent] = useState(promptBlock.content || '');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 同步 promptBlock 的变化到临时状态
  useEffect(() => {
    setTempTitle(promptBlock.title || '新提示词');
  }, [promptBlock.title]);

  useEffect(() => {
    setTempContent(promptBlock.content || '');
  }, [promptBlock.content]);

  useEffect(() => {
    if (isEditingContent && textAreaRef.current) {
      // 自动调整高度
      textAreaRef.current.style.height = 'auto';
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [isEditingContent, tempContent]);

  // 拖拽排序功能
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: promptBlock.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 保存标题
  const saveTitle = () => {
    onUpdate(promptBlock.id, { title: tempTitle });
    setIsEditingTitle(false);
  };

  // 保存内容
  const saveContent = () => {
    onUpdate(promptBlock.id, { content: tempContent });
    setIsEditingContent(false);
  };

  // 取消编辑
  const cancelTitleEdit = () => {
    setTempTitle(promptBlock.title || '新提示词');
    setIsEditingTitle(false);
  };

  const cancelContentEdit = () => {
    setTempContent(promptBlock.content || '');
    setIsEditingContent(false);
  };

  // 复制提示词
  const handleCopy = async () => {
    const success = await copyToClipboard(promptBlock.content);
    if (success) {
      setCopyStatus('success');
      onCopy(promptBlock.content);
      // 2秒后重置状态
      setTimeout(() => setCopyStatus('idle'), 2000);
    } else {
      setCopyStatus('error');
      // 2秒后重置状态
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // 更改颜色
  const changeColor = (colorName: ThemeColor) => {
    onUpdate(promptBlock.id, { color: colorName });
    setShowColorPicker(false);
  };

  // 获取当前颜色主题
  const currentTheme = getColorTheme((promptBlock.color as any) || 'pink');

  return (
    <div className="relative group">
      {/* 非编辑模式下的复制按钮 - 放在滚动容器外面 */}
      {!isEditing && (
        <div className="absolute top-7 right-2 z-[100] opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-100 scale-95">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-md transition-colors bg-white hover:bg-gray-50',
                copyStatus === 'success'
                  ? 'text-green-600 hover:text-green-700'
                  : copyStatus === 'error'
                    ? 'text-red-600 hover:text-red-700'
                    : 'text-gray-600 hover:text-gray-700'
              )}
              onClick={handleCopy}
              title={
                copyStatus === 'success'
                  ? '复制成功'
                  : copyStatus === 'error'
                    ? '复制失败'
                    : '复制'
              }
            >
              {copyStatus === 'success' ? (
                <Check className="h-3.5 w-3.5" />
              ) : copyStatus === 'error' ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* 状态提示 */}
            {copyStatus !== 'idle' && (
              <div
                className={cn(
                  'absolute -bottom-8 right-0 px-2 py-1 text-xs rounded shadow-lg z-20 whitespace-nowrap',
                  copyStatus === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                )}
              >
                {copyStatus === 'success' ? '复制成功' : '复制失败'}
              </div>
            )}
          </div>
        </div>
      )}

      <motion.div
        ref={setNodeRef}
        style={style}
        className={`relative group ${isDragging ? 'z-50 opacity-50' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        {...(isEditing ? attributes : {})}
        {...(isEditing ? listeners : {})}
      >
        {/* 标题和操作按钮区域 */}
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 min-w-0 mb-1">
            {isEditingTitle ? (
              <Input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') cancelTitleEdit();
                }}
                className="text-sm font-semibold h-4 px-2 border-0 bg-transparent"
                style={{ color: currentTheme.text }}
                autoFocus
              />
            ) : (
              <h5
                className="text-sm font-regular text-[#a8a1bf] cursor-pointer"
                title={promptBlock.title || '未命名提示词'}
                onDoubleClick={() => {
                  if (isEditing) {
                    setIsEditingTitle(true);
                  }
                }}
              >
                {promptBlock.title || '未命名提示词'}
              </h5>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isEditing && (
              <>
                <div key="color-picker" className="relative">
                  <Button
                    variant="ghost"
                    style={{ color: currentTheme.text }}
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="更改颜色"
                  >
                    <Palette className="h-3.5 w-3.5" />
                  </Button>

                  {/* 颜色选择器 */}
                  {showColorPicker && (
                    <div className="absolute top-full right-0 mt-1 p-3 bg-background border rounded-lg shadow-lg z-10 min-w-[200px]">
                      <div className="grid grid-cols-4 gap-2">
                        {COLOR_THEMES.map((theme) => (
                          <Button
                            key={theme.name}
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform flex items-center justify-center text-xs font-bold p-0"
                            style={{
                              backgroundColor: theme.colors.bg,
                              color: theme.colors.text,
                              borderColor:
                              promptBlock.color === theme.name
                                ? '#000'
                                : 'transparent',
                            }}
                            onClick={() => changeColor(theme.name as ThemeColor)}
                            title={theme.name}
                          >
                            {theme.name.charAt(0).toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  key="delete"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-destructive hover:text-destructive"
                  onClick={() => onDelete(promptBlock.id)}
                  title="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="w-full relative group">
          <Badge
            className={cn(
              'w-full p-4 rounded-2xl  transition-all duration-200 flex flex-col gap-3 ',
              isEditing ? 'cursor-grab active:cursor-grabbing' : ''
            )}
            style={{
              backgroundColor: currentTheme.bg,
              color: currentTheme.text,
            }}
          >
            {/* 内容区域 */}
            <div className="w-full relative">
              {isEditingContent ? (
                <Textarea
                  ref={textAreaRef}
                  rows={1}
                  value={tempContent}
                  onChange={(e) => setTempContent(e.target.value)}
                  onBlur={saveContent}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.ctrlKey) {
                        saveContent();
                      } else {
                        // 阻止普通回车键的默认行为，避免创建新行
                        e.preventDefault();
                        saveContent();
                      }
                    }
                    if (e.key === 'Escape') cancelContentEdit();
                  }}
                  className="w-full text-sm  resize-none overflow-hidden focus:outline-none focus:ring-0 break-words min-h-[60px] rounded-lg"
                  autoFocus
                  style={{
                    color: currentTheme.text,
                  }}
                />
              ) : (
                <h2
                  className="w-full text-sm leading-relaxed whitespace-pre-wrap cursor-pointer break-words   rounded-xl   flex items-start justify-start text-left"
                  style={{
                    color: promptBlock.content
                      ? currentTheme.text
                      : `${currentTheme.text}60`,

                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    lineHeight: '1.2',
                  }}
                  onDoubleClick={() => {
                    if (isEditing) {
                      setIsEditingContent(true);
                    } else if (onEnterEditMode) {
                      onEnterEditMode();
                      setTimeout(() => setIsEditingContent(true), 100);
                    }
                  }}
                >
                  {promptBlock.content || '描述一下画面'}
                </h2>
              )}
            </div>
          </Badge>
        </div>
      </motion.div>
    </div>
  );
}
