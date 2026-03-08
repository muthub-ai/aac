import { yamlToGraph } from './yaml-to-graph';

// ---------------------------------------------------------------------------
// 1. Empty / null / undefined / malformed YAML → empty result
// ---------------------------------------------------------------------------
describe('yamlToGraph – empty & invalid input', () => {
  it('returns empty result for an empty string', () => {
    const result = yamlToGraph('');
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('returns empty result for whitespace-only input', () => {
    const result = yamlToGraph('   \n\n  ');
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('returns empty result when YAML parses to null', () => {
    // "null" is valid YAML that parses to null
    const result = yamlToGraph('null');
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('returns empty result when YAML parses to a scalar string', () => {
    const result = yamlToGraph('just a string');
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('returns empty result when YAML parses to a number', () => {
    const result = yamlToGraph('42');
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('returns empty result for malformed YAML (syntax error)', () => {
    const result = yamlToGraph('actors:\n  - bad: [unclosed');
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('returns empty result for an empty object (no actors/systems/relationships)', () => {
    const result = yamlToGraph('foo: bar');
    expect(result).toEqual({ nodes: [], edges: [] });
  });
});

// ---------------------------------------------------------------------------
// 2. Parsing a single Person actor
// ---------------------------------------------------------------------------
describe('yamlToGraph – Person actor', () => {
  it('creates a personNode with correct data', () => {
    const yaml = `
actors:
  user:
    type: Person
    label: End User
    description: A user of the system
    boundary: Internal
`;
    const { nodes, edges } = yamlToGraph(yaml);

    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);

    const node = nodes[0];
    expect(node.id).toBe('user');
    expect(node.type).toBe('personNode');
    expect(node.position).toEqual({ x: 0, y: 0 });
    expect(node.data).toEqual({
      kind: 'person',
      label: 'End User',
      description: 'A user of the system',
      boundary: 'internal',
    });
  });

  it('falls back to the id as label when label is missing', () => {
    const yaml = `
actors:
  admin:
    type: Person
    description: An admin
`;
    const { nodes } = yamlToGraph(yaml);
    expect(nodes[0].data.label).toBe('admin');
  });
});

// ---------------------------------------------------------------------------
// 3. Parsing a SoftwareSystem actor
// ---------------------------------------------------------------------------
describe('yamlToGraph – SoftwareSystem actor', () => {
  it('creates a systemNode for a SoftwareSystem actor', () => {
    const yaml = `
actors:
  mailService:
    type: SoftwareSystem
    label: Mail Service
    description: Sends emails
    boundary: External
`;
    const { nodes } = yamlToGraph(yaml);

    expect(nodes).toHaveLength(1);
    const node = nodes[0];
    expect(node.id).toBe('mailService');
    expect(node.type).toBe('systemNode');
    expect(node.data.kind).toBe('softwareSystem');
    expect(node.data.label).toBe('Mail Service');
    expect(node.data.description).toBe('Sends emails');
    expect(node.data.boundary).toBe('external');
  });
});

// ---------------------------------------------------------------------------
// 4. Parsing a software system with containers
// ---------------------------------------------------------------------------
describe('yamlToGraph – softwareSystems with containers', () => {
  const yaml = `
softwareSystems:
  ecommerce:
    label: E-Commerce Platform
    description: Handles online sales
    containers:
      webApp:
        label: Web Application
        description: Frontend app
        technology: React
      api:
        label: API Server
        description: REST API
        technology: Node.js
`;

  it('creates a system node and container nodes', () => {
    const { nodes } = yamlToGraph(yaml);
    // 1 system + 2 containers
    expect(nodes).toHaveLength(3);
  });

  it('system node has correct properties', () => {
    const { nodes } = yamlToGraph(yaml);
    const system = nodes.find((n) => n.id === 'ecommerce');
    expect(system).toBeDefined();
    expect(system!.type).toBe('systemNode');
    expect(system!.data).toEqual({
      kind: 'softwareSystem',
      label: 'E-Commerce Platform',
      description: 'Handles online sales',
      boundary: 'internal',
    });
  });

  it('container nodes have composite ids and parentId', () => {
    const { nodes } = yamlToGraph(yaml);

    const webApp = nodes.find((n) => n.id === 'ecommerce.webApp');
    expect(webApp).toBeDefined();
    expect(webApp!.type).toBe('containerNode');
    expect(webApp!.parentId).toBe('ecommerce');
    expect(webApp!.extent).toBe('parent');
    expect(webApp!.data).toEqual({
      kind: 'container',
      label: 'Web Application',
      description: 'Frontend app',
      technology: 'React',
      boundary: 'internal',
    });

    const api = nodes.find((n) => n.id === 'ecommerce.api');
    expect(api).toBeDefined();
    expect(api!.type).toBe('containerNode');
    expect(api!.parentId).toBe('ecommerce');
    expect(api!.data.technology).toBe('Node.js');
  });
});

// ---------------------------------------------------------------------------
// 5. Containers with components (3-level nesting)
// ---------------------------------------------------------------------------
describe('yamlToGraph – 3-level nesting (system → container → component)', () => {
  const yaml = `
softwareSystems:
  platform:
    label: Platform
    containers:
      backend:
        label: Backend
        technology: Java
        components:
          authCtrl:
            label: Auth Controller
            description: Handles auth
            technology: Spring
          userSvc:
            label: User Service
            technology: Spring
`;

  it('creates system, container, and component nodes', () => {
    const { nodes } = yamlToGraph(yaml);
    // 1 system + 1 container + 2 components
    expect(nodes).toHaveLength(4);
  });

  it('component nodes have 3-segment ids and correct parentId', () => {
    const { nodes } = yamlToGraph(yaml);

    const authCtrl = nodes.find((n) => n.id === 'platform.backend.authCtrl');
    expect(authCtrl).toBeDefined();
    expect(authCtrl!.type).toBe('componentNode');
    expect(authCtrl!.parentId).toBe('platform.backend');
    expect(authCtrl!.extent).toBe('parent');
    expect(authCtrl!.data).toEqual({
      kind: 'component',
      label: 'Auth Controller',
      description: 'Handles auth',
      technology: 'Spring',
      boundary: 'internal',
    });

    const userSvc = nodes.find((n) => n.id === 'platform.backend.userSvc');
    expect(userSvc).toBeDefined();
    expect(userSvc!.parentId).toBe('platform.backend');
  });
});

// ---------------------------------------------------------------------------
// 6. Parsing relationships (edges)
// ---------------------------------------------------------------------------
describe('yamlToGraph – relationships', () => {
  const yaml = `
actors:
  user:
    type: Person
    label: User
softwareSystems:
  app:
    label: App
relationships:
  - from: user
    to: app
    label: Uses
    protocol: HTTPS
`;

  it('creates edges between known nodes', () => {
    const { edges } = yamlToGraph(yaml);
    expect(edges).toHaveLength(1);

    const edge = edges[0];
    expect(edge.id).toBe('user->app');
    expect(edge.source).toBe('user');
    expect(edge.target).toBe('app');
    expect(edge.label).toBe('Uses');
    expect(edge.animated).toBe(false);
    expect(edge.data).toEqual({
      label: 'Uses',
      protocol: 'HTTPS',
    });
  });

  it('creates edges without optional label/protocol', () => {
    const y = `
actors:
  a:
    type: Person
    label: A
  b:
    type: Person
    label: B
relationships:
  - from: a
    to: b
`;
    const { edges } = yamlToGraph(y);
    expect(edges).toHaveLength(1);
    expect(edges[0].data!.label).toBeUndefined();
    expect(edges[0].data!.protocol).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Relationship resolution by suffix match
// ---------------------------------------------------------------------------
describe('yamlToGraph – suffix-based node resolution', () => {
  const yaml = `
actors:
  user:
    type: Person
    label: User
softwareSystems:
  ecommerce:
    label: E-Commerce
    containers:
      webApp:
        label: Web Application
        technology: React
relationships:
  - from: user
    to: webApp
    label: Browses
`;

  it('resolves "webApp" to "ecommerce.webApp" via suffix match', () => {
    const { edges } = yamlToGraph(yaml);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('user');
    expect(edges[0].target).toBe('ecommerce.webApp');
    expect(edges[0].id).toBe('user->ecommerce.webApp');
  });

  it('prefers exact match over suffix match', () => {
    // "app" exists as a top-level system AND as a suffix of "myOrg.app"
    // resolveNodeId should return the exact match first
    const y = `
softwareSystems:
  app:
    label: App System
  myOrg:
    label: My Org
    containers:
      app:
        label: Nested App
actors:
  user:
    type: Person
    label: User
relationships:
  - from: user
    to: app
    label: Uses
`;
    const { edges } = yamlToGraph(y);
    expect(edges).toHaveLength(1);
    // exact match "app" wins over "myOrg.app"
    expect(edges[0].target).toBe('app');
  });

  it('resolves deeply nested component by suffix', () => {
    const y = `
actors:
  dev:
    type: Person
    label: Developer
softwareSystems:
  platform:
    label: Platform
    containers:
      api:
        label: API
        technology: Go
        components:
          authCtrl:
            label: Auth Controller
            technology: Go
relationships:
  - from: dev
    to: authCtrl
    label: Calls
`;
    const { edges } = yamlToGraph(y);
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe('platform.api.authCtrl');
  });
});

// ---------------------------------------------------------------------------
// 8. Unresolvable references are skipped
// ---------------------------------------------------------------------------
describe('yamlToGraph – unresolvable relationship references', () => {
  it('skips edges where "from" cannot be resolved', () => {
    const yaml = `
actors:
  user:
    type: Person
    label: User
relationships:
  - from: ghost
    to: user
    label: Haunts
`;
    const { edges } = yamlToGraph(yaml);
    expect(edges).toHaveLength(0);
  });

  it('skips edges where "to" cannot be resolved', () => {
    const yaml = `
actors:
  user:
    type: Person
    label: User
relationships:
  - from: user
    to: nonexistent
    label: Reaches
`;
    const { edges } = yamlToGraph(yaml);
    expect(edges).toHaveLength(0);
  });

  it('skips edges where both references are invalid', () => {
    const yaml = `
relationships:
  - from: foo
    to: bar
    label: Nothing
`;
    const { edges } = yamlToGraph(yaml);
    expect(edges).toHaveLength(0);
  });

  it('keeps valid edges and skips invalid ones in the same list', () => {
    const yaml = `
actors:
  user:
    type: Person
    label: User
softwareSystems:
  app:
    label: App
relationships:
  - from: user
    to: app
    label: Valid
  - from: user
    to: nonexistent
    label: Invalid
  - from: ghost
    to: app
    label: Also Invalid
`;
    const { edges } = yamlToGraph(yaml);
    expect(edges).toHaveLength(1);
    expect(edges[0].label).toBe('Valid');
  });
});

// ---------------------------------------------------------------------------
// 9. Boundary mapping
// ---------------------------------------------------------------------------
describe('yamlToGraph – boundary mapping', () => {
  it('maps actor boundary "Internal" → "internal"', () => {
    const yaml = `
actors:
  user:
    type: Person
    label: User
    boundary: Internal
`;
    const { nodes } = yamlToGraph(yaml);
    expect(nodes[0].data.boundary).toBe('internal');
  });

  it('maps actor boundary "External" → "external"', () => {
    const yaml = `
actors:
  ext:
    type: Person
    label: External User
    boundary: External
`;
    const { nodes } = yamlToGraph(yaml);
    expect(nodes[0].data.boundary).toBe('external');
  });

  it('defaults actor boundary to "external" when not specified', () => {
    const yaml = `
actors:
  user:
    type: Person
    label: User
`;
    const { nodes } = yamlToGraph(yaml);
    // actor.boundary is undefined → actor.boundary === 'Internal' is false → 'external'
    expect(nodes[0].data.boundary).toBe('external');
  });

  it('maps system boundary "External" → "external"', () => {
    const yaml = `
softwareSystems:
  extSys:
    label: External System
    boundary: External
`;
    const { nodes } = yamlToGraph(yaml);
    expect(nodes[0].data.boundary).toBe('external');
  });

  it('maps system boundary "Internal" → "internal"', () => {
    const yaml = `
softwareSystems:
  intSys:
    label: Internal System
    boundary: Internal
`;
    const { nodes } = yamlToGraph(yaml);
    expect(nodes[0].data.boundary).toBe('internal');
  });

  it('defaults system boundary to "internal" when not specified', () => {
    const yaml = `
softwareSystems:
  sys:
    label: Some System
`;
    const { nodes } = yamlToGraph(yaml);
    // system.boundary is undefined → system.boundary === 'External' is false → 'internal'
    expect(nodes[0].data.boundary).toBe('internal');
  });

  it('containers inherit boundary from their parent system', () => {
    const yaml = `
softwareSystems:
  extSys:
    label: External System
    boundary: External
    containers:
      svc:
        label: Service
        technology: Go
`;
    const { nodes } = yamlToGraph(yaml);
    const container = nodes.find((n) => n.id === 'extSys.svc');
    expect(container!.data.boundary).toBe('external');
  });

  it('components inherit boundary from their grandparent system', () => {
    const yaml = `
softwareSystems:
  extSys:
    label: External System
    boundary: External
    containers:
      svc:
        label: Service
        components:
          ctrl:
            label: Controller
`;
    const { nodes } = yamlToGraph(yaml);
    const component = nodes.find((n) => n.id === 'extSys.svc.ctrl');
    expect(component!.data.boundary).toBe('external');
  });
});

// ---------------------------------------------------------------------------
// 10. All positions default to { x: 0, y: 0 }
// ---------------------------------------------------------------------------
describe('yamlToGraph – default positions', () => {
  it('every node has position { x: 0, y: 0 }', () => {
    const yaml = `
actors:
  user:
    type: Person
    label: User
softwareSystems:
  platform:
    label: Platform
    containers:
      api:
        label: API
        technology: Go
        components:
          handler:
            label: Handler
            technology: Go
relationships:
  - from: user
    to: handler
    label: Calls
`;
    const { nodes } = yamlToGraph(yaml);
    expect(nodes.length).toBeGreaterThanOrEqual(4);
    for (const node of nodes) {
      expect(node.position).toEqual({ x: 0, y: 0 });
    }
  });
});

// ---------------------------------------------------------------------------
// Bonus: full integration round-trip
// ---------------------------------------------------------------------------
describe('yamlToGraph – full document integration', () => {
  const yaml = `
actors:
  customer:
    type: Person
    label: Customer
    description: Buys products
    boundary: Internal
  paymentGw:
    type: SoftwareSystem
    label: Payment Gateway
    description: Processes payments
    boundary: External
softwareSystems:
  shop:
    label: Online Shop
    description: E-commerce platform
    boundary: Internal
    containers:
      web:
        label: Web Frontend
        technology: React
        components:
          cart:
            label: Shopping Cart
            technology: TypeScript
      api:
        label: API
        technology: Node.js
relationships:
  - from: customer
    to: web
    label: Browses
    protocol: HTTPS
  - from: web
    to: api
    label: Calls
    protocol: JSON/HTTPS
  - from: api
    to: paymentGw
    label: Charges
    protocol: HTTPS
`;

  it('produces the correct number of nodes and edges', () => {
    const { nodes, edges } = yamlToGraph(yaml);
    // actors: customer, paymentGw → 2
    // systems: shop → 1
    // containers: shop.web, shop.api → 2
    // components: shop.web.cart → 1
    // total nodes: 6
    expect(nodes).toHaveLength(6);
    // 3 relationships, all resolvable via exact or suffix match
    expect(edges).toHaveLength(3);
  });

  it('correctly resolves suffix-based relationship targets', () => {
    const { edges } = yamlToGraph(yaml);
    const browsesEdge = edges.find((e) => e.label === 'Browses');
    expect(browsesEdge!.source).toBe('customer');
    expect(browsesEdge!.target).toBe('shop.web');

    const callsEdge = edges.find((e) => e.label === 'Calls');
    expect(callsEdge!.source).toBe('shop.web');
    expect(callsEdge!.target).toBe('shop.api');

    const chargesEdge = edges.find((e) => e.label === 'Charges');
    expect(chargesEdge!.source).toBe('shop.api');
    expect(chargesEdge!.target).toBe('paymentGw');
  });

  it('all node kinds are assigned correctly', () => {
    const { nodes } = yamlToGraph(yaml);
    const kinds = new Map(nodes.map((n) => [n.id, n.data.kind]));
    expect(kinds.get('customer')).toBe('person');
    expect(kinds.get('paymentGw')).toBe('softwareSystem');
    expect(kinds.get('shop')).toBe('softwareSystem');
    expect(kinds.get('shop.web')).toBe('container');
    expect(kinds.get('shop.api')).toBe('container');
    expect(kinds.get('shop.web.cart')).toBe('component');
  });
});
