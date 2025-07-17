"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon, FileImage, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageData, Prompt } from "@/types";
import { PromptBlock } from "./prompt-block";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";
import { ImageStorageService } from "@/lib/image-storage";
import { DndContext, useDroppable, DragEndEvent } from "@dnd-kit/core";

// 上传图片弹窗组件属性
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, imageName: string, prompts: Prompt[]) => Promise<void>;
}

// 上传图片弹窗组件
export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [imageName, setImageName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);

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

  // 使用 dnd-kit 的 droppable 区域
  const { setNodeRef, isOver } = useDroppable({
    id: "file-upload-zone",
    data: {
      accepts: ["file"],
    },
  });

  // 处理文件上传
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) {
      await processFile(fileArray[0]);
    }
  };

  // 监听拖拽状态
  React.useEffect(() => {
    setDragActive(isOver);
  }, [isOver]);

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === "file-upload-zone") {
      // 这里可以处理文件拖拽到上传区域的逻辑
      // 由于我们主要是为了统一使用 dnd-kit，实际的文件处理仍然通过文件选择器
      console.log("File dragged to upload zone");
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

  // 创建默认提示词
  const createDefaultPrompts = (): Prompt[] => {
    const now = new Date();
    return ["风格", "主体", "场景"].map((text, index) => ({
      id: generateId(),
      text,
      category: "default",
      tags: [],
      usageCount: 0,
      isTemplate: false,
      color: "slate" as const,
      createdAt: now,
      updatedAt: now,
    }));
  };

  // 处理文件
  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setSelectedFile(file);
      setPreviewUrl(base64);
      setImageName(file.name.split(".").slice(0, -1).join("."));

      if (prompts.length === 0) {
        setPrompts(createDefaultPrompts());
      }
    } catch (error) {
      console.error("文件处理失败:", error);
      alert("文件处理失败，请重试");
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 处理上传
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("请选择图片文件");
      return;
    }

    if (!imageName.trim()) {
      toast.error("图片名称不能为空");
      return;
    }

    try {
      setIsUploading(true);

      // 立即关闭弹窗并重置表单
      const uploadData = {
        file: selectedFile,
        imageName: imageName.trim(),
        prompts: prompts,
      };

      resetForm();
      onClose();

      // 开始后台上传，传递上传数据
      await onUpload(uploadData.file, uploadData.imageName, uploadData.prompts);
    } catch (error) {
      console.error("上传失败:", error);
      toast.error(
        "上传失败: " +
          (error instanceof Error ? error.message : "请检查网络连接后重试"),
      );
    } finally {
      setIsUploading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setImageName("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrompts([]);
    setIsEditingPrompts(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 关闭弹窗时重置表单
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 添加新提示词
  const addPrompt = () => {
    const newPrompt: Prompt = {
      id: generateId(),
      text: "新提示词",
      category: "default",
      tags: [],
      usageCount: 0,
      isTemplate: false,
      color: "slate",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPrompts([...prompts, newPrompt]);
  };

  // 更新提示词
  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setPrompts(
      prompts.map((prompt) =>
        prompt.id === id
          ? { ...prompt, ...updates, updatedAt: new Date() }
          : prompt,
      ),
    );
  };

  // 删除提示词
  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter((prompt) => prompt.id !== id));
  };

  // 复制提示词内容
  const copyPromptContent = (content: string) => {
    // 这里可以添加复制成功的提示
    console.log("复制提示词:", content);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl h-[95vh] p-0 flex flex-col">
        <DndContext onDragEnd={handleDragEnd}>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 custom-scrollbar">
              {/* 拖放区域 */}
              <div
                ref={setNodeRef}
                className={`
                border-2 border-dashed rounded-lg p-8
                flex flex-col items-center justify-center
                transition-colors duration-200
                ${dragActive ? "border-primary bg-primary/5" : "border-border"}
                ${selectedFile ? "bg-background" : "bg-muted/30"}
              `}
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
                      {imageName || "未选择文件"}
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

                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
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
              </div>
            </div>

            <div className="p-6 border-t bg-muted/30 flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !imageName.trim() || isUploading}
              >
                {isUploading ? "上传中..." : "提交"}
              </Button>
            </div>
          </div>
        </DndContext>
      </DialogContent>
    </Dialog>
  );
}
