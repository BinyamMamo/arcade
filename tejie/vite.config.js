import { defineConfig } from 'vite';

// PixiJS 8 initialises with a top-level await, which needs a modern target.
export default defineConfig({
  base: './',
  build: { target: 'esnext' },
});
