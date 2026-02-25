/**
 * Application polyfills to ensure compatibility across different environments.
 * This file should be imported before any other application code in the entry point.
 */

// Polyfill window.matchMedia if it's missing (e.g. in some test environments or older browsers)
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
