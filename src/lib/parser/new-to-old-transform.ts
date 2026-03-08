import type {
  YamlArchitecture,
  YamlActor,
  YamlSoftwareSystem,
  YamlContainer,
  YamlRelationship,
  NewYamlArchitecture,
  NewYamlRelationship,
} from '@/types/yaml-schema';

/**
 * Detect whether a parsed YAML document uses the new schema format.
 * The new format has a top-level `model` key.
 */
export function isNewFormat(doc: unknown): doc is NewYamlArchitecture {
  return (
    doc !== null &&
    typeof doc === 'object' &&
    'model' in doc &&
    typeof (doc as Record<string, unknown>).model === 'object'
  );
}

/** View info extracted for the UI pane */
export interface ViewInfo {
  key: string;
  type: 'systemContext' | 'container' | 'deployment';
  softwareSystemId: string;
  title?: string;
  description?: string;
  environment?: string;
}

/**
 * Extract views from a new-format document for the views pane.
 */
export function extractViews(doc: NewYamlArchitecture): ViewInfo[] {
  const views: ViewInfo[] = [];
  if (!doc.views) return views;

  for (const v of doc.views.systemContextViews ?? []) {
    views.push({
      key: v.key,
      type: 'systemContext',
      softwareSystemId: v.softwareSystemId,
      title: v.title,
      description: v.description,
    });
  }

  for (const v of doc.views.containerViews ?? []) {
    views.push({
      key: v.key,
      type: 'container',
      softwareSystemId: v.softwareSystemId,
      title: v.title,
      description: v.description,
    });
  }

  for (const v of doc.views.deploymentViews ?? []) {
    views.push({
      key: v.key,
      type: 'deployment',
      softwareSystemId: v.softwareSystemId,
      title: v.title,
      description: v.description,
      environment: v.environment,
    });
  }

  return views;
}

/**
 * Transform a new-format YAML architecture document to the old format
 * so the existing parser (`yamlToGraph`) can process it without changes.
 */
export function transformNewToOld(doc: NewYamlArchitecture): YamlArchitecture {
  const result: YamlArchitecture = {};
  const relationships: YamlRelationship[] = [];

  // ── People -> actors ──────────────────────────────────────────────
  if (doc.model.people && doc.model.people.length > 0) {
    result.actors = {};
    for (const person of doc.model.people) {
      const actor: YamlActor = {
        type: 'Person',
        label: person.name,
        description: person.description,
        boundary: 'External',
      };
      result.actors[person.id] = actor;

      // Collect inline relationships
      collectRelationships(person.id, person.relationships, relationships);
    }
  }

  // ── Software Systems ─────────────────────────────────────────────
  if (doc.model.softwareSystems && doc.model.softwareSystems.length > 0) {
    result.softwareSystems = {};
    for (const sys of doc.model.softwareSystems) {
      const hasContainers = sys.containers && sys.containers.length > 0;
      const boundary = deriveBoundary(sys.tags, hasContainers);

      const yamlSys: YamlSoftwareSystem = {
        label: sys.name,
        description: sys.description,
        boundary,
      };

      // Containers
      if (hasContainers) {
        yamlSys.containers = {};
        for (const cont of sys.containers!) {
          const yamlCont: YamlContainer = {
            label: cont.name,
            description: cont.description,
            technology: cont.technology,
          };
          yamlSys.containers[cont.id] = yamlCont;

          // Container-level relationships: source is "SystemId.ContainerId"
          collectRelationships(`${sys.id}.${cont.id}`, cont.relationships, relationships);
        }
      }

      result.softwareSystems[sys.id] = yamlSys;

      // System-level relationships
      collectRelationships(sys.id, sys.relationships, relationships);
    }
  }

  if (relationships.length > 0) {
    result.relationships = relationships;
  }

  return result;
}

/** Collect inline relationships from any element, converting new->old field names */
function collectRelationships(
  sourceId: string,
  rels: NewYamlRelationship[] | undefined,
  out: YamlRelationship[],
): void {
  if (!rels) return;
  for (const rel of rels) {
    out.push({
      from: sourceId,
      to: rel.destinationId,
      label: rel.description,
      protocol: rel.technology,
    });
  }
}

/** Derive boundary from tags string or container presence */
function deriveBoundary(tags?: string, hasContainers?: boolean): 'Internal' | 'External' {
  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim().toLowerCase());
    if (tagList.includes('external')) return 'External';
    if (tagList.includes('internal')) return 'Internal';
  }
  // Systems with containers are typically internal; without are external
  return hasContainers ? 'Internal' : 'External';
}
