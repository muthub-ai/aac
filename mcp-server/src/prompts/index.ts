/* ── Prompt Registration — barrel file for all MCP prompts ── */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDesignNewSystemPrompt } from "./design-new-system.js";
import { registerRequestExceptionPrompt } from "./request-exception.js";

/**
 * Register all AaC MCP prompts on the given server.
 */
export function registerPrompts(server: McpServer): void {
  registerDesignNewSystemPrompt(server);
  registerRequestExceptionPrompt(server);
}
