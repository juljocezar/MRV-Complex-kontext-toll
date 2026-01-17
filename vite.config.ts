
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill für process.env, damit AI Studio Code auch lokal ohne Änderungen läuft,
    // falls Libraries darauf zugreifen.
    'process.env': {}
  },
  server: {
    port: 5173,
    host: true // Wichtig für Project IDX / Docker Environments
  }
});
