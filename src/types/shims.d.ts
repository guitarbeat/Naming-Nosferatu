declare module "@utils/navigationUtils" {
  export function normalizeRoutePath(path: string): string;
  export function getNextRoute(route: string): string;
  export function getRouteForView(view: string): string;
}

declare module "@services/supabase/api" {
  const api: any;
  export = api;
}

declare module "@services/errorManager" {
  export const ErrorManager: any;
}

declare module "@utils/coreUtils" {
  export const devLog: (...args: any[]) => void;
  export function buildComparisonsMap(...args: any[]): any;
  export function getPreferencesMap(...args: any[]): any;
  export function initializeSorterPairs(...args: any[]): any;
}

declare module "@/shared/utils/authUtils" {
  export const isUserAdmin: (...args: any[]) => any;
}

declare module "@utils/logger" {
  export const devLog: (...args: any[]) => void;
  export const devWarn: (...args: any[]) => void;
  export const devError: (...args: any[]) => void;
}

declare module "@utils/ratingUtils" {
  export const ratingsToArray: (...args: any[]) => any;
  export const ratingsToObject: (...args: any[]) => any;
}

declare module "@services/supabase/auth" {
  const authApi: any;
  export = authApi;
}

declare module "../../features/tournament/PreferenceSorter" {
  export const PreferenceSorter: any;
}

declare module "../../features/tournament/EloRating" {
  const EloRating: any;
  export default EloRating;
}

declare module "prop-types" {
  const PropTypes: any;
  export default PropTypes;
}

declare module "@components" {
  export const Error: any;
  export const Loading: any;
  export const ScrollToTopButton: any;
}

declare module "@components/*" {
  const component: any;
  export default component;
}

declare module "@hooks/*" {
  const hook: any;
  export = hook;
}

declare module "@core/*" {
  const mod: any;
  export = mod;
}

declare module "./shared/components/NameSuggestionModal/NameSuggestionModal" {
  const NameSuggestionModal: any;
  export { NameSuggestionModal };
}

declare module "./shared/utils/performanceMonitor" {
  export function initializePerformanceMonitoring(): void;
  export function cleanupPerformanceMonitoring(): void;
}

declare module "./shared/utils/logger" {
  export function devError(...args: any[]): void;
  export function devWarn(...args: any[]): void;
  export function devLog(...args: any[]): void;
}

declare module "@components/ViewRouter/ViewRouter" {
  const ViewRouter: any;
  export default ViewRouter;
}

declare module "@components/CatBackground/CatBackground" {
  const CatBackground: any;
  export default CatBackground;
}

declare module "@core/store/useAppStore" {
  const useAppStore: any;
  export const useAppStoreInitialization: any;
  export const __resetMockState: any;
  export const __setMockState: any;
  export default useAppStore;
}

declare module "../../shared/components/BongoCat/constants" {
  export const BONGO_TRACKS: any;
}

declare module "../../shared/services/supabase/api" {
  const api: any;
  export = api;
}

declare module "../../shared/utils/coreUtils" {
  export const devLog: (...args: any[]) => void;
  export function buildComparisonsMap(...args: any[]): any;
  export function getPreferencesMap(...args: any[]): any;
  export function initializeSorterPairs(...args: any[]): any;
}

declare module "../../shared/services/errorManager" {
  export const ErrorManager: any;
}

declare module "../../features/tournament/constants" {
  export const FALLBACK_NAMES: any[];
}

declare module "../LiquidGlass" {
  const LiquidGlass: any;
  export default LiquidGlass;
}

declare module "../../hooks/useCollapsible" {
  export function useCollapsible(
    storageKey: string,
    defaultCollapsed?: boolean,
  ): { isCollapsed: boolean; toggleCollapsed: () => void };
}

declare module "../../../core/constants" {
  export const STORAGE_KEYS: Record<string, string>;
}
