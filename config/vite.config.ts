import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const resolveFromRoot = (...segments: string[]) => path.resolve(projectRoot, ...segments);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '');

  const serverPort = Number(env.VITE_PORT) || 5173;
  const previewPort = Number(env.VITE_PREVIEW_PORT) || 4173;
  const enableProdSourcemap = env.VITE_ENABLE_PROD_SOURCEMAP === 'true';

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'SUPABASE_'],
    // * Ensure proper base path for production builds
    base: '/',
    // * Define process.env for compatibility
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },
    css: {
      postcss: resolveFromRoot('config/postcss.config.js'),
    },
    resolve: {
      alias: {
        '@': resolveFromRoot('src'),
        '@components': resolveFromRoot('src/shared/components'),
        '@hooks': resolveFromRoot('src/core/hooks'),
        '@utils': resolveFromRoot('src/shared/utils'),
        '@services': resolveFromRoot('src/shared/services'),
        '@styles': resolveFromRoot('src/shared/styles'),
        '@features': resolveFromRoot('src/features'),
        '@core': resolveFromRoot('src/core')
      },
      // Ensure a single React instance to avoid hooks dispatcher being null
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime']
    },
    server: {
      host: '::',
      port: 8080,
      hmr: { overlay: false }
    },
    preview: {
      host: true,
      port: previewPort
    },
    build: {
      outDir: resolveFromRoot('dist'),
      emptyOutDir: true,
      // * Optimize chunk splitting for better caching and parallel loading
      rollupOptions: {
        output: {
          // * Ensure proper module format for vendor chunks to prevent export issues
          format: 'es',
          // * Manual chunk splitting strategy - prevents deployment failures from large chunks
          manualChunks: (id) => {
            // * Vendor chunks - separate large dependencies to improve caching and reduce initial load
            if (id.includes('node_modules')) {
              // * React and React DOM in separate chunk (most critical, changes rarely)
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react/jsx-runtime') ||
                id.includes('scheduler') ||
                id.includes('react/jsx-dev-runtime')
              ) {
                return 'react-vendor';
              }
              
              // * Supabase client in separate chunk (large, changes infrequently)
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              
              // * UI libraries (Radix, Heroicons, Lucide) - often used together
              if (
                id.includes('@radix-ui') ||
                id.includes('@heroicons') ||
                id.includes('lucide-react')
              ) {
                return 'ui-vendor';
              }
              
              // * Drag and drop library (large, only used in specific features)
              if (id.includes('@hello-pangea')) {
                return 'dnd-vendor';
              }
              
              // * State management (Zustand) - small but frequently used
              if (id.includes('zustand')) {
                return 'state-vendor';
              }
              
              // * All other node_modules go into a common vendor chunk
              return 'vendor';
            }
            
            // * Split large feature modules to prevent chunk size issues
            // * Results component is already large (106KB), keep it separate
            if (id.includes('/features/tournament/Results')) {
              return 'results-feature';
            }
            
            // * Tournament component is already split, but ensure it stays separate
            if (id.includes('/features/tournament/Tournament') && !id.includes('TournamentSetup')) {
              return 'tournament-feature';
            }
            
            // * TournamentSetup can be its own chunk
            if (id.includes('/features/tournament/TournamentSetup')) {
              return 'tournament-setup-feature';
            }
            
            // * Supabase services (legacy client is large)
            if (id.includes('/shared/services/supabase/legacy')) {
              return 'supabase-legacy';
            }
            
            // * Shared components that are large
            if (id.includes('/shared/components/NameManagementView')) {
              return 'name-management';
            }
          },
          // * Optimize chunk file names for better caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) {
              return 'assets/[name]-[hash][extname]';
            }
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico|avif|webp/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            if (/mp3|wav|ogg/i.test(ext)) {
              return 'assets/sounds/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // * Minification settings
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // * Remove console.log in production
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
          passes: 2, // * Multiple passes for better compression
          // * Disable unsafe optimizations to prevent module export issues
          // * These can break module exports when splitting vendor chunks
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
          reserved: ['exports', 'module'],
        },
      },
      // * Chunk size warnings threshold (500kb)
      chunkSizeWarningLimit: 500,
      // * Enable CSS code splitting
      cssCodeSplit: true,
      // * Optimize asset inlining threshold (4kb - smaller assets will be inlined)
      assetsInlineLimit: 4096,
      // * Enable gzip compression reporting
      reportCompressedSize: true,
      // * Target modern browsers for smaller bundles
      target: 'esnext',
      // * Enable source maps in development; allow opt-in for production debugging
      sourcemap: enableProdSourcemap || mode === 'development',
    },
    // * Optimize dependency pre-bundling
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
      // * Exclude large dependencies from pre-bundling if needed
      exclude: [],
    },
  };
});
