import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // root stays as academy-portal/ so index.html here emits dist/index.html
  // at the top level — not nested under the relative path to academy/.
  // The build script runs `npm install --prefix ../academy` first so that
  // Rollup's walk-up from academy/src/ finds packages in academy/node_modules/.
  publicDir: '../academy/public',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Explicit — not relying on Vite's default entry detection.
      // index.html is in academy-portal/ (same as root), relative path is fine.
      // The <script src> inside uses ../academy/src/portal-entry.tsx, which
      // Rollup resolves relative to the HTML file's location.
      input: 'index.html',
    },
  },
})
