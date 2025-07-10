"use client"

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, FileImage, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageData, Prompt, Tag } from '@/types';
import { TagManager } from './tag-manager';
import { PromptBlock } from './prompt-block';
import { useToastContext } from '@/components/toast-provider';
import { generateId } from '@/lib/utils';
import { ImageStorageService } from '@/lib/image-storage';

// 上传图片弹窗组件属性
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, imageName: string, prompts: Prompt[], tags: Tag[]) => Promise<void>;
  availableTags: Tag[];
  onCreateTag: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
}

// 上传图片弹窗组件
export function UploadModal({ 
  isOpen, 
  onClose, 
  onUpload,
  availableTags,
  onCreateTag
}: UploadModalProps) {
  const { toast } = useToastContext();
  const [imageName, setImageName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isEditingPrompts, setIsEditingPrompts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // 处理文件拖放
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  // 处理拖放区域事件
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
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

  // 处理文件
  const processFile = async (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    try {
      // 转换为base64并设置预览
      const base64 = await fileToBase64(file);
      setSelectedFile(file);
      setPreviewUrl(base64);
      
      // 使用文件名作为图片名称
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setImageName(fileName);
      
      // 创建默认的提示词块
      if (prompts.length === 0) {
        const defaultPrompt: Prompt = {
          id: generateId(),
          title: '默认提示词',
          content: fileName,
          color: 'slate',
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setPrompts([defaultPrompt]);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    // 上传步骤节点
    const uploadSteps = [
      { step: 1, title: '准备上传', description: '正在验证文件信息...', progress: 10 },
      { step: 2, title: '压缩图片', description: '正在优化图片大小...', progress: 30 },
      { step: 3, title: '上传文件', description: '正在上传到云存储...', progress: 60 },
      { step: 4, title: '保存数据', description: '正在保存图片信息...', progress: 85 },
      { step: 5, title: '完成处理', description: '正在生成缩略图...', progress: 100 }
    ];

    const toastId = toast.loading('步骤 1/5: 准备上传', '正在验证文件信息...', 0);
    
    try {
      setIsUploading(true);
      
      // 逐步显示上传流程
      for (let i = 0; i < uploadSteps.length; i++) {
        const currentStep = uploadSteps[i];
        
        // 更新 toast 显示当前步骤
        const stepTitle = `步骤 ${currentStep.step}/${uploadSteps.length}: ${currentStep.title}`;
        toast.update(toastId, stepTitle, currentStep.description, currentStep.progress);
        
        // 如果不是最后一步，模拟处理时间
        if (i < uploadSteps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          // 最后一步：实际执行上传
          await onUpload(selectedFile, imageName.trim(), prompts, selectedTags);
        }
      }
      
      toast.resolve(toastId, '上传完成', '图片已成功上传并保存');
      
      // 重置表单
      resetForm();
      
      // 关闭弹窗
      onClose();
    } catch (error) {
      console.error('上传失败:', error);
      toast.reject(toastId, '上传失败', error instanceof Error ? error.message : '请检查网络连接后重试');
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
    setSelectedTags([]);
    setIsEditingPrompts(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 关闭弹窗时重置表单
  const handleClose = () => {
    resetForm();
    onClose();
  }

  // 添加新提示词
  const addPrompt = () => {
    const newPrompt: Prompt = {
      id: generateId(),
      title: '新提示词',
      content: '',
      color: 'slate',
      order: prompts.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPrompts([...prompts, newPrompt]);
  };

  // 更新提示词
  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setPrompts(prompts.map(prompt => 
      prompt.id === id 
        ? { ...prompt, ...updates, updatedAt: new Date().toISOString() }
        : prompt
    ));
  };

  // 删除提示词
  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter(prompt => prompt.id !== id));
  };

  // 复制提示词内容
  const copyPromptContent = (content: string) => {
    // 这里可以添加复制成功的提示
    console.log('复制提示词:', content);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl h-[95vh] p-0 flex flex-col">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                上传图片
              </DialogTitle>
              <Button size="icon" variant="ghost" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription className="sr-only">
              上传图片并添加相关信息，包括图片名称、提示词和标签
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
            {/* 拖放区域 */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8
                flex flex-col items-center justify-center
                transition-colors duration-200
                ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
                ${selectedFile ? 'bg-background' : 'bg-muted/30'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile && previewUrl ? (
                <div className="relative w-full max-h-[300px] flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="max-w-full max-h-[300px] object-contain rounded-md"
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
                <div className="text-center">
                  <div className="mb-4 bg-primary/10 p-4 rounded-full inline-block">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">拖放图片到此处</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    支持 JPG, PNG, GIF 等常见图片格式
                  </p>
                  <Button onClick={triggerFileInput}>
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

            {/* 图片信息表单 */}
            <div className="space-y-6">
              {/* 图片名称显示 */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  图片名称
                </label>
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <span className="text-sm font-medium">
                    {imageName || '未选择文件'}
                  </span>
                </div>
              </div>

              {/* 提示词块管理 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    提示词块
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addPrompt}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    添加提示词
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {prompts.map((prompt) => (
                    <PromptBlock
                      key={prompt.id}
                      prompt={prompt}
                      isEditing={isEditingPrompts}
                      onUpdate={updatePrompt}
                      onDelete={deletePrompt}
                      onCopy={copyPromptContent}
                    />
                  ))}
                  
                  {prompts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">暂无提示词块</p>
                      <p className="text-xs mt-1">点击上方按钮添加提示词</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 标签管理 */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  标签
                </label>
                <TagManager
                  tags={selectedTags}
                  selectedTags={selectedTags}
                  availableTags={availableTags}
                  onTagsChange={setSelectedTags}
                  onCreateTag={onCreateTag}
                  isEditing={true}
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-muted/30 flex justify-end">
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || !imageName.trim() || isUploading}
            >
              {isUploading ? '上传中...' : '提交'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}