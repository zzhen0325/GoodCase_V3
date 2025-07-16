"use client"

import { Tag, getColorTheme } from "@/types"
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface TagItemProps {
  tag: Tag
  isSelected: boolean
  onToggle: () => void
}

export function TagItem({ tag, isSelected, onToggle }: TagItemProps) {
  const colorTheme = getColorTheme(tag.color)
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onToggle}
        className={`w-full justify-between ${
          isSelected ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0" 
            style={{ backgroundColor: colorTheme.bg }}
          />
          <span className="truncate text-sm">{tag.name}</span>
          {tag.usageCount && (
            <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
              {tag.usageCount}
            </span>
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}