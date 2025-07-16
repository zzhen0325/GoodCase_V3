import { Tag, getColorTheme } from "@/types"

// 类型定义
export type GroupedTag = {
  title: string
  colorName: string
  color: any
  tags: Tag[]
}

// 按顺序排序标签
export function sortTagsByOrder(tags: Tag[]): Tag[] {
  return tags.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    return a.name.localeCompare(b.name)
  })
}

// 获取分组标题
export function getGroupTitle(groupKey: string, customNames: Record<string, string>, tag: Tag): string {
  if (customNames[groupKey]) return customNames[groupKey]
  if (tag.group) return tag.group
  const colorTheme = getColorTheme(tag.color)
  return colorTheme.name.charAt(0).toUpperCase() + colorTheme.name.slice(1)
}

// 按分组和颜色分组标签
export function groupTagsByColor(
  tags: Tag[], 
  customNames: Record<string, string> = {}
): GroupedTag[] {
  const grouped = tags.reduce((acc, tag) => {
    const groupKey = tag.group || tag.color
    const colorTheme = getColorTheme(tag.color)
    
    if (!acc[groupKey]) {
      acc[groupKey] = {
        title: getGroupTitle(groupKey, customNames, tag),
        colorName: groupKey,
        color: colorTheme,
        tags: []
      }
    }
    acc[groupKey].tags.push(tag)
    return acc
  }, {} as Record<string, GroupedTag>)
  
  const groups = Object.values(grouped)
  
  // 对每个分组内的标签排序
  groups.forEach(group => {
    group.tags = sortTagsByOrder(group.tags)
  })
  
  // 按标题排序分组
  groups.sort((a, b) => a.title.localeCompare(b.title))
  
  return groups
}