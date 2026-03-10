/* ── AaC MCP Server Factory ── */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResources } from "./resources/index.js";
import { registerTools } from "./tools/index.js";
import { registerPrompts } from "./prompts/index.js";

/**
 * Create and configure the Architecture-as-Code MCP server.
 *
 * @param repoRoot - Absolute path to the AaC repository root directory.
 * @returns An object containing the configured {@link McpServer} instance.
 */
export function createServer(repoRoot: string): { server: McpServer } {
  const server = new McpServer(
    {
      name: "aac-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
      instructions: `Architecture as Code MCP Server.

This server provides access to enterprise architecture governance data:
- Resources: Read system models, standards, waivers, and patterns from the AaC repository
- Tools: Validate architecture YAML, lint for compliance violations, scaffold waiver requests
- Prompts: Guided workflows for designing new systems and requesting architecture exceptions

The repository root is: ${repoRoot}`,
    },
  );

  registerResources(server, repoRoot);
  registerTools(server, repoRoot);
  registerPrompts(server);

  return { server };
}
