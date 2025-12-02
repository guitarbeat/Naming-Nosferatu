import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'SUPABASE_'],
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
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'react-vendor';
              }
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              return 'vendor';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
        },
        format: { comments: false },
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      target: 'esnext',
      sourcemap: mode === 'development',
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  };
});
