import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // DŮLEŽITÉ: Nastavení base na název repozitáře pro GitHub Pages
  base: '/Nexuslink/',
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve '@' to the project root's 'src' directory
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
});