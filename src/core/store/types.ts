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
 * Check if a renderer object is writable (can have properties set on it)
 * This prevents "Cannot set properties of undefined" errors when Zustand devtools
 * tries to set the 'Activity' property
 * @param renderer - Renderer object to check
 * @returns True if renderer is writable
 */
function isRendererWritable(renderer: ReactDevToolsRenderer): boolean {
  // * Double-check renderer is not null or undefined
  if (renderer === null || renderer === undefined) {
    return false;
  }

  try {
    // * Test if we can set a property on the renderer
    // * Use a unique symbol-like key to avoid conflicts
    const testKey = "__ZUSTAND_WRITABILITY_TEST__";
    const originalValue = (renderer as Record<string, unknown>)[testKey];

    // * Try to set a test property
    (renderer as Record<string, unknown>)[testKey] = true;

    // * Check if the property was actually set
    const wasSet = (renderer as Record<string, unknown>)[testKey] === true;

    // * Restore original value or delete test property
    if (originalValue === undefined) {
      delete (renderer as Record<string, unknown>)[testKey];
    } else {
      (renderer as Record<string, unknown>)[testKey] = originalValue;
    }

    return wasSet;
  } catch {
    // * If setting property throws an error, renderer is not writable
    return false;
  }
}

/**
 * Type guard to check if all renderers in the hook are valid and writable
 * @param hook - Hook to check
 * @returns True if all renderers are valid and writable
 */
export function areAllRenderersValid(hook: ReactDevToolsHook): boolean {
  try {
    // * Ensure renderers map exists and is accessible
    if (!hook || !hook.renderers) {
      return false;
    }

    const rendererIds = Array.from(hook.renderers.keys());
    if (rendererIds.length === 0) {
      return false;
    }

    for (const rendererId of rendererIds) {
      const renderer = hook.renderers.get(rendererId);

      // * Check if renderer exists and is valid
      // * This prevents "Cannot set properties of undefined" errors
      if (!isValidRenderer(renderer)) {
        return false;
      }

      // * Check if renderer is writable before allowing devtools
      // * This prevents "Cannot set properties of undefined (setting 'Activity')" errors
      // * Note: isValidRenderer already checks for null/undefined, but we double-check here
      if (renderer === null || renderer === undefined) {
        return false;
      }

      if (!isRendererWritable(renderer)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    // * If any error occurs during validation, consider renderers invalid
    // * This prevents errors from propagating and causing runtime issues
    if (process.env.NODE_ENV === "development") {
      console.warn("[Zustand] Error validating renderers:", error);
    }
    return false;
  }
}
