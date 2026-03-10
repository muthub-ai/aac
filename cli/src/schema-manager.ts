/* ── SchemaManager — remote fetch, ETag cache, offline fallback ── */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import * as logger from './utils/logger.js';

const SCHEMA_FILE_MAP: Record<string, string> = {
  system: 'application-schema.json',
  application: 'application-schema.json',
  pattern: 'pattern-schema.json',
  standard: 'standards.json',
  waiver: 'waivers.json',
};

export const VALID_TYPES = Object.keys(SCHEMA_FILE_MAP);

interface CacheEntry {
  etag: string;
  schema: Record<string, unknown>;
}

export class SchemaManager {
  private baseUrl: string;
  private cacheDir: string;
  private token: string | undefined;

  constructor(baseUrl: string, cacheDirName: string = '.aac') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.cacheDir = path.join(os.homedir(), cacheDirName, 'cache', 'schemas');
    this.token = process.env.GITHUB_TOKEN;
  }

  /** Resolve a type name to its schema filename */
  static schemaFileFor(type: string): string | undefined {
    return SCHEMA_FILE_MAP[type];
  }

  /** Get schema — with cache, ETag validation, and offline fallback */
  async getSchema(
    type: string,
    forceRefresh: boolean = false,
  ): Promise<Record<string, unknown>> {
    const fileName = SCHEMA_FILE_MAP[type];
    if (!fileName) {
      throw new Error(`Unknown schema type "${type}". Valid types: ${VALID_TYPES.join(', ')}`);
    }

    const url = `${this.baseUrl}/${fileName}`;
    const cachePath = this.cachePath(fileName);
    const cached = this.readCache(cachePath);

    // Force refresh: skip ETag check, download fresh
    if (forceRefresh) {
      return this.fetchAndCache(url, cachePath);
    }

    // If we have a cached version, do a conditional fetch
    if (cached) {
      try {
        const headResp = await this.fetch(url, 'HEAD');
        const remoteEtag = headResp.headers.get('etag') ?? '';

        if (remoteEtag && remoteEtag === cached.etag) {
          logger.dim(`  Schema "${fileName}" loaded from cache (ETag match)`);
          return cached.schema;
        }
        // ETag mismatch — download new version
        return this.fetchAndCache(url, cachePath);
      } catch {
        // Network failure — fall back to cache
        logger.warn(`Network unavailable. Using cached schema for "${type}".`);
        return cached.schema;
      }
    }

    // No cache — must fetch
    return this.fetchAndCache(url, cachePath);
  }

  /** Fetch schema from remote, store in cache */
  private async fetchAndCache(
    url: string,
    cachePath: string,
  ): Promise<Record<string, unknown>> {
    const resp = await this.fetch(url, 'GET');
    if (!resp.ok) {
      // Try cached fallback
      const cached = this.readCache(cachePath);
      if (cached) {
        logger.warn(`HTTP ${resp.status} from remote. Using cached schema.`);
        return cached.schema;
      }
      throw new Error(`Failed to fetch schema: HTTP ${resp.status} ${resp.statusText} — ${url}`);
    }

    const schema = (await resp.json()) as Record<string, unknown>;
    const etag = resp.headers.get('etag') ?? '';
    this.writeCache(cachePath, { etag, schema });

    const fileName = path.basename(cachePath);
    logger.dim(`  Schema "${fileName}" fetched and cached`);
    return schema;
  }

  /** Perform an HTTP request with optional auth */
  private async fetch(url: string, method: 'GET' | 'HEAD'): Promise<Response> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'aac-cli/1.0',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return globalThis.fetch(url, { method, headers });
  }

  /** Read a cache entry from disk */
  private readCache(cachePath: string): CacheEntry | null {
    if (!fs.existsSync(cachePath)) return null;
    try {
      const raw = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(raw) as CacheEntry;
    } catch {
      return null;
    }
  }

  /** Write a cache entry to disk */
  private writeCache(cachePath: string, entry: CacheEntry): void {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(entry), 'utf-8');
  }

  /** Cache file path for a given schema filename */
  private cachePath(fileName: string): string {
    return path.join(this.cacheDir, fileName);
  }
}
