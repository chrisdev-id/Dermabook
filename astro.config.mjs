// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Alamat situs untuk URL kanonik dan gambar pratinjau. Di Vercel mengikuti domain produksi
// (dermabook.vercel.app, atau domain kustom setelah dipasang); bisa ditimpa dengan SITE_URL.
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://dermabook.vercel.app');

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: {
    plugins: [tailwindcss()],
    // Three.js (±600 KB) hanya dimuat di halaman atlas; batas default 500 KB memicu peringatan.
    build: { chunkSizeWarningLimit: 800 },
  },
});
