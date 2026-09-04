import path from "node:path";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
	server: {
		host: "0.0.0.0",
		port: 3000,
		strictPort: false,
		allowedHosts: true,
		hmr: process.env.DISABLE_HMR !== "true",
		watch:
			process.env.DISABLE_HMR === "true"
				? null
				: {
						usePolling: true,
						ignored: [
							"**/.local/**",
							"**/.cache/**",
							"**/node_modules/**",
							"**/dist/**",
							"**/.git/**",
						],
					},
	},
	preview: {
		host: "0.0.0.0",
		port: 5000,
		strictPort: false,
		allowedHosts: true,
	},
	css: {
		postcss: {
			plugins: [autoprefixer()],
		},
	},
	assetsInclude: ["**/*.glb", "**/*.gltf", "**/*.hdr", "**/*.webp"],
	plugins: [
		react({
			jsxImportSource: command === "serve" ? "react" : "react",
		}),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: [
				"assets/images/favicon.png",
				"assets/images/ui/cat_graphic_hd.png",
				"assets/3d/*.glb",
			],
			manifest: {
				id: "/",
				name: "Name Nosferatu",
				short_name: "Nosferatu",
				description:
					"Tournament-style voting for cat names with offline-first persistence and Elo rankings.",
				theme_color: "#12100d",
				background_color: "#12100d",
				display: "standalone",
				display_override: ["standalone", "minimal-ui"],
				orientation: "any",
				start_url: "/",
				scope: "/",
				categories: ["entertainment", "utilities"],
				icons: [
					{
						src: "/assets/images/favicon.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "/assets/images/favicon.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "maskable",
					},
					{
						src: "/assets/images/ui/cat_graphic_hd.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,gif,glb,woff,woff2}"],
				maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "google-fonts-stylesheets",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "google-fonts-webfonts",
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 60 * 60 * 24 * 365,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|glb)$/i,
						handler: "StaleWhileRevalidate",
						options: {
							cacheName: "static-media-cache",
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
			devOptions: {
				enabled: false,
			},
		}),
	],
	build: {
		chunkSizeWarningLimit: 800,
		cssCodeSplit: true,
		reportCompressedSize: true,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						if (
							id.includes("three") ||
							id.includes("@react-three/fiber") ||
							id.includes("@react-three/drei") ||
							id.includes("maath")
						) {
							return "vendor-three";
						}
						if (id.includes("ogl")) {
							return "vendor-ogl";
						}
						if (id.includes("gsap")) {
							return "vendor-gsap";
						}
						if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) {
							return "vendor-recharts";
						}
						if (id.includes("framer-motion")) {
							return "vendor-motion";
						}
						if (id.includes("@heroui")) {
							return "vendor-heroui";
						}
						if (id.includes("@hello-pangea/dnd") || id.includes("@hello-pangea")) {
							return "vendor-dnd";
						}
						if (id.includes("simple-statistics")) {
							return "vendor-stats";
						}
						if (id.includes("crypto-js")) {
							return "vendor-crypto";
						}
						if (id.includes("@sentry")) {
							return "vendor-sentry";
						}
						if (
							id.includes("react-router") ||
							id.includes("@tanstack/react-query") ||
							id.includes("zustand")
						) {
							return "vendor-core";
						}
					}
				},
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "..", "src"),
			"@/app": path.resolve(__dirname, "..", "src/app"),
			"@/features": path.resolve(__dirname, "..", "src/features"),
			"@/shared": path.resolve(__dirname, "..", "src/shared"),
		},
	},
}));
