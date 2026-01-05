// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Gzip compression for production
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files > 1KB
    }),
    // Brotli compression (better compression ratio)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    // Bundle analyzer (only in analyze mode)
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  server: {
    port: 3000,
    proxy: {
      '^/(api|auth)': {
        target: 'https://zanalyzer.fly.dev',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    // Enable source maps for debugging (disable in production if needed)
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Core React libraries - rarely change
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase auth - separate chunk for auth-related code
          'vendor-supabase': ['@supabase/supabase-js'],
          // Animation libraries - loaded when needed
          'vendor-animation': ['framer-motion', 'gsap', '@gsap/react'],
          // UI utilities
          'vendor-ui': ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react'],
        },
      },
    },
    // Minification options
    minify: 'esbuild',
    target: 'es2020',
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
}));
