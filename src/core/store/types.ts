// * Type definitions for React DevTools hook
// * These types help catch undefined property access at compile time with TypeScript strict mode

/**
 * React DevTools renderer object that Zustand devtools tries to access
 */
export interface ReactDevToolsRenderer {
  Activity?: unknown; // * Activity property that Zustand devtools tries to set
  [key: string]: unknown; // * Allow other properties
}

/**
 * Map of renderer IDs to renderer objects
 */
export type ReactDevToolsRenderersMap = Map<number, ReactDevToolsRenderer>;

/**
 * React DevTools global hook structure
 */
export interface ReactDevToolsHook {
  renderers: ReactDevToolsRenderersMap;
  [key: string]: unknown; // * Allow other properties
}

/**
 * Type guard to check if a value is a valid React DevTools renderer object
 * @param renderer - Value to check
 * @returns True if renderer is valid
 */
export function isValidRenderer(
  renderer: unknown,
): renderer is ReactDevToolsRenderer {
  return (
    renderer !== null &&
    renderer !== undefined &&
    typeof renderer === "object" &&
    !Array.isArray(renderer)
  );
}

/**
 * Type guard to check if React DevTools hook is valid and ready
 * @param hook - Hook to check
 * @returns True if hook is valid
 */
export function isValidReactDevToolsHook(
  hook: unknown,
): hook is ReactDevToolsHook {
  if (!hook || typeof hook !== "object") {
    return false;
  }

  const typedHook = hook as Record<string, unknown>;

  if (!typedHook.renderers) {
    return false;
  }

  const renderers = typedHook.renderers;

  // * Check if renderers is a Map-like structure
  if (
    typeof renderers !== "object" ||
    renderers === null ||
    typeof (renderers as { get?: unknown }).get !== "function" ||
    typeof (renderers as { keys?: unknown }).keys !== "function"
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard to check if all renderers in the hook are valid
 * @param hook - Hook to check
 * @returns True if all renderers are valid
 */
export function areAllRenderersValid(hook: ReactDevToolsHook): boolean {
  try {
    const rendererIds = Array.from(hook.renderers.keys());
    if (rendererIds.length === 0) {
      return false;
    }

    for (const rendererId of rendererIds) {
      const renderer = hook.renderers.get(rendererId);
      if (!isValidRenderer(renderer)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
