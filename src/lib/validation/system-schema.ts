import { z } from 'zod';

// ── Component ───────────────────────────────────────────────────────
export const YamlComponentSchema = z.object({
  label: z.string().min(1, 'Component label is required'),
  description: z.string().optional(),
  technology: z.string().optional(),
});

// ── Container ───────────────────────────────────────────────────────
export const YamlContainerSchema = z.object({
  label: z.string().min(1, 'Container label is required'),
  description: z.string().optional(),
  technology: z.string().optional(),
  containerType: z.string().optional(),
  components: z.record(z.string(), YamlComponentSchema).optional(),
});

// ── Software System ─────────────────────────────────────────────────
export const YamlSoftwareSystemSchema = z.object({
  label: z.string().min(1, 'Software system label is required'),
  description: z.string().optional(),
  boundary: z.enum(['Internal', 'External']).optional(),
  containers: z.record(z.string(), YamlContainerSchema).optional(),
});

// ── Actor ───────────────────────────────────────────────────────────
export const YamlActorSchema = z.object({
  type: z.enum(['Person', 'SoftwareSystem'], {
    message: "Actor type must be 'Person' or 'SoftwareSystem'",
  }),
  label: z.string().min(1, 'Actor label is required'),
  description: z.string().optional(),
  boundary: z.enum(['Internal', 'External']).optional(),
});

// ── Relationship ────────────────────────────────────────────────────
export const YamlRelationshipSchema = z.object({
  from: z.string().min(1, 'Relationship "from" is required'),
  to: z.string().min(1, 'Relationship "to" is required'),
  label: z.string().optional(),
  protocol: z.string().optional(),
});

// ── Full Architecture YAML ──────────────────────────────────────────
export const YamlArchitectureSchema = z.object({
  actors: z.record(z.string(), YamlActorSchema).optional(),
  softwareSystems: z.record(z.string(), YamlSoftwareSystemSchema).optional(),
  relationships: z.array(YamlRelationshipSchema).optional(),
});

// ── System Metadata (metadata.json) ─────────────────────────────────
export const SystemMetadataSchema = z.object({
  id: z
    .string()
    .min(1, 'System ID is required')
    .regex(/^[a-z0-9-]+$/, 'System ID must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1, 'System name is required'),
  repoCount: z.number().int().nonnegative(),
  linesOfCode: z.number().int().nonnegative(),
  deployableUnits: z.number().int().nonnegative(),
  domainModules: z.number().int().nonnegative(),
  domainObjects: z.number().int().nonnegative(),
  domainBehaviors: z.number().int().nonnegative(),
  lastScan: z.string().datetime({ message: 'lastScan must be a valid ISO 8601 datetime' }),
  branchName: z.string().min(1, 'Branch name is required'),
});

// ── Inferred types ──────────────────────────────────────────────────
export type ValidatedArchitecture = z.infer<typeof YamlArchitectureSchema>;
export type ValidatedMetadata = z.infer<typeof SystemMetadataSchema>;

// ── Validation helpers ──────────────────────────────────────────────

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

/**
 * Validate a parsed YAML architecture object against the schema.
 * Returns a result with success flag and human-readable error messages.
 */
export function validateArchitecture(data: unknown): ValidationResult {
  const result = YamlArchitectureSchema.safeParse(data);
  if (result.success) {
    return { success: true, errors: [] };
  }
  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`,
  );
  return { success: false, errors };
}

/**
 * Validate relationship references resolve to declared actors/systems/containers/components.
 */
export function validateRelationshipRefs(data: ValidatedArchitecture): ValidationResult {
  const errors: string[] = [];
  const knownIds = new Set<string>();

  if (data.actors) {
    for (const id of Object.keys(data.actors)) {
      knownIds.add(id);
    }
  }

  if (data.softwareSystems) {
    for (const [sysId, sys] of Object.entries(data.softwareSystems)) {
      knownIds.add(sysId);
      if (sys.containers) {
        for (const [cId, container] of Object.entries(sys.containers)) {
          knownIds.add(`${sysId}.${cId}`);
          if (container.components) {
            for (const compId of Object.keys(container.components)) {
              knownIds.add(`${sysId}.${cId}.${compId}`);
            }
          }
        }
      }
    }
  }

  if (data.relationships) {
    for (const [i, rel] of data.relationships.entries()) {
      if (!resolveRef(rel.from, knownIds)) {
        errors.push(`relationships[${i}].from: "${rel.from}" does not match any declared element`);
      }
      if (!resolveRef(rel.to, knownIds)) {
        errors.push(`relationships[${i}].to: "${rel.to}" does not match any declared element`);
      }
    }
  }

  return { success: errors.length === 0, errors };
}

/** Resolve a reference — exact match first, then suffix match (mirrors yaml-to-graph logic). */
function resolveRef(ref: string, knownIds: Set<string>): boolean {
  if (knownIds.has(ref)) return true;
  for (const id of knownIds) {
    if (id.endsWith(`.${ref}`)) return true;
  }
  return false;
}

/**
 * Validate metadata object against the schema.
 */
export function validateMetadata(data: unknown): ValidationResult {
  const result = SystemMetadataSchema.safeParse(data);
  if (result.success) {
    return { success: true, errors: [] };
  }
  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`,
  );
  return { success: false, errors };
}
