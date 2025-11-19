import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true,
    testTimeout: 10000,
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
  resolve: {
    alias: {
      '@': pathResolve(__dirname, '../src'),
      '@components': pathResolve(__dirname, '../src/shared/components'),
      '@hooks': pathResolve(__dirname, '../src/core/hooks'),
      '@utils': pathResolve(__dirname, '../src/shared/utils'),
      '@services': pathResolve(__dirname, '../src/shared/services'),
      '@styles': pathResolve(__dirname, '../src/shared/styles'),
      '@features': pathResolve(__dirname, '../src/features'),
      '@core': pathResolve(__dirname, '../src/core'),
    },
  },
});
