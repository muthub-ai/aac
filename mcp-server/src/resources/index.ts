/* ── Resource Registration — barrel file for all MCP resources ── */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSystemResources } from './systems.js';
import { registerStandardResources } from './standards.js';
import { registerWaiverResources } from './waivers.js';
import { registerPatternResources } from './patterns.js';
import { registerSchemaResources } from './schemas.js';

/**
 * Register all AaC MCP resources on the given server.
 */
export function registerResources(server: McpServer, repoRoot: string): void {
  registerSystemResources(server, repoRoot);
  registerStandardResources(server, repoRoot);
  registerWaiverResources(server, repoRoot);
  registerPatternResources(server, repoRoot);
  registerSchemaResources(server, repoRoot);
}
