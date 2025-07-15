"use client"

import * as React from "react"
import { GalleryVerticalEnd, Tag as TagIcon, Upload } from "lucide-react"
import { Tag, getColorTheme, SearchFilters } from "@/types"
import { SearchBar } from "@/components/search-bar"
import { Button } from "@/components/ui/button"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tags: Tag[]
  selectedTags: Tag[]
  onTagClick?: (tag: Tag) => void
  onTagToggle?: (tag: Tag) => void
  onSearch?: (filters: { query: string; tags: Tag[] }) => void
  onTagsChange?: (tags: Tag[]) => void
  onUpload?: () => void
}

// 按颜色分组标签
function groupTagsByColor(tags: Tag[]) {
  const grouped = tags.reduce((acc, tag) => {
    const colorTheme = getColorTheme(tag.color)
    const colorName = colorTheme.name
    if (!acc[colorName]) {
      acc[colorName] = {
        title: colorName.charAt(0).toUpperCase() + colorName.slice(1),
        color: colorTheme,
        tags: []
      }
    }
    acc[colorName].tags.push(tag)
    return acc
  }, {} as Record<string, { title: string; color: any; tags: Tag[] }>)
  
  return Object.values(grouped)
}

export function AppSidebar({ tags, selectedTags, onTagClick, onTagToggle, onSearch, onTagsChange, onUpload, ...props }: AppSidebarProps) {
  const groupedTags = groupTagsByColor(tags)
  
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              {/* <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">标签管理</span>
                  <span className="text-xs">{tags.length} 个标签</span>
                </div>
              </a> */}
            </SidebarMenuButton>
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
        {/* ALL 选项
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={selectedTags.length === 0}
                onClick={() => onTagsChange?.([])}
              >
                <button className="w-full flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span>ALL</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {tags.length}
                  </span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
         */}
        {groupedTags.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>
              {group.title} ({group.tags.length})
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.tags.map((tag) => {
                const isSelected = selectedTags.some(t => t.id === tag.id)
                const tagTheme = getColorTheme(tag.color)
                return (
                  <SidebarMenuItem key={tag.id}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isSelected}
                      onClick={() => onTagToggle?.(tag)}
                    >
                      <button className="w-full flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <TagIcon className="size-3" />
                          <span>{tag.name}</span>
                        </div>
                        {tag.usageCount && (
                          <span className="text-xs text-muted-foreground">
                            {tag.usageCount}
                          </span>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <Button
          onClick={onUpload}
          className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mb-3"
          size="lg"
        >
          <Upload className="w-5 h-5" />
          上传图片
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}