/* ── Tests for schema-loader ── */

import path from 'node:path';
import { VALID_TYPES, isValidType, loadSchema, schemaFileFor } from './schema-loader.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');

describe('schema-loader', () => {
  describe('VALID_TYPES', () => {
    it('contains four schema types', () => {
      expect(VALID_TYPES).toEqual(['system', 'pattern', 'standard', 'waiver']);
    });
  });

  describe('isValidType', () => {
    it('returns true for valid types', () => {
      expect(isValidType('system')).toBe(true);
      expect(isValidType('pattern')).toBe(true);
      expect(isValidType('standard')).toBe(true);
      expect(isValidType('waiver')).toBe(true);
    });

    it('returns false for invalid types', () => {
      expect(isValidType('invalid')).toBe(false);
      expect(isValidType('')).toBe(false);
      expect(isValidType('deployment')).toBe(false);
    });
  });

  describe('schemaFileFor', () => {
    it('maps type to filename', () => {
      expect(schemaFileFor('system')).toBe('application-schema.json');
      expect(schemaFileFor('pattern')).toBe('pattern-schema.json');
      expect(schemaFileFor('standard')).toBe('standards.json');
      expect(schemaFileFor('waiver')).toBe('waivers.json');
    });

    it('returns undefined for unknown type', () => {
      expect(schemaFileFor('invalid')).toBeUndefined();
    });
  });

  describe('loadSchema', () => {
    it('loads the system schema', () => {
      const schema = loadSchema(REPO_ROOT, 'system');
      expect(schema).toBeDefined();
      expect(schema.$schema).toContain('json-schema.org');
    });

    it('loads the waiver schema', () => {
      const schema = loadSchema(REPO_ROOT, 'waiver');
      expect(schema).toBeDefined();
      expect(schema.title).toBe('Architecture Waiver');
    });

    it('throws for unknown type', () => {
      expect(() => loadSchema(REPO_ROOT, 'bogus')).toThrow('Unknown schema type');
    });
  });
});
