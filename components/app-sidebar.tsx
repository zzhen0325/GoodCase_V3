"use client"

import * as React from "react"
import { GalleryVerticalEnd, Tag as TagIcon, Upload, MoreHorizontal } from "lucide-react"
import { Tag, SearchFilters } from "@/types"

import { SearchBar } from "@/components/search-bar"
import { Button } from "@/components/ui/button"
import { TagManagementPanel } from "@/components/tag-management-panel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { groupTagsByColor, type GroupedTag } from "@/lib/tag-utils"
import { TagItem } from "@/components/sidebar/tag-item"
import { GroupItem } from "@/components/sidebar/group-item"

interface ToolButton {
  label: string
  icon: React.ComponentType<any>
  onClick: () => void
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tags: Tag[]
  selectedTags: Tag[]
  onTagToggle?: (tag: Tag) => void
  onSearch?: (filters: SearchFilters) => void
  onTagsChange?: (tags: Tag[]) => void
  onUpload?: () => void
  onGroupNameChange?: (colorName: string, newName: string) => void
  toolButtons?: ToolButton[]
}



export function AppSidebar({ tags, selectedTags, onTagToggle, onSearch, onTagsChange, onUpload, onGroupNameChange, toolButtons, ...props }: AppSidebarProps) {
  const [customGroupNames, setCustomGroupNames] = React.useState<Record<string, string>>({})
  const [showTagManagement, setShowTagManagement] = React.useState(false)
  
  const groupedTags = React.useMemo(() => 
    groupTagsByColor(tags, customGroupNames),
    [tags, customGroupNames]
  )

  const handleGroupNameChange = (colorName: string, newName: string) => {
    setCustomGroupNames(prev => ({
      ...prev,
      [colorName]: newName
    }))
    onGroupNameChange?.(colorName, newName)
  }
  
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full">
              <SidebarMenuButton size="lg" asChild className="flex-1">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">goodcase</span>
                    <span className="text-xs">{tags.length} 个标签</span>
                  </div>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowTagManagement(true)}>
                    <TagIcon className="w-4 h-4 mr-2" />
                    标签管理
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* 搜索栏 */}
        <div className="px-2 pt-2">
          <SearchBar
            availableTags={tags}
            selectedTags={selectedTags}
            onSearch={onSearch || (() => {})}
            onTagsChange={onTagsChange || (() => {})}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groupedTags.map((group, index) => (
          <GroupItem
            key={group.colorName}
            group={group}
          >
            <SidebarMenu>
              {group.tags.map((tag) => (
                <TagItem
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedTags.some(t => t.id === tag.id)}
                  onToggle={() => onTagToggle?.(tag)}
                />
              ))}
            </SidebarMenu>
          </GroupItem>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {/* 工具按钮 */}
        {toolButtons && toolButtons.length > 0 && (
          <SidebarGroup>
            <SidebarMenu>
              {toolButtons.map((button, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    onClick={button.onClick}
                    className="w-full"
                  >
                    <button.icon className="w-4 h-4" />
                    <span>{button.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
        
        {/* 上传按钮 */}
        <Button
          onClick={onUpload}
          className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          size="lg"
        >
          <Upload className="w-5 h-5" />
          上传图片
        </Button>
      </SidebarFooter>
      
      {onTagsChange && (
        <TagManagementPanel
          open={showTagManagement}
          onOpenChange={setShowTagManagement}
          tags={tags}
          onTagsChange={onTagsChange}
          onGroupNameChange={onGroupNameChange}
          customGroupNames={customGroupNames}
          onTagCreate={async (tagData) => {
            // 这里可以调用创建标签的API
            console.log('创建标签:', tagData);
            return undefined;
          }}
          onTagDelete={async (tagId) => {
            // 这里可以调用删除标签的API
            console.log('删除标签:', tagId);
          }}
        />
      )}
    </Sidebar>
  )
}