import os from 'node:os';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  cacheDir: path.join(os.tmpdir(), 'smart-hostel-grievance-vite'),
  server: {
    // Fixed development port to avoid confusion. Change if needed.
    port: 5173,
    // Host 0.0.0.0 to allow external access if required.
    host: true,
    strictPort: false, // auto-increment if port is occupied
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // When running `vite preview` after a build, serve on the same port
    port: 5175,
    host: true,
    strictPort: true,
  },
});
