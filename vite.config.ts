import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Base URL for GitHub Pages deployment (repository name)
  base: '/yt-music-player/',
  server: {
    port: 5174,
    host: '0.0.0.0',
  },
})
