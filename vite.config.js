import { defineConfig } from 'vite';
import config from './config/vite.config.ts';
import { componentTagger } from 'lovable-tagger';

// Root vite.config.js required by Lovable
// Imports main config from config/vite.config.ts and adds lovable-tagger plugin
export default defineConfig(({ mode }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
}));
