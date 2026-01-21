/**
 * Build cache buster: 2026-01-02-v1
 * Forces fresh dependency installation to resolve rollup native module issues
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;

const resolveFromRoot = (...segments: string[]) => path.resolve(projectRoot, ...segments);

// ts-prune-ignore-next (used by Vite build system)
export default defineConfig(({ mode }) => {
	// Use system environment variables directly (skip .env file loading to avoid permission issues)
	const env = { ...process.env };

	// IMPORTANT: Lovable sandbox requires port 8080
	const serverPort = 8080;
	const previewPort = Number(env.VITE_PREVIEW_PORT) || 4173;

	return {
		plugins: [
			react(),
			VitePWA({
				registerType: "autoUpdate",
				includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
				manifest: {
					name: "Naming Nosferatu",
					short_name: "Nosferatu",
					description: "Rank cat names and find the perfect one for your feline friend.",
					theme_color: "#121212",
					icons: [
						{
							src: "pwa-192x192.png",
							sizes: "192x192",
							type: "image/png",
						},
						{
							src: "pwa-512x512.png",
							sizes: "512x512",
							type: "image/png",
						},
					],
				},
				workbox: {
					globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
					runtimeCaching: [
						{
							urlPattern: /^https:\/\/api\.thecatapi\.com\/.*/i,
							handler: "CacheFirst",
							options: {
								cacheName: "cat-api-cache",
								expiration: {
									maxEntries: 50,
									maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
								},
								cacheableResponse: {
									statuses: [0, 200],
								},
							},
						},
					],
				},
			}),
		],
		envPrefix: ["VITE_", "SUPABASE_"],
		// * Ensure proper base path for production builds
		base: "/",
		css: {
			postcss: resolveFromRoot("config/postcss.config.js"),
			devSourcemap: true,
		},
		resolve: {
			alias: {
				"@": resolveFromRoot("source"),
				"@components": resolveFromRoot("source/shared/components"),
				"@hooks": resolveFromRoot("source/core/hooks"),
				"@utils": resolveFromRoot("source/shared/utils"),
				"@services": resolveFromRoot("source/shared/services"),
				"@styles": resolveFromRoot("source/shared/styles"),
				"@features": resolveFromRoot("source/features"),
				"@core": resolveFromRoot("source/core"),
			},
			// Ensure a single React instance to avoid hooks dispatcher being null
			dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
		},
		server: {
			host: true,
			port: serverPort,
			strictPort: true,
			allowedHosts: true, // Allow all hosts for Replit proxy compatibility
			hmr: {
				clientPort: serverPort,
				port: serverPort,
				overlay: false,
			},
		},
		preview: {
			host: true,
			port: previewPort,
		},
		build: {
			outDir: resolveFromRoot("dist"),
			emptyOutDir: true,
			minify: "esbuild",
			chunkSizeWarningLimit: 1000,
			reportCompressedSize: true,
			target: "esnext",
			sourcemap: mode === "development",
			rollupOptions: {
				output: {
					format: "es",
				},
			},
		},
		// * Optimize dependency pre-bundling
		optimizeDeps: {
			include: ["react", "react-dom", "react/jsx-runtime"],
			// * Exclude large dependencies from pre-bundling if needed
			exclude: [],
		},
	};
});
