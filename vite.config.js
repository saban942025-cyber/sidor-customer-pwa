import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vite מוציא ל-dist כברירת מחדל, אבל אפשר להוסיף את זה ליתר ביטחון:
  build: {
    outDir: 'dist',
  }
})
