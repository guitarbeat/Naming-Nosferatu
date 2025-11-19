/**
 * @module componentUtils
 * @description Consolidated component utilities for common patterns and behaviors.
 * Re-exports from modular hook files for backward compatibility.
 */

import useLocalStorage from "../../core/hooks/useLocalStorage";

// * Re-export form utilities
export { useFormState } from "./components/formUtils";

// * Re-export state management hooks
export {
  useLoadingState,
  useErrorState,
  useAsyncOperation,
} from "./components/stateHooks";

// * Re-export interaction hooks
export {
  useClickOutside,
  useKeyboardHandler,
  useFocusManager,
} from "./components/interactionHooks";

// * Re-export utility hooks
export {
  useDebounce,
  useThrottle,
  useMediaQuery,
  useVisibilityManager,
  usePrevious,
  useForceUpdate,
} from "./components/utilityHooks";

export default {
    useFormState,
    useLoadingState,
    useErrorState,
    useAsyncOperation,
    useDebounce,
    useThrottle,
    useClickOutside,
    useKeyboardHandler,
    useFocusManager,
    useVisibilityManager,
    useLocalStorage,
    useMediaQuery,
    usePrevious,
  useForceUpdate,
};

// * Re-export useLocalStorage for convenience
export { default as useLocalStorage } from "../../core/hooks/useLocalStorage";
