import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = (env.VITE_API_TARGET || 'http://127.0.0.1:4000').trim();

  return {
    plugins: [react()],
    define: {
      global: 'window',
    },
    server: {
      host: true,
      port: 3000,
      strictPort: true,
      proxy: {
        '/auth': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/graphql': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
      watch: {
        usePolling: true,
      },
    },
  };
});
