/**
 * Build cache buster: 2026-01-02-v1
 * Forces fresh dependency installation to resolve rollup native module issues
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;

const resolveFromRoot = (...segments: string[]) => path.resolve(projectRoot, ...segments);

// ts-prune-ignore-next (used by Vite build system)
export default defineConfig(({ mode }) => {
	// Use system environment variables directly (skip .env file loading to avoid permission issues)
	const env = { ...process.env };
	const isProd = mode === "production";

	const serverPort = Number(env.VITE_PORT) || 5173; // Default to 5173 (standard Vite) to avoid macOS AirPlay conflict on 5000
	const previewPort = Number(env.VITE_PREVIEW_PORT) || 4173;
	const enableProdSourcemap = env.VITE_ENABLE_PROD_SOURCEMAP === "true";

	return {
		// Disable .env file loading to avoid permission issues
		envDir: false,
		plugins: [
			react({
				// * Strip PropTypes from production bundles to reduce size
				babel: {
					plugins: isProd ? [["transform-react-remove-prop-types", { removeImport: true }]] : [],
				},
			}),
			mode === "development" && componentTagger(),
			mode === "production" &&
				visualizer({
					filename: "stats.html",
					open: false,
					gzipSize: true,
					brotliSize: true,
					template: "treemap",
				}),
		].filter(Boolean),
		envPrefix: ["VITE_", "SUPABASE_"],
		// * Ensure proper base path for production builds
		base: "/",
		// * Define process.env for compatibility
		define: {
			"process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
		},
		css: {
			postcss: resolveFromRoot("config/postcss.config.js"),
		},
		resolve: {
			alias: {
				"@": resolveFromRoot("src"),
				"@components": resolveFromRoot("src/shared/components"),
				"@hooks": resolveFromRoot("src/core/hooks"),
				"@utils": resolveFromRoot("src/shared/utils"),
				"@services": resolveFromRoot("src/shared/services"),
				"@styles": resolveFromRoot("src/shared/styles"),
				"@features": resolveFromRoot("src/features"),
				"@core": resolveFromRoot("src/core"),
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
			rollupOptions: {
				output: {
					format: "es",
					// * Keep inlineDynamicImports for stability - maintains existing behavior
					inlineDynamicImports: true,
					// * Single entry file name (no chunks)
					entryFileNames: "assets/js/[name]-[hash].js",
					assetFileNames: (assetInfo) => {
						if (!assetInfo.name) {
							return "assets/[name]-[hash][extname]";
						}
						const info = assetInfo.name.split(".");
						const ext = info[info.length - 1];
						if (/png|jpe?g|svg|gif|tiff|bmp|ico|avif|webp/i.test(ext)) {
							return "assets/images/[name]-[hash][extname]";
						}
						if (/woff2?|eot|ttf|otf/i.test(ext)) {
							return "assets/fonts/[name]-[hash][extname]";
						}
						if (/mp3|wav|ogg/i.test(ext)) {
							return "assets/sounds/[name]-[hash][extname]";
						}
						return "assets/[name]-[hash][extname]";
					},
				},
			},
			// * Minification settings
			minify: "terser",
			terserOptions: {
				compress: {
					drop_console: mode === "production", // * Remove console.log in production
					drop_debugger: true,
					pure_funcs: mode === "production" ? ["console.log", "console.info", "console.debug"] : [],
					passes: 2, // * Multiple passes for better compression
					// * Disable unsafe optimizations to prevent module export issues
					unsafe: false,
					unsafe_comps: false,
					unsafe_math: false,
					unsafe_methods: false,
				},
				format: {
					comments: false, // * Remove comments
					// * Preserve module structure to prevent export object issues
					preserve_annotations: false,
				},
				mangle: {
					safari10: true, // * Fix Safari 10 issues
					// * Preserve module exports to prevent undefined object errors
					reserved: ["exports", "module"],
				},
			},
			// * Chunk size warnings threshold (500kb)
			chunkSizeWarningLimit: 500,
			// * Disable CSS code splitting - bundle all CSS into a single file
			cssCodeSplit: false,
			// * Optimize asset inlining threshold (4kb - smaller assets will be inlined)
			assetsInlineLimit: 4096,
			// * Enable gzip compression reporting
			reportCompressedSize: true,
			// * Target modern browsers for smaller bundles
			target: "esnext",
			// * Enable source maps in development; allow opt-in for production debugging
			sourcemap: enableProdSourcemap || mode === "development",
		},
		// * Optimize dependency pre-bundling
		optimizeDeps: {
			include: ["react", "react-dom", "react/jsx-runtime"],
			// * Exclude large dependencies from pre-bundling if needed
			exclude: [],
		},
	};
});
