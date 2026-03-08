import { validateNewSystem, validateYamlContent } from './validate-new-system';

// ---------------------------------------------------------------------------
// Helpers – valid fixtures
// ---------------------------------------------------------------------------

const validMetadata = {
  id: 'my-system',
  name: 'My System',
  repoCount: 1,
  linesOfCode: 5000,
  deployableUnits: 2,
  domainModules: 3,
  domainObjects: 10,
  domainBehaviors: 7,
  lastScan: '2024-01-15T10:30:00Z',
  branchName: 'main',
};

const validYaml = `
actors:
  user:
    type: Person
    label: End User
softwareSystems:
  backend:
    label: Backend Service
    containers:
      api:
        label: API Server
        technology: Node.js
relationships:
  - from: user
    to: api
    label: Uses
`.trim();

const validYamlNoRelationships = `
softwareSystems:
  frontend:
    label: Frontend App
`.trim();

// ---------------------------------------------------------------------------
// validateNewSystem
// ---------------------------------------------------------------------------

describe('validateNewSystem', () => {
  // 1. Valid YAML + valid metadata -> valid: true, no errors
  it('returns valid: true with no errors for valid YAML and valid metadata', () => {
    const result = validateNewSystem(validYaml, validMetadata);

    expect(result.valid).toBe(true);
    expect(result.yamlErrors).toEqual([]);
    expect(result.metadataErrors).toEqual([]);
    expect(result.referenceErrors).toEqual([]);
  });

  // 2. Malformed YAML syntax -> valid: false, yamlErrors populated, early return
  it('returns yamlErrors for malformed YAML syntax', () => {
    const badYaml = `
actors:
  user:
    type: Person
  - this is invalid
`;
    const result = validateNewSystem(badYaml, validMetadata);

    expect(result.valid).toBe(false);
    expect(result.yamlErrors.length).toBeGreaterThan(0);
    // Metadata should still be validated (early return only skips arch/ref)
    // but the metadata here is valid so no metadata errors
    expect(result.metadataErrors).toEqual([]);
  });

  // 3. Valid YAML structure but invalid architecture schema -> yamlErrors populated
  it('returns yamlErrors when YAML parses but violates architecture schema', () => {
    // actors require type and label; omit them
    const invalidArchYaml = `
actors:
  user:
    description: Missing type and label
`;
    const result = validateNewSystem(invalidArchYaml, validMetadata);

    expect(result.valid).toBe(false);
    expect(result.yamlErrors.length).toBeGreaterThan(0);
    expect(result.yamlErrors.some((e) => e.toLowerCase().includes('type'))).toBe(true);
  });

  // 4. Invalid metadata (missing fields, bad ID) -> metadataErrors populated
  it('returns metadataErrors for invalid metadata with missing fields', () => {
    const badMetadata = { id: '', name: '' };
    const result = validateNewSystem(validYaml, badMetadata);

    expect(result.valid).toBe(false);
    expect(result.metadataErrors.length).toBeGreaterThan(0);
  });

  it('returns metadataErrors for metadata with invalid ID format', () => {
    const badIdMetadata = { ...validMetadata, id: 'INVALID_ID!!' };
    const result = validateNewSystem(validYaml, badIdMetadata);

    expect(result.valid).toBe(false);
    expect(result.metadataErrors.length).toBeGreaterThan(0);
    expect(result.metadataErrors.some((e) => e.includes('id'))).toBe(true);
  });

  // 5. Invalid relationship refs -> referenceErrors populated
  it('returns referenceErrors for unresolved relationship references', () => {
    const yamlWithBadRef = `
actors:
  user:
    type: Person
    label: User
relationships:
  - from: user
    to: nonexistent-service
    label: Calls
`;
    const result = validateNewSystem(yamlWithBadRef, validMetadata);

    expect(result.valid).toBe(false);
    expect(result.referenceErrors.length).toBeGreaterThan(0);
    expect(result.referenceErrors[0]).toContain('nonexistent-service');
  });

  // 6. Both YAML (arch schema) and metadata invalid -> both error arrays populated
  it('populates both yamlErrors and metadataErrors when both are invalid', () => {
    const invalidArchYaml = `
actors:
  user:
    description: Missing required type and label
`;
    const badMetadata = { id: 'UPPER', name: '' };
    const result = validateNewSystem(invalidArchYaml, badMetadata);

    expect(result.valid).toBe(false);
    expect(result.yamlErrors.length).toBeGreaterThan(0);
    expect(result.metadataErrors.length).toBeGreaterThan(0);
  });

  // 7. YAML parse error short-circuits (no ref validation runs on YAML side)
  it('short-circuits on YAML parse error — no referenceErrors are produced', () => {
    const unparseable = ':\n  :\n  - [bad';
    const result = validateNewSystem(unparseable, validMetadata);

    expect(result.valid).toBe(false);
    expect(result.yamlErrors.length).toBeGreaterThan(0);
    // Early return means referenceErrors are never populated
    expect(result.referenceErrors).toEqual([]);
    // Early return also means metadataErrors are never populated
    expect(result.metadataErrors).toEqual([]);
  });

  it('does not run relationship ref validation when architecture schema fails', () => {
    // The YAML parses fine but fails the architecture schema check,
    // so archResult.success is false and relationship ref validation is skipped.
    const invalidArchYaml = `
actors:
  user:
    description: Missing type and label
relationships:
  - from: user
    to: ghost
`;
    const result = validateNewSystem(invalidArchYaml, validMetadata);

    expect(result.valid).toBe(false);
    expect(result.yamlErrors.length).toBeGreaterThan(0);
    // Ref validation is skipped because archResult.success is false
    expect(result.referenceErrors).toEqual([]);
  });

  it('collects referenceErrors AND metadataErrors when both are bad', () => {
    const yamlWithBadRef = `
actors:
  user:
    type: Person
    label: User
relationships:
  - from: user
    to: nowhere
`;
    const badMeta = { id: '' };
    const result = validateNewSystem(yamlWithBadRef, badMeta);

    expect(result.valid).toBe(false);
    expect(result.referenceErrors.length).toBeGreaterThan(0);
    expect(result.metadataErrors.length).toBeGreaterThan(0);
    expect(result.yamlErrors).toEqual([]);
  });

  it('handles completely empty metadata (null)', () => {
    const result = validateNewSystem(validYaml, null);

    expect(result.valid).toBe(false);
    expect(result.metadataErrors.length).toBeGreaterThan(0);
  });

  it('handles undefined metadata', () => {
    const result = validateNewSystem(validYaml, undefined);

    expect(result.valid).toBe(false);
    expect(result.metadataErrors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// validateYamlContent
// ---------------------------------------------------------------------------

describe('validateYamlContent', () => {
  // 8. Valid YAML returns success
  it('returns success for fully valid YAML architecture', () => {
    const result = validateYamlContent(validYaml);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('returns success for valid YAML without relationships', () => {
    const result = validateYamlContent(validYamlNoRelationships);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // 9. Malformed YAML returns error
  it('returns errors for malformed YAML syntax', () => {
    const badYaml = '{ unclosed: [';
    const result = validateYamlContent(badYaml);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // 10. Empty/null YAML content returns success (null/undefined from yaml.load)
  it('returns success when YAML content is empty string (yaml.load returns undefined)', () => {
    const result = validateYamlContent('');

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('returns success when YAML content is "null" (yaml.load returns null)', () => {
    const result = validateYamlContent('null');

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('returns success when YAML content is "~" (yaml.load returns null)', () => {
    const result = validateYamlContent('~');

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // 11. Valid structure but bad refs returns errors
  it('returns errors when relationships reference undeclared elements', () => {
    const yamlBadRefs = `
actors:
  admin:
    type: Person
    label: Admin
relationships:
  - from: admin
    to: missing-system
`;
    const result = validateYamlContent(yamlBadRefs);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('missing-system');
  });

  it('returns errors when both from and to are unresolved', () => {
    const yaml = `
relationships:
  - from: ghost-a
    to: ghost-b
`;
    const result = validateYamlContent(yaml);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0]).toContain('ghost-a');
    expect(result.errors[1]).toContain('ghost-b');
  });

  // 12. Invalid schema returns errors
  it('returns errors for invalid architecture schema (bad actor)', () => {
    const badActorYaml = `
actors:
  user:
    type: InvalidType
    label: User
`;
    const result = validateYamlContent(badActorYaml);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns errors for invalid architecture schema (missing container label)', () => {
    const noLabelYaml = `
softwareSystems:
  myApp:
    label: My App
    containers:
      api:
        technology: Node.js
`;
    const result = validateYamlContent(noLabelYaml);

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('label'))).toBe(true);
  });

  it('returns schema errors before reaching ref validation', () => {
    // Schema fails, so ref validation never runs — we should only get schema errors
    const yaml = `
actors:
  user:
    description: no type or label
relationships:
  - from: user
    to: phantom
`;
    const result = validateYamlContent(yaml);

    expect(result.success).toBe(false);
    // Errors are from schema validation, not ref validation
    expect(result.errors.some((e) => e.includes('phantom'))).toBe(false);
  });
});
