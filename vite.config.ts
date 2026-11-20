import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { injectInitialLoading } from './src/loading/bootstrap';

export default defineConfig({ plugins: [react(), {
  name: 'solar-early-loading',
  transformIndexHtml: injectInitialLoading,
}], base: '/' });
