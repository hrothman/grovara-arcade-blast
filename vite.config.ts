import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Phaser into its own chunk (large library)
          'phaser': ['phaser'],
          // Separate Framer Motion into its own chunk
          'framer-motion': ['framer-motion'],
          // Separate Supabase into its own chunk
          'supabase': ['@supabase/supabase-js'],
          // Group React ecosystem together
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Group UI libraries together
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-slot', 'lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit (we know Phaser is large)
    chunkSizeWarningLimit: 1000,
    // Use esbuild for faster minification (default, but explicit)
    minify: 'esbuild',
  },
}));
