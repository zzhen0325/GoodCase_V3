'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/lib/enhanced-toast';

import { BaseModal } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Tag as TagIcon, X, GripVertical } from 'lucide-react';
import { PromptBlock, getColorTheme } from '@/types';
import { useTags } from '@/hooks/data/useTags';
import { generateId } from '@/lib/utils/common';
import { FileUploadArea } from './FileUploadArea';
import { TagSelector } from '@/components/common/tags/TagSelector';
import { Separator } from '@/components/ui/separator';
import { UploadActions } from './UploadActions';
import { PromptList } from '../../image-management/image-modal/PromptList';

// 上传图片弹窗组件属性
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (
    file: File,
    imageName: string,
    promptBlocks: PromptBlock[],
    tagIds?: string[]
  ) => Promise<void>;
}

// 主要的上传模态框组件
export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  // 面板宽度状态
  const [leftPanelWidth, setLeftPanelWidth] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  
  // 文件相关状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 图片信息状态
  const [imageName, setImageName] = useState('');

  // 提示词相关状态
  const [promptBlocks, setPromptBlocks] = useState<PromptBlock[]>([
    { id: generateId(), title: '风格', content: '', color: 'pink', order: 0 },
    { id: generateId(), title: '主体', content: '', color: 'cyan', order: 1 },
    { id: generateId(), title: '场景', content: '', color: 'yellow', order: 2 },
  ]);

  // 标签相关状态
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSelectorOpen, setTagSelectorOpen] = useState(false);

  // 上传状态
  const [isUploading, setIsUploading] = useState(false);

  // 标签操作hooks
  const { tags, tagCategories, refreshAll } = useTags();

  // 拖拽处理函数
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.querySelector('[data-upload-modal-container]') as HTMLElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // 限制宽度范围在 20% 到 80% 之间
    const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
    setLeftPanelWidth(clampedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // 生成预览URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // 自动设置图片名称（去掉扩展名）
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setImageName(nameWithoutExt);
  };

  // 清除文件
  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 重置表单
  const resetForm = () => {
    handleClearFile();
    setPromptBlocks([
      { id: generateId(), title: '风格', content: '', color: 'pink', order: 0 },
      { id: generateId(), title: '主体', content: '', color: 'cyan', order: 1 },
      { id: generateId(), title: '场景', content: '', color: 'yellow', order: 2 },
    ]);
    setSelectedTagIds([]);
    setIsUploading(false);
  };

  // 处理上传
  const handleUpload = async (e?: React.MouseEvent) => {
    // 阻止默认行为和事件冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!selectedFile) {
      toast.error('请选择图片文件');
      return;
    }

    // 显示上传进度条
    const toastId = toast.uploadProgress(0, '正在上传图片...');
    
    try {
      setIsUploading(true);

      console.log('🚀 开始上传图片:', imageName);

      // 更新进度到30%
      toast.updateProgress(toastId, { progress: 30, message: '正在处理图片...' });

      // 更新进度到60%
      toast.updateProgress(toastId, { progress: 60, message: '正在上传到服务器...' });

      // 开始上传
      await onUpload(selectedFile, imageName, promptBlocks, selectedTagIds);

      // 更新进度到100%
      toast.updateProgress(toastId, { progress: 100, message: '上传完成' });

      // 显示成功消息
      toast.completeProgress(toastId, '图片上传成功！');
      
      // 上传成功后才关闭弹窗并重置表单
      resetForm();
      onClose();

    } catch (error) {
      console.error('❌ 上传失败:', error);
      // 显示失败消息
      toast.failProgress(toastId, '图片上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // 清理预览URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 检查是否可以上传
  const canUpload = selectedFile;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        className="max-w-[70vw] h-[75vh] p-0 flex flex-col rounded-2xl overflow-hidden gap-0"
      >
        <div className="mt-4 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 ml-auto">
                <TagSelector
                  tags={tags}
                  tagCategories={tagCategories}
                  selectedTagIds={selectedTagIds}
                  onTagsChange={setSelectedTagIds}
                  open={tagSelectorOpen}
                  onOpenChange={setTagSelectorOpen}
                  onRefetch={refreshAll}
                  mode="dropdown"
                  variant="outline"
                  placeholder="Add Tags"
                />
                <Separator orientation="vertical" className="h-6 mx-4" />
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const newBlock: PromptBlock = {
                      id: generateId(),
                      title: '新提示词',
                      content: '',
                      color: 'pink',
                      order: promptBlocks.length,
                    };
                    setPromptBlocks([...promptBlocks, newBlock]);
                  }}
                  className="px-3 text-black font-medium"
                >
                  <Plus className="h-3 w-3" />
                  Add Prompt
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden" data-upload-modal-container>
            {/* 左侧：文件上传区域 */}
            <div 
              className="flex-1 min-w-0 flex-shrink-0" 
              style={{ width: `${leftPanelWidth}%` }}
            >
              <FileUploadArea
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                onFileSelect={handleFileSelect}
                onClearFile={handleClearFile}
                fileInputRef={fileInputRef}
              />
            </div>

            {/* 拖拽分隔条 */}
            <div 
              className={`w-[1px] bg-border hover:bg-border cursor-col-resize flex-shrink-0 relative group ${
                isDragging ? 'bg-border' : ''
              }`}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute inset-y-0 -left-2 -right-2 flex items-center justify-center">
                <div className="bg-white border  rounded-xl px-1 py-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <GripVertical className="w-3 h-6 text-border" />
                </div>
              </div>
            </div>

            {/* 右侧：编辑区域 */}
            <div 
              className="bg-white flex flex-col min-w-0" 
              style={{ width: `${100 - leftPanelWidth}%` }}
            >
              <div className="flex-1 flex flex-col overflow-hidden">
              
                
                {/* 提示词显示区域 */}
                <div className="flex-1 flex flex-col min-h-0 max-h-[calc(75vh-220px)]">
                  <PromptList
                    promptBlocks={promptBlocks}
                    isEditing={true}
                    onUpdate={(id, updates) => {
                      setPromptBlocks(prev => 
                        prev.map(block => 
                          block.id === id ? { ...block, ...updates } : block
                        )
                      );
                    }}
                    onDelete={(id) => {
                      setPromptBlocks(prev => prev.filter(block => block.id !== id));
                    }}
                    onCopy={(content) => {
                      navigator.clipboard.writeText(content);
                      toast.success('已复制到剪贴板');
                    }}
                  />
                </div>

                  {/* 标签显示区域 */}
                <div className="border-t bg-white p-4">
                  <label className="text-sm font-medium text-black mb-2 block">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTagIds.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId);
                      const tagCategory = tag ? tagCategories.find(g => g.id === tag.categoryId) : null;
                      const colorTheme = tagCategory ? getColorTheme(tagCategory.color || 'gray') : getColorTheme('pink');
                      return tag ? (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                         className="px-3 h-8 py-4 text-xs font-medium rounded-xl border"
                          style={{
                            backgroundColor: colorTheme.bg,
                            borderColor: colorTheme.primary,
                            color: colorTheme.text
                          }}
                        >
                          {tag.name}
                          <Button
                            size="icon"
                             className="ml-1 h-4 w-4 bg-transparent hover:bg-transparent"
                            style={{
                              color: colorTheme.text
                            }}
                            onClick={() => {
                              setSelectedTagIds(prev => prev.filter(id => id !== tag.id));
                            }}
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </Badge>
                      ) : null;
                    })}
                    {selectedTagIds.length === 0 && (
                      <span className="text-xs text-gray-500">暂无标签</span>
                    )}
                  </div>
                </div>


              </div>

              {/* 操作按钮 */}
              <div className="p-6 border-t bg-white flex justify-end">
                <UploadActions
                  onUpload={handleUpload}
                  onCancel={handleCancel}
                  canUpload={!!canUpload}
                  isUploading={isUploading}
                />
              </div>
            </div>
          </div>
      </BaseModal>
    </>
  );
}
