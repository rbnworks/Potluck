import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Allow configuring allowed hosts via env (comma-separated)
const raw = (globalThis as any)?.process?.env?.VITE_ALLOWED_HOSTS as string | undefined
const allowedHosts = raw && raw.trim().length > 0
  ? raw.split(',').map((h: string) => h.trim()).filter(Boolean)
  : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    ...(allowedHosts ? { allowedHosts } : {})
  }
})
