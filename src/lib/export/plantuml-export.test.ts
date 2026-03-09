import { exportToPlantUml } from './plantuml-export';
import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';

/* ------------------------------------------------------------------ */
/*  Helpers – mirrors drawio-export.test.ts patterns                  */
/* ------------------------------------------------------------------ */

function makeNode(
  id: string,
  kind: C4NodeData['kind'],
  boundary: C4NodeData['boundary'],
  opts?: Partial<C4NodeData> & { parentId?: string; x?: number; y?: number },
): Node<C4NodeData> {
  return {
    id,
    type:
      kind === 'person'
        ? 'personNode'
        : kind === 'softwareSystem'
          ? 'systemNode'
          : kind === 'container'
            ? 'containerNode'
            : 'componentNode',
    position: { x: opts?.x ?? 100, y: opts?.y ?? 200 },
    ...(opts?.parentId ? { parentId: opts.parentId } : {}),
    data: {
      kind,
      label: opts?.label ?? `Test ${id}`,
      boundary,
      description: opts?.description,
      technology: opts?.technology,
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

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('exportToPlantUml', () => {
  // ---------------------------------------------------------------
  // 1. Empty graph returns a valid PlantUML skeleton
  // ---------------------------------------------------------------
  describe('empty input', () => {
    it('starts with @startuml', () => {
      const puml = exportToPlantUml([], []);
      expect(puml).toMatch(/^@startuml/);
    });

    it('ends with @enduml', () => {
      const puml = exportToPlantUml([], []);
      expect(puml.trimEnd()).toMatch(/@enduml$/);
    });

    it('includes the C4_Context.puml by default', () => {
      const puml = exportToPlantUml([], []);
      expect(puml).toContain(
        '!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml',
      );
    });

    it('contains no Rel() calls', () => {
      const puml = exportToPlantUml([], []);
      expect(puml).not.toContain('Rel(');
    });

    it('contains no Person/System/Container macros', () => {
      const puml = exportToPlantUml([], []);
      expect(puml).not.toContain('Person(');
      expect(puml).not.toContain('System(');
      expect(puml).not.toContain('Container(');
    });
  });

  // ---------------------------------------------------------------
  // 2. Single person node
  // ---------------------------------------------------------------
  describe('single person node', () => {
    const nodes = [makeNode('p1', 'person', 'internal', { label: 'Alice' })];
    const puml = exportToPlantUml(nodes, []);

    it('contains a Person() macro call', () => {
      expect(puml).toContain('Person(p1,');
    });

    it('includes the label in the macro', () => {
      expect(puml).toContain('"Alice"');
    });

    it('uses C4_Context.puml include for person-only diagrams', () => {
      expect(puml).toContain('C4_Context.puml');
    });
  });

  // ---------------------------------------------------------------
  // 3. Person + system with relationship
  // ---------------------------------------------------------------
  describe('person + system with relationship', () => {
    const nodes = [
      makeNode('user', 'person', 'internal', { label: 'User' }),
      makeNode('sys', 'softwareSystem', 'internal', {
        label: 'My System',
        description: 'Core system',
      }),
    ];
    const edges = [makeEdge('e1', 'user', 'sys', { label: 'Uses', protocol: 'HTTPS' })];
    const puml = exportToPlantUml(nodes, edges);

    it('contains Person() and System()', () => {
      expect(puml).toContain('Person(user,');
      expect(puml).toContain('System(sys,');
    });

    it('generates a Rel() with correct source and target', () => {
      expect(puml).toContain('Rel(user, sys,');
    });

    it('includes edge label in the Rel()', () => {
      expect(puml).toContain('"Uses"');
    });

    it('includes protocol in the Rel()', () => {
      expect(puml).toContain('"HTTPS"');
    });

    it('includes C4_Context.puml include', () => {
      expect(puml).toContain('C4_Context.puml');
    });
  });

  // ---------------------------------------------------------------
  // 4. Container diagram with internal / external systems
  // ---------------------------------------------------------------
  describe('container diagram with internal/external', () => {
    const nodes = [
      makeNode('web', 'container', 'internal', {
        label: 'Web App',
        technology: 'React',
        description: 'SPA frontend',
      }),
      makeNode('api', 'container', 'internal', {
        label: 'API',
        technology: 'Node.js',
      }),
      makeNode('ext', 'softwareSystem', 'external', {
        label: 'Email Service',
        description: 'Sends emails',
      }),
    ];
    const edges = [
      makeEdge('e1', 'web', 'api', { label: 'Makes API calls', protocol: 'JSON/HTTPS' }),
      makeEdge('e2', 'api', 'ext', { label: 'Sends emails' }),
    ];
    const puml = exportToPlantUml(nodes, edges);

    it('uses C4_Container.puml include', () => {
      expect(puml).toContain('C4_Container.puml');
    });

    it('renders internal containers with Container()', () => {
      expect(puml).toContain('Container(web,');
      expect(puml).toContain('Container(api,');
    });

    it('renders external system with System_Ext()', () => {
      expect(puml).toContain('System_Ext(ext,');
    });

    it('includes technology in container macros', () => {
      expect(puml).toContain('"React"');
      expect(puml).toContain('"Node.js"');
    });

    it('generates Rel() for each edge', () => {
      expect(puml).toContain('Rel(web, api,');
      expect(puml).toContain('Rel(api, ext,');
    });
  });

  // ---------------------------------------------------------------
  // 5. Database containers use ContainerDb()
  // ---------------------------------------------------------------
  describe('database containers', () => {
    it('uses ContainerDb() when technology contains "database"', () => {
      const nodes = [
        makeNode('db1', 'container', 'internal', {
          label: 'Users DB',
          technology: 'PostgreSQL database',
        }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('ContainerDb(db1,');
    });

    it('uses ContainerDb() when technology contains "db"', () => {
      const nodes = [
        makeNode('db2', 'container', 'internal', {
          label: 'Cache DB',
          technology: 'Redis DB',
        }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('ContainerDb(db2,');
    });

    it('uses ContainerDb_Ext() for external database containers', () => {
      const nodes = [
        makeNode('extdb', 'container', 'external', {
          label: 'Legacy DB',
          technology: 'Oracle Database',
        }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('ContainerDb_Ext(extdb,');
    });

    it('uses regular Container() when technology does not mention db', () => {
      const nodes = [
        makeNode('svc', 'container', 'internal', {
          label: 'API',
          technology: 'Spring Boot',
        }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('Container(svc,');
      expect(puml).not.toContain('ContainerDb(');
    });

    it('uses ComponentDb() for component with database technology', () => {
      const nodes = [
        makeNode('repo', 'component', 'internal', {
          label: 'User Repository',
          technology: 'Database Access',
        }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('ComponentDb(repo,');
    });
  });

  // ---------------------------------------------------------------
  // 6. Deployment diagram with nested deployment nodes
  // ---------------------------------------------------------------
  describe('deployment diagram', () => {
    const parent = makeNode('cloud', 'deploymentNode', 'internal', {
      label: 'AWS Cloud',
      technology: 'Amazon Web Services',
    });
    const child = makeNode('ec2', 'deploymentNode', 'internal', {
      label: 'EC2 Instance',
      technology: 'Ubuntu 22.04',
      parentId: 'cloud',
    });
    const container = makeNode('app', 'container', 'internal', {
      label: 'Web App',
      technology: 'Node.js',
      parentId: 'ec2',
    });
    const nodes = [parent, child, container];
    const puml = exportToPlantUml(nodes, []);

    it('uses C4_Deployment.puml include', () => {
      expect(puml).toContain('C4_Deployment.puml');
    });

    it('renders top-level Deployment_Node()', () => {
      expect(puml).toContain('Deployment_Node(cloud,');
    });

    it('nests child deployment node inside parent', () => {
      // The child should appear indented inside the parent block
      const cloudStart = puml.indexOf('Deployment_Node(cloud,');
      const ec2Start = puml.indexOf('Deployment_Node(ec2,');
      const cloudEnd = puml.indexOf('}', ec2Start);
      expect(cloudStart).toBeLessThan(ec2Start);
      expect(ec2Start).toBeLessThan(cloudEnd);
    });

    it('nests container inside child deployment node', () => {
      const ec2Start = puml.indexOf('Deployment_Node(ec2,');
      const containerStart = puml.indexOf('Container(app,');
      expect(ec2Start).toBeLessThan(containerStart);
    });

    it('does not render nested children at the top level', () => {
      // Split into lines and check top-level (non-indented) lines
      const topLines = puml
        .split('\n')
        .filter((l) => !l.startsWith(' ') && l.includes('Container('));
      expect(topLines.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // 7. Component diagram
  // ---------------------------------------------------------------
  describe('component diagram', () => {
    const nodes = [
      makeNode('ctrl', 'component', 'internal', {
        label: 'UserController',
        technology: 'Spring MVC',
        description: 'Handles user requests',
      }),
      makeNode('svc', 'component', 'internal', {
        label: 'UserService',
        technology: 'Spring Bean',
      }),
    ];
    const edges = [makeEdge('e1', 'ctrl', 'svc', { label: 'Calls' })];
    const puml = exportToPlantUml(nodes, edges);

    it('uses C4_Component.puml include', () => {
      expect(puml).toContain('C4_Component.puml');
    });

    it('renders Component() macros', () => {
      expect(puml).toContain('Component(ctrl,');
      expect(puml).toContain('Component(svc,');
    });

    it('includes description in component macro', () => {
      expect(puml).toContain('"Handles user requests"');
    });

    it('generates Rel() for component relationships', () => {
      expect(puml).toContain('Rel(ctrl, svc, "Calls"');
    });
  });

  // ---------------------------------------------------------------
  // 8. All edge labels appear as Rel() calls
  // ---------------------------------------------------------------
  describe('edge labels in Rel() calls', () => {
    const nodes = [
      makeNode('a', 'person', 'internal'),
      makeNode('b', 'softwareSystem', 'internal'),
      makeNode('c', 'softwareSystem', 'internal'),
    ];
    const edges = [
      makeEdge('e1', 'a', 'b', { label: 'Reads from' }),
      makeEdge('e2', 'b', 'c', { label: 'Syncs data', protocol: 'gRPC' }),
      makeEdge('e3', 'a', 'c', { label: 'Monitors' }),
    ];
    const puml = exportToPlantUml(nodes, edges);

    it('generates a Rel() for every edge', () => {
      const relCount = (puml.match(/Rel\(/g) ?? []).length;
      expect(relCount).toBe(3);
    });

    it('includes all labels', () => {
      expect(puml).toContain('"Reads from"');
      expect(puml).toContain('"Syncs data"');
      expect(puml).toContain('"Monitors"');
    });

    it('includes protocol when provided', () => {
      expect(puml).toContain('"gRPC"');
    });

    it('uses empty string for protocol when not provided', () => {
      // e1 has no protocol → Rel(a, b, "Reads from", "")
      expect(puml).toContain('Rel(a, b, "Reads from", "")');
    });
  });

  // ---------------------------------------------------------------
  // 9. External nodes use _Ext() variants
  // ---------------------------------------------------------------
  describe('external nodes use _Ext() variants', () => {
    it('uses Person_Ext() for external person', () => {
      const nodes = [
        makeNode('ep', 'person', 'external', { label: 'External User' }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('Person_Ext(ep,');
      expect(puml).not.toMatch(/(?<!_Ext\()Person\(ep/);
    });

    it('uses System_Ext() for external software system', () => {
      const nodes = [
        makeNode('es', 'softwareSystem', 'external', { label: 'Third Party' }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('System_Ext(es,');
    });

    it('uses Container_Ext() for external container', () => {
      const nodes = [
        makeNode('ec', 'container', 'external', {
          label: 'External Service',
          technology: 'REST API',
        }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('Container_Ext(ec,');
    });

    it('uses Component_Ext() for external component', () => {
      const nodes = [
        makeNode('ecomp', 'component', 'external', {
          label: 'External Lib',
          technology: 'npm',
        }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('Component_Ext(ecomp,');
    });
  });

  // ---------------------------------------------------------------
  // 10. Diagram type auto-detection
  // ---------------------------------------------------------------
  describe('diagram type auto-detection', () => {
    it('selects C4_Context.puml for person-only diagrams', () => {
      const nodes = [makeNode('p', 'person', 'internal')];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('C4_Context.puml');
    });

    it('selects C4_Container.puml when containers present (no components)', () => {
      const nodes = [
        makeNode('s', 'softwareSystem', 'internal'),
        makeNode('c', 'container', 'internal'),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('C4_Container.puml');
    });

    it('selects C4_Component.puml when components are present', () => {
      const nodes = [
        makeNode('c', 'container', 'internal'),
        makeNode('comp', 'component', 'internal'),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('C4_Component.puml');
    });

    it('selects C4_Deployment.puml when deployment nodes are present', () => {
      const nodes = [makeNode('dn', 'deploymentNode', 'internal', { label: 'Server' })];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('C4_Deployment.puml');
    });

    it('selects C4_Deployment.puml when infrastructure nodes are present', () => {
      const nodes = [
        makeNode('infra', 'infrastructureNode', 'internal', { label: 'Load Balancer' }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('C4_Deployment.puml');
    });

    it('deployment takes precedence over component', () => {
      const nodes = [
        makeNode('dn', 'deploymentNode', 'internal', { label: 'Server' }),
        makeNode('comp', 'component', 'internal'),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('C4_Deployment.puml');
    });
  });

  // ---------------------------------------------------------------
  // 11. Infrastructure node rendering
  // ---------------------------------------------------------------
  describe('infrastructure nodes', () => {
    it('renders infrastructureNode as Deployment_Node()', () => {
      const nodes = [
        makeNode('lb', 'infrastructureNode', 'internal', {
          label: 'Load Balancer',
          technology: 'Nginx',
        }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('Deployment_Node(lb, "Load Balancer", "Nginx")');
    });
  });

  // ---------------------------------------------------------------
  // 12. Special characters are escaped in output
  // ---------------------------------------------------------------
  describe('string escaping', () => {
    it('escapes double quotes in labels', () => {
      const nodes = [
        makeNode('n1', 'person', 'internal', { label: 'User "Admin"' }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('User \\"Admin\\"');
      expect(puml).not.toContain('User "Admin"');
    });

    it('escapes double quotes in edge labels', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [makeEdge('e1', 'a', 'b', { label: 'Reads "data"' })];
      const puml = exportToPlantUml(nodes, edges);
      expect(puml).toContain('Reads \\"data\\"');
    });
  });

  // ---------------------------------------------------------------
  // 13. Alias sanitisation
  // ---------------------------------------------------------------
  describe('alias sanitisation', () => {
    it('replaces non-alphanumeric characters with underscores', () => {
      const nodes = [
        makeNode('my-node.1', 'person', 'internal', { label: 'Test' }),
      ];
      const puml = exportToPlantUml(nodes, []);
      expect(puml).toContain('Person(my_node_1,');
    });
  });

  // ---------------------------------------------------------------
  // 14. Edges with missing labels
  // ---------------------------------------------------------------
  describe('edges without labels', () => {
    it('uses empty strings for label and protocol when data is undefined', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [makeEdge('e1', 'a', 'b')];
      const puml = exportToPlantUml(nodes, edges);
      expect(puml).toContain('Rel(a, b, "", "")');
    });
  });
});
