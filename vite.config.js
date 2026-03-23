import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      apply: 'build',
      generateBundle() {
        const source = path.resolve(__dirname, 'public/_redirects')
        const dest = path.resolve(__dirname, 'dist/_redirects')
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, dest)
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://vehicle-monitor-bay-area-a782b1271cca.herokuapp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
