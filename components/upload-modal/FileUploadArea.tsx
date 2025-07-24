'use client';

import React from 'react';
import { Upload, FileImage } from 'lucide-react';
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
          className="h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center relative overflow-hidden bg-gray-50/50 hover:bg-gray-50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {previewUrl ? (
            <div className="relative w-full h-full">
              <img
                src={previewUrl}
                alt="预览"
                className="w-full h-full object-contain rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                onClick={onClearFile}
              >
                ×
              </Button>
            </div>
          ) : (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <Upload className="h-full w-full" />
              </div>
              <div className="text-sm text-gray-600 mb-2">
                拖拽图片到此处，或
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500 ml-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  点击选择
                </button>
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
