/** @type {import('knip').KnipConfig} */
export default {
  entry: [
    'src/index.jsx',
    'src/App.jsx',
    'vite.config.ts',
    'config/vite.config.ts',
    'config/vitest.config.mjs',
    'config/eslint.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'scripts/**/*.mjs',
    'scripts/**/*.js',
  ],
  project: [
    'src/**/*.{js,jsx,ts,tsx}',
    'config/**/*.{js,ts,mjs}',
    'scripts/**/*.{js,mjs}',
    '*.{js,ts,mjs}',
  ],
  ignore: [
    'dist/**',
    'build/**',
    'coverage/**',
    'node_modules/**',
    'public/**',
    'backend/**',
    'supabase/**',
    'docs/**',
  ],
  ignoreDependencies: [
    // * Build tools that are used but not imported in code
    'vite',
    '@vitejs/plugin-react-swc',
    '@vitejs/plugin-react',
    'autoprefixer',
    'postcss',
    'postcss-preset-env',
    'tailwindcss',
    '@tailwindcss/postcss',
    'sharp',
    'terser',
    // * Testing tools
    'vitest',
    '@vitest/coverage-v8',
    'jsdom',
    '@testing-library/jest-dom',
    '@testing-library/react',
    '@testing-library/user-event',
    // * Linting/formatting tools
    'eslint',
    '@eslint/js',
    'prettier',
    'stylelint',
    'stylelint-order',
    'stylelint-config-standard',
    'stylelint-config-recess-order',
    'stylelint-declaration-block-no-ignored-properties',
    'stylelint-declaration-strict-value',
    'eslint-config-prettier',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    // * TypeScript
    'typescript',
    '@types/react',
    '@types/react-dom',
    // * Development tools
    'npm-check-updates',
    'glob',
    'globals',
    // * Supabase CLI
    'supabase',
    // * Lovable tagger (used in vite config)
    'lovable-tagger',
    // * Bundle analyzer
    'vite-bundle-analyzer',
  ],
  vite: {
    config: 'config/vite.config.ts',
  },
  // * Path aliases from vite.config.ts and tsconfig.json
  paths: {
    '@': ['src'],
    '@components': ['src/shared/components'],
    '@hooks': ['src/core/hooks'],
    '@utils': ['src/shared/utils'],
    '@services': ['src/shared/services'],
    '@styles': ['src/shared/styles'],
    '@features': ['src/features'],
    '@core': ['src/core'],
  },
};

