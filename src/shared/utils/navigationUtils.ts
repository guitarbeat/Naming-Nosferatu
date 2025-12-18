/**
 * @module navigationUtils
 * @description Utilities for handling navigation and routing
 */

/**
 * Normalize a route path by ensuring it starts with /
 * @param routeValue - The route value to normalize
 * @returns Normalized route path
 */
export function normalizeRoutePath(routeValue: string): string {
  if (!routeValue) return "/";
  return routeValue.startsWith("/") ? routeValue : `/${routeValue}`;
}
