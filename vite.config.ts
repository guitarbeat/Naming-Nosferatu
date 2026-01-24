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

const resolveFromRoot = (...segments: string[]) =>
        path.resolve(projectRoot, ...segments);

// ts-prune-ignore-next (used by Vite build system)
export default defineConfig(({ mode }) => {
        // Use system environment variables directly (skip .env file loading to avoid permission issues)
        const env = { ...process.env };
        const _isProd = mode === "production";

        const serverPort = Number(env.VITE_PORT) || 5000; // Port 5000 for Replit
        const previewPort = Number(env.VITE_PREVIEW_PORT) || 4173;
        const enableProdSourcemap = env.VITE_ENABLE_PROD_SOURCEMAP === "true";

        return {
                plugins: [react()],
                envPrefix: ["VITE_", "SUPABASE_"],
                // * Ensure proper base path for production builds
                base: "/",
                // * Define process.env for compatibility
                define: {
                        "process.env.NODE_ENV": JSON.stringify(
                                mode === "production"
                                        ? "production"
                                        : "development",
                        ),
                },
                css: {
                        postcss: resolveFromRoot("config/postcss.config.js"),
                        devSourcemap: true,
                },
                resolve: {
                        alias: {
                                "@": resolveFromRoot("source"),
                                "@components": resolveFromRoot(
                                        "source/shared/components",
                                ),
                                "@hooks": resolveFromRoot("source/core/hooks"),
                                "@utils": resolveFromRoot(
                                        "source/shared/utils",
                                ),
                                "@services": resolveFromRoot(
                                        "source/shared/services",
                                ),
                                "@styles": resolveFromRoot(
                                        "source/shared/styles",
                                ),
                                "@features": resolveFromRoot("source/features"),
                                "@core": resolveFromRoot("source/core"),
                        },
                        // Ensure a single React instance to avoid hooks dispatcher being null
                        dedupe: [
                                "react",
                                "react-dom",
                                "react/jsx-runtime",
                                "react/jsx-dev-runtime",
                        ],
                },
                server: {
                        host: "0.0.0.0",
                        port: serverPort,
                        strictPort: true,
                        allowedHosts: true, // Allow all hosts for Replit proxy compatibility
                        hmr: {
                                clientPort: 443,
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
                                        // * Enable code splitting for better performance
                                        inlineDynamicImports: false,
                                        // * Single entry file name (no chunks)
                                        entryFileNames:
                                                "assets/js/[name]-[hash].js",
                                        // * Enable manual chunking for better caching
                                        manualChunks: (id) => {
                                                // Vendor chunks for better caching
                                                if (
                                                        id.includes(
                                                                "node_modules",
                                                        )
                                                ) {
                                                        if (
                                                                id.includes(
                                                                        "react",
                                                                ) ||
                                                                id.includes(
                                                                        "react-dom",
                                                                ) ||
                                                                id.includes(
                                                                        "jsx-runtime",
                                                                )
                                                        ) {
                                                                return "react-vendor";
                                                        }
                                                        if (
                                                                id.includes(
                                                                        "framer-motion",
                                                                )
                                                        ) {
                                                                return "animation-vendor";
                                                        }
                                                        if (
                                                                id.includes(
                                                                        "lucide-react",
                                                                ) ||
                                                                id.includes(
                                                                        "class-variance-authority",
                                                                )
                                                        ) {
                                                                return "ui-vendor";
                                                        }
                                                        if (
                                                                id.includes(
                                                                        "@supabase",
                                                                ) ||
                                                                id.includes(
                                                                        "@tanstack",
                                                                ) ||
                                                                id.includes(
                                                                        "zustand",
                                                                )
                                                        ) {
                                                                return "data-vendor";
                                                        }
                                                        if (
                                                                id.includes(
                                                                        "react-hook-form",
                                                                ) ||
                                                                id.includes(
                                                                        "zod",
                                                                )
                                                        ) {
                                                                return "form-vendor";
                                                        }
                                                        // Group other vendor libraries
                                                        return "vendor";
                                                }

                                                // Feature-based chunks for better caching
                                                // Group related features to avoid circular dependencies
                                                if (id.includes("features/")) {
                                                        if (
                                                                id.includes(
                                                                        "tournament",
                                                                ) ||
                                                                id.includes(
                                                                        "analytics",
                                                                ) ||
                                                                id.includes(
                                                                        "gallery",
                                                                )
                                                        ) {
                                                                return "core-features";
                                                        }
                                                        if (
                                                                id.includes(
                                                                        "explore",
                                                                ) ||
                                                                id.includes(
                                                                        "auth",
                                                                )
                                                        ) {
                                                                return "secondary-features";
                                                        }
                                                }
                                        },
                                        assetFileNames: (assetInfo) => {
                                                if (!assetInfo.name) {
                                                        return "assets/[name]-[hash][extname]";
                                                }
                                                const info =
                                                        assetInfo.name.split(
                                                                ".",
                                                        );
                                                const ext =
                                                        info[info.length - 1];
                                                if (
                                                        /png|jpe?g|svg|gif|tiff|bmp|ico|avif|webp/i.test(
                                                                ext,
                                                        )
                                                ) {
                                                        return "assets/images/[name]-[hash][extname]";
                                                }
                                                if (
                                                        /woff2?|eot|ttf|otf/i.test(
                                                                ext,
                                                        )
                                                ) {
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
                                        pure_funcs:
                                                mode === "production"
                                                        ? [
                                                                  "console.log",
                                                                  "console.info",
                                                                  "console.debug",
                                                          ]
                                                        : [],
                                        passes: 3, // * Increased passes for better compression
                                        // * Safe optimizations only
                                        unsafe: false,
                                        unsafe_comps: false,
                                        unsafe_math: false,
                                        unsafe_methods: false,
                                        // * Additional optimizations
                                        collapse_vars: true,
                                        reduce_vars: true,
                                        pure_getters: true,
                                        booleans: true,
                                        loops: true,
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
                                        // * More aggressive mangling
                                        properties: {
                                                regex: /^_[A-Za-z]/, // * Mangle private properties
                                        },
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
                        sourcemap:
                                enableProdSourcemap || mode === "development",
                },
                // * Optimize dependency pre-bundling
                optimizeDeps: {
                        include: ["react", "react-dom", "react/jsx-runtime"],
                        // * Exclude large dependencies from pre-bundling if needed
                        exclude: [],
                },
        };

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
                                includeAssets: [
                                        "favicon.ico",
                                        "robots.txt",
                                        "apple-touch-icon.png",
                                ],
                                manifest: {
                                        name: "Naming Nosferatu",
                                        short_name: "Nosferatu",
                                        description:
                                                "Rank cat names and find the perfect one for your feline friend.",
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
                                        globPatterns: [
                                                "**/*.{js,css,html,ico,png,svg,woff,woff2}",
                                        ],
                                        runtimeCaching: [
                                                {
                                                        urlPattern: /^https:\/\/api\.thecatapi\.com\/.*/i,
                                                        handler: "CacheFirst",
                                                        options: {
                                                                cacheName: "cat-api-cache",
                                                                expiration: {
                                                                        maxEntries: 50,
                                                                        maxAgeSeconds:
                                                                                60 *
                                                                                60 *
                                                                                24 *
                                                                                7, // 1 week
                                                                },
                                                                cacheableResponse:
                                                                        {
                                                                                statuses: [
                                                                                        0,
                                                                                        200,
                                                                                ],
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
                        postcss: resolveFromRoot("postcss.config.js"),
                        devSourcemap: true,
                },
                resolve: {
                        alias: [
                                // Project @supabase/* aliases - must be specific to avoid conflicts with npm @supabase/supabase-js
                                {
                                        find: "@supabase/client",
                                        replacement:
                                                resolveFromRoot(
                                                        "supabase/client.ts",
                                                ),
                                },
                                {
                                        find: "@supabase/types",
                                        replacement:
                                                resolveFromRoot(
                                                        "supabase/types.ts",
                                                ),
                                },
                                // Other project aliases
                                {
                                        find: "@db",
                                        replacement:
                                                resolveFromRoot("supabase"),
                                },
                                {
                                        find: /^@\//,
                                        replacement: `${resolveFromRoot("source")}/`,
                                },
                                {
                                        find: "@components",
                                        replacement:
                                                resolveFromRoot(
                                                        "source/components",
                                                ),
                                },
                                {
                                        find: "@hooks",
                                        replacement:
                                                resolveFromRoot("source/hooks"),
                                },
                                {
                                        find: "@utils",
                                        replacement:
                                                resolveFromRoot("source/utils"),
                                },
                                {
                                        find: "@services",
                                        replacement:
                                                resolveFromRoot(
                                                        "source/services",
                                                ),
                                },
                                {
                                        find: "@styles",
                                        replacement:
                                                resolveFromRoot(
                                                        "source/styles",
                                                ),
                                },
                                {
                                        find: "@features",
                                        replacement:
                                                resolveFromRoot(
                                                        "source/features",
                                                ),
                                },
                                {
                                        find: "@core",
                                        replacement: resolveFromRoot("source"),
                                },
                        ],
                        // Ensure a single React instance to avoid hooks dispatcher being null
                        dedupe: [
                                "react",
                                "react-dom",
                                "react/jsx-runtime",
                                "react/jsx-dev-runtime",
                        ],
                },
                server: {
                        host: true,
                        port: serverPort,
                        strictPort: true,
                        allowedHosts: true, // Allow all hosts for Replit/Lovable proxy compatibility
                        hmr: {
                                clientPort: 443, // Standard HTTPS port for sandboxes
                                protocol: "wss",
                                overlay: true, // Show errors in the browser
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
