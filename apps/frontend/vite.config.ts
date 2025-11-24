import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Allow access from network (for mobile testing)
    allowedHosts: ['.loca.lt', '.ngrok.io', '.ngrok-free.app'], // Allow tunnel services
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Vercel dev server
        changeOrigin: true,
        cookieDomainRewrite: 'localhost', // Ensure cookies work in development
        secure: false, // Allow self-signed certificates if needed
      },
    },
  },
});
