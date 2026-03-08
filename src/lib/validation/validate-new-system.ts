import yaml from 'js-yaml';
import {
  validateArchitecture,
  validateMetadata,
  validateRelationshipRefs,
  type ValidationResult,
  type ValidatedArchitecture,
} from './system-schema';

export interface NewSystemValidationResult {
  valid: boolean;
  yamlErrors: string[];
  metadataErrors: string[];
  referenceErrors: string[];
}

/**
 * Validate a new system's YAML content and metadata before creation.
 * Use this when a user submits a new system to ensure compliance
 * with the Structurizr DSL YAML schema.
 */
export function validateNewSystem(
  yamlContent: string,
  metadata: unknown,
): NewSystemValidationResult {
  const result: NewSystemValidationResult = {
    valid: true,
    yamlErrors: [],
    metadataErrors: [],
    referenceErrors: [],
  };

  // Validate YAML content
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlContent);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid YAML syntax';
    result.yamlErrors.push(msg);
    result.valid = false;
    return result;
  }

  const archResult = validateArchitecture(parsed);
  if (!archResult.success) {
    result.yamlErrors.push(...archResult.errors);
    result.valid = false;
  }

  // Validate relationship references (only if architecture is structurally valid)
  if (archResult.success && parsed) {
    const refResult = validateRelationshipRefs(parsed as ValidatedArchitecture);
    if (!refResult.success) {
      result.referenceErrors.push(...refResult.errors);
      result.valid = false;
    }
  }

  // Validate metadata
  const metaResult = validateMetadata(metadata);
  if (!metaResult.success) {
    result.metadataErrors.push(...metaResult.errors);
    result.valid = false;
  }

  return result;
}

/**
 * Validate only a YAML architecture string (no metadata).
 * Useful for validating YAML edits in the editor.
 */
export function validateYamlContent(yamlContent: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlContent);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid YAML syntax';
    return { success: false, errors: [msg] };
  }

  if (parsed === null || parsed === undefined) {
    return { success: true, errors: [] };
  }

  const archResult = validateArchitecture(parsed);
  if (!archResult.success) {
    return archResult;
  }

  const refResult = validateRelationshipRefs(parsed as ValidatedArchitecture);
  return refResult;
}
