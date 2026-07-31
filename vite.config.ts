import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    server: {
      proxy: {
        '/hevy-api': {
          target: 'https://api.hevyapp.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/hevy-api/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              proxyReq.setHeader('api-key', env.VITE_HEVY_API_KEY || '');
              proxyReq.setHeader('accept', 'application/json');
            });
          },
        },
      },
    },
  }
})
