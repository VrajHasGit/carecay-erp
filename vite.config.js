import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'firebase/app': path.resolve(__dirname, 'src/lib/localFirebase/app.js'),
      'firebase/firestore': path.resolve(__dirname, 'src/lib/localFirebase/firestore.js'),
      'firebase/auth': path.resolve(__dirname, 'src/lib/localFirebase/auth.js'),
      'firebase/storage': path.resolve(__dirname, 'src/lib/localFirebase/storage.js'),
    },
  },
})
