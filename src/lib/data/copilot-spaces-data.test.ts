import {
  QUICK_START_STEPS,
  COPILOT_SPACES,
  RAG_ARCHITECTURE,
  STRATEGIC_BENEFITS,
  IDE_MCP_CONFIG,
  EXAMPLE_PROMPT,
  ACCESS_CONTROL_ROLES,
} from './copilot-spaces-data';

describe('copilot-spaces-data', () => {
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

  describe('COPILOT_SPACES', () => {
    it('exports 2 domain spaces', () => {
      expect(COPILOT_SPACES).toHaveLength(2);
    });

    it('each space has required fields', () => {
      for (const space of COPILOT_SPACES) {
        expect(space.name).toBeTruthy();
        expect(space.purpose).toBeTruthy();
        expect(space.sources.length).toBeGreaterThan(0);
        expect(space.instruction).toBeTruthy();
        expect(space.spaceUrl).toMatch(/^https:\/\/github\.com\/copilot\/spaces\//);
      }
    });

    it('sources reference existing standard and pattern paths', () => {
      for (const space of COPILOT_SPACES) {
        for (const src of space.sources) {
          expect(src).toMatch(/^(standards|patterns)\//);
        }
      }
    });

    it('includes Data & AI and Infrastructure spaces', () => {
      const names = COPILOT_SPACES.map((s) => s.name);
      expect(names).toContain('Data & AI Architecture Standards');
      expect(names).toContain('Infrastructure Resilience Patterns');
    });
  });

  describe('RAG_ARCHITECTURE', () => {
    it('exports 3 steps', () => {
      expect(RAG_ARCHITECTURE).toHaveLength(3);
    });

    it('has sequentially numbered steps', () => {
      RAG_ARCHITECTURE.forEach((step, idx) => {
        expect(step.step).toBe(idx + 1);
      });
    });

    it('each step has title and description', () => {
      for (const step of RAG_ARCHITECTURE) {
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
      }
    });

    it('covers indexing, instructions, and grounding', () => {
      const titles = RAG_ARCHITECTURE.map((s) => s.title);
      expect(titles).toContain('Continuous Indexing');
      expect(titles).toContain('Custom Instructions');
      expect(titles).toContain('Contextual Grounding');
    });
  });

  describe('STRATEGIC_BENEFITS', () => {
    it('exports 4 benefits', () => {
      expect(STRATEGIC_BENEFITS).toHaveLength(4);
    });

    it('each benefit has title and description', () => {
      for (const benefit of STRATEGIC_BENEFITS) {
        expect(benefit.title).toBeTruthy();
        expect(benefit.description).toBeTruthy();
      }
    });
  });

  describe('IDE_MCP_CONFIG', () => {
    it('is a non-empty JSON string containing mcpServers', () => {
      expect(typeof IDE_MCP_CONFIG).toBe('string');
      expect(IDE_MCP_CONFIG.length).toBeGreaterThan(0);
      expect(IDE_MCP_CONFIG).toContain('mcpServers');
      expect(IDE_MCP_CONFIG).toContain('github');
    });
  });

  describe('EXAMPLE_PROMPT', () => {
    it('is a non-empty string referencing a Copilot Space', () => {
      expect(typeof EXAMPLE_PROMPT).toBe('string');
      expect(EXAMPLE_PROMPT.length).toBeGreaterThan(0);
      expect(EXAMPLE_PROMPT).toContain('Copilot Space');
    });
  });

  describe('ACCESS_CONTROL_ROLES', () => {
    it('exports 2 roles', () => {
      expect(ACCESS_CONTROL_ROLES).toHaveLength(2);
    });

    it('each role has role, audience, and permissions', () => {
      for (const acr of ACCESS_CONTROL_ROLES) {
        expect(acr.role).toBeTruthy();
        expect(acr.audience).toBeTruthy();
        expect(acr.permissions).toBeTruthy();
      }
    });

    it('includes Viewer and Editor roles', () => {
      const roles = ACCESS_CONTROL_ROLES.map((r) => r.role);
      expect(roles).toContain('Viewer');
      expect(roles).toContain('Editor');
    });
  });
});
