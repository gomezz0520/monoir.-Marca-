import { defineConfig } from 'astro/config';

// Sitio estático: rápido y sin servidor. Se publica en Vercel.
export default defineConfig({
  output: 'static',
  build: { inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
