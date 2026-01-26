import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true, // Fail if port 3000 is not available
    host: true,
    // Removed proxy - frontend now uses explicit URLs with VITE_API_URL
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
