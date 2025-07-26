import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PromptBlock as PromptBlockComponent } from '@/components/prompt-block';
import { PromptBlock } from '@/types';

interface PromptListProps {
  promptBlocks: PromptBlock[];
  isEditing: boolean;
  onUpdate: (id: string, updates: Partial<PromptBlock>) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
}

export function PromptList({ promptBlocks, isEditing, onUpdate, onDelete, onCopy }: PromptListProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 max-h-[calc(75vh-220px)]">
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-6 pt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-md font-medium text-black">
                  Prompts 
                </label>
              </div>

              <SortableContext
                items={promptBlocks.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {promptBlocks.map((promptBlock) => (
                    <PromptBlockComponent
                      key={promptBlock.id}
                      promptBlock={{
                        id: promptBlock.id,
                        title: promptBlock.title,
                        content: promptBlock.content || '',
                        color: promptBlock.color || 'pink',
                        
                      }}
                      isEditing={isEditing}
                      onUpdate={(id, updates) => {
                        onUpdate(id, {
                          title: updates.title !== undefined ? updates.title : promptBlock.title,
                          content: updates.content || promptBlock.content,
                          color: (updates.color as any) || promptBlock.color,
                          
                        });
                      }}
                      onDelete={onDelete}
                      onCopy={onCopy}
                    />
                  ))}
                </div>
              </SortableContext>

              {promptBlocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">暂无提示词</p>
                  {isEditing && (
                    <p className="text-xs mt-1">点击上方按钮添加提示词</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// 拖拽覆盖层组件
PromptList.DragOverlay = function PromptListDragOverlay({ 
  promptBlock, 
  isEditing 
}: { 
  promptBlock: PromptBlock; 
  isEditing: boolean; 
}) {
  return (
    <div 
      className="pointer-events-none"
      style={{
        transform: 'rotate(5deg) scale(1.05)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        zIndex: 1000,
        opacity: 0.9
      }}
    >
      <PromptBlockComponent
        promptBlock={{
          id: promptBlock.id,
          title: promptBlock.title,
          content: promptBlock.content || '',
          color: promptBlock.color || 'default'
        }}
        isEditing={isEditing}
        onUpdate={() => {}}
        onDelete={() => {}}
        onCopy={() => {}}
      />
    </div>
   );
 };