export type C4Boundary = 'internal' | 'external';

export type C4NodeKind = 'person' | 'softwareSystem' | 'container' | 'component';

export interface C4NodeData extends Record<string, unknown> {
  kind: C4NodeKind;
  label: string;
  description?: string;
  technology?: string;
  boundary: C4Boundary;
}

export interface C4EdgeData extends Record<string, unknown> {
  label?: string;
  protocol?: string;
}
