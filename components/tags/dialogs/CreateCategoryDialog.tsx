import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from '@/lib/enhanced-toast';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; color?: string }) => void;
  initialData?: { name: string; color?: string };
}

export function CreateCategoryDialog({ open, onOpenChange, onConfirm, initialData }: CreateCategoryDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>('pink');
  const [isCreating, setIsCreating] = useState(false);
  
  const isEditMode = !!initialData;
  
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setColor(initialData.color || 'pink');
    } else {
      setName('');
      setColor('pink');
    }
  }, [initialData, open]);

  const handleSubmit = async () => {
    if (!name.trim() || isCreating) return;
    
    setIsCreating(true);
    
    // 显示进度条
    const progressToastId = toast.progress({
      progress: 0,
      message: isEditMode ? '正在更新分类...' : '正在创建分类...',
      description: `${isEditMode ? '更新' : '创建'}分类 "${name.trim()}"`
    });

    try {
      // 模拟进度更新
      toast.updateProgress(progressToastId, {
        progress: 50,
        message: '验证分类信息...'
      });

      await onConfirm({ name: name.trim(), color });
      
      toast.completeProgress(progressToastId, isEditMode ? '分类更新成功' : '分类创建成功');
      setName('');
      setColor('pink');
    } catch (error) {
      console.error('操作分类失败:', error);
      toast.failProgress(progressToastId, isEditMode ? '分类更新失败' : '分类创建失败');
    } finally {
      setIsCreating(false);
    }
  };

  const colorOptions = [
    { name: 'pink', label: '粉色', colors: { bg: '#FFE5FA', primary: '#F4BFEA' } },
    { name: 'cyan', label: '青色', colors: { bg: '#D7F9FF', primary: '#80E3F5' } },
    { name: 'yellow', label: '黄色', colors: { bg: '#FFF7D7', primary: '#FFE1B3' } },
    { name: 'green', label: '绿色', colors: { bg: '#D1FFCB', primary: '#A6E19E' } },
    { name: 'purple', label: '紫色', colors: { bg: '#EADDFF', primary: '#D8C0FF' } },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑标签分类' : '创建标签分类'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '修改标签分类的名称和颜色。' : '创建一个新的标签分类来组织您的标签。'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 ">
          <div>
            <Label htmlFor="category-name">分类名称</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入分类名称"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label>分类颜色</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {colorOptions.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => setColor(option.name)}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg border-2 transition-all',
                    color === option.name ? 'border-border ' : 'border-transparent hover:border-gray-300'
                  )}
                  style={{ backgroundColor: option.colors.bg }}
                >
                  <div
                    className="w-6 h-6 rounded-full mb-1"
                    style={{ backgroundColor: option.colors.primary }}
                  />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className='px-6'>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name?.trim() || isCreating} className="bg-accent text-black px-6">
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isCreating 
              ? (isEditMode ? '保存中...' : '创建中...') 
              : (isEditMode ? '保存' : '创建')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
