/* ── Validate Architecture Tool — schema-validate YAML against AaC JSON Schemas ── */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  validateYamlContent,
  detectSchemaType,
  type ValidationError,
} from "../lib/validator.js";
import { loadSchema, isValidType } from "../lib/schema-loader.js";

interface ValidateResult {
  [key: string]: unknown;
  valid: boolean;
  type: string;
  errorCount: number;
  errors: ValidationError[];
}

export function registerValidateArchitectureTool(
  server: McpServer,
  repoRoot: string,
): void {
  server.registerTool(
    "validate_architecture",
    {
      title: "Validate Architecture YAML",
      description:
        "Validate an Architecture-as-Code YAML document against the appropriate " +
        "JSON Schema (system, pattern, standard, or waiver). Optionally auto-detects " +
        "the schema type from the YAML content.",
      inputSchema: {
        yamlContent: z.string().describe("The raw YAML content to validate"),
        type: z
          .enum(["system", "pattern", "standard", "waiver"])
          .optional()
          .describe(
            "Schema type to validate against. If omitted, the type is auto-detected from the YAML content.",
          ),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => {
      try {
        // Resolve the schema type — explicit or auto-detected
        let resolvedType: string | undefined = args.type;
        if (!resolvedType) {
          const detected = detectSchemaType(args.yamlContent);
          if (!detected || !isValidType(detected)) {
            const errResult: ValidateResult = {
              valid: false,
              type: "unknown",
              errorCount: 1,
              errors: [
                {
                  path: "/",
                  message:
                    "Could not auto-detect schema type. Provide the 'type' parameter explicitly.",
                },
              ],
            };
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: Could not auto-detect schema type from YAML content. Please specify the 'type' parameter.",
                },
              ],
              structuredContent: errResult,
              isError: true,
            };
          }
          resolvedType = detected;
        }

        const schema = loadSchema(repoRoot, resolvedType);
        const result = validateYamlContent(args.yamlContent, schema);

        const structured: ValidateResult = {
          valid: result.valid,
          type: resolvedType,
          errorCount: result.errors.length,
          errors: result.errors,
        };

        const summary = result.valid
          ? `Validation passed for type "${resolvedType}". No errors found.`
          : `Validation failed for type "${resolvedType}" with ${String(result.errors.length)} error(s):\n` +
            result.errors
              .map((e) => `  - ${e.path}: ${e.message}`)
              .join("\n");

        return {
          content: [{ type: "text" as const, text: summary }],
          structuredContent: structured,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const errResult: ValidateResult = {
          valid: false,
          type: args.type ?? "unknown",
          errorCount: 1,
          errors: [{ path: "/", message: msg }],
        };
        return {
          content: [{ type: "text" as const, text: `Error: ${msg}` }],
          structuredContent: errResult,
          isError: true,
        };
      }
    },
  );
}
