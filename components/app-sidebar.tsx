"use client";

import * as React from "react";
import { GalleryVerticalEnd, Upload, MoreHorizontal, Tag } from "lucide-react";
import { SearchFilters } from "@/types";
import { useTagOperations } from "@/hooks/use-tag-operations";

import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { GroupItem } from "@/components/sidebar/group-item";

interface ToolButton {
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSearch?: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
  onUpload?: () => void;
  toolButtons?: ToolButton[];
}

export function AppSidebar({
  onSearch,
  currentFilters,
  onUpload,
  toolButtons,
  ...props
}: AppSidebarProps) {
  const [customGroupNames, setCustomGroupNames] = React.useState<
    Record<string, string>
  >({});
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(),
  );

  // 获取标签数据
  const {
    tagGroups,
    tags,
    loading: tagsLoading,
    getTagsByGroup,
  } = useTagOperations();

  const handleGroupNameChange = (colorName: string, newName: string) => {
    setCustomGroupNames((prev) => ({ ...prev, [colorName]: newName }));
  };

  // 处理标签点击筛选
  const handleTagClick = (tagId: string) => {
    const currentTags = currentFilters?.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((id) => id !== tagId)
      : [...currentTags, tagId];

    onSearch?.({
      query: currentFilters?.query || "",
      tags: newTags,
      dateRange: currentFilters?.dateRange,
      sizeRange: currentFilters?.sizeRange,
      sortBy: currentFilters?.sortBy || "createdAt",
      sortOrder: currentFilters?.sortOrder || "desc",
    });
  };

  // 切换分组展开状态
  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // 获取分组的标签
  const getGroupTags = (groupId: string) => {
    return tags.filter((tag) => tag.groupId === groupId);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-16 flex items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full mt-2 px-2">
              <SidebarMenuButton size="lg" asChild className="flex-1">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-xl">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">Lemon8</span>
                  </div>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end"></DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* 搜索栏区域 */}
        <div className="px-4 mt-6">
          <SearchBar
            onSearch={onSearch || (() => {})}
            currentFilters={currentFilters}
          />
        </div>

        {/* 标签分组区域 */}
        <SidebarGroup className="mt-6">
          <div className="px-4 mb-3">
            <h3 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              标签筛选
            </h3>
          </div>

          {tagsLoading ? (
            <div className="px-4 text-sm text-muted-foreground">加载中...</div>
          ) : (
            <SidebarMenu>
              {tagGroups.map((group) => {
                const groupTags = getGroupTags(group.id);
                const isExpanded = expandedGroups.has(group.id);
                const selectedTags = currentFilters?.tags || [];

                return (
                  <SidebarMenuItem key={group.id}>
                    <div className="space-y-1">
                      {/* 分组标题 */}
                      <SidebarMenuButton
                        onClick={() => toggleGroupExpanded(group.id)}
                        className="w-full justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          <span>{group.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({groupTags.length})
                          </span>
                        </div>
                        <span
                          className={`text-xs transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        >
                          ▶
                        </span>
                      </SidebarMenuButton>

                      {/* 标签列表 */}
                      {isExpanded && (
                        <div className="ml-4 space-y-1">
                          {groupTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                onClick={() => handleTagClick(tag.id)}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                                  isSelected
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{tag.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({tag.usageCount})
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* 工具按钮 */}
        {toolButtons?.length && (
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
        <div className="px-4">
          <Button
            onClick={onUpload}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 mb-6 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            size="lg"
          >
            <Upload className="w-5 h-5" />
            上传图片
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
