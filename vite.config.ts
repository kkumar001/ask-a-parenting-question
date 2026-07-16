import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { askApiPlugin } from './server/askApi.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), askApiPlugin(env)],
  }
})
