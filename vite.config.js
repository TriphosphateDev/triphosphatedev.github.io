import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: '/index.html',
        pricecalculator: '/resources/pricecalculator/index.html',
        // Add other pages as needed
      }
    }
  },
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}) 