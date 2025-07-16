"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Trash2, Palette, Check, X } from 'lucide-react';
import { Prompt, COLOR_THEMES, getColorTheme } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { copyToClipboard } from '@/lib/utils';

// 提示词块组件属性
interface PromptBlockProps {
  prompt: Prompt;
  isEditing: boolean;
  onUpdate: (id: string, updates: Partial<Prompt>) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
  onEnterEditMode?: () => void;
}

// 提示词块组件
export function PromptBlock({ 
  prompt, 
  isEditing, 
  onUpdate, 
  onDelete, 
  onCopy,
  onEnterEditMode 
}: PromptBlockProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempTitle, setTempTitle] = useState(prompt.title);
  const [tempContent, setTempContent] = useState(prompt.content);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
  } = useSortable({ id: prompt.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 保存标题
  const saveTitle = () => {
    onUpdate(prompt.id, { title: tempTitle });
    setIsEditingTitle(false);
  };

  // 保存内容
  const saveContent = () => {
    onUpdate(prompt.id, { content: tempContent });
    setIsEditingContent(false);
  };

  // 取消编辑
  const cancelTitleEdit = () => {
    setTempTitle(prompt.title);
    setIsEditingTitle(false);
  };

  const cancelContentEdit = () => {
    setTempContent(prompt.content);
    setIsEditingContent(false);
  };

  // 复制提示词
  const handleCopy = async () => {
    const success = await copyToClipboard(prompt.content);
    if (success) {
      setCopyStatus('success');
      onCopy(prompt.content);
      // 2秒后重置状态
      setTimeout(() => setCopyStatus('idle'), 2000);
    } else {
      setCopyStatus('error');
      // 2秒后重置状态
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // 更改颜色
  const changeColor = (colorName: string) => {
    onUpdate(prompt.id, { color: colorName });
    setShowColorPicker(false);
  };

  // 获取当前颜色主题
  const currentTheme = getColorTheme(prompt.color);

  return (
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
      <div
        className={`p-4 rounded-2xl transition-all duration-200 relative flex ${
          isEditing ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''
        }`}
        style={{ 
          borderColor: currentTheme.text,
          backgroundColor: currentTheme.bg
        }}
      >

        
        {/* 主要内容区域 */}
        <div className="flex-1">
          {/* 标题和操作按钮在同一行 */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex-1 mr-2">
              {isEditingTitle ? (
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') cancelTitleEdit();
                  }}
                  className="text-sm font-light"
                  autoFocus
                />
              ) : (
                <h4
                  className="text-sm font-regular cursor-pointer"
                  style={{ color: currentTheme.text }}
                  onDoubleClick={() => {
                    if (isEditing) {
                      setIsEditingTitle(true);
                    } else if (onEnterEditMode) {
                      onEnterEditMode();
                      setTimeout(() => setIsEditingTitle(true), 100);
                    }
                  }}
                >
                  | {prompt.title || '未命名提示词'}
                </h4>
              )}
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 transition-colors ${
                    copyStatus === 'success' ? 'text-green-600 hover:text-green-700' :
                    copyStatus === 'error' ? 'text-red-600 hover:text-red-700' : ''
                  }`}
                  style={{ color: currentTheme.text }}
                  onClick={handleCopy}
                  title={copyStatus === 'success' ? '复制成功' : copyStatus === 'error' ? '复制失败' : '复制'}
                >
                  {copyStatus === 'success' ? (
                    <Check className="h-4 w-4" />
                  ) : copyStatus === 'error' ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                
                {/* 状态提示 */}
                {copyStatus !== 'idle' && (
                  <div className={`absolute -bottom-8 right-0 px-2 py-1 text-xs rounded shadow-lg z-20 whitespace-nowrap ${
                    copyStatus === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                    'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {copyStatus === 'success' ? '复制成功' : '复制失败'}
                  </div>
                )}
              </div>
              
              {isEditing && (
                <>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      style={{ color: currentTheme.text }}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      title="更改颜色"
                    >
                      <Palette className="h-4 w-4" />
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
                                backgroundColor: theme.bg,
                                color: theme.text,
                                borderColor: prompt.color === theme.name ? '#000' : 'transparent'
                              }}
                              onClick={() => changeColor(theme.name)}
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
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(prompt.id)}
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 内容 */}
          <div className="mb-3">
            {isEditingContent ? (
              <Textarea
                ref={textAreaRef}
                rows={1}
                value={tempContent}
                onChange={(e) => setTempContent(e.target.value)}
                onBlur={saveContent}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) saveContent();
                  if (e.key === 'Escape') cancelContentEdit();
                }}
                className="w-full p-2 text-sm border rounded-2xl resize-none overflow-hidden focus:outline-none focus:ring-0 focus:ring-ring break-words"
                autoFocus
                style={{ color: currentTheme.text }}
              />
            ) : (
              <p
                className="text-md text-bold whitespace-pre-wrap h-auto cursor-pointer break-words overflow-hidden"
                style={{ 
                  color: prompt.content ? currentTheme.text : `${currentTheme.text}80`,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
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
                {prompt.content || ' 双击以进行编辑  '}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}