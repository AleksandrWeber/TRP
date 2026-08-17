import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createBrowserSecurityHeaders } from './src/browser-security';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const headers = createBrowserSecurityHeaders(mode, env.VITE_API_URL);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      headers,
    },
    preview: {
      headers,
    },
  };
});
