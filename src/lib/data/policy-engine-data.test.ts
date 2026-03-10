import {
  QUICK_START_STEPS,
  POLICY_RULES,
  CI_COMMANDS,
  SAMPLE_TEST,
  DIRECTORY_STRUCTURE,
} from './policy-engine-data';
import type { PolicyRule, CiCommand } from './policy-engine-data';

describe('policy-engine-data', () => {
  describe('QUICK_START_STEPS', () => {
    it('exports 3 steps', () => {
      expect(QUICK_START_STEPS).toHaveLength(3);
    });

    it('has sequentially numbered steps', () => {
      QUICK_START_STEPS.forEach((step, idx) => {
        expect(step.step).toBe(idx + 1);
      });
    });

    it('each step has required fields', () => {
      for (const step of QUICK_START_STEPS) {
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.command).toBeTruthy();
      }
    });
  });

  describe('POLICY_RULES', () => {
    it('exports 3 rules', () => {
      expect(POLICY_RULES).toHaveLength(3);
    });

    it('covers all three governance domains', () => {
      const domains = POLICY_RULES.map((r: PolicyRule) => r.domain).sort();
      expect(domains).toEqual(['FinOps', 'Integration', 'Security']);
    });

    it('each rule has required fields', () => {
      for (const rule of POLICY_RULES) {
        expect(rule.name).toBeTruthy();
        expect(rule.domain).toBeTruthy();
        expect(rule.package_name).toMatch(/^architecture\./);
        expect(rule.description).toBeTruthy();
        expect(rule.enforces).toBeTruthy();
        expect(['high', 'medium']).toContain(rule.severity);
      }
    });

    it('package names follow architecture.<domain> convention', () => {
      const packages = POLICY_RULES.map((r: PolicyRule) => r.package_name);
      expect(packages).toContain('architecture.finops');
      expect(packages).toContain('architecture.security');
      expect(packages).toContain('architecture.integration');
    });
  });

  describe('CI_COMMANDS', () => {
    it('exports 4 commands', () => {
      expect(CI_COMMANDS).toHaveLength(4);
    });

    it('each command has required fields', () => {
      for (const cmd of CI_COMMANDS) {
        expect(cmd.name).toBeTruthy();
        expect(cmd.command).toBeTruthy();
        expect(cmd.description).toBeTruthy();
        expect(typeof cmd.failsBuild).toBe('boolean');
      }
    });

    it('all commands reference opa CLI', () => {
      for (const cmd of CI_COMMANDS) {
        expect(cmd.command).toMatch(/^opa /);
      }
    });

    it('format, syntax, and test checks block the build', () => {
      const blocking = CI_COMMANDS.filter((c: CiCommand) => c.failsBuild);
      expect(blocking).toHaveLength(3);
    });

    it('coverage analysis does not block the build', () => {
      const coverage = CI_COMMANDS.find((c: CiCommand) => c.name === 'Coverage Analysis');
      expect(coverage).toBeDefined();
      expect(coverage!.failsBuild).toBe(false);
    });
  });

  describe('SAMPLE_TEST', () => {
    it('is a non-empty string containing Rego test code', () => {
      expect(typeof SAMPLE_TEST).toBe('string');
      expect(SAMPLE_TEST.length).toBeGreaterThan(0);
      expect(SAMPLE_TEST).toContain('package architecture.finops');
      expect(SAMPLE_TEST).toContain('test_');
      expect(SAMPLE_TEST).toContain('with input as');
    });
  });

  describe('DIRECTORY_STRUCTURE', () => {
    it('is a non-empty string showing the policy workspace tree', () => {
      expect(typeof DIRECTORY_STRUCTURE).toBe('string');
      expect(DIRECTORY_STRUCTURE).toContain('packages/policies/');
      expect(DIRECTORY_STRUCTURE).toContain('rules/');
      expect(DIRECTORY_STRUCTURE).toContain('.rego');
    });
  });
});
