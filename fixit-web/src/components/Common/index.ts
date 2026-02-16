// components/Common/index.ts
// 公共组件导出

export { Loading, useFullScreenLoading } from './Loading';
export { EmptyState, EmptyStates } from './EmptyState';
export { SkeletonCard, SkeletonTable, SkeletonDetail, SkeletonProfile } from './Skeleton';
export { ConfirmModal } from './ConfirmModal';
export { ErrorBoundary } from './ErrorBoundary';
export { ThemeSwitch } from './ThemeSwitch';
export { handleApiError, handleApiSuccess, useApiError, withLoading, ErrorFallback } from './api-error';
