"use client"

import * as React from "react"
import { GroupedTag } from "@/lib/tag-utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"

interface GroupItemProps {
  group: GroupedTag
  children: React.ReactNode
}

export function GroupItem({ group, children }: GroupItemProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel 
        className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 px-2 py-1 rounded-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2 flex-1">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: group.color.bg }}
          />
          <span className="text-sm font-medium">
            {group.title}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {group.tags.length}
        </span>
      </SidebarGroupLabel>
      {!isCollapsed && children}
    </SidebarGroup>
  )
}