/**
 * Copy template files into dist/ so they're included in the npm package.
 * Run after tsup build: `node scripts/copy-templates.js`
 */
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'src', 'templates');
const dest = join(root, 'dist', 'templates');

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
process.stdout.write('Templates copied to dist/templates/\n');
