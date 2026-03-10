import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Validator } from './validator';

describe('Validator', () => {
  let tmpDir: string;
  let validator: Validator;
  const schemasDir = path.resolve(__dirname, '..', '..', 'schema');

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aac-validator-test-'));
    validator = new Validator();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  /** Helper to write a YAML file in the temp dir */
  function writeYaml(name: string, content: string): string {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }

  /** Helper to write a JSON file in the temp dir */
  function writeJson(name: string, data: unknown): string {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    return filePath;
  }

  it('1 - validates a valid YAML file against a simple schema', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    };
    const filePath = writeYaml('test.yaml', 'name: Alice\nage: 30\n');
    const result = validator.validate(filePath, schema);
    expect(result.valid).toBe(true);
    expect(result.filePath).toBe(filePath);
    expect(result.errors).toEqual([]);
  });

  it('2 - reports errors for invalid YAML', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
    };
    const filePath = writeYaml('test.yaml', 'age: 30\n');
    const result = validator.validate(filePath, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes('name'))).toBe(true);
  });

  it('3 - validates a JSON file', () => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'integer' },
      },
      required: ['count'],
    };
    const filePath = writeJson('test.json', { count: 42 });
    const result = validator.validate(filePath, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('4 - throws when file does not exist', () => {
    const schema = { type: 'object' };
    expect(() =>
      validator.validate('/nonexistent/file.yaml', schema),
    ).toThrow('File not found');
  });

  it('5 - handles draft-07 schema', () => {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        title: { type: 'string' },
      },
    };
    const filePath = writeYaml('draft07.yaml', 'title: hello\n');
    const result = validator.validate(filePath, schema);
    expect(result.valid).toBe(true);
  });

  it('6 - handles draft 2020-12 schema', () => {
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        value: { type: 'number' },
      },
      required: ['value'],
    };
    const filePath = writeYaml('draft2020.yaml', 'value: 99\n');
    const result = validator.validate(filePath, schema);
    expect(result.valid).toBe(true);
  });

  it('7 - reports multiple errors with allErrors mode', () => {
    const schema = {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'string' },
      },
      required: ['a', 'b'],
    };
    const filePath = writeYaml('empty.yaml', '{}\n');
    const result = validator.validate(filePath, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });

  it('8 - validates against real standards schema', () => {
    const schemaPath = path.join(schemasDir, 'standards.json');
    if (!fs.existsSync(schemaPath)) return; // skip if schema not available
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    const validStandard = `
metadata:
  schemaVersion: 2
  standardId: "STD-TEST-001"
  name: "Test Standard"
  architectureDomain: "Application Architecture"
  architecturePrinciple:
    - "Modular and Composable Architecture"
  l4Domain: "Application Architecture"
  l3Domain: "Design Patterns"
  l2Domain: "Service Design"
  standardOwner: "Architecture Team"
  assignedArchitect: "Lead Architect"
  lifecycleCategory: "DRAFT"
  publicationStatus: "DRAFT"
  version: "1.0"
  approvalDate: "2025-01-01"
  tags:
    - architecture
scope:
  inScope:
    - "All new services"
  outOfScope:
    - "Legacy"
requirements:
  - id: "REQ-001"
    statement: "Must implement health checks."
    severity: "MUST"
    rationale: "Monitoring"
    verification: "Integration test"
guidelines:
  - id: "GUIDE-001"
    text: "Use async messaging."
solutions:
  - id: "SOL-001"
    name: "Health Library"
    description: "Shared health check lib"
`;
    const filePath = writeYaml('standard.yaml', validStandard);
    const result = validator.validate(filePath, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
