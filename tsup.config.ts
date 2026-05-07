import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['bin/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  target: 'node18',
  splitting: false,
  sourcemap: false,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
