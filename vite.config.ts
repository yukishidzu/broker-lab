import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.VITE_BASE ?? (repository ? `/${repository}/` : '/')

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: { manifest: true },
})
