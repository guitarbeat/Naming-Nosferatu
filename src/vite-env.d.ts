/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SENTRY_DSN?: string;
	readonly VITE_APP_VERSION?: string;
	readonly VITE_WEBSOCKET_URL?: string;
	readonly VITE_SUPABASE_DEMO_PASSWORD?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
	readonly MODE: string;
	readonly PROD: boolean;
}

/** Captured in index.html before the app bundle loads (Chromium install prompt). */
interface Window {
	__deferredPwaPrompt: BeforeInstallPromptEvent | null;
}
