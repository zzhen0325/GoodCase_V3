// 核心 hooks
export * from './core';

// 数据相关 hooks
export * from './data';

// UI相关 hooks
export * from './ui';

// 原有数据管理相关 hooks (保持向后兼容)
export { useDataManager } from './use-data-manager';
export { useImageOperations } from './use-image-operations';
// useTagOperations 已迁移到 hooks/data/useTags.ts
export { useDataSync } from './use-data-sync';

// 状态管理相关 hooks
export { useImageState } from './use-image-state';
export { useModalState } from './use-modal-state';
export { useEditMode } from './use-edit-mode';

// 操作相关 hooks
export { useBatchOperations } from './use-batch-operations';
export { useNavigation } from './use-navigation';
export { useTagFilter } from './use-tag-filter';

// 页面相关 hooks
export { useInfiniteScroll } from './use-infinite-scroll';

// 工具相关 hooks
export { useIsMobile } from './use-mobile';