# Hooks 架构说明

本项目已完成从旧的 `database` 模块到新的 Firestore API 的迁移，所有 hooks 现在直接使用 REST API 接口进行数据操作。

## 核心 Hooks

### 数据管理 Hooks

#### `useDataManager`
统一的数据管理 hook，提供所有数据类型的状态管理和基础操作。

```typescript
const {
  images, tags, categories, prompts,
  loading, error,
  refreshAll, refreshImages, refreshTags,
  getImageById, getTagById
} = useDataManager();
```

#### `useImageOperations`
图片相关操作 hook，包括上传、更新、删除、复制等功能。

```typescript
const {
  handleImageUpdate,
  handleImageUpload,
  handleImageDelete,
  handleImageDuplicate,
  handleCopyPrompt
} = useImageOperations({
  selectedImage,
  setImages,
  setSelectedImage,
  setIsImageModalOpen,
  onRefresh
});
```

#### `useTagOperations`
标签相关操作 hook，包括创建、更新、删除标签等功能。

```typescript
const {
  tags, selectedTags,
  createTag, updateTag, deleteTag,
  toggleTagSelection, getTagsByGroup
} = useTagOperations();
```


```

### 状态管理 Hooks

#### `useImageState`
图片状态管理，包括加载、搜索、筛选等功能。

```typescript
const {
  images, filteredImages, isLoading,
  searchFilters, connectionStatus,
  handleSearchChange, refetch, clearSearch
} = useImageState();
```

#### `useDataSync`
数据同步管理，提供手动刷新功能。

```typescript
const { refreshData } = useDataSync({
  setImages,
  setConnectionStatus
});
```

### 操作 Hooks

#### `useBatchOperations`
批量操作功能，包括批量删除、导出等。

```typescript
const {
  handleBatchDelete,
  handleBatchExport
} = useBatchOperations({
  selectedImageIds,
  filteredImages,
  setSelectedImageIds
});
```

### 页面级 Hooks

#### `useHomePage`
主页面状态管理，整合所有子 hooks。

```typescript
const {
  // 所有状态和操作
  images, tags, categories, prompts,
  handleImageUpdate, handleBatchDelete,
  displayedImages, loadMore
} = useHomePage();
```

## API 接口对应关系

| Hook 方法 | API 接口 | HTTP 方法 |
|-----------|----------|----------|
| `refreshImages` | `/api/images` | GET |
| `handleImageUpdate` | `/api/images/{id}` | PUT |
| `handleImageDelete` | `/api/images/{id}` | DELETE |
| `handleImageUpload` | `/api/images/upload` | POST |
| `createTag` | `/api/tags` | POST |
| `updateTag` | `/api/tags/{id}` | PATCH |
| `deleteTag` | `/api/tags/{id}` | DELETE |
| `refreshTags` | `/api/tags` | GET |
| `createCategory` | `/api/tag-categories` | POST |
| `updateCategory` | `/api/tag-categories/{id}` | PATCH |
| `deleteCategory` | `/api/tag-categories/{id}` | DELETE |
| `refreshCategories` | `/api/tag-categories` | GET |
| ~~`createPrompt`~~ | ~~`/api/prompts`~~ | ~~POST~~ |
| ~~`updatePrompt`~~ | ~~`/api/prompts/{id}`~~ | ~~PUT~~ |
| ~~`deletePrompt`~~ | ~~`/api/prompts/{id}`~~ | ~~DELETE~~ |
| ~~`refreshPrompts`~~ | ~~`/api/prompts`~~ | ~~GET~~ |

**注意：** 提示词(prompts)作为图片数据的一部分存储，通过图片API进行管理，不再有独立的API端点。

## 迁移说明

### 主要变更

1. **移除 `database` 依赖**: 所有 hooks 不再依赖 `@/lib/database` 模块
2. **使用 REST API**: 直接调用 `/api/*` 接口进行数据操作
3. **统一错误处理**: 所有 API 调用都包含统一的错误处理逻辑
4. **类型安全**: 严格按照 `@/types` 中定义的类型进行数据处理

### 数据流

```
组件 → Hook → REST API → Firestore → 响应 → Hook → 组件状态更新
```

### 错误处理

所有 hooks 都包含完整的错误处理机制：
- API 调用失败时抛出错误
- 错误信息会被记录到控制台
- 组件可以通过 try-catch 捕获错误进行处理

### 性能优化

1. **缓存状态**: 使用 React state 缓存数据，减少不必要的 API 调用
2. **批量操作**: 支持批量删除等操作，提高效率
3. **按需加载**: 只在需要时才调用相应的 API 接口

## 使用建议

1. **优先使用 `useDataManager`**: 对于需要多种数据类型的组件
2. **按需使用专门的 hooks**: 对于只需要特定功能的组件
3. **合理处理加载状态**: 利用 `loading` 状态提供良好的用户体验
4. **统一错误处理**: 在组件层面统一处理错误状态

## 示例用法

```typescript
// 在组件中使用
function ImageGallery() {
  const {
    images,
    loading,
    error,
    refreshImages,
    handleImageUpdate,
    handleImageDelete
  } = useHomePage();

  if (loading.images) return <Loading />;
  if (error.images) return <Error message={error.images} />;

  return (
    <div>
      {images.map(image => (
        <ImageCard
          key={image.id}
          image={image}
          onUpdate={handleImageUpdate}
          onDelete={handleImageDelete}
        />
      ))}
    </div>
  );
}
```