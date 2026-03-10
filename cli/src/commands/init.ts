/* ── aac init — scaffold project structure ───────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { writeConfig, configExists, DEFAULT_CONFIG } from '../utils/config.js';
import * as logger from '../utils/logger.js';
import { EXIT_SUCCESS } from '../utils/exit-codes.js';

const DIRECTORIES = ['model', 'patterns', 'standards', 'waivers', 'schema'];

export function runInit(): void {
  const cwd = process.cwd();

  // Create .aacrc
  if (configExists(cwd)) {
    logger.warn('.aacrc already exists — skipping config creation.');
  } else {
    const configPath = writeConfig(DEFAULT_CONFIG, cwd);
    logger.success(`Created ${path.relative(cwd, configPath)}`);
  }

  // Create standard directories
  for (const dir of DIRECTORIES) {
    const dirPath = path.join(cwd, dir);
    if (fs.existsSync(dirPath)) {
      logger.dim(`  ${dir}/ already exists`);
    } else {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.success(`Created ${dir}/`);
    }
  }

  // Create .gitkeep in empty directories
  for (const dir of DIRECTORIES) {
    const dirPath = path.join(cwd, dir);
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      fs.writeFileSync(path.join(dirPath, '.gitkeep'), '', 'utf-8');
    }
  }

  logger.info('');
  logger.success('Project initialized. Run `aac create <type>` to scaffold your first artifact.');
  process.exit(EXIT_SUCCESS);
}
