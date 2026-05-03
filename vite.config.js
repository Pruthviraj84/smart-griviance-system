import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Fixed development port to avoid confusion. Change if needed.
    port: 5174,
    // Host 0.0.0.0 to allow external access if required.
    host: true,
    strictPort: true, // fail if port is occupied instead of auto‑incrementing
  },
  preview: {
    // When running `vite preview` after a build, serve on the same port
    port: 5174,
    host: true,
    strictPort: true,
  },
});
