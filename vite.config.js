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
  base: '/repository-name/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}) 