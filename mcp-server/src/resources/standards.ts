/* ── Standard Resources — expose standards/ directory as MCP resources ── */

import path from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { discoverYamlFiles, readYaml, readText } from '../lib/repo-resolver.js';

interface StandardSummary {
  filename: string;
  standardId: string;
  name: string;
}

/**
 * Register standard-related MCP resources.
 *
 * - `aac://standards`            — JSON list of all standards
 * - `aac://standards/{filename}` — raw YAML for a specific standard
 */
export function registerStandardResources(server: McpServer, repoRoot: string): void {
  const standardsDir = path.join(repoRoot, 'standards');

  /* ── Static: list all standards ── */
  server.registerResource(
    'standards-list',
    'aac://standards',
    { mimeType: 'application/json', description: 'List of all standards with IDs and names' },
    async (uri) => {
      try {
        const files = discoverYamlFiles(standardsDir);
        const standards: StandardSummary[] = files.map((file) => {
          const basename = file.replace(/\.ya?ml$/, '');
          try {
            const data = readYaml(path.join(standardsDir, file)) as Record<string, unknown>;
            return {
              filename: basename,
              standardId: String(data['standardId'] ?? basename),
              name: String(data['name'] ?? basename),
            };
          } catch {
            return { filename: basename, standardId: basename, name: basename };
          }
        });

        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: 'application/json',
              text: JSON.stringify(standards, null, 2),
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
              text: JSON.stringify({ error: `Failed to list standards: ${message}` }),
            },
          ],
        };
      }
    },
  );

  /* ── Dynamic: single standard YAML ── */
  server.registerResource(
    'standard-detail',
    new ResourceTemplate('aac://standards/{filename}', { list: undefined }),
    { mimeType: 'text/yaml', description: 'Raw YAML definition for a specific standard' },
    async (uri, variables) => {
      const filename = String(variables.filename);
      try {
        const yamlPath = path.join(standardsDir, `${filename}.yaml`);
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
              text: `Error reading standard "${filename}": ${message}`,
            },
          ],
        };
      }
    },
  );
}
