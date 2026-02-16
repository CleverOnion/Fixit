import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use .env from project root
  envDir: path.resolve(__dirname, '..'),
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['axios']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'antd': ['antd'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'editor': ['@uiw/react-md-editor', 'react-markdown', 'rehype-katex', 'remark-math', 'katex'],
        }
      }
    }
  }
})
