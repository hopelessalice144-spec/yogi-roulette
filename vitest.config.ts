import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      '@core': path.resolve(root, 'src/core'),
      '@lib': path.resolve(root, 'src/lib'),
      '@ui': path.resolve(root, 'src/ui'),
      '@scene': path.resolve(root, 'src/scene'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    passWithNoTests: false,
  },
});
