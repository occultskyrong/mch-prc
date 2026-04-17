import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 部署到根目录时 base: '/'
// 部署到子目录时 base: '/子目录名/'
export default defineConfig({
  plugins: [react()],
  base: '/',  // 可根据部署位置修改
  server: {
    port: 5173,
  },
})