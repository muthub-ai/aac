import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Integration-style tests for the validate command.
 * Uses real schema files and temp YAML fixtures.
 */
describe('runValidate', () => {
  let tmpDir: string;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let originalFetch: typeof globalThis.fetch;
  const schemasDir = path.resolve(__dirname, '..', '..', '..', 'schema');

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aac-validate-test-'));
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /** Mock fetch to serve a local schema file */
  function mockSchemaFetch(schemaFileName: string): void {
    const schemaPath = path.join(schemasDir, schemaFileName);
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    globalThis.fetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      if (opts.method === 'HEAD') {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ etag: '"test"' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(schema),
        headers: new Headers({ etag: '"test"' }),
      });
    });
  }

  /** Set up a standards/ directory with a valid standard YAML */
  function setupValidStandard(): string {
    const dir = path.join(tmpDir, 'standards');
    fs.mkdirSync(dir, { recursive: true });
    const content = `
metadata:
  schemaVersion: 2
  standardId: "STD-TEST-001"
  name: "Test Standard"
  architectureDomain: "Application Architecture"
  architecturePrinciple:
    - "Modular and Composable Architecture"
  l4Domain: "Application Architecture"
  l3Domain: "Design Patterns"
  l2Domain: "Service Design"
  standardOwner: "Architecture Team"
  assignedArchitect: "Lead Architect"
  lifecycleCategory: "DRAFT"
  publicationStatus: "DRAFT"
  version: "1.0"
  approvalDate: "2025-01-01"
  tags:
    - architecture
scope:
  inScope:
    - "All new services"
  outOfScope:
    - "Legacy"
requirements:
  - id: "REQ-001"
    statement: "Must implement health checks."
    severity: "MUST"
    rationale: "Monitoring"
    verification: "Integration test"
guidelines:
  - id: "GUIDE-001"
    text: "Use async messaging."
solutions:
  - id: "SOL-001"
    name: "Health Library"
    description: "Shared health check lib"
`;
    const filePath = path.join(dir, 'test-standard.yaml');
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }

  /** Set up an invalid standard */
  function setupInvalidStandard(): string {
    const dir = path.join(tmpDir, 'standards');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, 'bad-standard.yaml');
    fs.writeFileSync(filePath, 'title: Missing metadata\n', 'utf-8');
    return filePath;
  }

  it('1 - validates a valid file successfully', async () => {
    const filePath = setupValidStandard();
    mockSchemaFetch('standards.json');
    const { runValidate } = await import('./validate');
    try {
      await runValidate(filePath, { type: 'standard' });
    } catch {
      // process.exit
    }
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('2 - reports validation failure for invalid file', async () => {
    const filePath = setupInvalidStandard();
    mockSchemaFetch('standards.json');
    const { runValidate } = await import('./validate');
    try {
      await runValidate(filePath, { type: 'standard' });
    } catch {
      // process.exit
    }
    expect(exitSpy).toHaveBeenCalledWith(2);
  });

  it('3 - infers type from standards/ directory', async () => {
    const filePath = setupValidStandard();
    mockSchemaFetch('standards.json');
    const { runValidate } = await import('./validate');
    try {
      await runValidate(filePath, { type: '' });
    } catch {
      // process.exit
    }
    // Should infer 'standard' from path and validate successfully
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('4 - validates a directory of files', async () => {
    const dir = path.join(tmpDir, 'standards');
    fs.mkdirSync(dir, { recursive: true });

    // Write 2 valid standard files
    for (const name of ['std1.yaml', 'std2.yaml']) {
      fs.writeFileSync(
        path.join(dir, name),
        `
metadata:
  schemaVersion: 2
  standardId: "STD-DIR-001"
  name: "${name}"
  architectureDomain: "Application Architecture"
  architecturePrinciple:
    - "Modular and Composable Architecture"
  l4Domain: "Application Architecture"
  l3Domain: "Design Patterns"
  l2Domain: "Service Design"
  standardOwner: "Team"
  assignedArchitect: "Architect"
  lifecycleCategory: "DRAFT"
  publicationStatus: "DRAFT"
  version: "1.0"
  approvalDate: "2025-01-01"
  tags:
    - test
scope:
  inScope:
    - "All"
  outOfScope:
    - "None"
requirements:
  - id: "REQ-001"
    statement: "Test requirement"
    severity: "MUST"
    rationale: "Test rationale"
    verification: "Test verification"
guidelines:
  - id: "GUIDE-001"
    text: "Test guideline"
solutions:
  - id: "SOL-001"
    name: "Test Solution"
    description: "Test description"
`,
        'utf-8',
      );
    }

    mockSchemaFetch('standards.json');
    const { runValidate } = await import('./validate');
    try {
      await runValidate(dir, { type: 'standard' });
    } catch {
      // process.exit
    }
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('5 - exits with error for nonexistent path', async () => {
    const { runValidate } = await import('./validate');
    try {
      await runValidate('/nonexistent/path', { type: 'standard' });
    } catch {
      // process.exit
    }
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('6 - exits with error for unknown type', async () => {
    const filePath = setupValidStandard();
    const { runValidate } = await import('./validate');
    try {
      await runValidate(filePath, { type: 'bogus' });
    } catch {
      // process.exit
    }
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('7 - json output produces valid JSON', async () => {
    const filePath = setupValidStandard();
    mockSchemaFetch('standards.json');
    const { runValidate } = await import('./validate');
    try {
      await runValidate(filePath, { type: 'standard', output: 'json' });
    } catch {
      // process.exit
    }

    // Find the JSON output from stdout calls
    const jsonCall = stdoutSpy.mock.calls.find((call) => {
      const text = call[0] as string;
      try {
        JSON.parse(text);
        return true;
      } catch {
        return false;
      }
    });
    expect(jsonCall).toBeDefined();
    const parsed = JSON.parse(jsonCall![0] as string);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty('file');
    expect(parsed[0]).toHaveProperty('valid');
    expect(parsed[0].valid).toBe(true);
  });

  it('8 - empty directory exits with error', async () => {
    const emptyDir = path.join(tmpDir, 'empty-standards');
    fs.mkdirSync(emptyDir, { recursive: true });
    const { runValidate } = await import('./validate');
    try {
      await runValidate(emptyDir, { type: 'standard' });
    } catch {
      // process.exit
    }
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
