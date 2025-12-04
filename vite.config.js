import { defineConfig } from 'vite';
import { componentTagger } from 'lovable-tagger';

// Import the main config from config folder
import baseConfig from './config/vite.config.ts';

export default defineConfig(async ({ mode }) => {
  // Get the base config
  const base = await baseConfig({ mode, command: mode === 'production' ? 'build' : 'serve' });
  
  // Add lovable-tagger plugin for development
  const plugins = [...(base.plugins || [])];
  
  if (mode === 'development') {
    plugins.push(componentTagger());
  }
  
  return {
    ...base,
    plugins,
  };
});
