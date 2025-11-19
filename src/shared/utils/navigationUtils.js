/**
 * Utility helpers for working with application routes.
 */
export function normalizeRoutePath(routeValue) {
  if (typeof routeValue !== "string") {
    return "/";
  }

  const [path] = routeValue.split(/[?#]/);

  if (!path) {
    return "/";
  }

  if (path.length > 1 && path.endsWith("/")) {
    return path.replace(/\/+$/, "") || "/";
  }

  return path;
}
