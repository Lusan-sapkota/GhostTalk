/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  build: {
    // Split chunks for better performance
    chunkSizeWarningLimit: 1000,
    // Minimize output
    minify: 'terser',
    // Optimize for slower devices
    target: 'es2015',
    // Improve source map performance
    sourcemap: false
  },
  // Increase memory limit (if Node.js has enough memory)
  server: {
    hmr: {
      overlay: false
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
