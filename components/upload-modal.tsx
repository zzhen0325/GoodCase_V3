"use client"

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, FileImage } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageData, Prompt, Tag } from '@/types';
import { TagManager } from './tag-manager';
import { generateId } from '@/lib/utils';

// 上传图片弹窗组件属性
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (image: Omit<ImageData, 'id'>) => Promise<void>;
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
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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
      
      // 如果没有标题，使用文件名作为默认标题
      if (!title) {
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setTitle(fileName);
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
      alert('请选择图片文件');
      return;
    }

    try {
      setIsUploading(true);
      
      // 创建新的图片数据对象
      const newImage: Omit<ImageData, 'id'> = {
        title: title || '未命名图片',
        url: previewUrl || '', // 现在存储base64数据
        prompts: [],
        tags: selectedTags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 调用上传回调
      await onUpload(newImage);
      
      // 重置表单
      resetForm();
      
      // 关闭弹窗
      onClose();
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setTitle('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedTags([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 关闭弹窗时重置表单
  const handleClose = () => {
    resetForm();
    onClose();
  }

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
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  图片标题
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入图片标题"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
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
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? '上传中...' : '上传图片'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}