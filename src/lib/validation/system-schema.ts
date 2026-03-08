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

// ── New Format Schemas ──────────────────────────────────────────────

const NewYamlRelationshipSchema = z.object({
  destinationId: z.string().min(1),
  description: z.string().optional(),
  technology: z.string().optional(),
});

const NewYamlContainerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  technology: z.string().optional(),
  tags: z.string().optional(),
  properties: z.record(z.string(), z.string()).optional(),
  relationships: z.array(NewYamlRelationshipSchema).optional(),
});

const NewYamlSoftwareSystemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  group: z.string().optional(),
  tags: z.string().optional(),
  disposition: z.string().optional(),
  dataClassification: z.string().optional(),
  properties: z.record(z.string(), z.string()).optional(),
  containers: z.array(NewYamlContainerSchema).optional(),
  relationships: z.array(NewYamlRelationshipSchema).optional(),
});

const NewYamlPersonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  relationships: z.array(NewYamlRelationshipSchema).optional(),
});

const NewYamlContainerInstanceSchema = z.object({
  containerId: z.string().min(1),
  instanceId: z.number(),
});

const NewYamlDeploymentChildSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  technology: z.string().optional(),
  tags: z.string().optional(),
  containerInstances: z.array(NewYamlContainerInstanceSchema).optional(),
});

const NewYamlInfrastructureNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  technology: z.string().optional(),
  tags: z.string().optional(),
  properties: z.record(z.string(), z.string()).optional(),
  relationships: z.array(NewYamlRelationshipSchema).optional(),
});

const NewYamlDeploymentNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  environment: z.string().optional(),
  technology: z.string().optional(),
  tags: z.string().optional(),
  infrastructureNodes: z.array(NewYamlInfrastructureNodeSchema).optional(),
  children: z.array(NewYamlDeploymentChildSchema).optional(),
  containerInstances: z.array(NewYamlContainerInstanceSchema).optional(),
});

const NewYamlViewDefinitionSchema = z.object({
  key: z.string().min(1),
  softwareSystemId: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  environment: z.string().optional(),
});

const NewYamlViewsSchema = z.object({
  systemContextViews: z.array(NewYamlViewDefinitionSchema).optional(),
  containerViews: z.array(NewYamlViewDefinitionSchema).optional(),
  deploymentViews: z.array(NewYamlViewDefinitionSchema).optional(),
});

const NewYamlModelSchema = z.object({
  people: z.array(NewYamlPersonSchema).optional(),
  softwareSystems: z.array(NewYamlSoftwareSystemSchema).optional(),
  deploymentNodes: z.array(NewYamlDeploymentNodeSchema).optional(),
});

export const NewYamlArchitectureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  model: NewYamlModelSchema,
  views: NewYamlViewsSchema.optional(),
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
export type ValidatedNewArchitecture = z.infer<typeof NewYamlArchitectureSchema>;
export type ValidatedMetadata = z.infer<typeof SystemMetadataSchema>;

// ── Validation helpers ──────────────────────────────────────────────

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

/** Detect whether data looks like the new schema format */
export function isNewSchemaFormat(data: unknown): boolean {
  return (
    data !== null &&
    typeof data === 'object' &&
    'model' in data &&
    typeof (data as Record<string, unknown>).model === 'object'
  );
}

export function validateArchitecture(data: unknown): ValidationResult {
  // Detect format and validate with the appropriate schema
  const schema = isNewSchemaFormat(data) ? NewYamlArchitectureSchema : YamlArchitectureSchema;
  const result = schema.safeParse(data);
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

/**
 * Validate relationship references for the new schema format.
 */
export function validateNewFormatRelationshipRefs(data: unknown): ValidationResult {
  if (!isNewSchemaFormat(data)) return { success: true, errors: [] };

  const doc = data as { model: { people?: Array<{ id: string; relationships?: Array<{ destinationId: string }> }>; softwareSystems?: Array<{ id: string; containers?: Array<{ id: string; relationships?: Array<{ destinationId: string }> }>; relationships?: Array<{ destinationId: string }> }> } };
  const errors: string[] = [];
  const knownIds = new Set<string>();

  // Collect all known IDs
  if (doc.model.people) {
    for (const person of doc.model.people) {
      knownIds.add(person.id);
    }
  }

  if (doc.model.softwareSystems) {
    for (const sys of doc.model.softwareSystems) {
      knownIds.add(sys.id);
      if (sys.containers) {
        for (const cont of sys.containers) {
          knownIds.add(cont.id);
          knownIds.add(`${sys.id}.${cont.id}`);
        }
      }
    }
  }

  // Validate all relationships
  if (doc.model.people) {
    for (const person of doc.model.people) {
      if (person.relationships) {
        for (const rel of person.relationships) {
          if (!resolveRef(rel.destinationId, knownIds)) {
            errors.push(`${person.id}: destinationId "${rel.destinationId}" does not match any declared element`);
          }
        }
      }
    }
  }

  if (doc.model.softwareSystems) {
    for (const sys of doc.model.softwareSystems) {
      if (sys.relationships) {
        for (const rel of sys.relationships) {
          if (!resolveRef(rel.destinationId, knownIds)) {
            errors.push(`${sys.id}: destinationId "${rel.destinationId}" does not match any declared element`);
          }
        }
      }
      if (sys.containers) {
        for (const cont of sys.containers) {
          if (cont.relationships) {
            for (const rel of cont.relationships) {
              if (!resolveRef(rel.destinationId, knownIds)) {
                errors.push(`${sys.id}.${cont.id}: destinationId "${rel.destinationId}" does not match any declared element`);
              }
            }
          }
        }
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
