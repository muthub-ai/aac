/* ── Prompt: Request Architecture Exception ── */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the "request_architecture_exception" prompt.
 *
 * Walks an LLM through the process of generating a formal waiver request
 * to bypass an architecture standard for a specific application.
 */
export function registerRequestExceptionPrompt(server: McpServer): void {
  server.registerPrompt(
    "request_architecture_exception",
    {
      title: "Request Architecture Exception",
      description:
        "Generate a formal waiver request to bypass an architecture standard",
      argsSchema: {
        standardId: z
          .string()
          .describe("Identifier of the standard to request an exception for"),
        applicationId: z
          .string()
          .describe("Identifier of the application requesting the exception"),
      },
    },
    (args) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are helping an engineer request a formal architecture exception (waiver).

Follow these steps:

1. Read the standard being waived:
   - Use resource aac://standards to find the standard "${args.standardId}"
   - Read its full content to understand what is being waived

2. Read the application context:
   - Use resource aac://systems/${args.applicationId} to understand the system architecture
   - Note the system's components, relationships, and deployment model

3. Gather information from the user:
   - Business justification: Why is this exception needed?
   - Financial impact: What is the cost of compliance vs. the risk of non-compliance?
   - Mitigating controls: What compensating measures will be implemented?
   - Requested duration: How long is the exception needed? (default: 6 months)

4. Generate the waiver:
   - Use the scaffold_waiver tool with the gathered information
   - Parameters: applicationId="${args.applicationId}", standardId="${args.standardId}"

5. Present the generated waiver YAML to the user for review.

6. If the user approves, confirm the waiver file location.
   If changes are needed, modify and re-validate.`,
          },
        },
      ],
    }),
  );
}
