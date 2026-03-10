/* ── Waiver Resources — expose waivers/ directory as MCP resources ── */

import path from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { discoverYamlFiles, readYaml, readText } from '../lib/repo-resolver.js';

interface WaiverSummary {
  filename: string;
  exception_id: string;
  status: string;
}

/**
 * Register waiver-related MCP resources.
 *
 * - `aac://waivers`            — JSON list of all waivers
 * - `aac://waivers/active`     — JSON list of approved (active) waivers
 * - `aac://waivers/{filename}` — raw YAML for a specific waiver
 */
export function registerWaiverResources(server: McpServer, repoRoot: string): void {
  const waiversDir = path.join(repoRoot, 'waivers');

  /** Read all waiver summaries from the waivers directory. */
  function readAllWaivers(): WaiverSummary[] {
    const files = discoverYamlFiles(waiversDir);
    return files.map((file) => {
      const basename = file.replace(/\.ya?ml$/, '');
      try {
        const data = readYaml(path.join(waiversDir, file)) as Record<string, unknown>;
        return {
          filename: basename,
          exception_id: String(data['exception_id'] ?? basename),
          status: String(data['status'] ?? 'unknown'),
        };
      } catch {
        return { filename: basename, exception_id: basename, status: 'unknown' };
      }
    });
  }

  /* ── Static: list all waivers ── */
  server.registerResource(
    'waivers-list',
    'aac://waivers',
    { mimeType: 'application/json', description: 'List of all waivers with exception IDs and statuses' },
    async (uri) => {
      try {
        const waivers = readAllWaivers();
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: 'application/json',
              text: JSON.stringify(waivers, null, 2),
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
              text: JSON.stringify({ error: `Failed to list waivers: ${message}` }),
            },
          ],
        };
      }
    },
  );

  /* ── Static: active (approved) waivers only ── */
  server.registerResource(
    'waivers-active',
    'aac://waivers/active',
    { mimeType: 'application/json', description: 'List of currently active (approved) waivers' },
    async (uri) => {
      try {
        const waivers = readAllWaivers();
        const active = waivers.filter((w) => w.status === 'approved');
        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: 'application/json',
              text: JSON.stringify(active, null, 2),
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
              text: JSON.stringify({ error: `Failed to list active waivers: ${message}` }),
            },
          ],
        };
      }
    },
  );

  /* ── Dynamic: single waiver YAML ── */
  server.registerResource(
    'waiver-detail',
    new ResourceTemplate('aac://waivers/{filename}', { list: undefined }),
    { mimeType: 'text/yaml', description: 'Raw YAML definition for a specific waiver' },
    async (uri, variables) => {
      const filename = String(variables.filename);
      try {
        const yamlPath = path.join(waiversDir, `${filename}.yaml`);
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
              text: `Error reading waiver "${filename}": ${message}`,
            },
          ],
        };
      }
    },
  );
}
