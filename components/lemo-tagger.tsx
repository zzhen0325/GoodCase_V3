"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, useDroppable, DragEndEvent } from '@dnd-kit/core';

// 文件对接口
interface FilePair {
  id: string;
  imageFile: File;
  textFile?: File;
  imageUrl: string;
  textContent: string;
  fileName: string;
}

// Lemo Tagger 组件属性
interface LemoTaggerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Lemo Tagger 组件
export function LemoTagger({ isOpen, onClose }: LemoTaggerProps) {
  const [filePairs, setFilePairs] = useState<FilePair[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 处理文件上传
  const handleFiles = (files: FileList) => {
    const imageFiles = new Map<string, File>();
    const textFiles = new Map<string, File>();

    // 分类文件
    Array.from(files).forEach(file => {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      
      if (file.type.startsWith('image/')) {
        imageFiles.set(baseName, file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        textFiles.set(baseName, file);
      }
    });

    // 创建文件对
    const newPairs: FilePair[] = [];
    
    imageFiles.forEach((imageFile, baseName) => {
      const textFile = textFiles.get(baseName);
      const imageUrl = URL.createObjectURL(imageFile);
      
      const pair: FilePair = {
        id: Math.random().toString(36).substr(2, 9),
        imageFile,
        textFile,
        imageUrl,
        textContent: '',
        fileName: baseName
      };

      if (textFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          pair.textContent = e.target?.result as string || '';
          setFilePairs(prev => prev.map(p => p.id === pair.id ? pair : p));
        };
        reader.readAsText(textFile);
      }

      newPairs.push(pair);
    });

    setFilePairs(prev => [...prev, ...newPairs]);
  };

  // 使用 dnd-kit 的 droppable 区域
  const { setNodeRef, isOver } = useDroppable({
    id: 'lemo-file-drop-zone',
    data: {
      accepts: ['file']
    }
  });

  // 监听拖拽状态
  React.useEffect(() => {
    setIsDragging(isOver);
  }, [isOver]);

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === 'lemo-file-drop-zone') {
      // 这里可以处理文件拖拽到上传区域的逻辑
      console.log('Files dragged to lemo drop zone');
    }
  };

  // 文件选择处理
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  // 更新文本内容
  const updateTextContent = (id: string, content: string) => {
    setFilePairs(prev => prev.map(pair => 
      pair.id === id ? { ...pair, textContent: content } : pair
    ));
  };

  // 删除文件对
  const removePair = (id: string) => {
    setFilePairs(prev => {
      const pair = prev.find(p => p.id === id);
      if (pair) {
        URL.revokeObjectURL(pair.imageUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  // 下载单个文件
  const downloadSingle = (pair: FilePair) => {
    const blob = new Blob([pair.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pair.fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 批量下载所有文件
  const downloadAll = async () => {
    if (filePairs.length === 0) return;

    // 动态导入 JSZip
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    filePairs.forEach(pair => {
      if (pair.textContent.trim()) {
        zip.file(`${pair.fileName}.txt`, pair.textContent);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lemo-tagger-export.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 清理 URL
  useEffect(() => {
    return () => {
      filePairs.forEach(pair => {
        URL.revokeObjectURL(pair.imageUrl);
      });
    };
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#fffdf5] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <DndContext onDragEnd={handleDragEnd}>
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-[#f0e6cc]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LT</span>
              </div>
              <h2 className="text-xl font-semibold text-[#8b8b8b]">Lemo Image Tagger</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[#8b8b8b] hover:text-black"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* 上传区域 */}
            <div
              ref={setNodeRef}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 mb-6 ${
                isDragging 
                  ? 'border-black bg-[#fffff7]' 
                  : 'border-[#f0e6cc] bg-white hover:border-black hover:bg-[#fffff7]'
              }`}
            >
              <p className="text-[#bababa] mb-4">
                拖拽图片和TXT文件到此处，或点击下方按钮选择文件
              </p>
              <Button
                onClick={handleFileSelect}
                className="bg-black text-white hover:bg-[#e09612] mb-4"
              >
                选择文件
              </Button>
              <p className="text-sm text-[#bababa]">
                支持批量上传图片(jpg, png, jpeg, gif)和文本文件(txt)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* 批量操作 */}
            {filePairs.length > 0 && (
              <div className="text-center mb-6">
                <Button
                  onClick={downloadAll}
                  className="bg-black text-white hover:bg-[#e09612]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  批量下载所有TXT文件
                </Button>
              </div>
            )}

            {/* 文件预览区域 */}
            {filePairs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-[#ddd5c6] text-lg">
                  暂无预览内容，请上传文件
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filePairs.map((pair) => (
                  <motion.div
                    key={pair.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 relative"
                  >
                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePair(pair.id)}
                      className="absolute top-3 right-3 z-10 w-6 h-6 bg-black/10 hover:bg-black/20 text-[#8b8b8b] hover:text-red-500 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    {/* 文件名 */}
                    <div className="p-3 bg-white border-b border-[#f0e6cc]">
                      <div className="text-sm font-medium text-[#8b8b8b] truncate pr-8">
                        {pair.fileName}
                      </div>
                    </div>

                    {/* 图片预览 */}
                    <div className="h-48 bg-[#fffff7] border-b border-[#f0e6cc]">
                      <img
                        src={pair.imageUrl}
                        alt={pair.fileName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* 文本编辑区域 */}
                    <div className="p-0">
                      <Textarea
                        value={pair.textContent}
                        onChange={(e) => updateTextContent(pair.id, e.target.value)}
                        placeholder="在此输入或编辑提示词..."
                        className="w-full h-32 p-4 border-0 resize-none text-sm text-[#ddd5c6] bg-white focus:outline-none focus:bg-[#fffff7] transition-colors"
                      />
                    </div>

                    {/* 下载按钮 */}
                    <div className="p-4">
                      <Button
                        onClick={() => downloadSingle(pair)}
                        className="w-full bg-black text-white hover:bg-[#e09612] transition-colors"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        下载TXT
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </DndContext>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}