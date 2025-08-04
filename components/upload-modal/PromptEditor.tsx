'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { PromptBlock } from '@/types';
import { PromptBlock as PromptBlockComponent } from '../prompt-block';
import { generateId } from '@/lib/utils';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

interface PromptEditorProps {
  promptBlocks: PromptBlock[];
  onPromptsChange: (promptBlocks: PromptBlock[]) => void;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  disabled?: boolean;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  promptBlocks,
  onPromptsChange,
  isEditing,
  onEditingChange,
  disabled = false
}) => {
  // 添加新提示词
  const addPrompt = () => {
    const newPrompt: PromptBlock = {
      id: `temp_${generateId()}`,
      title: 'New Prompt',
      content: '',
      color: 'pink',
      order: promptBlocks.length
    };
    onPromptsChange([...promptBlocks, newPrompt]);
  };

  // 更新提示词
  const updatePrompt = (id: string, updates: Partial<PromptBlock>) => {
    onPromptsChange(
      promptBlocks.map((promptBlock) =>
        promptBlock.id === id ? { ...promptBlock, ...updates } : promptBlock
      )
    );
  };

  // 删除提示词
  const deletePrompt = (id: string) => {
    onPromptsChange(promptBlocks.filter((promptBlock) => promptBlock.id !== id));
  };

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = promptBlocks.findIndex(p => p.id === active.id);
    const newIndex = promptBlocks.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newPrompts = [...promptBlocks];
    const [movedPrompt] = newPrompts.splice(oldIndex, 1);
    newPrompts.splice(newIndex, 0, movedPrompt);

    // 更新order
    const updatedPrompts = newPrompts.map((prompt, index) => ({
      ...prompt,
      order: index
    }));

    onPromptsChange(updatedPrompts);
  };

  // 复制提示词内容
  const copyPromptContent = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      console.log('复制提示词:', content);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">提示词</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditingChange(!isEditing)}
            disabled={disabled}
            className="text-xs"
          >
            {isEditing ? '完成编辑' : '编辑'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addPrompt}
            disabled={disabled}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[200px]">
        <DndContext onDragEnd={handleDragEnd}>
          <div className="space-y-2 pr-2">
            <AnimatePresence>
              {promptBlocks.map((promptBlock, index) => (
                <motion.div
                  key={promptBlock.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <PromptBlockComponent
                    promptBlock={promptBlock}
                    isEditing={isEditing}
                    onUpdate={(id, updates) => updatePrompt(id, updates)}
                    onDelete={() => deletePrompt(promptBlock.id)}
                    onCopy={() => copyPromptContent(promptBlock.content)}
                    showDragHandle={isEditing}
                    disabled={disabled}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {promptBlocks.length === 0 && (
              <div className="text-center py-8 text-muted">
                <div className="text-sm">暂无提示词</div>
                <div className="text-xs mt-1">点击&quot;添加&quot;按钮创建提示词</div>
              </div>
            )}
          </div>
        </DndContext>
      </ScrollArea>
    </div>
  );
};
