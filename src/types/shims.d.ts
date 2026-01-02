declare module "@utils/navigationUtils" {
	export function normalizeRoutePath(path: string): string;
	export function getNextRoute(route: string): string;
	export function getRouteForView(view: string): string;
}

declare module "@services/supabase/api" {
	const api: unknown;
	export = api;
}

declare module "@services/errorManager" {
	export const ErrorManager: unknown;
}

declare module "@utils/coreUtils" {
	export const devLog: (...args: unknown[]) => void;
	export const devWarn: (...args: unknown[]) => void;
	export const devError: (...args: unknown[]) => void;
	export function buildComparisonsMap(...args: unknown[]): unknown;
	export function getPreferencesMap(...args: unknown[]): unknown;
	export function initializeSorterPairs(...args: unknown[]): unknown;
	export const ratingsToArray: (...args: unknown[]) => unknown;
	export const ratingsToObject: (...args: unknown[]) => unknown;
}

declare module "@services/supabase/auth" {
	const authApi: unknown;
	export = authApi;
}

declare module "@components" {
	export const Error: React.ComponentType<Record<string, unknown>>;
	export const Loading: React.ComponentType<Record<string, unknown>>;
	export const ScrollToTopButton: React.ComponentType<Record<string, unknown>>;
}

declare module "@components/*" {
	const component: React.ComponentType<Record<string, unknown>>;
	export default component;
}

declare module "@hooks/*" {
	const hook: (...args: unknown[]) => unknown;
	export = hook;
}

declare module "@core/*" {
	const mod: unknown;
	export = mod;
}

declare module "@core/store/useAppStore" {
	const useAppStore: () => unknown;
	export const useAppStoreInitialization: () => void;
	export const __resetMockState: () => void;
	export const __setMockState: (state: unknown) => void;
	export default useAppStore;
}

declare module "*.module.css" {
	const classes: { [key: string]: string };
	export default classes;
}

declare module "*.css" {
	const content: string;
	export default content;
}

declare module "*.svg" {
	const content: string;
	export default content;
}

declare module "*.png" {
	const content: string;
	export default content;
}

declare module "*.jpg" {
	const content: string;
	export default content;
}

declare module "*.jpeg" {
	const content: string;
	export default content;
}

declare module "*.gif" {
	const content: string;
	export default content;
}

declare module "*.webp" {
	const content: string;
	export default content;
}
