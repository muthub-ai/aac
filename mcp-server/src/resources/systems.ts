/* ── System Resources — expose model/ directory as MCP resources ── */

import path from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { discoverSubdirs, readYaml, readText } from '../lib/repo-resolver.js';

interface SystemMetadata {
  id: string;
  name: string;
}

/**
 * Register system-related MCP resources.
 *
 * - `aac://systems`      — JSON list of all system IDs + names
 * - `aac://systems/{id}` — raw YAML for a specific system
 */
export function registerSystemResources(server: McpServer, repoRoot: string): void {
  const modelDir = path.join(repoRoot, 'model');

  /* ── Static: list all systems ── */
  server.registerResource(
    'systems-list',
    'aac://systems',
    { mimeType: 'application/json', description: 'List of all system IDs and names' },
    async (uri) => {
      try {
        const dirs = discoverSubdirs(modelDir);
        const systems: SystemMetadata[] = dirs.map((dir) => {
          try {
            const metaPath = path.join(modelDir, dir, 'metadata.json');
            const meta = readYaml(metaPath) as Record<string, unknown>;
            return {
              id: String(meta['id'] ?? dir),
              name: String(meta['name'] ?? dir),
            };
          } catch {
            return { id: dir, name: dir };
          }
        });

        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: 'application/json',
              text: JSON.stringify(systems, null, 2),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: 'application/json',
              text: JSON.stringify({ error: `Failed to list systems: ${message}` }),
            },
          ],
        };
      }
    },
  );

  /* ── Dynamic: single system YAML ── */
  server.registerResource(
    'system-detail',
    new ResourceTemplate('aac://systems/{id}', { list: undefined }),
    { mimeType: 'text/yaml', description: 'Raw YAML definition for a specific system' },
    async (uri, variables) => {
      const id = String(variables.id);
      try {
        const yamlPath = path.join(modelDir, id, 'system.yaml');
        const text = readText(yamlPath);
        return {
          contents: [{ uri: uri.toString(), mimeType: 'text/yaml', text }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: 'text/plain',
              text: `Error reading system "${id}": ${message}`,
            },
          ],
        };
      }
    },
  );
}
