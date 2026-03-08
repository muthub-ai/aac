import yaml from 'js-yaml';
import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';
import type {
  YamlArchitecture,
  YamlActor,
  YamlSoftwareSystem,
  YamlContainer,
  YamlRelationship,
} from '@/types/yaml-schema';

export function graphToYaml(
  nodes: Node<C4NodeData>[],
  edges: Edge<C4EdgeData>[],
): string {
  const doc: YamlArchitecture = {};

  const persons = nodes.filter((n) => n.data.kind === 'person');
  const systems = nodes.filter((n) => n.data.kind === 'softwareSystem');
  const containers = nodes.filter((n) => n.data.kind === 'container');
  const components = nodes.filter((n) => n.data.kind === 'component');

  if (persons.length > 0) {
    doc.actors = {};
    for (const p of persons) {
      const actor: YamlActor = {
        type: 'Person',
        label: p.data.label,
        description: p.data.description,
        boundary: p.data.boundary === 'internal' ? 'Internal' : 'External',
      };
      doc.actors[p.id] = actor;
    }
  }

  if (systems.length > 0) {
    doc.softwareSystems = {};
    for (const sys of systems) {
      const yamlSys: YamlSoftwareSystem = {
        label: sys.data.label,
        description: sys.data.description,
        boundary: sys.data.boundary === 'internal' ? 'Internal' : 'External',
      };

      const sysContainers = containers.filter((c) => c.parentId === sys.id);
      if (sysContainers.length > 0) {
        yamlSys.containers = {};
        for (const cont of sysContainers) {
          const shortId = cont.id.split('.').pop()!;
          const yamlCont: YamlContainer = {
            label: cont.data.label,
            technology: cont.data.technology,
            description: cont.data.description,
          };

          const contComponents = components.filter((c) => c.parentId === cont.id);
          if (contComponents.length > 0) {
            yamlCont.components = {};
            for (const comp of contComponents) {
              const compShortId = comp.id.split('.').pop()!;
              yamlCont.components[compShortId] = {
                label: comp.data.label,
                technology: comp.data.technology,
                description: comp.data.description,
              };
            }
          }

          yamlSys.containers[shortId] = yamlCont;
        }
      }

      doc.softwareSystems[sys.id] = yamlSys;
    }
  }

  if (edges.length > 0) {
    doc.relationships = edges.map((e): YamlRelationship => ({
      from: e.source,
      to: e.target,
      label: e.data?.label,
      protocol: e.data?.protocol,
    }));
  }

  return yaml.dump(doc, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: "'",
  });
}
