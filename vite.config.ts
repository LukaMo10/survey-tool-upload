import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // ⚠️ 关键：设置相对路径，确保 Netlify 上资源正确加载
    base: './',

    plugins: [react()],
    define: {
      // 保留你的环境变量
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})
