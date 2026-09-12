import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: true, // ఇది మొబైల్ లేదా ఎక్స్‌టర్నల్ కనెక్షన్‌ల కోసం అవసరం
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
  },
  define: {
    global: 'window', // SockJS కోసం ఇది చాలా ముఖ్యం
  },
});