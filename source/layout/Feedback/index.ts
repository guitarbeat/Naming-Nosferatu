/**
 * @module Feedback
 * @description Barrel export for all feedback components (Loading, Toast, Error, etc.)
 * Provides backward compatibility for existing imports from FeedbackComponents
 */

export { Loading, type LoadingProps } from "./Loading";
export { OfflineIndicator } from "./OfflineIndicator";
export { PerformanceBadges, TrendIndicator } from "./PerformanceBadges";
export {
	Toast,
	ToastContainer,
	type IToastItem,
} from "./Toast";
export { ErrorComponent, ErrorBoundary, type ErrorFallbackProps } from "./ErrorBoundary";
