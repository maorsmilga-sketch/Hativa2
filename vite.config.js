import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const siteUrl = process.env.VITE_SITE_URL || 'https://hativa2.vercel.app';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'inject-site-url-meta',
      transformIndexHtml(html) {
        return html.replaceAll('__SITE_URL__', siteUrl.replace(/\/$/, ''));
      },
    },
  ],
});
