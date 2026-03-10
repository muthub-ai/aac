/* ── Scaffold Waiver Tool — generate a pre-filled waiver YAML from inputs ── */

import path from "node:path";
import yaml from "js-yaml";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  validateYamlContent,
  type ValidationError,
} from "../lib/validator.js";
import { loadSchema } from "../lib/schema-loader.js";
import { writeText } from "../lib/repo-resolver.js";

interface ScaffoldResult {
  [key: string]: unknown;
  filePath: string;
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Extract an uppercase alpha-only category token from a standard ID.
 * e.g. "STD-SEC-001" → "SEC", "data-governance" → "DATAGOVERNANCE"
 * Falls back to "WAIV" if nothing useful can be extracted.
 */
function extractCategory(standardId: string): string {
  // Try to match a pattern like STD-XXX-NNN or similar with a middle segment
  const parts = standardId.toUpperCase().replace(/[^A-Z0-9]+/g, "-").split("-");
  // Find the first purely-alpha segment that is not "STD", "EXC", etc.
  for (const part of parts) {
    if (/^[A-Z]+$/.test(part) && !["STD", "EXC", "PAT"].includes(part) && part.length >= 2) {
      return part;
    }
  }
  // Fallback: use first alpha chars of the standardId
  const alpha = standardId.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return alpha.length >= 2 ? alpha.slice(0, 8) : "WAIV";
}

/** Convert a string to a lowercase kebab-case slug. */
function toKebabSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Format a Date as ISO date string (YYYY-MM-DD). */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function registerScaffoldWaiverTool(
  server: McpServer,
  repoRoot: string,
): void {
  server.registerTool(
    "scaffold_waiver",
    {
      title: "Scaffold Architecture Waiver",
      description:
        "Generate a pre-filled waiver YAML file for a given application and standard. " +
        "The waiver is validated against the waiver JSON Schema and written to the waivers/ directory.",
      inputSchema: {
        applicationId: z
          .string()
          .describe("The application or system ID requesting the waiver"),
        standardId: z
          .string()
          .describe("The standard ID being waived (e.g. STD-SEC-001)"),
        rationale: z
          .string()
          .describe(
            "Technical or business justification for the waiver (min 10 chars)",
          ),
        mitigatingControls: z
          .array(z.string())
          .optional()
          .describe(
            "List of compensating controls to mitigate the risk of non-compliance",
          ),
        requestedDurationMonths: z
          .number()
          .optional()
          .describe(
            "Duration in months before the waiver expires (default: 6)",
          ),
      },
    },
    async (args) => {
      try {
        const {
          applicationId,
          standardId,
          rationale,
          mitigatingControls,
          requestedDurationMonths,
        } = args;

        const durationMonths = requestedDurationMonths ?? 6;

        // Generate file slug (kebab-case) and exception ID (schema pattern: EXC-[A-Z]+-[0-9]{3})
        const slug = `${toKebabSlug(applicationId)}-${toKebabSlug(standardId)}`;
        const category = extractCategory(standardId);
        const exceptionId = `EXC-${category}-001`;

        // Compute dates
        const now = new Date();
        const requestedDate = isoDate(now);
        const expirationDate = isoDate(
          new Date(
            now.getFullYear(),
            now.getMonth() + durationMonths,
            now.getDate(),
          ),
        );

        // Build compensating controls array (schema requires minItems: 1)
        const controls =
          mitigatingControls && mitigatingControls.length > 0
            ? mitigatingControls
            : ["TBD - define compensating controls"];

        const compensatingControls = controls.map((control) => ({
          control,
          effectiveness: "MEDIUM" as const,
        }));

        // Build the waiver object matching schema/waivers.json
        const waiverData: Record<string, unknown> = {
          exceptionId,
          title: `Waiver: ${standardId} for ${applicationId}`,
          targetAppId: applicationId,
          targetAppName: applicationId,
          violatedStandardId: standardId,
          violatedStandardName: standardId,
          status: "PENDING_REVIEW",
          rationale,
          riskSeverity: "MEDIUM",
          compensatingControls,
          requestedBy: "TBD",
          requestedDate,
          remediationPlan: {
            description: rationale,
            targetDate: expirationDate,
          },
        };

        // Serialize to YAML
        const yamlContent = yaml.dump(waiverData, {
          lineWidth: 120,
          noRefs: true,
          quotingType: '"',
          forceQuotes: false,
        });

        // Validate against the waiver schema
        const schema = loadSchema(repoRoot, "waiver");
        const validation = validateYamlContent(yamlContent, schema);

        // Write file to waivers/ directory
        const fileName = `${slug}.yaml`;
        const filePath = path.join(repoRoot, "waivers", fileName);
        writeText(filePath, yamlContent);

        const result: ScaffoldResult = {
          filePath: `waivers/${fileName}`,
          valid: validation.valid,
          errors: validation.errors,
        };

        const summary = validation.valid
          ? `Waiver scaffolded and written to ${result.filePath}. Validation passed.`
          : `Waiver written to ${result.filePath} with ${String(validation.errors.length)} validation warning(s):\n` +
            validation.errors
              .map((e) => `  - ${e.path}: ${e.message}`)
              .join("\n");

        return {
          content: [{ type: "text" as const, text: summary }],
          structuredContent: result,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const errResult: ScaffoldResult = {
          filePath: "",
          valid: false,
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
