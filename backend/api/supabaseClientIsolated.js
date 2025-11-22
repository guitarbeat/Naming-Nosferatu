/**
 * @module supabaseClientIsolated
 * @description Completely isolated Supabase client with no external dependencies
 */

// Inline the Supabase client creation to avoid any import issues
let supabase = null;

// * Read from environment variables (prioritize env vars over hardcoded values)
const getEnvVar = (key) => {
  try {
    // Try Vite env first (browser)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const viteKey = `VITE_${key}`;
      if (import.meta.env[viteKey]) return import.meta.env[viteKey];
      if (import.meta.env[key]) return import.meta.env[key];
    }
    // Try Node process env
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key]) return process.env[key];
      if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
    }
  } catch {
    // Ignore errors in env access
  }
  return undefined;
};

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // Dynamically import Supabase only when needed
  import('@supabase/supabase-js').then(({ createClient }) => {
    const supabaseUrl = 
      getEnvVar('SUPABASE_URL') || 
      'https://ocghxwwwuubgmwsxgyoy.supabase.co'; // Fallback for development
    
    const supabaseAnonKey = 
      getEnvVar('SUPABASE_ANON_KEY') || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ2h4d3d3dXViZ213c3hneW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTgzMjksImV4cCI6MjA2NTY3NDMyOX0.93cpwT3YCC5GTwhlw4YAzSBgtxbp6fGkjcfqzdKX4E0'; // Fallback for development
    
    if (supabaseUrl && supabaseAnonKey) {
      if (!window.__supabaseClient) {
        window.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      }
      supabase = window.__supabaseClient;
    } else {
      if (process.env?.NODE_ENV === 'development') {
        console.warn('Missing Supabase environment variables. Supabase features are disabled.');
      }
    }
  }).catch(error => {
    console.error('Failed to load Supabase:', error);
  });
}

export { supabase };
