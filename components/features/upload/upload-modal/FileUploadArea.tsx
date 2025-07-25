'use client';

import React from 'react';
import { Upload, FileImage, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
              {/* X按钮放在整个预览区域的右上角 */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-xl bg-white/80 hover:bg-white z-10"
                onClick={onClearFile}
              >
                <X className="h-4 w-4" />
              </Button>
              
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
