/* ── Prompt: Design New System ── */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the "design_new_system" prompt.
 *
 * Guides an LLM through a step-by-step workflow to produce a validated,
 * compliant C4 architecture YAML model for a brand-new system.
 */
export function registerDesignNewSystemPrompt(server: McpServer): void {
  server.registerPrompt(
    "design_new_system",
    {
      title: "Design New System",
      description:
        "Design a new C4 architecture model that conforms to enterprise standards and patterns",
      argsSchema: {
        systemName: z.string().describe("Name of the new system to design"),
        description: z
          .string()
          .describe("High-level description of the system's purpose"),
      },
    },
    (args) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are an enterprise architect. Design a new system called "${args.systemName}".
Description: ${args.description}

Follow these steps:

1. Read the approved technology standards:
   - Use resource aac://standards to list all available standards
   - Read relevant standards for this system type

2. Review existing architecture patterns for reference:
   - Use resource aac://patterns to see available patterns
   - Read relevant pattern details from aac://patterns/{id}
   - Apply the most relevant pattern to your design

3. Study an existing system model for format reference:
   - Use resource aac://systems to list existing systems
   - Read one system from aac://systems/{id} to understand the YAML structure

4. Review the required schema:
   - Use resource aac://schemas/system to see the JSON Schema your output must conform to

5. Generate a compliant C4 YAML model including:
   - name and description
   - model.softwareSystems with containers, relationships, technology fields
   - model.deploymentNodes with container instances
   - views (systemContextViews, containerViews)

6. Validate your generated YAML:
   - Use the validate_architecture tool with your YAML content
   - Fix any validation errors before presenting the result

7. Run compliance checks:
   - Use the lint_compliance tool to verify enterprise policy compliance
   - Address any violations found

Present the final validated YAML to the user.`,
          },
        },
      ],
    }),
  );
}
