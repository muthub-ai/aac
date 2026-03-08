import { validateArchitecture, validateRelationshipRefs, validateMetadata } from './system-schema';

// ---------------------------------------------------------------------------
// validateArchitecture
// ---------------------------------------------------------------------------
describe('validateArchitecture', () => {
  it('1 - accepts a valid complete architecture with actors, systems, and relationships', () => {
    const data = {
      actors: {
        customer: {
          type: 'Person',
          label: 'Customer',
          description: 'An end-user of the platform',
          boundary: 'External',
        },
        backOffice: {
          type: 'SoftwareSystem',
          label: 'Back-office System',
          boundary: 'Internal',
        },
      },
      softwareSystems: {
        ecommerce: {
          label: 'E-Commerce Platform',
          description: 'Handles online orders',
          boundary: 'Internal',
          containers: {
            webApp: {
              label: 'Web Application',
              technology: 'React',
              containerType: 'SPA',
              components: {
                cart: {
                  label: 'Shopping Cart',
                  technology: 'TypeScript',
                },
              },
            },
            api: {
              label: 'API Server',
              technology: 'Node.js',
              description: 'REST API backend',
            },
          },
        },
      },
      relationships: [
        { from: 'customer', to: 'ecommerce.webApp', label: 'Uses', protocol: 'HTTPS' },
        { from: 'ecommerce.webApp', to: 'ecommerce.api', label: 'Calls' },
      ],
    };

    const result = validateArchitecture(data);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('2 - accepts an empty object as valid', () => {
    const result = validateArchitecture({});
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('3 - rejects an invalid actor type (not Person or SoftwareSystem)', () => {
    const data = {
      actors: {
        bot: {
          type: 'Robot',
          label: 'Automation Bot',
        },
      },
    };

    const result = validateArchitecture(data);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors.some((e) => e.includes('type'))).toBe(true);
  });

  it('4 - rejects missing required labels', () => {
    const data = {
      actors: {
        noLabel: {
          type: 'Person',
          label: '', // empty string violates min(1)
        },
      },
      softwareSystems: {
        sys: {
          label: '', // empty
          containers: {
            c: {
              label: '', // empty
              components: {
                comp: {
                  label: '', // empty
                },
              },
            },
          },
        },
      },
    };

    const result = validateArchitecture(data);
    expect(result.success).toBe(false);
    // Should report errors for each empty label
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
    expect(result.errors.some((e) => e.includes('Actor label is required'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Software system label is required'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Container label is required'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Component label is required'))).toBe(true);
  });

  it('5 - rejects an invalid boundary value', () => {
    const data = {
      softwareSystems: {
        sys: {
          label: 'My System',
          boundary: 'Outbound', // not 'Internal' | 'External'
        },
      },
    };

    const result = validateArchitecture(data);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('boundary'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateRelationshipRefs
// ---------------------------------------------------------------------------
describe('validateRelationshipRefs', () => {
  it('6 - passes when all refs resolve via exact match', () => {
    const data = {
      actors: {
        user: { type: 'Person' as const, label: 'User' },
      },
      softwareSystems: {
        platform: {
          label: 'Platform',
          containers: {
            web: { label: 'Web' },
          },
        },
      },
      relationships: [
        { from: 'user', to: 'platform.web' },
      ],
    };

    const result = validateRelationshipRefs(data);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('7 - resolves suffix-based shorthand (e.g. "webApp" matches "ecommerce.webApp")', () => {
    const data = {
      softwareSystems: {
        ecommerce: {
          label: 'E-Commerce',
          containers: {
            webApp: { label: 'Web App' },
            api: { label: 'API' },
          },
        },
      },
      relationships: [
        { from: 'webApp', to: 'api' }, // shorthand, not fully qualified
      ],
    };

    const result = validateRelationshipRefs(data);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('8 - returns an error for an unknown ref', () => {
    const data = {
      actors: {
        user: { type: 'Person' as const, label: 'User' },
      },
      softwareSystems: {},
      relationships: [
        { from: 'user', to: 'nonexistent.service' },
      ],
    };

    const result = validateRelationshipRefs(data);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('relationships[0].to');
    expect(result.errors[0]).toContain('nonexistent.service');
  });

  it('9 - passes when relationships array is empty', () => {
    const data = {
      actors: { a: { type: 'Person' as const, label: 'A' } },
      relationships: [],
    };

    const result = validateRelationshipRefs(data);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('10 - resolves component-level 3-part IDs', () => {
    const data = {
      softwareSystems: {
        shop: {
          label: 'Shop',
          containers: {
            backend: {
              label: 'Backend',
              components: {
                orderService: { label: 'Order Service' },
                paymentService: { label: 'Payment Service' },
              },
            },
          },
        },
      },
      relationships: [
        { from: 'shop.backend.orderService', to: 'shop.backend.paymentService' },
        { from: 'orderService', to: 'paymentService' }, // suffix resolution
      ],
    };

    const result = validateRelationshipRefs(data);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateMetadata
// ---------------------------------------------------------------------------
describe('validateMetadata', () => {
  const validMetadata = {
    id: 'my-system-01',
    name: 'My System',
    repoCount: 3,
    linesOfCode: 150000,
    deployableUnits: 5,
    domainModules: 12,
    domainObjects: 87,
    domainBehaviors: 43,
    lastScan: '2024-06-15T10:30:00Z',
    branchName: 'main',
  };

  it('11 - accepts valid metadata', () => {
    const result = validateMetadata(validMetadata);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('12 - rejects an ID with uppercase letters or spaces', () => {
    const upper = validateMetadata({ ...validMetadata, id: 'MySystem' });
    expect(upper.success).toBe(false);
    expect(upper.errors.some((e) => e.includes('id') || e.includes('ID'))).toBe(true);

    const spaces = validateMetadata({ ...validMetadata, id: 'my system' });
    expect(spaces.success).toBe(false);
    expect(spaces.errors.some((e) => e.includes('id') || e.includes('ID'))).toBe(true);
  });

  it('13 - rejects negative numbers', () => {
    const result = validateMetadata({ ...validMetadata, repoCount: -1 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('repoCount'))).toBe(true);

    const result2 = validateMetadata({ ...validMetadata, linesOfCode: -500 });
    expect(result2.success).toBe(false);
    expect(result2.errors.some((e) => e.includes('linesOfCode'))).toBe(true);
  });

  it('14 - rejects an invalid datetime format', () => {
    const result = validateMetadata({ ...validMetadata, lastScan: 'not-a-date' });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('lastScan'))).toBe(true);

    const result2 = validateMetadata({ ...validMetadata, lastScan: '2024/06/15' });
    expect(result2.success).toBe(false);
    expect(result2.errors.some((e) => e.includes('lastScan'))).toBe(true);
  });

  it('15 - rejects when required fields are missing', () => {
    const result = validateMetadata({});
    expect(result.success).toBe(false);
    // All required fields should produce errors
    expect(result.errors.some((e) => e.includes('id'))).toBe(true);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    expect(result.errors.some((e) => e.includes('branchName'))).toBe(true);
    expect(result.errors.some((e) => e.includes('lastScan'))).toBe(true);
    expect(result.errors.some((e) => e.includes('repoCount'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateArchitecture – new schema format
// ---------------------------------------------------------------------------
describe('validateArchitecture – new schema format', () => {
  it('16 - accepts a valid new-format architecture', () => {
    const data = {
      name: 'test-system',
      description: 'A test system',
      model: {
        people: [
          { id: 'user', name: 'User', description: 'An end user' },
        ],
        softwareSystems: [
          {
            id: 'App',
            name: 'Application',
            description: 'Main app',
            containers: [
              { id: 'Web', name: 'Web App', technology: 'React' },
            ],
          },
        ],
      },
      views: {
        systemContextViews: [
          { key: 'ctx', softwareSystemId: 'App', title: 'Context View' },
        ],
      },
    };
    const result = validateArchitecture(data);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('17 - accepts a new-format with no views', () => {
    const data = {
      name: 'minimal',
      model: {
        softwareSystems: [
          { id: 'Sys', name: 'System' },
        ],
      },
    };
    const result = validateArchitecture(data);
    expect(result.success).toBe(true);
  });

  it('18 - rejects new-format with missing name', () => {
    const data = {
      model: {
        softwareSystems: [
          { id: 'Sys', name: 'System' },
        ],
      },
    };
    const result = validateArchitecture(data);
    expect(result.success).toBe(false);
    expect(result.errors.some((e: string) => e.includes('name'))).toBe(true);
  });

  it('19 - rejects new-format with missing system name', () => {
    const data = {
      name: 'test',
      model: {
        softwareSystems: [
          { id: 'Sys' }, // missing name
        ],
      },
    };
    const result = validateArchitecture(data);
    expect(result.success).toBe(false);
  });

  it('20 - rejects new-format with missing person id', () => {
    const data = {
      name: 'test',
      model: {
        people: [
          { name: 'User' }, // missing id
        ],
      },
    };
    const result = validateArchitecture(data);
    expect(result.success).toBe(false);
  });

  it('21 - accepts new-format with relationships', () => {
    const data = {
      name: 'test',
      model: {
        people: [
          {
            id: 'user',
            name: 'User',
            relationships: [
              { destinationId: 'App', description: 'Uses', technology: 'HTTPS' },
            ],
          },
        ],
        softwareSystems: [
          { id: 'App', name: 'Application' },
        ],
      },
    };
    const result = validateArchitecture(data);
    expect(result.success).toBe(true);
  });

  it('22 - accepts new-format with deployment nodes', () => {
    const data = {
      name: 'test',
      model: {
        softwareSystems: [
          {
            id: 'App',
            name: 'Application',
            containers: [
              { id: 'Web', name: 'Web App', technology: 'React' },
            ],
          },
        ],
        deploymentNodes: [
          {
            id: 'prod',
            name: 'Production',
            environment: 'Production',
            children: [
              {
                id: 'k8s',
                name: 'Kubernetes',
                containerInstances: [
                  { containerId: 'App.Web', instanceId: 1 },
                ],
              },
            ],
          },
        ],
      },
    };
    const result = validateArchitecture(data);
    expect(result.success).toBe(true);
  });

  it('23 - still accepts old-format (backward compatibility)', () => {
    const data = {
      actors: {
        user: { type: 'Person', label: 'User' },
      },
      softwareSystems: {
        app: { label: 'App' },
      },
      relationships: [
        { from: 'user', to: 'app', label: 'Uses' },
      ],
    };
    const result = validateArchitecture(data);
    expect(result.success).toBe(true);
  });
});
