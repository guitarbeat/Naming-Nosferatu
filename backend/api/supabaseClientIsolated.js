/**
 * @module supabaseClientIsolated
 * @description Completely isolated Supabase client with no external dependencies
 */

// Inline the Supabase client creation to avoid any import issues
let supabase = null;

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // Dynamically import Supabase only when needed
  import('@supabase/supabase-js').then(({ createClient }) => {
    const supabaseUrl = 'https://ocghxwwwuubgmwsxgyoy.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ2h4d3d3dXViZ213c3hneW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTgzMjksImV4cCI6MjA2NTY3NDMyOX0.93cpwT3YCC5GTwhlw4YAzSBgtxbp6fGkjcfqzdKX4E0';
    
    if (supabaseUrl && supabaseAnonKey) {
      if (!window.__supabaseClient) {
        window.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      }
      supabase = window.__supabaseClient;
    } else {
      console.warn('Missing Supabase environment variables. Supabase features are disabled.');
    }
  }).catch(error => {
    console.error('Failed to load Supabase:', error);
  });
}

export { supabase };
