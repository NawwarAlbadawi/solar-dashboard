import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative base so GitHub Pages works at https://<user>.github.io/<repo>/ automatically
  base: './',
  plugins: [react(), tailwindcss()],
});
