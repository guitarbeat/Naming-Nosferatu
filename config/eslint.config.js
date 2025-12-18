import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // React & TypeScript rules
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
        process: "readonly", // Allow process.env for environment checks
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // React rules
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // TypeScript rules
      ...tsPlugin.configs.recommended.rules,

      // * Unused imports and variables (using plugin for better auto-fix support)
      // Disable the standard no-unused-vars rule in favor of the plugin version
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off", // specific to TS, let unused-imports handle it
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": "off", // Allow console statements
      "prefer-const": "error",
      "no-var": "error",

      // * Type safety and undefined access prevention
      "no-undef": "off", // TypeScript handles this better
      // Note: TypeScript-specific rules (no-unsafe-*) only work with TypeScript files
      // For JavaScript files, we rely on JSDoc types and runtime type guards

      // * Tree shaking and dead code elimination rules
      "no-unused-expressions": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error",
      "no-empty": "error",
      "no-extra-semi": "error",
      "no-irregular-whitespace": "error",
      "no-multiple-empty-lines": ["error", { max: 2 }],
      "no-trailing-spaces": "error",
      "eol-last": "error",
      // Align with existing codebase style which primarily uses trailing commas
      // and a mix of single/double quotes. Enforcing a single quote style
      // creates noise across untouched files, so disable strict enforcement
      // here to keep linting focused on functional issues.
      "comma-dangle": "off",
      quotes: "off",
      semi: ["error", "always"],

      // * Import/export optimization rules
      "no-duplicate-imports": "error",
      "no-useless-rename": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "prefer-arrow-callback": "error",
      "prefer-destructuring": [
        "error",
        {
          array: true,
          object: true,
        },
        {
          enforceForRenamedProperties: false,
        },
      ],

      // Disable problematic rules temporarily
      "react/prop-types": "off", // Disable prop-types validation
      "react/display-name": "off", // Disable display-name validation

      // Modern JSX transform doesn't require React in scope
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Files to ignore
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".vercel/**",
      "*.config.js",
      "*.config.mjs",
    ],
  },
];
