import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('runInit', () => {
  let tmpDir: string;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aac-init-test-'));
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    // Suppress logger output
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('1 - creates .aacrc and all directories', async () => {
    const { runInit } = await import('./init');
    try {
      runInit();
    } catch {
      // process.exit throws
    }

    expect(fs.existsSync(path.join(tmpDir, '.aacrc'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'model'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'patterns'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'standards'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'waivers'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'schema'))).toBe(true);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('2 - creates .gitkeep in empty directories', async () => {
    const { runInit } = await import('./init');
    try {
      runInit();
    } catch {
      // process.exit throws
    }

    for (const dir of ['model', 'patterns', 'standards', 'waivers', 'schema']) {
      expect(fs.existsSync(path.join(tmpDir, dir, '.gitkeep'))).toBe(true);
    }
  });

  it('3 - skips .aacrc if it already exists', async () => {
    fs.writeFileSync(path.join(tmpDir, '.aacrc'), '{"custom":true}', 'utf-8');
    const { runInit } = await import('./init');
    try {
      runInit();
    } catch {
      // process.exit throws
    }

    const content = fs.readFileSync(path.join(tmpDir, '.aacrc'), 'utf-8');
    expect(JSON.parse(content)).toEqual({ custom: true });
  });

  it('4 - skips existing directories', async () => {
    fs.mkdirSync(path.join(tmpDir, 'model'));
    fs.writeFileSync(path.join(tmpDir, 'model', 'existing.yaml'), 'test', 'utf-8');
    const { runInit } = await import('./init');
    try {
      runInit();
    } catch {
      // process.exit throws
    }

    // existing file should still be there
    expect(fs.existsSync(path.join(tmpDir, 'model', 'existing.yaml'))).toBe(true);
    // .gitkeep should NOT be added since directory is not empty
    expect(fs.existsSync(path.join(tmpDir, 'model', '.gitkeep'))).toBe(false);
  });

  it('5 - .aacrc contains valid JSON config', async () => {
    const { runInit } = await import('./init');
    try {
      runInit();
    } catch {
      // process.exit throws
    }

    const content = fs.readFileSync(path.join(tmpDir, '.aacrc'), 'utf-8');
    const config = JSON.parse(content);
    expect(config).toHaveProperty('schemaBaseUrl');
    expect(config).toHaveProperty('cacheDirName');
    expect(config).toHaveProperty('defaultBranch');
  });
});
