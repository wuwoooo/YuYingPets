import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { validateDisplayPublic } from './scripts/display-public-guard.mjs';

function displayPublicGuardPlugin() {
  return {
    name: 'display-public-guard',
    buildStart() {
      validateDisplayPublic({ root: process.cwd() });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), displayPublicGuardPlugin()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
