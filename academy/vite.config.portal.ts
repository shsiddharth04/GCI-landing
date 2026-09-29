import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { renameSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'rename-portal-html',
      closeBundle() {
        const src = resolve(__dirname, 'dist-portal/index-portal.html')
        const dest = resolve(__dirname, 'dist-portal/index.html')
        if (existsSync(src)) renameSync(src, dest)
      },
    },
  ],
  build: {
    outDir: 'dist-portal',
    rollupOptions: {
      input: 'index-portal.html',
    },
  },
})
