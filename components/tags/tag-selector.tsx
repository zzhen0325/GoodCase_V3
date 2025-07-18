import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Tags, X, ChevronDown, Plus } from 'lucide-react';
import { Tag, TagGroup } from '@/types';
import { TagItem } from './tag-item';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  tags: Tag[];
  tagGroups: TagGroup[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  onCreateTag?: (name: string, groupId: string) => void;
  placeholder?: string;
  maxSelectedTags?: number;
  disabled?: boolean;
  className?: string;
}

export function TagSelector({
  tags,
  tagGroups,
  selectedTagIds,
  onTagsChange,
  onCreateTag,
  placeholder = '选择标签...',
  maxSelectedTags,
  disabled = false,
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 获取选中的标签对象
  const selectedTags = useMemo(() => {
    return tags.filter((tag) => selectedTagIds.includes(tag.id));
  }, [tags, selectedTagIds]);

  // 根据搜索查询过滤标签
  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags;
    return tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tags, searchQuery]);

  // 根据分组组织过滤后的标签
  const groupedFilteredTags = useMemo(() => {
    const grouped: Record<string, { group: TagGroup; tags: Tag[] }> = {};

    tagGroups.forEach((group) => {
      const groupTags = filteredTags.filter((tag) => tag.groupId === group.id);
      if (groupTags.length > 0 || !searchQuery) {
        grouped[group.id] = { group, tags: groupTags };
      }
    });

    return grouped;
  }, [tagGroups, filteredTags, searchQuery]);

  // 切换标签选择
  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTagIds.includes(tag.id);

    if (isSelected) {
      onTagsChange(selectedTagIds.filter((id) => id !== tag.id));
    } else {
      if (maxSelectedTags && selectedTagIds.length >= maxSelectedTags) {
        return; // 达到最大选择数量
      }
      onTagsChange([...selectedTagIds, tag.id]);
    }
  };

  // 移除标签
  const removeTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter((id) => id !== tagId));
  };

  // 清空所有选择
  const clearAll = () => {
    onTagsChange([]);
  };

  // 切换分组展开状态
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // 创建新标签
  const handleCreateTag = (groupId: string) => {
    if (searchQuery.trim() && onCreateTag) {
      onCreateTag(searchQuery.trim(), groupId);
      setSearchQuery('');
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-[40px] h-auto"
            disabled={disabled}
          >
            <div className="flex items-center gap-2 flex-1">
              <Tags className="w-4 h-4 text-muted-foreground" />

              {selectedTags.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <div className="flex flex-wrap gap-1 flex-1">
                  {selectedTags.map((tag) => {
                    const group = tagGroups.find((g) => g.id === tag.groupId);
                    return (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: group?.color + '20',
                          color: group?.color,
                        }}
                      >
                        {tag.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-3 w-3 p-0 ml-1 hover:bg-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTag(tag.id);
                          }}
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll();
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {selectedTags.length > 0 && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedTags.length} 个标签
                  {maxSelectedTags && ` / ${maxSelectedTags}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-6 text-xs"
                >
                  清空
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {Object.entries(groupedFilteredTags).map(
                ([groupId, { group, tags: groupTags }]) => (
                  <div key={groupId} className="mb-3">
                    <div
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => toggleGroup(groupId)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-medium text-sm">
                          {group.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {groupTags.length}
                        </Badge>
                      </div>

                      {searchQuery && onCreateTag && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateTag(groupId);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          创建
                        </Button>
                      )}
                    </div>

                    {(expandedGroups.has(groupId) || searchQuery) && (
                      <div className="ml-4 space-y-1">
                        {groupTags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center justify-between p-1 hover:bg-muted/30 rounded"
                          >
                            <TagItem
                              tag={tag}
                              group={group}
                              selected={selectedTagIds.includes(tag.id)}
                              showUsageCount
                              size="sm"
                              onClick={() => toggleTag(tag)}
                              className="cursor-pointer"
                            />
                          </div>
                        ))}

                        {groupTags.length === 0 && searchQuery && (
                          <div className="text-center py-2 text-muted-foreground text-sm">
                            未找到匹配的标签
                          </div>
                        )}
                      </div>
                    )}

                    {groupId !==
                      Object.keys(groupedFilteredTags)[
                        Object.keys(groupedFilteredTags).length - 1
                      ] && <Separator className="mt-2" />}
                  </div>
                )
              )}

              {Object.keys(groupedFilteredTags).length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {searchQuery ? '未找到匹配的标签' : '暂无标签'}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
