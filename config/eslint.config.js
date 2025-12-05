import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // React recommended rules
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'unused-imports': unusedImports
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
        process: 'readonly' // Allow process.env for environment checks
      },
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      // React rules
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // * Unused imports and variables (using plugin for better auto-fix support)
      // Disable the standard no-unused-vars rule in favor of the plugin version
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-console': 'off', // Allow console statements
      'prefer-const': 'error',
      'no-var': 'error',

      // * Type safety and undefined access prevention
      'no-undef': 'error', // Catch undefined variables
      // Note: TypeScript-specific rules (no-unsafe-*) only work with TypeScript files
      // For JavaScript files, we rely on JSDoc types and runtime type guards

      // * Tree shaking and dead code elimination rules
      'no-unused-expressions': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-empty': 'error',
      'no-extra-semi': 'error',
      'no-irregular-whitespace': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      // Align with existing codebase style which primarily uses trailing commas
      // and a mix of single/double quotes. Enforcing a single quote style
      // creates noise across untouched files, so disable strict enforcement
      // here to keep linting focused on functional issues.
      'comma-dangle': 'off',
      'quotes': 'off',
      'semi': ['error', 'always'],

      // * Import/export optimization rules
      'no-duplicate-imports': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-destructuring': ['error', {
        array: true,
        object: true
      }, {
        enforceForRenamedProperties: false
      }],

      // Disable problematic rules temporarily
      'react/prop-types': 'off', // Disable prop-types validation
      'react/display-name': 'off', // Disable display-name validation

      // Modern JSX transform doesn't require React in scope
      'react/react-in-jsx-scope': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },

  // Files to ignore
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.vercel/**',
      '*.config.js',
      '*.config.mjs'
    ]
  }
];