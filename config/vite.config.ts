import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { componentTagger } from 'lovable-tagger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const resolveFromRoot = (...segments: string[]) => path.resolve(projectRoot, ...segments);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '');

  const serverPort = Number(env.VITE_PORT) || 5173;
  const previewPort = Number(env.VITE_PREVIEW_PORT) || 4173;

  return {
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    envPrefix: ['VITE_', 'SUPABASE_'],
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
          // * Manual chunk splitting strategy
          manualChunks: (id) => {
            // * Vendor chunks - separate large dependencies
            if (id.includes('node_modules')) {
              // * React and React DOM in separate chunk (most critical)
              if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime')) {
                return 'react-vendor';
              }
              // * Supabase client in separate chunk
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              // * UI libraries
              if (id.includes('@radix-ui') || id.includes('@heroicons') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              // * Other large dependencies
              if (id.includes('@hello-pangea') || id.includes('zustand')) {
                return 'utils-vendor';
              }
              // * All other node_modules
              return 'vendor';
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
          unsafe: true, // * Enable unsafe optimizations
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_methods: true,
        },
        format: {
          comments: false, // * Remove comments
        },
        mangle: {
          safari10: true, // * Fix Safari 10 issues
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
      // * Enable source maps only in development
      sourcemap: mode === 'development',
    },
    // * Optimize dependency pre-bundling
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
      // * Exclude large dependencies from pre-bundling if needed
      exclude: [],
    },
  };
});
