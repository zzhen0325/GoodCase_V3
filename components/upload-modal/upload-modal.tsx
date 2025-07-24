'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Tag as TagIcon, X } from 'lucide-react';
import { PromptBlock, getColorTheme } from '@/types';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { generateId } from '@/lib/utils';
import { FileUploadArea } from './FileUploadArea';
import { TagSelectorDropdown } from 'components/image-modal/TagSelectorDropdown';
import { Separator } from '@/components/ui/separator';
import { UploadActions } from './UploadActions';
import { PromptList } from '../image-modal/PromptList';

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
  // 文件相关状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 图片信息状态
  const [imageName, setImageName] = useState('');

  // 提示词相关状态
  const [promptBlocks, setPromptBlocks] = useState<PromptBlock[]>([
    { id: generateId(), content: '风格', color: 'pink', order: 0 },
    { id: generateId(), content: '主体', color: 'cyan', order: 1 },
    { id: generateId(), content: '场景', color: 'yellow', order: 2 },
  ]);

  // 标签相关状态
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSelectorOpen, setTagSelectorOpen] = useState(false);

  // 上传状态
  const [isUploading, setIsUploading] = useState(false);

  // 标签操作hooks
  const { tags, tagCategories, refreshAll } = useTagOperations();

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
      { id: generateId(), content: '风格', color: 'pink', order: 0 },
      { id: generateId(), content: '主体', color: 'cyan', order: 1 },
      { id: generateId(), content: '场景', color: 'yellow', order: 2 },
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

    try {
      setIsUploading(true);

      console.log('🚀 开始上传图片:', imageName);

      // 开始上传
      await onUpload(selectedFile, imageName, promptBlocks, selectedTagIds);

      // 上传成功后才关闭弹窗并重置表单
      toast.success('图片上传成功！');
      resetForm();
      onClose();

    } catch (error) {
      console.error('❌ 上传失败:', error);
      toast.error(
        '上传失败: ' +
          (error instanceof Error ? error.message : '请检查网络连接后重试')
      );
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[70vw] h-[75vh] p-0 flex flex-col rounded-2xl overflow-hidden gap-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
          <DialogHeader className="mt-4 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>上传图片</DialogTitle>
                <DialogDescription>
                  选择图片文件，添加提示词，然后上传到图库
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 ">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setTagSelectorOpen(true)}
                  className="px-3 text-black font-medium"
                >
                  <TagIcon className="h-3 w-3 " />
                  Add Tag
                </Button>
                <Separator orientation="vertical" className="h-6 mx-4" />
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const newBlock: PromptBlock = {
                      id: generateId(),
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
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
            {/* 左侧：文件上传区域 */}
            <div className="w-[35%] flex-1 min-w-0">
              <FileUploadArea
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                onFileSelect={handleFileSelect}
                onClearFile={handleClearFile}
                fileInputRef={fileInputRef}
              />
            </div>

            {/* 右侧：编辑区域 */}
            <div className="w-[65%] border-l bg-gray-50/50 flex flex-col">
              <div className="flex-1 flex flex-col overflow-hidden">
              
                
                {/* 提示词显示区域 */}
                <div className="flex-1 min-h-0 bg-white">
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
                          className="h-8 py-4 text-xs font-medium rounded-xl border"
                          style={{
                            backgroundColor: colorTheme.bg,
                            borderColor: colorTheme.primary,
                            color: colorTheme.text
                          }}
                        >
                          {tag.name}
                          <Button
                            size="icon"
                            className="ml-2 h-5 w-5 bg-white/40 hover:bg-white"
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
        </DialogContent>
      </Dialog>
      

    </>
  );
}
