import yaml from 'js-yaml';
import { graphToYaml } from './graph-to-yaml';
import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';

// ---------------------------------------------------------------------------
// Parsed YAML shape (used for type-safe assertions in tests)
// ---------------------------------------------------------------------------

interface ParsedYamlComponent {
  label?: string;
  technology?: string;
  description?: string;
}

interface ParsedYamlContainer {
  label?: string;
  technology?: string;
  description?: string;
  components?: Record<string, ParsedYamlComponent>;
}

interface ParsedYamlSystem {
  label?: string;
  description?: string;
  boundary?: string;
  containers?: Record<string, ParsedYamlContainer>;
}

interface ParsedYamlActor {
  type?: string;
  label?: string;
  description?: string;
  boundary?: string;
}

interface ParsedYamlRelationship {
  from: string;
  to: string;
  label?: string;
  protocol?: string;
}

interface ParsedYaml {
  actors?: Record<string, ParsedYamlActor>;
  softwareSystems?: Record<string, ParsedYamlSystem>;
  relationships?: ParsedYamlRelationship[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePersonNode(
  id: string,
  label: string,
  opts: Partial<C4NodeData> = {},
): Node<C4NodeData> {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      kind: 'person',
      label,
      description: opts.description ?? '',
      boundary: opts.boundary ?? 'external',
      ...opts,
    },
  };
}

function makeSystemNode(
  id: string,
  label: string,
  opts: Partial<C4NodeData> = {},
): Node<C4NodeData> {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      kind: 'softwareSystem',
      label,
      description: opts.description ?? '',
      boundary: opts.boundary ?? 'internal',
      ...opts,
    },
  };
}

function makeContainerNode(
  id: string,
  parentId: string,
  label: string,
  opts: Partial<C4NodeData> = {},
): Node<C4NodeData> {
  return {
    id,
    parentId,
    position: { x: 0, y: 0 },
    data: {
      kind: 'container',
      label,
      description: opts.description ?? '',
      technology: opts.technology ?? '',
      boundary: opts.boundary ?? 'internal',
      ...opts,
    },
  };
}

function makeComponentNode(
  id: string,
  parentId: string,
  label: string,
  opts: Partial<C4NodeData> = {},
): Node<C4NodeData> {
  return {
    id,
    parentId,
    position: { x: 0, y: 0 },
    data: {
      kind: 'component',
      label,
      description: opts.description ?? '',
      technology: opts.technology ?? '',
      boundary: opts.boundary ?? 'internal',
      ...opts,
    },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  data?: C4EdgeData,
): Edge<C4EdgeData> {
  return { id, source, target, data };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('graphToYaml', () => {
  // -----------------------------------------------------------------------
  // 1. Empty input
  // -----------------------------------------------------------------------
  describe('empty nodes and edges', () => {
    it('returns YAML representing an empty object when given no nodes or edges', () => {
      const result = graphToYaml([], []);
      const parsed = yaml.load(result);
      // js-yaml.load returns undefined for an empty-object YAML like "{}\n"
      // but graphToYaml builds an empty `{}` doc, which yaml.dump renders as "{}\n"
      expect(parsed == null || (typeof parsed === 'object' && Object.keys(parsed as object).length === 0)).toBe(true);
    });

    it('output is a string', () => {
      expect(typeof graphToYaml([], [])).toBe('string');
    });
  });

  // -----------------------------------------------------------------------
  // 2. Serializing person actors
  // -----------------------------------------------------------------------
  describe('person actors', () => {
    it('serializes a single person into the actors map', () => {
      const nodes = [makePersonNode('user1', 'End User', { description: 'A customer', boundary: 'external' })];
      const result = graphToYaml(nodes, []);
      const parsed = yaml.load(result) as ParsedYaml;

      expect(parsed.actors).toBeDefined();
      expect(parsed.actors.user1).toBeDefined();
      expect(parsed.actors.user1.type).toBe('Person');
      expect(parsed.actors.user1.label).toBe('End User');
      expect(parsed.actors.user1.description).toBe('A customer');
      expect(parsed.actors.user1.boundary).toBe('External');
    });

    it('serializes multiple persons', () => {
      const nodes = [
        makePersonNode('admin', 'Admin', { boundary: 'internal' }),
        makePersonNode('customer', 'Customer', { boundary: 'external' }),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(Object.keys(parsed.actors)).toHaveLength(2);
      expect(parsed.actors.admin).toBeDefined();
      expect(parsed.actors.customer).toBeDefined();
    });

    it('does not include actors key when there are no persons', () => {
      const nodes = [makeSystemNode('sys1', 'My System')];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.actors).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // 3. Serializing software systems
  // -----------------------------------------------------------------------
  describe('software systems', () => {
    it('serializes a single software system', () => {
      const nodes = [makeSystemNode('banking', 'Banking System', { description: 'Handles banking', boundary: 'internal' })];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.softwareSystems).toBeDefined();
      expect(parsed.softwareSystems.banking).toBeDefined();
      expect(parsed.softwareSystems.banking.label).toBe('Banking System');
      expect(parsed.softwareSystems.banking.description).toBe('Handles banking');
      expect(parsed.softwareSystems.banking.boundary).toBe('Internal');
    });

    it('serializes multiple software systems', () => {
      const nodes = [
        makeSystemNode('sys1', 'System One'),
        makeSystemNode('sys2', 'System Two'),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(Object.keys(parsed.softwareSystems)).toHaveLength(2);
    });

    it('does not include softwareSystems key when there are none', () => {
      const nodes = [makePersonNode('u1', 'User')];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.softwareSystems).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // 4. Systems with containers (parentId relationship)
  // -----------------------------------------------------------------------
  describe('systems with containers', () => {
    it('nests containers under their parent system', () => {
      const nodes: Node<C4NodeData>[] = [
        makeSystemNode('sys1', 'My System'),
        makeContainerNode('sys1.api', 'sys1', 'API Server', { technology: 'Node.js', description: 'REST API' }),
        makeContainerNode('sys1.db', 'sys1', 'Database', { technology: 'PostgreSQL', description: 'Stores data' }),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.softwareSystems.sys1.containers).toBeDefined();
      expect(Object.keys(parsed.softwareSystems.sys1.containers)).toHaveLength(2);

      expect(parsed.softwareSystems.sys1.containers.api.label).toBe('API Server');
      expect(parsed.softwareSystems.sys1.containers.api.technology).toBe('Node.js');
      expect(parsed.softwareSystems.sys1.containers.api.description).toBe('REST API');

      expect(parsed.softwareSystems.sys1.containers.db.label).toBe('Database');
      expect(parsed.softwareSystems.sys1.containers.db.technology).toBe('PostgreSQL');
    });

    it('uses the last segment of the container id as the key', () => {
      const nodes: Node<C4NodeData>[] = [
        makeSystemNode('myApp', 'My App'),
        makeContainerNode('myApp.frontend.web', 'myApp', 'Web UI', { technology: 'React' }),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      // The function calls id.split('.').pop(), so the key should be 'web'
      expect(parsed.softwareSystems.myApp.containers.web).toBeDefined();
      expect(parsed.softwareSystems.myApp.containers.web.label).toBe('Web UI');
    });

    it('does not add containers key when system has no child containers', () => {
      const nodes: Node<C4NodeData>[] = [
        makeSystemNode('sys1', 'Lonely System'),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.softwareSystems.sys1.containers).toBeUndefined();
    });

    it('only assigns containers to their matching parent system', () => {
      const nodes: Node<C4NodeData>[] = [
        makeSystemNode('sysA', 'System A'),
        makeSystemNode('sysB', 'System B'),
        makeContainerNode('sysA.web', 'sysA', 'Web App'),
        makeContainerNode('sysB.worker', 'sysB', 'Worker'),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(Object.keys(parsed.softwareSystems.sysA.containers)).toEqual(['web']);
      expect(Object.keys(parsed.softwareSystems.sysB.containers)).toEqual(['worker']);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Containers with components (nested)
  // -----------------------------------------------------------------------
  describe('containers with components', () => {
    it('nests components under their parent container', () => {
      const nodes: Node<C4NodeData>[] = [
        makeSystemNode('sys', 'System'),
        makeContainerNode('sys.api', 'sys', 'API', { technology: 'Express' }),
        makeComponentNode('sys.api.authCtrl', 'sys.api', 'Auth Controller', {
          technology: 'TypeScript',
          description: 'Handles authentication',
        }),
        makeComponentNode('sys.api.userCtrl', 'sys.api', 'User Controller', {
          technology: 'TypeScript',
          description: 'Manages users',
        }),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      const apiContainer = parsed.softwareSystems.sys.containers.api;
      expect(apiContainer.components).toBeDefined();
      expect(Object.keys(apiContainer.components)).toHaveLength(2);

      expect(apiContainer.components.authCtrl.label).toBe('Auth Controller');
      expect(apiContainer.components.authCtrl.technology).toBe('TypeScript');
      expect(apiContainer.components.authCtrl.description).toBe('Handles authentication');

      expect(apiContainer.components.userCtrl.label).toBe('User Controller');
    });

    it('uses the last segment of the component id as the key', () => {
      const nodes: Node<C4NodeData>[] = [
        makeSystemNode('sys', 'System'),
        makeContainerNode('sys.api', 'sys', 'API'),
        makeComponentNode('sys.api.deep.nested.ctrl', 'sys.api', 'Controller'),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.softwareSystems.sys.containers.api.components.ctrl).toBeDefined();
    });

    it('does not add components key when container has no child components', () => {
      const nodes: Node<C4NodeData>[] = [
        makeSystemNode('sys', 'System'),
        makeContainerNode('sys.api', 'sys', 'API'),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.softwareSystems.sys.containers.api.components).toBeUndefined();
    });

    it('handles a full hierarchy: system -> container -> component', () => {
      const nodes: Node<C4NodeData>[] = [
        makePersonNode('user', 'User', { boundary: 'external' }),
        makeSystemNode('ecommerce', 'E-Commerce', { description: 'Online shop', boundary: 'internal' }),
        makeContainerNode('ecommerce.web', 'ecommerce', 'Web App', { technology: 'React' }),
        makeContainerNode('ecommerce.api', 'ecommerce', 'API', { technology: 'Node.js' }),
        makeComponentNode('ecommerce.api.orders', 'ecommerce.api', 'Order Service', { technology: 'TypeScript' }),
        makeComponentNode('ecommerce.api.payments', 'ecommerce.api', 'Payment Service', { technology: 'TypeScript' }),
      ];
      const edges = [
        makeEdge('e1', 'user', 'ecommerce.web', { label: 'Uses', protocol: 'HTTPS' }),
        makeEdge('e2', 'ecommerce.web', 'ecommerce.api', { label: 'Calls' }),
      ];
      const parsed = yaml.load(graphToYaml(nodes, edges)) as ParsedYaml;

      // Verify actors
      expect(parsed.actors.user.label).toBe('User');

      // Verify system
      expect(parsed.softwareSystems.ecommerce.label).toBe('E-Commerce');

      // Verify containers
      expect(parsed.softwareSystems.ecommerce.containers.web.label).toBe('Web App');
      expect(parsed.softwareSystems.ecommerce.containers.api.label).toBe('API');

      // Verify components
      expect(parsed.softwareSystems.ecommerce.containers.api.components.orders.label).toBe('Order Service');
      expect(parsed.softwareSystems.ecommerce.containers.api.components.payments.label).toBe('Payment Service');

      // Verify relationships
      expect(parsed.relationships).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // 6. Serializing edges as relationships
  // -----------------------------------------------------------------------
  describe('edges / relationships', () => {
    it('serializes edges as a relationships array', () => {
      const edges = [
        makeEdge('e1', 'user', 'system', { label: 'Uses', protocol: 'HTTPS' }),
      ];
      const parsed = yaml.load(graphToYaml([], edges)) as ParsedYaml;

      expect(parsed.relationships).toBeDefined();
      expect(parsed.relationships).toHaveLength(1);
      expect(parsed.relationships[0]).toEqual({
        from: 'user',
        to: 'system',
        label: 'Uses',
        protocol: 'HTTPS',
      });
    });

    it('serializes multiple edges', () => {
      const edges = [
        makeEdge('e1', 'a', 'b', { label: 'Calls' }),
        makeEdge('e2', 'b', 'c', { label: 'Reads from', protocol: 'SQL' }),
        makeEdge('e3', 'c', 'a'),
      ];
      const parsed = yaml.load(graphToYaml([], edges)) as ParsedYaml;

      expect(parsed.relationships).toHaveLength(3);
      expect(parsed.relationships[0].from).toBe('a');
      expect(parsed.relationships[0].to).toBe('b');
      expect(parsed.relationships[1].protocol).toBe('SQL');
    });

    it('handles edges with no data (label and protocol are undefined)', () => {
      const edges = [makeEdge('e1', 'src', 'tgt')];
      const parsed = yaml.load(graphToYaml([], edges)) as ParsedYaml;

      expect(parsed.relationships[0].from).toBe('src');
      expect(parsed.relationships[0].to).toBe('tgt');
      // label and protocol should be absent or undefined
      expect(parsed.relationships[0].label).toBeUndefined();
      expect(parsed.relationships[0].protocol).toBeUndefined();
    });

    it('handles edges with partial data (only label, no protocol)', () => {
      const edges = [makeEdge('e1', 'x', 'y', { label: 'Sends data' })];
      const parsed = yaml.load(graphToYaml([], edges)) as ParsedYaml;

      expect(parsed.relationships[0].label).toBe('Sends data');
      expect(parsed.relationships[0].protocol).toBeUndefined();
    });

    it('does not include relationships key when there are no edges', () => {
      const nodes = [makePersonNode('u', 'User')];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.relationships).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // 7. Boundary mapping
  // -----------------------------------------------------------------------
  describe('boundary mapping', () => {
    it('maps "internal" to "Internal" for persons', () => {
      const nodes = [makePersonNode('p1', 'Internal User', { boundary: 'internal' })];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.actors.p1.boundary).toBe('Internal');
    });

    it('maps "external" to "External" for persons', () => {
      const nodes = [makePersonNode('p1', 'External User', { boundary: 'external' })];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.actors.p1.boundary).toBe('External');
    });

    it('maps "internal" to "Internal" for software systems', () => {
      const nodes = [makeSystemNode('s1', 'Internal System', { boundary: 'internal' })];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.softwareSystems.s1.boundary).toBe('Internal');
    });

    it('maps "external" to "External" for software systems', () => {
      const nodes = [makeSystemNode('s1', 'External System', { boundary: 'external' })];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.softwareSystems.s1.boundary).toBe('External');
    });
  });

  // -----------------------------------------------------------------------
  // 8. Output is valid YAML
  // -----------------------------------------------------------------------
  describe('valid YAML output', () => {
    it('returns a string that can be parsed by js-yaml without errors', () => {
      const nodes: Node<C4NodeData>[] = [
        makePersonNode('user', 'User', { boundary: 'external', description: 'A user' }),
        makeSystemNode('sys', 'System', { boundary: 'internal', description: 'Main system' }),
        makeContainerNode('sys.web', 'sys', 'Web', { technology: 'React' }),
        makeComponentNode('sys.web.login', 'sys.web', 'Login', { technology: 'TS' }),
      ];
      const edges = [makeEdge('e1', 'user', 'sys.web', { label: 'Browses', protocol: 'HTTPS' })];

      const result = graphToYaml(nodes, edges);
      expect(() => yaml.load(result)).not.toThrow();
    });

    it('round-trips to a JS object with the expected top-level keys', () => {
      const nodes: Node<C4NodeData>[] = [
        makePersonNode('u', 'User', { boundary: 'external' }),
        makeSystemNode('s', 'Sys', { boundary: 'internal' }),
        makeContainerNode('s.c', 's', 'Container'),
      ];
      const edges = [makeEdge('e1', 'u', 's.c', { label: 'Uses' })];

      const parsed = yaml.load(graphToYaml(nodes, edges)) as ParsedYaml;

      expect(parsed).toHaveProperty('actors');
      expect(parsed).toHaveProperty('softwareSystems');
      expect(parsed).toHaveProperty('relationships');
    });

    it('does not produce YAML anchors/references (noRefs: true)', () => {
      const sharedDescription = 'Shared description value';
      const nodes: Node<C4NodeData>[] = [
        makePersonNode('p1', 'Person 1', { description: sharedDescription, boundary: 'external' }),
        makePersonNode('p2', 'Person 2', { description: sharedDescription, boundary: 'external' }),
      ];
      const result = graphToYaml(nodes, []);

      // YAML anchors look like &ref_0 and aliases look like *ref_0
      expect(result).not.toMatch(/&ref/);
      expect(result).not.toMatch(/\*ref/);
    });

    it('preserves special characters in labels and descriptions', () => {
      const nodes = [
        makePersonNode('p', 'User & Admin', {
          description: 'Manages "everything" <and> more',
          boundary: 'internal',
        }),
      ];
      const parsed = yaml.load(graphToYaml(nodes, [])) as ParsedYaml;

      expect(parsed.actors.p.label).toBe('User & Admin');
      expect(parsed.actors.p.description).toBe('Manages "everything" <and> more');
    });
  });
});
