import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('runCreate', () => {
  let tmpDir: string;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aac-create-test-'));
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

  it('1 - creates a standard artifact', async () => {
    fs.mkdirSync(path.join(tmpDir, 'standards'));
    const { runCreate } = await import('./create');
    try {
      runCreate('standard', 'My Test Standard');
    } catch {
      // process.exit throws
    }

    const expectedPath = path.join(tmpDir, 'standards', 'my-test-standard.yaml');
    expect(fs.existsSync(expectedPath)).toBe(true);
    const content = fs.readFileSync(expectedPath, 'utf-8');
    expect(content).toContain('My Test Standard');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('2 - creates a waiver artifact', async () => {
    fs.mkdirSync(path.join(tmpDir, 'waivers'));
    const { runCreate } = await import('./create');
    try {
      runCreate('waiver', 'Legacy Auth Bypass');
    } catch {
      // process.exit throws
    }

    const expectedPath = path.join(tmpDir, 'waivers', 'legacy-auth-bypass.yaml');
    expect(fs.existsSync(expectedPath)).toBe(true);
    const content = fs.readFileSync(expectedPath, 'utf-8');
    expect(content).toContain('Legacy Auth Bypass');
  });

  it('3 - creates a system artifact in a subdirectory', async () => {
    fs.mkdirSync(path.join(tmpDir, 'model'));
    const { runCreate } = await import('./create');
    try {
      runCreate('system', 'Payment Service');
    } catch {
      // process.exit throws
    }

    const sysDir = path.join(tmpDir, 'model', 'payment-service');
    expect(fs.existsSync(sysDir)).toBe(true);
    expect(fs.existsSync(path.join(sysDir, 'system.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(sysDir, 'metadata.json'))).toBe(true);

    const yaml = fs.readFileSync(path.join(sysDir, 'system.yaml'), 'utf-8');
    expect(yaml).toContain('payment-service');

    const meta = fs.readFileSync(path.join(sysDir, 'metadata.json'), 'utf-8');
    expect(meta).toContain('payment-service');
  });

  it('4 - creates a pattern artifact in a subdirectory', async () => {
    fs.mkdirSync(path.join(tmpDir, 'patterns'));
    const { runCreate } = await import('./create');
    try {
      runCreate('pattern', 'Circuit Breaker');
    } catch {
      // process.exit throws
    }

    const patDir = path.join(tmpDir, 'patterns', 'circuit-breaker');
    expect(fs.existsSync(patDir)).toBe(true);
    expect(fs.existsSync(path.join(patDir, 'pattern.yaml'))).toBe(true);
  });

  it('5 - errors on unknown type', async () => {
    const { runCreate } = await import('./create');
    try {
      runCreate('unknown');
    } catch {
      // process.exit throws
    }
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('6 - errors when target file already exists', async () => {
    fs.mkdirSync(path.join(tmpDir, 'standards'));
    fs.writeFileSync(path.join(tmpDir, 'standards', 'existing.yaml'), 'x', 'utf-8');
    const { runCreate } = await import('./create');
    try {
      runCreate('standard', 'Existing');
    } catch {
      // process.exit throws
    }
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('7 - uses default name when none provided', async () => {
    fs.mkdirSync(path.join(tmpDir, 'waivers'));
    const { runCreate } = await import('./create');
    try {
      runCreate('waiver');
    } catch {
      // process.exit throws
    }

    const expectedPath = path.join(tmpDir, 'waivers', 'my-waiver.yaml');
    expect(fs.existsSync(expectedPath)).toBe(true);
  });

  it('8 - slugifies names correctly', async () => {
    fs.mkdirSync(path.join(tmpDir, 'standards'));
    const { runCreate } = await import('./create');
    try {
      runCreate('standard', 'My  Weird--Name!@#');
    } catch {
      // process.exit throws
    }

    const expectedPath = path.join(tmpDir, 'standards', 'my-weird-name.yaml');
    expect(fs.existsSync(expectedPath)).toBe(true);
  });

  it('9 - creates parent directory if not present', async () => {
    // Don't create standards/ dir upfront
    const { runCreate } = await import('./create');
    try {
      runCreate('standard', 'Auto Dir');
    } catch {
      // process.exit throws
    }

    expect(fs.existsSync(path.join(tmpDir, 'standards', 'auto-dir.yaml'))).toBe(true);
  });

  it('10 - CREATE_TYPES includes expected types', async () => {
    const { CREATE_TYPES } = await import('./create');
    expect(CREATE_TYPES).toContain('system');
    expect(CREATE_TYPES).toContain('pattern');
    expect(CREATE_TYPES).toContain('standard');
    expect(CREATE_TYPES).toContain('waiver');
  });
});
