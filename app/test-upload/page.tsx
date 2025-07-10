"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageStorageService } from '@/lib/image-storage';
import { useToastContext } from '@/components/toast-provider';
import { Upload, Image as ImageIcon } from 'lucide-react';

export default function TestUploadPage() {
  const { toast } = useToastContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }
      
      setSelectedFile(file);
      
      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理上传
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('请先选择图片文件');
      return;
    }

    const toastId = toast.loading('上传中...', '正在上传到 Firebase Storage');
    
    try {
      setIsUploading(true);
      
      // 上传到 Firebase Storage
      const imageUrl = await ImageStorageService.uploadImage(selectedFile, 'test-uploads');
      
      setUploadedUrl(imageUrl);
      toast.resolve(toastId, '上传成功!', '图片已成功上传到 Firebase Storage');
      
    } catch (error) {
      console.error('上传失败:', error);
      toast.reject(toastId, '上传失败', error instanceof Error ? error.message : '请检查网络连接');
    } finally {
      setIsUploading(false);
    }
  };

  // 清除选择
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Firebase Storage 图片上传测试
          </h1>
          
          <div className="space-y-6">
            {/* 文件选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择图片文件
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full"
              />
            </div>
            
            {/* 预览区域 */}
            {previewUrl && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  预览
                </h3>
                <img 
                  src={previewUrl} 
                  alt="预览" 
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                />
                <div className="mt-4 text-sm text-gray-600">
                  <p>文件名: {selectedFile?.name}</p>
                  <p>文件大小: {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB</p>
                  <p>文件类型: {selectedFile?.type}</p>
                </div>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex gap-4">
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
                className="flex-1 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? '上传中...' : '上传到 Firebase Storage'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={isUploading}
              >
                清除
              </Button>
            </div>
            
            {/* 上传结果 */}
            {uploadedUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  ✅ 上传成功!
                </h3>
                <p className="text-sm text-green-700 mb-3">
                  图片已成功上传到 Firebase Storage
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 break-all">
                    <strong>下载链接:</strong> {uploadedUrl}
                  </p>
                  <img 
                    src={uploadedUrl} 
                    alt="上传的图片" 
                    className="max-w-full max-h-32 rounded border"
                    onError={() => console.log('图片加载失败')}
                  />
                </div>
              </div>
            )}
            
            {/* 说明信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">
                📝 测试说明
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 支持的格式: JPEG, PNG, GIF, WebP, SVG</li>
                <li>• 最大文件大小: 10MB</li>
                <li>• 图片将上传到 Firebase Storage 的 test-uploads 文件夹</li>
                <li>• 如果连接失败，请检查网络或使用 Firebase 模拟器</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}