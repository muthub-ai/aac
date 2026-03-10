/* ── Tool Registration — barrel file for all MCP tools ── */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerValidateArchitectureTool } from "./validate-architecture.js";
import { registerLintComplianceTool } from "./lint-compliance.js";
import { registerScaffoldWaiverTool } from "./scaffold-waiver.js";

/**
 * Register all AaC MCP tools on the given server.
 */
export function registerTools(server: McpServer, repoRoot: string): void {
  registerValidateArchitectureTool(server, repoRoot);
  registerLintComplianceTool(server, repoRoot);
  registerScaffoldWaiverTool(server, repoRoot);
}
