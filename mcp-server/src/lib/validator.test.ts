/* ── Tests for validator ── */

import path from 'node:path';
import { validateData, validateYamlContent, detectSchemaType } from './validator.js';
import { loadSchema } from './schema-loader.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');

describe('validator', () => {
  describe('detectSchemaType', () => {
    it('detects system type from model key', () => {
      const yaml = `name: Test\nmodel:\n  softwareSystems: []`;
      expect(detectSchemaType(yaml)).toBe('system');
    });

    it('detects waiver type from exceptionId', () => {
      const yaml = `exceptionId: EXC-SEC-001\ntitle: test`;
      expect(detectSchemaType(yaml)).toBe('waiver');
    });

    it('detects standard type from standardId', () => {
      const yaml = `standardId: STD-SEC-001\ntitle: test`;
      expect(detectSchemaType(yaml)).toBe('standard');
    });

    it('detects pattern type from patternId', () => {
      const yaml = `patternId: PAT-001\ntitle: test`;
      expect(detectSchemaType(yaml)).toBe('pattern');
    });

    it('returns undefined for unrecognised content', () => {
      expect(detectSchemaType('foo: bar')).toBeUndefined();
    });

    it('returns undefined for invalid YAML', () => {
      expect(detectSchemaType(':::bad')).toBeUndefined();
    });
  });

  describe('validateData', () => {
    it('validates a simple object against a schema', () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      };
      const result = validateData({ name: 'test' }, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for invalid data', () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      };
      const result = validateData({}, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateYamlContent', () => {
    it('validates valid YAML against schema', () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      };
      const result = validateYamlContent('name: hello', schema);
      expect(result.valid).toBe(true);
    });

    it('returns error for invalid YAML syntax', () => {
      const schema = { type: 'object' };
      const result = validateYamlContent(':::invalid', schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0].path).toBe('/');
    });

    it('returns error for empty YAML', () => {
      const schema = { type: 'object' };
      const result = validateYamlContent('', schema);
      expect(result.valid).toBe(false);
    });

    it('validates a real waiver schema (draft 2020-12)', () => {
      const schema = loadSchema(REPO_ROOT, 'waiver');
      const validWaiver = `
exceptionId: "EXC-SEC-001"
title: "Test waiver for unit tests"
targetAppId: "test-app"
targetAppName: "Test App"
violatedStandardId: "STD-SEC-001"
violatedStandardName: "Encryption Standard"
status: "PENDING_REVIEW"
rationale: "This is a test rationale for unit testing the validator"
riskSeverity: "LOW"
compensatingControls:
  - control: "Manual review"
    effectiveness: "MEDIUM"
requestedBy: "Test Team"
requestedDate: "2025-01-01"
remediationPlan:
  description: "Will comply after migration"
  targetDate: "2025-07-01"
`;
      const result = validateYamlContent(validWaiver, schema);
      expect(result.valid).toBe(true);
    });
  });
});
