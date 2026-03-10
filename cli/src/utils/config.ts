/* ── .aacrc configuration file reader/writer ──────────────────── */

import fs from 'node:fs';
import path from 'node:path';

export interface AacConfig {
  schemaBaseUrl: string;
  cacheDirName: string;
  defaultBranch: string;
}

const DEFAULT_CONFIG: AacConfig = {
  schemaBaseUrl: 'https://raw.githubusercontent.com/muthub-ai/aac/main/schema',
  cacheDirName: '.aac',
  defaultBranch: 'main',
};

const CONFIG_FILE = '.aacrc';

export function resolveConfigPath(cwd: string = process.cwd()): string {
  return path.join(cwd, CONFIG_FILE);
}

export function readConfig(cwd: string = process.cwd()): AacConfig {
  const configPath = resolveConfigPath(cwd);
  if (!fs.existsSync(configPath)) return { ...DEFAULT_CONFIG };
  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<AacConfig>;
  return { ...DEFAULT_CONFIG, ...parsed };
}

export function writeConfig(config: AacConfig, cwd: string = process.cwd()): string {
  const configPath = resolveConfigPath(cwd);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  return configPath;
}

export function configExists(cwd: string = process.cwd()): boolean {
  return fs.existsSync(resolveConfigPath(cwd));
}

export { DEFAULT_CONFIG };
