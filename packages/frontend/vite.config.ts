import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [
    react(),
    basicSsl(), // Auto-generate self-signed cert for HTTPS
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  server: {
    port: 5173,
    host: true, // Expose on local network (0.0.0.0)
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/ws': {
        target: BACKEND_URL.replace(/^http/, 'ws'),
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
