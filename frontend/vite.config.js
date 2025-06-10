import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Add this to help serve static assets
    fs: {
      strict: false
    }
  },
  // Help Vite handle WebViewer assets
  assetsInclude: ['**/*.wasm', '**/*.mem', '**/*.data'],
  // Ensure proper handling of public directory
  publicDir: 'public'
});