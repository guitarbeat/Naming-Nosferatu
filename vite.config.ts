import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { consoleForwardPlugin } from "./vite-console-forward-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
    consoleForwardPlugin({
      // Enable console forwarding (default: true in dev mode)
      enabled: true,
      // Custom API endpoint (default: '/api/debug/client-logs')
      endpoint: "/api/debug/client-logs",
      // Which console levels to forward (default: all)
      levels: ["log", "warn", "error", "info", "debug"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@supabase/client": path.resolve(__dirname, "src/services/supabase/client.ts"),
      "@supabase/types": path.resolve(__dirname, "supabase/types.ts"),
      "@db": path.resolve(__dirname, "supabase"),
    },
  },
});
