import {
  QUICK_START_STEPS,
  PIPELINE_STAGES,
  COMPLIANCE_RULES,
  OPA_POLICIES,
  WORKFLOW_YAML,
  AACRC_CONFIG,
  MODEL_STRUCTURE,
  CLI_EXIT_CODES,
} from './ci-pipeline-data';

describe('ci-pipeline-data', () => {
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

  describe('PIPELINE_STAGES', () => {
    it('exports 8 stages', () => {
      expect(PIPELINE_STAGES).toHaveLength(8);
    });

    it('each stage has required fields', () => {
      for (const stage of PIPELINE_STAGES) {
        expect(stage.stage).toBeTruthy();
        expect(stage.name).toBeTruthy();
        expect(stage.description).toBeTruthy();
        expect(stage.commands.length).toBeGreaterThan(0);
        expect(stage.exitBehavior).toBeTruthy();
      }
    });

    it('includes 3 parallel compliance sub-stages', () => {
      const parallel = PIPELINE_STAGES.filter((s) => s.parallel);
      expect(parallel).toHaveLength(3);
      expect(parallel.map((s) => s.stage)).toEqual(['3a', '3b', '3c']);
    });

    it('includes Schema Validation and Policy Engine stages', () => {
      const names = PIPELINE_STAGES.map((s) => s.name);
      expect(names).toContain('Schema Validation');
      expect(names).toContain('Policy Engine');
    });

    it('has stages in correct order', () => {
      const stages = PIPELINE_STAGES.map((s) => s.stage);
      expect(stages).toEqual(['1', '2', '3a', '3b', '3c', '4', '5', '6']);
    });
  });

  describe('COMPLIANCE_RULES', () => {
    it('exports 5 rules', () => {
      expect(COMPLIANCE_RULES).toHaveLength(5);
    });

    it('each rule has required fields', () => {
      for (const rule of COMPLIANCE_RULES) {
        expect(rule.name).toBeTruthy();
        expect(rule.rule).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(typeof rule.blocksDeply).toBe('boolean');
      }
    });

    it('includes no-frontend-db-bypass rule', () => {
      const rules = COMPLIANCE_RULES.map((r) => r.rule);
      expect(rules).toContain('no-frontend-db-bypass');
    });

    it('all rules block deployment', () => {
      for (const rule of COMPLIANCE_RULES) {
        expect(rule.blocksDeply).toBe(true);
      }
    });
  });

  describe('OPA_POLICIES', () => {
    it('exports 3 policies', () => {
      expect(OPA_POLICIES).toHaveLength(3);
    });

    it('each policy has required fields', () => {
      for (const policy of OPA_POLICIES) {
        expect(policy.domain).toBeTruthy();
        expect(policy.packageName).toBeTruthy();
        expect(policy.description).toBeTruthy();
        expect(policy.enforcement).toBeTruthy();
        expect(['high', 'medium']).toContain(policy.severity);
      }
    });

    it('covers security, finops, and integration domains', () => {
      const domains = OPA_POLICIES.map((p) => p.domain);
      expect(domains).toContain('Security');
      expect(domains).toContain('FinOps');
      expect(domains).toContain('Integration');
    });

    it('package names use architecture namespace', () => {
      for (const policy of OPA_POLICIES) {
        expect(policy.packageName).toMatch(/^architecture\./);
      }
    });
  });

  describe('WORKFLOW_YAML', () => {
    it('is a non-empty string', () => {
      expect(typeof WORKFLOW_YAML).toBe('string');
      expect(WORKFLOW_YAML.length).toBeGreaterThan(0);
    });

    it('contains aac validate command', () => {
      expect(WORKFLOW_YAML).toContain('aac validate');
    });

    it('contains opa eval command', () => {
      expect(WORKFLOW_YAML).toContain('opa eval');
    });

    it('contains on: trigger configuration', () => {
      expect(WORKFLOW_YAML).toContain('on:');
      expect(WORKFLOW_YAML).toContain('pull_request');
    });

    it('contains path filter for model/', () => {
      expect(WORKFLOW_YAML).toContain('model/**');
    });

    it('contains all 3 parallel compliance jobs', () => {
      expect(WORKFLOW_YAML).toContain('app-architecture');
      expect(WORKFLOW_YAML).toContain('pattern-conformance');
      expect(WORKFLOW_YAML).toContain('standards-compliance');
    });
  });

  describe('AACRC_CONFIG', () => {
    it('is a non-empty string containing schemaBaseUrl', () => {
      expect(typeof AACRC_CONFIG).toBe('string');
      expect(AACRC_CONFIG.length).toBeGreaterThan(0);
      expect(AACRC_CONFIG).toContain('schemaBaseUrl');
    });

    it('is valid JSON', () => {
      expect(() => JSON.parse(AACRC_CONFIG)).not.toThrow();
    });
  });

  describe('MODEL_STRUCTURE', () => {
    it('is a non-empty string', () => {
      expect(typeof MODEL_STRUCTURE).toBe('string');
      expect(MODEL_STRUCTURE.length).toBeGreaterThan(0);
    });

    it('contains system.yaml and metadata.json', () => {
      expect(MODEL_STRUCTURE).toContain('system.yaml');
      expect(MODEL_STRUCTURE).toContain('metadata.json');
    });

    it('contains .aacrc config reference', () => {
      expect(MODEL_STRUCTURE).toContain('.aacrc');
    });
  });

  describe('CLI_EXIT_CODES', () => {
    it('exports 3 exit codes', () => {
      expect(CLI_EXIT_CODES).toHaveLength(3);
    });

    it('each exit code has required fields', () => {
      for (const ec of CLI_EXIT_CODES) {
        expect(typeof ec.code).toBe('number');
        expect(ec.label).toBeTruthy();
        expect(ec.meaning).toBeTruthy();
      }
    });

    it('includes success (0) and validation failed (2)', () => {
      const codes = CLI_EXIT_CODES.map((c) => c.code);
      expect(codes).toContain(0);
      expect(codes).toContain(2);
    });
  });
});
