"use client"

import * as React from "react"
import { Tag as TagIcon, Plus, Trash2 } from "lucide-react"
import { Tag, getColorTheme } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface TagManagementPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  onGroupNameChange?: (colorName: string, newName: string) => void
  customGroupNames?: Record<string, string>
  onTagCreate?: (tag: Omit<Tag, 'id'>) => Promise<Tag | undefined>
  onTagDelete?: (tagId: string) => Promise<void>
}

type GroupedTag = {
  title: string
  colorName: string
  color: any
  tags: Tag[]
}

function groupTagsByGroup(
  tags: Tag[],
  customNames: Record<string, string> = {}
): GroupedTag[] {
  const grouped = tags.reduce((acc, tag) => {
    const groupKey = tag.group || 'unassigned'
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  return Object.entries(grouped)
    .filter(([groupKey]) => groupKey !== 'unassigned')
    .map(([groupKey, tags]) => {
      const color = getColorTheme(groupKey)
      const title = customNames[groupKey] || color.name
      
      return {
        title,
        colorName: groupKey,
        color,
        tags: tags.sort((a, b) => (a.order || 0) - (b.order || 0))
      }
    })
}

// 未分组标签容器
function UnassignedTagsContainer({ tags, customGroupNames, onTagCreate, onTagDelete }: { 
  tags: Tag[], 
  customGroupNames: Record<string, string>,
  onTagCreate?: (tag: Omit<Tag, 'id'>) => Promise<Tag | undefined>,
  onTagDelete?: (tagId: string) => Promise<void>
}) {
  const [isAddingTag, setIsAddingTag] = React.useState(false)
  const [newTagName, setNewTagName] = React.useState('')

  const unassignedTags = tags.filter(tag => !tag.group)

  const handleAddTag = async () => {
    if (newTagName.trim() && onTagCreate) {
      await onTagCreate({
        name: newTagName.trim(),
        color: 'gray'
      })
      setNewTagName('')
      setIsAddingTag(false)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (onTagDelete) {
      await onTagDelete(tagId)
    }
  }

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-gray-700">未分组标签</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {unassignedTags.length}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingTag(true)}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {unassignedTags.map(tag => (
          <div key={tag.id} className="flex items-center gap-2 group">
            <div className="flex-1">
              <TagDisplay tag={tag} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteTag(tag.id)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {isAddingTag && (
          <div className="flex items-center gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag()
                if (e.key === 'Escape') {
                  setNewTagName('')
                  setIsAddingTag(false)
                }
              }}
              placeholder="输入标签名称"
              className="h-8 text-sm"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddTag}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
        {unassignedTags.length === 0 && !isAddingTag && (
          <p className="text-sm text-gray-500 text-center py-8">暂无未分组标签</p>
        )}
      </div>
    </div>
  )
}

// 分组容器
function GroupContainer({ group, customGroupNames, onGroupNameChange, onTagCreate, onTagDelete, onGroupDelete }: { 
  group: GroupedTag, 
  customGroupNames: Record<string, string>,
  onGroupNameChange?: (colorName: string, newName: string) => void,
  onTagCreate?: (tag: Omit<Tag, 'id'>) => Promise<Tag | undefined>,
  onTagDelete?: (tagId: string) => Promise<void>,
  onGroupDelete?: (colorName: string) => void
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editingName, setEditingName] = React.useState(group.title)
  const [isAddingTag, setIsAddingTag] = React.useState(false)
  const [newTagName, setNewTagName] = React.useState('')

  const handleNameSubmit = () => {
    if (editingName.trim() && editingName !== group.title) {
      onGroupNameChange?.(group.colorName, editingName.trim())
    }
    setIsEditing(false)
  }

  const handleAddTag = async () => {
    if (newTagName.trim() && onTagCreate) {
      await onTagCreate({
        name: newTagName.trim(),
        color: group.colorName,
        group: group.colorName
      })
      setNewTagName('')
      setIsAddingTag(false)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (onTagDelete) {
      await onTagDelete(tagId)
    }
  }

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: group.color?.bg }}
          />
          {isEditing ? (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit()
                if (e.key === 'Escape') {
                  setEditingName(group.title)
                  setIsEditing(false)
                }
              }}
              className="h-6 text-sm font-medium"
              autoFocus
            />
          ) : (
            <h3 
              className="font-medium text-sm text-gray-700 cursor-pointer hover:text-gray-900"
              onClick={() => setIsEditing(true)}
            >
              {group.title}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {group.tags.length}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingTag(true)}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
          {group.tags.length === 0 && onGroupDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGroupDelete(group.colorName)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {group.tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-2">
            <div className="flex-1">
              <TagDisplay tag={tag} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteTag(tag.id)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {isAddingTag && (
          <div className="flex items-center gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag()
                if (e.key === 'Escape') {
                  setNewTagName('')
                  setIsAddingTag(false)
                }
              }}
              placeholder="输入标签名称"
              className="h-8 text-sm"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddTag}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
        {group.tags.length === 0 && !isAddingTag && (
          <p className="text-sm text-gray-500 text-center py-8">暂无标签</p>
        )}
      </div>
    </div>
  )
}

// 标签显示组件
function TagDisplay({ tag }: { tag: Tag }) {
  const color = getColorTheme(tag.group || 'gray')

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg border hover:shadow-sm transition-all"
    >
      <div 
        className="w-2 h-2 rounded-full flex-shrink-0" 
        style={{ backgroundColor: color.bg }}
      />
      <span className="text-sm font-medium flex-1">{tag.name}</span>
      {tag.usageCount && (
        <Badge variant="outline" className="text-xs">
          {tag.usageCount}
        </Badge>
      )}
    </div>
  )
}

// 新增分组容器
function NewGroupContainer({ onGroupCreate }: { onGroupCreate: (colorName: string, groupName: string) => void }) {
  const [isCreating, setIsCreating] = React.useState(false)
  const [groupName, setGroupName] = React.useState('')
  const [selectedColor, setSelectedColor] = React.useState('blue')
  
  const availableColors = ['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'orange']
  
  const handleCreate = () => {
    if (groupName.trim()) {
      onGroupCreate(selectedColor, groupName.trim())
      setGroupName('')
      setIsCreating(false)
    }
  }
  
  if (!isCreating) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
        <Button
          variant="outline"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增分组
        </Button>
      </div>
    )
  }
  
  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 min-h-[200px]">
      <div className="space-y-4">
        <h3 className="font-medium text-sm text-gray-700">新增分组</h3>
        
        <div className="space-y-2">
          <label className="text-xs text-gray-600">分组名称</label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="输入分组名称"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-gray-600">选择颜色</label>
          <div className="grid grid-cols-4 gap-2">
            {availableColors.map(color => {
              const colorTheme = getColorTheme(color)
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorTheme.bg }}
                />
              )
            })}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCreating(false)
              setGroupName('')
            }}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!groupName.trim()}
            className="flex-1"
          >
            创建
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TagManagementPanel({
  open,
  onOpenChange,
  tags,
  onTagsChange,
  onGroupNameChange,
  customGroupNames = {},
  onTagCreate,
  onTagDelete
}: TagManagementPanelProps) {
  const [localCustomGroupNames, setLocalCustomGroupNames] = React.useState(customGroupNames)
  
  const groupedTags = React.useMemo(() => 
    groupTagsByGroup(tags, localCustomGroupNames),
    [tags, localCustomGroupNames]
  )

  const handleGroupNameChange = (colorName: string, newName: string) => {
    setLocalCustomGroupNames(prev => ({
      ...prev,
      [colorName]: newName
    }))
    onGroupNameChange?.(colorName, newName)
  }

  const handleGroupCreate = (colorName: string, groupName: string) => {
    setLocalCustomGroupNames(prev => ({
      ...prev,
      [colorName]: groupName
    }))
    onGroupNameChange?.(colorName, groupName)
  }

  const handleGroupDelete = (colorName: string) => {
    // 将该分组下的所有标签移动到未分组
    const updatedTags = tags.map(tag => {
      if (tag.group === colorName) {
        return { ...tag, group: undefined }
      }
      return tag
    })
    onTagsChange(updatedTags)
    
    // 删除自定义分组名称
    setLocalCustomGroupNames(prev => {
      const newNames = { ...prev }
      delete newNames[colorName]
      return newNames
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>标签管理</DialogTitle>
          <DialogDescription>
            管理和组织您的标签，点击分组名称可以编辑
          </DialogDescription>
        </DialogHeader>
        
        <div className="h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {/* 未分组标签容器 */}
            <UnassignedTagsContainer 
              tags={tags} 
              customGroupNames={localCustomGroupNames}
              onTagCreate={onTagCreate}
              onTagDelete={onTagDelete}
            />
            
            {/* 各个分组容器 */}
            {groupedTags.map(group => (
              <GroupContainer
                key={group.colorName}
                group={group}
                customGroupNames={localCustomGroupNames}
                onGroupNameChange={handleGroupNameChange}
                onTagCreate={onTagCreate}
                onTagDelete={onTagDelete}
                onGroupDelete={handleGroupDelete}
              />
            ))}
            
            {/* 新增分组按钮 */}
            <NewGroupContainer onGroupCreate={handleGroupCreate} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}