import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const rawUrl = req.url?.split('?')[0].split('#')[0]
        if (
          req.method === 'GET' &&
          rawUrl &&
          !path.extname(rawUrl) &&
          rawUrl !== '/' &&
          !rawUrl.startsWith('/@') &&
          !rawUrl.startsWith('/__') &&
          !rawUrl.startsWith('/node_modules') &&
          !rawUrl.startsWith('/api') &&
          !rawUrl.startsWith('/uploads') &&
          !rawUrl.startsWith('/socket.io')
        ) {
          const accept = req.headers.accept
          if (accept === undefined || accept === '' || accept.includes('text/html') || accept.includes('*/*')) {
            req.url = '/index.html'
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  appType: 'spa',
  plugins: [react(), spaFallbackPlugin()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@mediapipe/tasks-vision'],
  },
  build: {
    sourcemap: false,
    cssMinify: 'esbuild',
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
    watch: {
      usePolling: true,
    },
  },
})