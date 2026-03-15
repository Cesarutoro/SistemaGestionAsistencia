import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // No borrar el dist antes de construir.
    // Esto preserva los archivos commitados si el build falla en CI/Render.
    emptyOutDir: false,
  },
})
