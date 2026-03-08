import yaml from 'js-yaml';
import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '../types/c4';
import type {
  YamlArchitecture,
  YamlActor,
  YamlSoftwareSystem,
  YamlContainer,
  YamlComponent,
  YamlRelationship,
} from '../types/yaml-schema';

export function graphToYaml(
  nodes: Node<C4NodeData>[],
  edges: Edge<C4EdgeData>[],
): string {
  const doc: YamlArchitecture = {};

  // Group nodes by kind
  const persons = nodes.filter((n) => n.data.kind === 'person');
  const systems = nodes.filter((n) => n.data.kind === 'softwareSystem');
  const containers = nodes.filter((n) => n.data.kind === 'container');
  const components = nodes.filter((n) => n.data.kind === 'component');

  // Build actors
  if (persons.length > 0) {
    doc.actors = {};
    for (const p of persons) {
      const actor: YamlActor = {
        type: 'Person',
        label: p.data.label,
        boundary: p.data.boundary === 'internal' ? 'Internal' : 'External',
      };
      if (p.data.description) actor.description = p.data.description;
      doc.actors[p.id] = actor;
    }
  }

  // Build software systems with nested containers and components
  if (systems.length > 0) {
    doc.softwareSystems = {};
    for (const sys of systems) {
      const system: YamlSoftwareSystem = {
        label: sys.data.label,
        boundary: sys.data.boundary === 'internal' ? 'Internal' : 'External',
      };
      if (sys.data.description) system.description = sys.data.description;

      // Find containers belonging to this system
      const sysContainers = containers.filter((c) => c.parentId === sys.id);
      if (sysContainers.length > 0) {
        system.containers = {};
        for (const cont of sysContainers) {
          const shortId = cont.id.split('.').pop()!;
          const container: YamlContainer = {
            label: cont.data.label,
          };
          if (cont.data.description) container.description = cont.data.description;
          if (cont.data.technology) container.technology = cont.data.technology;

          // Find components belonging to this container
          const contComponents = components.filter((comp) => comp.parentId === cont.id);
          if (contComponents.length > 0) {
            container.components = {};
            for (const comp of contComponents) {
              const compShortId = comp.id.split('.').pop()!;
              const component: YamlComponent = {
                label: comp.data.label,
              };
              if (comp.data.description) component.description = comp.data.description;
              if (comp.data.technology) component.technology = comp.data.technology;
              container.components[compShortId] = component;
            }
          }

          system.containers[shortId] = container;
        }
      }

      doc.softwareSystems[sys.id] = system;
    }
  }

  // Build relationships
  if (edges.length > 0) {
    doc.relationships = edges.map((e): YamlRelationship => {
      const rel: YamlRelationship = {
        from: e.source,
        to: e.target,
      };
      if (e.data?.label) rel.label = e.data.label;
      if (e.data?.protocol) rel.protocol = e.data.protocol;
      return rel;
    });
  }

  return yaml.dump(doc, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: "'",
    forceQuotes: false,
  });
}
