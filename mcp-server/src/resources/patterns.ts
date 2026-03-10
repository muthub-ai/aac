/* ── Pattern Resources — expose patterns/ directory as MCP resources ── */

import path from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { discoverSubdirs, readText } from '../lib/repo-resolver.js';

/**
 * Register pattern-related MCP resources.
 *
 * - `aac://patterns`      — JSON list of pattern directory names
 * - `aac://patterns/{id}` — raw YAML for a specific pattern
 */
export function registerPatternResources(server: McpServer, repoRoot: string): void {
  const patternsDir = path.join(repoRoot, 'patterns');

  /* ── Static: list all patterns ── */
  server.registerResource(
    'patterns-list',
    'aac://patterns',
    { mimeType: 'application/json', description: 'List of all pattern directory names' },
    async (uri) => {
      try {
        const dirs = discoverSubdirs(patternsDir);
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: 'application/json',
              text: JSON.stringify(dirs, null, 2),
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
              text: JSON.stringify({ error: `Failed to list patterns: ${message}` }),
            },
          ],
        };
      }
    },
  );

  /* ── Dynamic: single pattern YAML ── */
  server.registerResource(
    'pattern-detail',
    new ResourceTemplate('aac://patterns/{id}', { list: undefined }),
    { mimeType: 'text/yaml', description: 'Raw YAML definition for a specific pattern' },
    async (uri, variables) => {
      const id = String(variables.id);
      try {
        const yamlPath = path.join(patternsDir, id, 'pattern.yaml');
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
              text: `Error reading pattern "${id}": ${message}`,
            },
          ],
        };
      }
    },
  );
}
