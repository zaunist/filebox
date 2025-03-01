import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
    host: '0.0.0.0', // 监听所有地址
    strictPort: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端服务器地址
        changeOrigin: true,
        // 如果后端API不包含/api前缀，可以使用rewrite去掉
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
})

