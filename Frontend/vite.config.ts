/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

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
    },
    port: 8100, // Set port explicitly to 8100
    strictPort: true, // Fail if port is not available instead of incrementing
    host: '0.0.0.0'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
