import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { componentTagger } from 'lovable-tagger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root vite.config.js required by Lovable
// Re-exports config with lovable-tagger plugin
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    envPrefix: ['VITE_', 'SUPABASE_'],
    css: {
      postcss: path.resolve(__dirname, 'config/postcss.config.js'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/shared/components'),
        '@hooks': path.resolve(__dirname, 'src/core/hooks'),
        '@utils': path.resolve(__dirname, 'src/shared/utils'),
        '@services': path.resolve(__dirname, 'src/shared/services'),
        '@styles': path.resolve(__dirname, 'src/shared/styles'),
        '@features': path.resolve(__dirname, 'src/features'),
        '@core': path.resolve(__dirname, 'src/core')
      },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime']
    },
    server: {
      host: '::',
      port: 8080,
      hmr: { overlay: false }
    },
    preview: {
      host: true,
      port: 4173
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // * Ensure proper module format for vendor chunks to prevent export issues
          format: 'es',
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'react-vendor';
              }
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              if (id.includes('@radix-ui') || id.includes('@heroicons') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              if (id.includes('@hello-pangea')) {
                return 'dnd-vendor';
              }
              if (id.includes('zustand')) {
                return 'state-vendor';
              }
              return 'vendor';
            }
            if (id.includes('/features/tournament/Results')) {
              return 'results-feature';
            }
            if (id.includes('/features/tournament/Tournament') && !id.includes('TournamentSetup')) {
              return 'tournament-feature';
            }
            if (id.includes('/features/tournament/TournamentSetup')) {
              return 'tournament-setup-feature';
            }
            if (id.includes('/shared/services/supabase/legacy')) {
              return 'supabase-legacy';
            }
            if (id.includes('/shared/components/NameManagementView')) {
              return 'name-management';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
            const ext = assetInfo.name.split('.').pop();
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
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        },
        format: {
          comments: false,
          // * Preserve module structure to prevent export object issues
          preserve_annotations: false,
        },
        mangle: {
          // * Preserve module exports to prevent undefined object errors
          reserved: ['exports', 'module'],
        },
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      reportCompressedSize: true,
      target: 'esnext',
      sourcemap: mode === 'development',
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  };
});
