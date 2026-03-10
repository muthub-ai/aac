import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SchemaManager, VALID_TYPES } from './schema-manager';

describe('SchemaManager', () => {
  let tmpDir: string;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aac-schema-test-'));
    originalFetch = globalThis.fetch;
    // Suppress logger output during tests
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  /** Create a SchemaManager that caches into our temp dir */
  function createManager(baseUrl = 'https://example.com/schema'): SchemaManager {
    // Use a unique cache dir name that resolves into tmpDir
    // We'll override the cache dir by constructing the manager and then
    // setting the base URL and cache dir via constructor params
    return new SchemaManager(baseUrl, path.join(tmpDir, '.aac'));
  }

  /** Mock fetch to return a given schema */
  function mockFetch(schema: Record<string, unknown>, etag = '"abc123"'): void {
    globalThis.fetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      if (opts.method === 'HEAD') {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ etag }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(schema),
        headers: new Headers({ etag }),
      });
    });
  }

  function mockFetchFailure(): void {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
  }

  it('1 - VALID_TYPES contains expected types', () => {
    expect(VALID_TYPES).toContain('system');
    expect(VALID_TYPES).toContain('application');
    expect(VALID_TYPES).toContain('pattern');
    expect(VALID_TYPES).toContain('standard');
    expect(VALID_TYPES).toContain('waiver');
  });

  it('2 - schemaFileFor maps known types', () => {
    expect(SchemaManager.schemaFileFor('system')).toBe('application-schema.json');
    expect(SchemaManager.schemaFileFor('application')).toBe('application-schema.json');
    expect(SchemaManager.schemaFileFor('pattern')).toBe('pattern-schema.json');
    expect(SchemaManager.schemaFileFor('standard')).toBe('standards.json');
    expect(SchemaManager.schemaFileFor('waiver')).toBe('waivers.json');
  });

  it('3 - schemaFileFor returns undefined for unknown type', () => {
    expect(SchemaManager.schemaFileFor('unknown')).toBeUndefined();
  });

  it('4 - getSchema throws for unknown type', async () => {
    const manager = createManager();
    await expect(manager.getSchema('bogus')).rejects.toThrow('Unknown schema type');
  });

  it('5 - getSchema fetches and caches a schema', async () => {
    const schema = { type: 'object', properties: {} };
    mockFetch(schema);
    const manager = createManager();
    const result = await manager.getSchema('standard');
    expect(result).toEqual(schema);
    // fetch should have been called (GET)
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it('6 - getSchema returns cached schema on ETag match', async () => {
    const schema = { type: 'object', title: 'cached' };
    mockFetch(schema, '"etag-v1"');
    const manager = createManager();

    // First fetch
    const first = await manager.getSchema('waiver');
    expect(first).toEqual(schema);

    // Second fetch — same etag, should return cached
    const second = await manager.getSchema('waiver');
    expect(second).toEqual(schema);

    // Fetch should have been called: first time GET, second time HEAD only
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBe(2); // GET + HEAD
  });

  it('7 - getSchema re-fetches when ETag changes', async () => {
    const schemaV1 = { type: 'object', title: 'v1' };
    const schemaV2 = { type: 'object', title: 'v2' };
    mockFetch(schemaV1, '"etag-v1"');
    const manager = createManager();

    await manager.getSchema('standard');

    // Now serve v2 with different etag
    mockFetch(schemaV2, '"etag-v2"');
    const result = await manager.getSchema('standard');
    expect(result).toEqual(schemaV2);
  });

  it('8 - getSchema falls back to cache on network failure', async () => {
    const schema = { type: 'object', title: 'fallback' };
    mockFetch(schema, '"etag-fb"');
    const manager = createManager();

    // Populate cache
    await manager.getSchema('pattern');

    // Now mock network failure
    mockFetchFailure();
    const result = await manager.getSchema('pattern');
    expect(result).toEqual(schema);
  });

  it('9 - getSchema throws when no cache and network fails', async () => {
    mockFetchFailure();
    const manager = createManager();
    await expect(manager.getSchema('standard')).rejects.toThrow();
  });

  it('10 - forceRefresh skips ETag check', async () => {
    const schemaOld = { type: 'object', title: 'old' };
    const schemaNew = { type: 'object', title: 'new' };
    mockFetch(schemaOld, '"etag-old"');
    const manager = createManager();

    await manager.getSchema('waiver');

    // Force refresh with new schema
    mockFetch(schemaNew, '"etag-new"');
    const result = await manager.getSchema('waiver', true);
    expect(result).toEqual(schemaNew);
    // Last call should be GET (not HEAD)
    const lastCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    expect(lastCall?.[1]?.method).toBe('GET');
  });
});
