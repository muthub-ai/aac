/**
 * Build standalone binaries using Bun's --compile flag.
 *
 * Usage:
 *   bun run scripts/build-binary.js                              # current platform
 *   bun run scripts/build-binary.js --target bun-linux-x64       # cross-compile
 *   bun run scripts/build-binary.js --target bun-darwin-arm64    # macOS ARM
 *
 * Supported Bun cross-compile targets:
 *   bun-darwin-arm64, bun-darwin-x64
 *   bun-linux-arm64,  bun-linux-x64
 *   bun-windows-x64
 *
 * Output: bin-release/<platform>/
 *   aac (or aac.exe)  — standalone binary
 *   templates/         — YAML scaffolding templates
 *
 * The binary + templates folder are zipped together for distribution.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const releaseDir = join(root, 'bin-release');

// Parse --target flag
const args = process.argv.slice(2);
const targetIdx = args.indexOf('--target');
const target = targetIdx !== -1 ? args[targetIdx + 1] : null;

// Determine platform label for output directory
const platformLabel = target
  ? target.replace(/^bun-/, '')
  : `${process.platform}-${process.arch}`;

const platformDir = join(releaseDir, platformLabel);

// Ensure dist/ is built
if (!existsSync(join(root, 'dist', 'bin', 'aac.js'))) {
  process.stdout.write('Building dist/ first...\n');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
}

// Clean and create output directory
if (existsSync(platformDir)) rmSync(platformDir, { recursive: true });
mkdirSync(platformDir, { recursive: true });

// Compile binary
const entryPath = join(root, 'dist', 'bin', 'aac.js');
const isWindows = platformLabel.includes('windows');
const outName = isWindows ? 'aac.exe' : 'aac';
const outPath = join(platformDir, outName);

const compileArgs = [
  'bun', 'build', entryPath,
  '--compile',
  '--outfile', outPath,
  ...(target ? ['--target', target] : []),
];

process.stdout.write(`\nCompiling: ${compileArgs.join(' ')}\n`);
execSync(compileArgs.join(' '), { cwd: root, stdio: 'inherit' });

// Copy templates alongside binary
const templatesOut = join(platformDir, 'templates');
mkdirSync(templatesOut, { recursive: true });
cpSync(join(root, 'dist', 'templates'), templatesOut, { recursive: true });

// Create archive
const archiveName = `aac-${platformLabel}${isWindows ? '.zip' : '.tar.gz'}`;
const archivePath = join(releaseDir, archiveName);

if (isWindows) {
  execSync(`zip -rj "${archivePath}" "${platformDir}"`, { stdio: 'inherit' });
} else {
  execSync(
    `tar -czf "${archivePath}" -C "${releaseDir}" "${platformLabel}"`,
    { stdio: 'inherit' },
  );
}

process.stdout.write(`\nBinary:   ${outPath}\n`);
process.stdout.write(`Archive:  ${archivePath}\n`);
process.stdout.write(`\nInstall: extract and add the directory to your PATH.\n`);
