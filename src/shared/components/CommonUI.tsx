/**
 * @module CommonUI
 * @description Re-exports Loading, Toast, Error components from focused modules.
 *
 * This file provides backward compatibility by re-exporting components
 * that were previously consolidated here. The components now live in
 * dedicated directories for better maintainability:
 *
 * - Loading/Loading.tsx
 * - Toast/Toast.tsx
 * - Error/Error.tsx
 */

// Re-export Error components
export {
	Error,
	ErrorBoundaryFallback,
	type ErrorBoundaryFallbackProps,
	ErrorComponent,
	type ErrorProps,
} from "./Error";
// Re-export Loading component
export { Loading, type LoadingProps } from "./Loading";
// Re-export Toast components
export {
	type IToastItem,
	Toast,
	ToastContainer,
	type ToastContainerProps,
	ToastItem,
	type ToastItemProps,
	type ToastProps,
} from "./Toast";
