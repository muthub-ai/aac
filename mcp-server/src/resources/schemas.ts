/* ── Schema Resources — expose schema/ directory as MCP resources ── */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadSchema } from '../lib/schema-loader.js';

/**
 * Register schema-related MCP resources.
 *
 * - `aac://schemas/{type}` — JSON Schema for a given type (system, standard, waiver, pattern)
 */
export function registerSchemaResources(server: McpServer, repoRoot: string): void {
  /* ── Dynamic: schema by type ── */
  server.registerResource(
    'schema-detail',
    new ResourceTemplate('aac://schemas/{type}', { list: undefined }),
    { mimeType: 'application/json', description: 'JSON Schema for a given architecture type (system, standard, waiver, pattern)' },
    async (uri, variables) => {
      const type = String(variables.type);
      try {
        const schema = loadSchema(repoRoot, type);
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: 'application/json',
              text: JSON.stringify(schema, null, 2),
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
              text: JSON.stringify({ error: `Failed to load schema for type "${type}": ${message}` }),
            },
          ],
        };
      }
    },
  );
}
