'use client';

import React, { useState, useCallback } from 'react';
import { 
  FirebaseStorageUploader, 
  FirebaseStorageDownloader,
  FirebaseStorageManager,
  ImageStorageUtils,
  type UploadProgress 
} from '@/lib/firebase-storage-example';

/**
 * Firebase Storage 演示组件
 * 展示文件上传、下载、删除等功能
 */
export default function FirebaseStorageDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');
  const [fileList, setFileList] = useState<{files: string[], folders: string[]}>({files: [], folders: []});
  const [logs, setLogs] = useState<string[]>([]);

  // 添加日志
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // 文件选择处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      addLog(`选择文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  };

  // 简单上传
  const handleSimpleUpload = async () => {
    if (!selectedFile) {
      addLog('请先选择文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      addLog('开始简单上传...');
      
      const filename = ImageStorageUtils.generateUniqueFilename(selectedFile.name, 'demo');
      const downloadURL = await FirebaseStorageUploader.uploadFile(
        selectedFile,
        `demo/${filename}`,
        {
          contentType: selectedFile.type,
          customMetadata: {
            originalName: selectedFile.name,
            uploadedAt: new Date().toISOString(),
            uploadType: 'simple'
          }
        }
      );
      
      setUploadedUrl(downloadURL);
      setUploadProgress(100);
      addLog(`简单上传成功: ${downloadURL}`);
    } catch (error) {
      addLog(`简单上传失败: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 可恢复上传
  const handleResumableUpload = async () => {
    if (!selectedFile) {
      addLog('请先选择文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      addLog('开始可恢复上传...');
      
      const filename = ImageStorageUtils.generateUniqueFilename(selectedFile.name, 'resumable');
      const downloadURL = await FirebaseStorageUploader.uploadFileResumable(
        selectedFile,
        `demo/resumable/${filename}`,
        (progress: UploadProgress) => {
          const percent = (progress.bytesTransferred / progress.totalBytes) * 100;
          setUploadProgress(percent);
          addLog(`上传进度: ${percent.toFixed(2)}% (${progress.state})`);
        },
        {
          contentType: selectedFile.type,
          customMetadata: {
            originalName: selectedFile.name,
            uploadedAt: new Date().toISOString(),
            uploadType: 'resumable'
          }
        }
      );
      
      setUploadedUrl(downloadURL);
      addLog(`可恢复上传成功: ${downloadURL}`);
    } catch (error) {
      addLog(`可恢复上传失败: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 图片上传（带验证）
  const handleImageUpload = async () => {
    if (!selectedFile) {
      addLog('请先选择文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      addLog('开始图片上传（带验证）...');
      
      const result = await ImageStorageUtils.uploadImageWithThumbnail(
        selectedFile,
        'demo/images',
        (progress: UploadProgress) => {
          const percent = (progress.bytesTransferred / progress.totalBytes) * 100;
          setUploadProgress(percent);
          addLog(`图片上传进度: ${percent.toFixed(2)}%`);
        }
      );
      
      setUploadedUrl(result.originalUrl);
      addLog(`图片上传成功: ${result.originalUrl}`);
      if (result.thumbnailUrl) {
        addLog(`缩略图: ${result.thumbnailUrl}`);
      }
    } catch (error) {
      addLog(`图片上传失败: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 获取下载URL
  const handleGetDownloadUrl = async () => {
    if (!filePath.trim()) {
      addLog('请输入文件路径');
      return;
    }

    try {
      addLog(`获取下载URL: ${filePath}`);
      const url = await FirebaseStorageDownloader.getDownloadURL(filePath);
      setDownloadUrl(url);
      addLog(`获取下载URL成功: ${url}`);
    } catch (error) {
      addLog(`获取下载URL失败: ${error}`);
    }
  };

  // 下载文件
  const handleDownloadFile = async () => {
    if (!filePath.trim()) {
      addLog('请输入文件路径');
      return;
    }

    try {
      addLog(`下载文件: ${filePath}`);
      const blob = await FirebaseStorageDownloader.downloadAsBlob(filePath);
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addLog(`文件下载成功 (${blob.size} bytes)`);
    } catch (error) {
      addLog(`文件下载失败: ${error}`);
    }
  };

  // 删除文件
  const handleDeleteFile = async () => {
    if (!filePath.trim()) {
      addLog('请输入文件路径');
      return;
    }

    try {
      addLog(`删除文件: ${filePath}`);
      await FirebaseStorageManager.deleteFile(filePath);
      addLog('文件删除成功');
    } catch (error) {
      addLog(`文件删除失败: ${error}`);
    }
  };

  // 获取文件元数据
  const handleGetMetadata = async () => {
    if (!filePath.trim()) {
      addLog('请输入文件路径');
      return;
    }

    try {
      addLog(`获取文件元数据: ${filePath}`);
      const metadata = await FirebaseStorageManager.getFileMetadata(filePath);
      addLog(`文件元数据: ${JSON.stringify(metadata, null, 2)}`);
    } catch (error) {
      addLog(`获取文件元数据失败: ${error}`);
    }
  };

  // 列出文件
  const handleListFiles = async () => {
    const folderPath = filePath.trim() || 'demo';
    
    try {
      addLog(`列出文件夹内容: ${folderPath}`);
      const result = await FirebaseStorageManager.listFiles(folderPath);
      setFileList(result);
      addLog(`找到 ${result.files.length} 个文件，${result.folders.length} 个文件夹`);
    } catch (error) {
      addLog(`列出文件失败: ${error}`);
    }
  };

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Firebase Storage 演示
        </h1>
        <p className="text-gray-600">
          展示文件上传、下载、删除等功能
        </p>
      </div>

      {/* 文件上传区域 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">文件上传</h2>
        
        <div className="space-y-4">
          {/* 文件选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择文件
            </label>
            <input
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                已选择: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* 上传进度 */}
          {isUploading && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>上传进度</span>
                <span>{uploadProgress.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 上传按钮 */}
          <div className="flex space-x-4">
            <button
              onClick={handleSimpleUpload}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              简单上传
            </button>
            <button
              onClick={handleResumableUpload}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              可恢复上传
            </button>
            <button
              onClick={handleImageUpload}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              图片上传
            </button>
          </div>

          {/* 上传结果 */}
          {uploadedUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-800 mb-2">上传成功！</p>
              <p className="text-sm text-green-700 break-all">{uploadedUrl}</p>
              {uploadedUrl.includes('image') && (
                <img 
                  src={uploadedUrl} 
                  alt="Uploaded" 
                  className="mt-2 max-w-xs max-h-48 object-contain border rounded"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 文件操作区域 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">文件操作</h2>
        
        <div className="space-y-4">
          {/* 文件路径输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件路径
            </label>
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="例如: demo/image_123456_abc123.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGetDownloadUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              获取下载URL
            </button>
            <button
              onClick={handleDownloadFile}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              下载文件
            </button>
            <button
              onClick={handleDeleteFile}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              删除文件
            </button>
            <button
              onClick={handleGetMetadata}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              获取元数据
            </button>
            <button
              onClick={handleListFiles}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              列出文件
            </button>
          </div>

          {/* 下载URL显示 */}
          {downloadUrl && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800 mb-2">下载URL:</p>
              <p className="text-sm text-blue-700 break-all">{downloadUrl}</p>
            </div>
          )}

          {/* 文件列表 */}
          {(fileList.files.length > 0 || fileList.folders.length > 0) && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm font-medium text-gray-800 mb-2">文件列表:</p>
              {fileList.folders.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">文件夹:</p>
                  {fileList.folders.map((folder, index) => (
                    <p key={index} className="text-xs text-gray-600 ml-2">📁 {folder}</p>
                  ))}
                </div>
              )}
              {fileList.files.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">文件:</p>
                  {fileList.files.map((file, index) => (
                    <p key={index} className="text-xs text-gray-600 ml-2">📄 {file}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 日志区域 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">操作日志</h2>
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            清空日志
          </button>
        </div>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">暂无日志...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}