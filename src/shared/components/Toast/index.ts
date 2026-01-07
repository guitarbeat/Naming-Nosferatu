// Re-export from UnifiedToast (existing component)

// Re-export from new Toast module (extracted from CommonUI)
export {
	type IToastItem,
	Toast,
	ToastContainer,
	type ToastContainerProps,
	ToastItem,
	type ToastItemProps,
	type ToastProps,
} from "./Toast";
export type {
	ToastProps as UnifiedToastProps,
	ToastVariant,
} from "./UnifiedToast";
export { Toast as UnifiedToast } from "./UnifiedToast";
