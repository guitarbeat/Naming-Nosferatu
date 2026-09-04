/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

export {};

declare global {
	interface Window {
		__deferredPwaPrompt: BeforeInstallPromptEvent | null;
	}

	interface PWAInstallElement extends HTMLElement {
		manifestUrl: string;
		useLocalStorage: boolean;
		installDescription: string;
		styles: Record<string, string>;
		externalPromptEvent: BeforeInstallPromptEvent | null;
	}
}

declare module "react" {
	// biome-ignore lint/style/noNamespace: JSX.IntrinsicElements can only be augmented via a namespace
	namespace JSX {
		interface IntrinsicElements {
			"pwa-install": {
				ref?: import("react").Ref<PWAInstallElement>;
			};
		}
	}
}
