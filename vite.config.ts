
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // Optimalizace obrázků během buildu
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      exclude: undefined,
      include: undefined,
      includePublic: true,
      logStats: true,
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                cleanupNumericValues: false,
                removeViewBox: false, // Důležité pro škálování ikon
                noSpaceAfterFlags: false,
              },
            },
          },
          'sortAttrs',
          {
            name: 'addAttributesToSVGElement',
            params: {
              attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
            },
          },
        ],
      },
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        lossless: true,
      },
    }),
    // Gzip komprese výsledných souborů
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Komprimovat pouze soubory větší než 1KB
      deleteOriginFile: false, // Ponechat i původní soubory pro kompatibilitu
    })
  ],
  define: {
    'process.env': {}
  },
  // Odstranění console a debugger v produkci pomocí esbuild (nevyžaduje terser)
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild', // Používá nativní esbuild místo chybějícího terseru
    rollupOptions: {
      external: ['html5-qrcode'],
      output: {
        // Lepší hashing pro cache prohlížeče
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    reportCompressedSize: true, // Zobrazí velikost po kompresi v logu buildu
    chunkSizeWarningLimit: 1000,
  },
});
