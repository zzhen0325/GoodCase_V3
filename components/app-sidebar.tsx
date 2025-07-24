'use client';

import * as React from 'react';
import { GalleryVerticalEnd, MoreHorizontal, Tag, Settings, Download, Upload, Bot, FileText } from 'lucide-react';
import { SearchFilters } from '@/types';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { Button } from '@/components/ui/button';
import { TagManagementPanel } from '@/components/tags/tag-management-panel';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { GroupItem } from '@/components/sidebar/group-item';
import { TagGroups } from '@/components/sidebar/tag-groups';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSearch?: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
  onUpload?: () => void;
  onImport?: () => void;
  onExport?: () => void;
}

export function AppSidebar({
  onSearch,
  currentFilters,
  onUpload,
  onImport,
  onExport,
  ...props
}: AppSidebarProps) {
  const [customGroupNames, setCustomGroupNames] = React.useState<
    Record<string, string>
  >({});
  const [tagManagementOpen, setTagManagementOpen] = React.useState(false);

  // 获取标签数据
  const {
    tagCategories,
    tags,
    loading: tagsLoading,
    getTagsByCategory,
  } = useTagOperations();

  const handleGroupNameChange = (colorName: string, newName: string) => {
    setCustomGroupNames((prev) => ({ ...prev, [colorName]: newName }));
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="sidebar-header h-24 ">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center  justify-between w-full  h-24 px-4">
              <SidebarMenuButton size="lg" asChild className="flex-1 hover:bg-transparent hover:text-current">
                <a href="#">
                  <img src="/android-chrome-192x192.png" alt="Logo" className="w-8 h-8" />
                  <div className="flex flex-col gap-2 leading-none ">
                    <span className="font-bold text-2xl text-black">Gooooodcase!</span>
                  </div>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="dropdown-trigger">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTagManagementOpen(true)}>
                    <Settings className="h-4 w-4" />
                    标签管理
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onImport}>
                    <Upload className="h-4 w-4" />
                    导入数据
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="h-4 w-4" />
                    导出数据
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* 标签分组区域 */}
        <SidebarGroup className="tag-groups-area">
          <TagGroups
            tagCategories={tagCategories}
            tags={tags}
            currentFilters={currentFilters}
            onSearch={onSearch}
            loading={tagsLoading}
          />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-2 p-4">
              <Button
                onClick={() => {
                  // 处理 lemo promptBlock 功能
                  console.log('Lemo Prompt clicked');
                }}
                variant="outline"
                className="w-full h-10 justify-start"
                size="sm"
              >
                <Bot className="h-4 w-4" />
                Lemo Prompt
              </Button>
              <Button
                onClick={() => {
                  // 打开 lemon8 AI wiki
                  window.open(
                    'https://bytedance.larkoffice.com/wiki/HNHvwAjVzicLVuk1r5ictnNKncg',
                    '_blank'
                  );
                }}
                variant="outline"
                className="w-full h-10 justify-start"
                size="sm"
              >
                <FileText className="h-4 w-4" />
                Lemon8 AI Wiki
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      {/* 标签管理面板 */}
      <TagManagementPanel
        open={tagManagementOpen}
        onOpenChange={setTagManagementOpen}
      />
    </Sidebar>
  );
}
