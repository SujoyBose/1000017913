import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/shorturls': 'http://localhost:3000',
    },
  },
});