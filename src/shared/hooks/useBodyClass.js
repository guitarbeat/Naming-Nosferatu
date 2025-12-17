/**
 * @module useBodyClass
 * @description Hook to add/remove CSS classes on body and html elements
 */

import { useEffect } from "react";

/**
 * Hook to manage CSS classes on body and html elements
 * @param {string} className - The class name to add/remove
 */
export function useBodyClass(className) {
  useEffect(() => {
    if (!className) return;

    document.body.classList.add(className);
    document.documentElement.classList.add(className);

    return () => {
      document.body.classList.remove(className);
      document.documentElement.classList.remove(className);
    };
  }, [className]);
}
