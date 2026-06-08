import os from 'node:os';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env vars so VITE_API_BASE is available during config resolution
  const env = loadEnv(mode, process.cwd(), '');

  // In development, always proxy to local backend (localhost:4000).
  // In production builds this proxy config is unused (server handles routing).
  const backendTarget = env.VITE_API_BASE || 'http://localhost:4000';

  return {
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
          target: backendTarget,
          changeOrigin: true,
          // Log proxy errors so they're visible in the Vite terminal
          configure: (proxy) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('[Vite Proxy Error]', err.message, '→ target:', backendTarget);
            });
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('[Vite Proxy]', req.method, req.url, '→', backendTarget);
            });
          },
        },
      },
    },
    preview: {
      // When running `vite preview` after a build, serve on the same port
      port: 5175,
      host: true,
      strictPort: true,
    },
  };
});
