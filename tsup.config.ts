// tsup.config.ts
export default {
  entry: ['bin/index.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  target: 'node18',
}
