/* ── Tests for repo-resolver ── */

import path from 'node:path';
import { resolveRepoRoot, discoverSubdirs, discoverYamlFiles, readText, readYaml } from './repo-resolver.js';

// The real repo root is three levels up from mcp-server/src/lib/
const EXPECTED_ROOT = path.resolve(import.meta.dirname, '../../..');

describe('repo-resolver', () => {
  describe('resolveRepoRoot', () => {
    it('accepts an explicit root path', () => {
      const root = resolveRepoRoot(EXPECTED_ROOT);
      expect(root).toBe(EXPECTED_ROOT);
    });

    it('throws for a bogus root path', () => {
      expect(() => resolveRepoRoot('/tmp/nonexistent-aac-repo-xyz')).toThrow();
    });
  });

  describe('discoverSubdirs', () => {
    it('discovers model subdirectories', () => {
      const modelDir = path.join(EXPECTED_ROOT, 'model');
      const dirs = discoverSubdirs(modelDir);
      expect(dirs.length).toBeGreaterThan(0);
      expect(dirs).toContain('ecommerce-platform');
    });
  });

  describe('discoverYamlFiles', () => {
    it('discovers YAML files in a directory', () => {
      const standardsDir = path.join(EXPECTED_ROOT, 'standards');
      const files = discoverYamlFiles(standardsDir);
      // May or may not have standards yet — just verify it returns an array
      expect(Array.isArray(files)).toBe(true);
    });
  });

  describe('readText', () => {
    it('reads a text file', () => {
      const pkgPath = path.join(EXPECTED_ROOT, 'package.json');
      const content = readText(pkgPath);
      expect(content).toContain('"name"');
    });
  });

  describe('readYaml', () => {
    it('parses a YAML file', () => {
      const yamlPath = path.join(EXPECTED_ROOT, 'model', 'ecommerce-platform', 'system.yaml');
      const data = readYaml(yamlPath);
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });
  });
});
