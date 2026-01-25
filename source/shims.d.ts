declare module "@utils/navigationUtils" {
	export function normalizeRoutePath(path: string): string;
	export function getNextRoute(route: string): string;
	export function getRouteForView(view: string): string;
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

declare module "@store" {
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
