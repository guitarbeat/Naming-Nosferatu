import type { BuildNavItemsContext, NavItem, NavItemConfig } from "./types";

/**
 * Check if a route is currently active
 *
 * Rules:
 * - Root route ("/") requires exact match
 * - Other routes match if current route starts with the route
 *
 * @param route - The route to check
 * @param currentRoute - The current active route
 * @returns true if the route is active
 */
function isRouteActive(
  route: string | undefined,
  currentRoute: string | undefined,
): boolean {
  if (!route || !currentRoute) {
    return false;
  }
  if (route === "/") {
    return currentRoute === "/";
  }
  return currentRoute.startsWith(route);
}

/**
 * Transform navigation configuration into runtime navigation items
 *
 * This function:
 * - Computes active state based on current route
 * - Attaches onClick handlers for routes
 * - Recursively transforms children
 * - Ensures ariaLabel is always present
 *
 * @param context - Build context with current route and handlers
 * @param items - Navigation configuration items to transform
 * @returns Runtime navigation items ready for rendering
 */
export function buildNavItems(
  context: BuildNavItemsContext,
  items: NavItemConfig[],
): NavItem[] {
  const { currentRoute, onNavigate } = context;

  return items.map((config) => {
    const isActive = isRouteActive(config.route, currentRoute);

    const onClick =
      config.route && onNavigate
        ? () => {
            // We know config.route exists because of the condition above
            const route = config.route;
            if (route) {
              onNavigate(route);
            }
          }
        : undefined;

    return {
      key: config.key,
      label: config.label,
      icon: config.icon,
      type: config.type,
      ariaLabel: config.ariaLabel || config.label,
      isActive,
      onClick,
      children: config.children
        ? buildNavItems(context, config.children)
        : undefined,
    };
  });
}

/**
 * Find a navigation item by key (searches recursively)
 *
 * @param items - Navigation items to search
 * @param key - The key to find
 * @returns The found navigation item or undefined
 */
export function findNavItem(
  items: NavItemConfig[],
  key: string,
): NavItemConfig | undefined {
  for (const item of items) {
    if (item.key === key) {
      return item;
    }
    if (item.children) {
      const found = findNavItem(item.children, key);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Get navigation items for bottom nav by keys
 *
 * @param allItems - All available navigation items
 * @param keys - Keys of items to include in bottom nav
 * @returns Filtered navigation items for bottom nav
 */
export function getBottomNavItems(
  allItems: NavItemConfig[],
  keys: string[],
): NavItemConfig[] {
  return keys
    .map((key) => findNavItem(allItems, key))
    .filter((item): item is NavItemConfig => Boolean(item));
}
