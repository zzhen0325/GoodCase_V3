'use client';

import * as React from 'react';

import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';

interface GroupItemProps {
  children: React.ReactNode;
}

export function GroupItem({ children }: GroupItemProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-2">分组</div>
      </SidebarGroupLabel>
      {!isCollapsed && children}
    </SidebarGroup>
  );
}