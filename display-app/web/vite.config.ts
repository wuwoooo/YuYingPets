import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { bundleDisplayCss } from './scripts/display-css-bundle.mjs';
import { bundleDisplayBridgeScripts } from './scripts/display-js-bridge-bundle.mjs';
import { validateDisplayPublic } from './scripts/display-public-guard.mjs';

function displayPublicGuardPlugin() {
  return {
    name: 'display-public-guard',
    buildStart() {
      validateDisplayPublic({ root: process.cwd() });
    },
  };
}

function displayCssBundlePlugin() {
  return {
    name: 'display-css-bundle',
    closeBundle() {
      const result = bundleDisplayCss({ root: process.cwd() });
      console.log(
        `[display-css-bundle] ${result.file} from ${result.cssCount} files (${result.bytes} bytes)`,
      );
    },
  };
}

function displayBridgeBundlePlugin() {
  return {
    name: 'display-bridge-bundle',
    closeBundle() {
      const result = bundleDisplayBridgeScripts({ root: process.cwd() });
      console.log(
        `[display-bridge-bundle] ${result.file} from ${result.scriptCount} files (${result.bytes} bytes)`,
      );
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    displayPublicGuardPlugin(),
    displayCssBundlePlugin(),
    displayBridgeBundlePlugin(),
  ],
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
