import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  resolveConfigPath,
  readConfig,
  writeConfig,
  configExists,
  DEFAULT_CONFIG,
} from './config';

describe('config utilities', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aac-config-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('1 - resolveConfigPath returns .aacrc in given cwd', () => {
    const result = resolveConfigPath(tmpDir);
    expect(result).toBe(path.join(tmpDir, '.aacrc'));
  });

  it('2 - DEFAULT_CONFIG has expected shape', () => {
    expect(DEFAULT_CONFIG).toEqual({
      schemaBaseUrl: 'https://raw.githubusercontent.com/muthub-ai/aac/main/schema',
      cacheDirName: '.aac',
      defaultBranch: 'main',
    });
  });

  it('3 - readConfig returns defaults when .aacrc does not exist', () => {
    const config = readConfig(tmpDir);
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('4 - writeConfig creates .aacrc and readConfig reads it back', () => {
    const custom = { ...DEFAULT_CONFIG, defaultBranch: 'develop' };
    const resultPath = writeConfig(custom, tmpDir);
    expect(resultPath).toBe(path.join(tmpDir, '.aacrc'));
    expect(fs.existsSync(resultPath)).toBe(true);

    const loaded = readConfig(tmpDir);
    expect(loaded.defaultBranch).toBe('develop');
    expect(loaded.schemaBaseUrl).toBe(DEFAULT_CONFIG.schemaBaseUrl);
  });

  it('5 - readConfig merges partial config with defaults', () => {
    const partial = { cacheDirName: '.my-cache' };
    fs.writeFileSync(
      path.join(tmpDir, '.aacrc'),
      JSON.stringify(partial),
      'utf-8',
    );
    const config = readConfig(tmpDir);
    expect(config.cacheDirName).toBe('.my-cache');
    expect(config.schemaBaseUrl).toBe(DEFAULT_CONFIG.schemaBaseUrl);
    expect(config.defaultBranch).toBe(DEFAULT_CONFIG.defaultBranch);
  });

  it('6 - configExists returns false when no .aacrc', () => {
    expect(configExists(tmpDir)).toBe(false);
  });

  it('7 - configExists returns true after writeConfig', () => {
    writeConfig(DEFAULT_CONFIG, tmpDir);
    expect(configExists(tmpDir)).toBe(true);
  });
});
