import { isNewFormat, extractViews, transformNewToOld } from './new-to-old-transform';
import type { NewYamlArchitecture } from '@/types/yaml-schema';

// ---------------------------------------------------------------------------
// 1. isNewFormat
// ---------------------------------------------------------------------------
describe('isNewFormat', () => {
  it('returns false for null', () => {
    expect(isNewFormat(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isNewFormat(undefined)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isNewFormat('hello')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isNewFormat(42)).toBe(false);
  });

  it('returns false for old format object', () => {
    expect(isNewFormat({ actors: {}, softwareSystems: {} })).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(isNewFormat({})).toBe(false);
  });

  it('returns true for object with model key', () => {
    expect(isNewFormat({ model: {} })).toBe(true);
  });

  it('returns true for full new format', () => {
    expect(isNewFormat({ name: 'test', model: { people: [] } })).toBe(true);
  });

  it('returns false when model is not an object', () => {
    expect(isNewFormat({ model: 'string' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. extractViews
// ---------------------------------------------------------------------------
describe('extractViews', () => {
  it('returns empty array when no views property', () => {
    const doc: NewYamlArchitecture = { name: 'test', model: {} };
    expect(extractViews(doc)).toEqual([]);
  });

  it('returns empty array when views has empty arrays', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {},
      views: { systemContextViews: [], containerViews: [], deploymentViews: [] },
    };
    expect(extractViews(doc)).toEqual([]);
  });

  it('extracts systemContextViews correctly', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {},
      views: {
        systemContextViews: [
          { key: 'ctx-1', softwareSystemId: 'App', title: 'App Context', description: 'Shows context' },
        ],
      },
    };
    const views = extractViews(doc);
    expect(views).toHaveLength(1);
    expect(views[0]).toEqual({
      key: 'ctx-1',
      type: 'systemContext',
      softwareSystemId: 'App',
      title: 'App Context',
      description: 'Shows context',
    });
  });

  it('extracts containerViews correctly', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {},
      views: {
        containerViews: [
          { key: 'cont-1', softwareSystemId: 'App', title: 'Containers' },
        ],
      },
    };
    const views = extractViews(doc);
    expect(views).toHaveLength(1);
    expect(views[0].type).toBe('container');
  });

  it('extracts deploymentViews with environment field', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {},
      views: {
        deploymentViews: [
          { key: 'depl-1', softwareSystemId: 'App', title: 'Production', environment: 'Production' },
        ],
      },
    };
    const views = extractViews(doc);
    expect(views).toHaveLength(1);
    expect(views[0].type).toBe('deployment');
    expect(views[0].environment).toBe('Production');
  });

  it('extracts mixed views from all three types', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {},
      views: {
        systemContextViews: [
          { key: 'ctx', softwareSystemId: 'A' },
        ],
        containerViews: [
          { key: 'cont', softwareSystemId: 'A' },
        ],
        deploymentViews: [
          { key: 'depl', softwareSystemId: 'A', environment: 'Prod' },
        ],
      },
    };
    const views = extractViews(doc);
    expect(views).toHaveLength(3);
    expect(views.map((v) => v.type)).toEqual(['systemContext', 'container', 'deployment']);
  });
});

// ---------------------------------------------------------------------------
// 3. transformNewToOld
// ---------------------------------------------------------------------------
describe('transformNewToOld', () => {
  it('converts people to actors with correct field mapping', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        people: [
          { id: 'user1', name: 'End User', description: 'A user' },
        ],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.actors).toBeDefined();
    expect(result.actors!.user1).toEqual({
      type: 'Person',
      label: 'End User',
      description: 'A user',
      boundary: 'External',
    });
  });

  it('converts systems to softwareSystems keyed map', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        softwareSystems: [
          { id: 'App', name: 'Application', description: 'Main app', tags: 'internal' },
        ],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.softwareSystems).toBeDefined();
    expect(result.softwareSystems!.App.label).toBe('Application');
    expect(result.softwareSystems!.App.description).toBe('Main app');
  });

  it('derives Internal boundary from tags', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        softwareSystems: [
          { id: 'App', name: 'App', tags: 'core, internal' },
        ],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.softwareSystems!.App.boundary).toBe('Internal');
  });

  it('derives External boundary from tags', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        softwareSystems: [
          { id: 'ExtSys', name: 'External', tags: 'external, payments' },
        ],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.softwareSystems!.ExtSys.boundary).toBe('External');
  });

  it('derives Internal boundary for systems with containers (no tags)', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        softwareSystems: [
          {
            id: 'App',
            name: 'App',
            containers: [{ id: 'Web', name: 'Web' }],
          },
        ],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.softwareSystems!.App.boundary).toBe('Internal');
  });

  it('derives External boundary for systems without containers and no tags', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        softwareSystems: [
          { id: 'ExtSys', name: 'External' },
        ],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.softwareSystems!.ExtSys.boundary).toBe('External');
  });

  it('converts containers to keyed map with correct fields', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        softwareSystems: [
          {
            id: 'App',
            name: 'App',
            tags: 'internal',
            containers: [
              { id: 'WebUI', name: 'Web Application', description: 'Frontend', technology: 'React' },
              { id: 'API', name: 'API Server', technology: 'Node.js' },
            ],
          },
        ],
      },
    };
    const result = transformNewToOld(doc);
    const containers = result.softwareSystems!.App.containers!;
    expect(Object.keys(containers)).toHaveLength(2);
    expect(containers.WebUI.label).toBe('Web Application');
    expect(containers.WebUI.technology).toBe('React');
    expect(containers.WebUI.description).toBe('Frontend');
    expect(containers.API.label).toBe('API Server');
  });

  it('collects inline relationships from people', () => {
    const doc: NewYamlArchitecture = {
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
          { id: 'App', name: 'App' },
        ],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships![0]).toEqual({
      from: 'user',
      to: 'App',
      label: 'Uses',
      protocol: 'HTTPS',
    });
  });

  it('collects inline relationships from systems', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        softwareSystems: [
          {
            id: 'App',
            name: 'App',
            relationships: [
              { destinationId: 'ExtSys', description: 'Sends data', technology: 'REST' },
            ],
          },
          { id: 'ExtSys', name: 'External' },
        ],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships![0].from).toBe('App');
    expect(result.relationships![0].to).toBe('ExtSys');
  });

  it('collects inline relationships from containers with qualified source id', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        softwareSystems: [
          {
            id: 'App',
            name: 'App',
            containers: [
              {
                id: 'Web',
                name: 'Web',
                relationships: [
                  { destinationId: 'App.API', description: 'Calls', technology: 'JSON/HTTPS' },
                ],
              },
              { id: 'API', name: 'API' },
            ],
          },
        ],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships![0].from).toBe('App.Web');
    expect(result.relationships![0].to).toBe('App.API');
    expect(result.relationships![0].label).toBe('Calls');
    expect(result.relationships![0].protocol).toBe('JSON/HTTPS');
  });

  it('flattens all relationships into single array', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        people: [
          {
            id: 'user',
            name: 'User',
            relationships: [
              { destinationId: 'App.Web', description: 'Browses', technology: 'HTTPS' },
            ],
          },
        ],
        softwareSystems: [
          {
            id: 'App',
            name: 'App',
            containers: [
              {
                id: 'Web',
                name: 'Web',
                relationships: [
                  { destinationId: 'App.API', description: 'Calls' },
                ],
              },
              { id: 'API', name: 'API' },
            ],
            relationships: [
              { destinationId: 'ExtSys', description: 'Sends' },
            ],
          },
          { id: 'ExtSys', name: 'External' },
        ],
      },
    };
    const result = transformNewToOld(doc);
    // user->App.Web, App.Web->App.API, App->ExtSys = 3
    expect(result.relationships).toHaveLength(3);
  });

  it('returns empty object for empty model', () => {
    const doc: NewYamlArchitecture = { name: 'empty', model: {} };
    const result = transformNewToOld(doc);
    expect(result.actors).toBeUndefined();
    expect(result.softwareSystems).toBeUndefined();
    expect(result.relationships).toBeUndefined();
  });

  it('omits relationships key when no relationships exist', () => {
    const doc: NewYamlArchitecture = {
      name: 'test',
      model: {
        people: [{ id: 'user', name: 'User' }],
        softwareSystems: [{ id: 'App', name: 'App' }],
      },
    };
    const result = transformNewToOld(doc);
    expect(result.relationships).toBeUndefined();
  });

  it('full integration: transforms complete document correctly', () => {
    const doc: NewYamlArchitecture = {
      name: 'test-system',
      description: 'A test system',
      model: {
        people: [
          {
            id: 'User',
            name: 'End User',
            description: 'A user',
            relationships: [
              { destinationId: 'App.WebUI', description: 'Uses', technology: 'HTTPS' },
            ],
          },
        ],
        softwareSystems: [
          {
            id: 'App',
            name: 'Application',
            description: 'Main app',
            tags: 'core, internal',
            containers: [
              {
                id: 'WebUI',
                name: 'Web Application',
                description: 'Frontend',
                technology: 'React',
                relationships: [
                  { destinationId: 'App.API', description: 'Calls', technology: 'JSON/HTTPS' },
                ],
              },
              {
                id: 'API',
                name: 'API Server',
                description: 'Backend',
                technology: 'Node.js',
              },
            ],
            relationships: [
              { destinationId: 'ExtSys', description: 'Sends data to', technology: 'REST' },
            ],
          },
          {
            id: 'ExtSys',
            name: 'External System',
            description: 'Third party',
            tags: 'external',
          },
        ],
      },
    };

    const result = transformNewToOld(doc);

    // Actors
    expect(result.actors!.User).toEqual({
      type: 'Person',
      label: 'End User',
      description: 'A user',
      boundary: 'External',
    });

    // Systems
    expect(result.softwareSystems!.App.label).toBe('Application');
    expect(result.softwareSystems!.App.boundary).toBe('Internal');
    expect(result.softwareSystems!.ExtSys.label).toBe('External System');
    expect(result.softwareSystems!.ExtSys.boundary).toBe('External');
    expect(result.softwareSystems!.ExtSys.containers).toBeUndefined();

    // Containers
    expect(result.softwareSystems!.App.containers!.WebUI.label).toBe('Web Application');
    expect(result.softwareSystems!.App.containers!.WebUI.technology).toBe('React');
    expect(result.softwareSystems!.App.containers!.API.label).toBe('API Server');

    // Relationships: User->App.WebUI, App.WebUI->App.API, App->ExtSys = 3
    expect(result.relationships).toHaveLength(3);

    const userRel = result.relationships!.find((r) => r.from === 'User');
    expect(userRel!.to).toBe('App.WebUI');
    expect(userRel!.label).toBe('Uses');
    expect(userRel!.protocol).toBe('HTTPS');

    const webRel = result.relationships!.find((r) => r.from === 'App.WebUI');
    expect(webRel!.to).toBe('App.API');

    const sysRel = result.relationships!.find((r) => r.from === 'App');
    expect(sysRel!.to).toBe('ExtSys');
    expect(sysRel!.label).toBe('Sends data to');
    expect(sysRel!.protocol).toBe('REST');
  });
});
