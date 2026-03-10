import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['bin/aac.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist/bin',
  clean: true,
  splitting: false,
  sourcemap: false,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Keep dependencies external — they'll be installed from package.json
  external: [
    'commander',
    'chalk',
    'ajv',
    'ajv/dist/2020.js',
    'ajv-formats',
    'js-yaml',
  ],
  // Bundle internal modules (src/) into the single entry
  noExternal: [/^\.\.\/src/],
});
