// Re-export from UnifiedToast (existing component)
export { Toast as UnifiedToast } from "./UnifiedToast";
export type { ToastProps as UnifiedToastProps, ToastVariant } from "./UnifiedToast";

// Re-export from new Toast module (extracted from CommonUI)
export {
    Toast,
    ToastItem,
    ToastContainer,
    type ToastProps,
    type ToastItemProps,
    type ToastContainerProps,
    type IToastItem,
} from "./Toast";
