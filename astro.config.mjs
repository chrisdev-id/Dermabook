// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://dermabook.id',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: {
    plugins: [tailwindcss()],
    // Three.js (±600 KB) hanya dimuat di halaman atlas; batas default 500 KB memicu peringatan.
    build: { chunkSizeWarningLimit: 800 },
  },
});
