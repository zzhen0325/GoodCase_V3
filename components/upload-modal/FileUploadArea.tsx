'use client';

import React, { useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { compressImageFile, validateImageFile } from '@/lib/image-utils';
import { toast } from '@/lib/enhanced-toast';
import CompressionSettings, { CompressionConfig } from './CompressionSettings';

interface FileUploadAreaProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClearFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  selectedFile,
  previewUrl,
  onFileSelect,
  onClearFile,
  fileInputRef
}) => {
  // 压缩配置状态
  const [compressionConfig, setCompressionConfig] = useState<CompressionConfig>({
    enabled: true,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080
  });
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndSelectFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await processAndSelectFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 处理文件选择和压缩
  const processAndSelectFile = async (file: File) => {
    try {
      // 验证文件
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.error || '文件验证失败');
        return;
      }

      // 显示压缩进度
      const toastId = toast.uploadProgress(0, '正在处理图片...');
      
      try {
        // 更新进度
        toast.updateProgress(toastId, { progress: 30, message: '正在压缩图片...' });
        
        // 根据配置决定是否压缩图片
        let processedFile = file;
        
        if (compressionConfig.enabled) {
          processedFile = await compressImageFile(file, {
            maxWidth: compressionConfig.maxWidth,
            maxHeight: compressionConfig.maxHeight,
            quality: compressionConfig.quality
          });
        }
        
        // 更新进度
        toast.updateProgress(toastId, { progress: 80, message: '压缩完成...' });
        
        // 完成进度
        toast.updateProgress(toastId, { progress: 100, message: '处理完成' });
        
        // 显示处理结果
        if (compressionConfig.enabled && processedFile.size < file.size) {
          const compressionRatio = ((file.size - processedFile.size) / file.size * 100).toFixed(1);
          toast.completeProgress(toastId, `图片压缩完成，减少了 ${compressionRatio}% 的大小`);
        } else if (compressionConfig.enabled) {
          toast.completeProgress(toastId, '图片处理完成');
        } else {
          toast.completeProgress(toastId, '图片已选择（未压缩）');
        }
        
        // 选择处理后的文件
        onFileSelect(processedFile);
        
      } catch (processingError) {
         console.error('图片处理失败:', processingError);
         toast.failProgress(toastId, '图片处理失败，使用原始文件');
         // 处理失败时使用原始文件
         onFileSelect(file);
       }
      
    } catch (error) {
      console.error('文件处理失败:', error);
      toast.error('文件处理失败，请重试');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 拖放区域 */}
      <div className="flex-1 p-6">
        <div
          className={`h-full flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
            previewUrl 
              ? 'rounded-2xl' 
              : 'border-1 border-dashed  rounded-lg bg-muted/30 hover:bg-muted'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {previewUrl ? (
            <>
              {/* 右上角按钮组 */}
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                <CompressionSettings
                  config={compressionConfig}
                  onChange={setCompressionConfig}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-xl bg-white/80 hover:bg-white"
                  onClick={onClearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 图片预览 */}
              <img
                src={previewUrl}
                alt="预览"
                className="max-w-full max-h-[calc(75vh-20rem)] object-contain rounded-2xl"
              />
            </>
          ) : (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mx-auto h-12 w-12 text-black/70 mb-4">
                <Upload className="h-full w-full" />
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="text-white bg-black hover:text-black mb-10  rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                支持 JPG、PNG、WebP 格式
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* 文件信息 */}
      {selectedFile && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <FileImage className="h-4 w-4 text-gray-500" />
              <span className="font-medium truncate">{selectedFile.name}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              {compressionConfig.enabled && (
                <span className="ml-2 text-green-600">已压缩</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
