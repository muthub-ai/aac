import type { QuickStartStep } from '@/types/utility';

export interface McpResource {
  uri: string;
  description: string;
  mimeType: string;
  example?: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputs: Array<{ name: string; type: string; required: boolean; description: string }>;
  outputFields: Array<{ name: string; type: string; description: string }>;
}

export interface McpPrompt {
  name: string;
  title: string;
  description: string;
  args: Array<{ name: string; type: string; description: string }>;
}

export const QUICK_START_STEPS: QuickStartStep[] = [
  {
    step: 1,
    title: 'Install',
    description: 'Install the MCP server globally from npm.',
    command: 'npm install -g @muthub-ai/aac-mcp-server',
  },
  {
    step: 2,
    title: 'Configure IDE',
    description: 'Add to your IDE\'s MCP configuration.',
    command: '{ "mcpServers": { "aac": { "command": "aac-mcp", "args": ["--root", "/path/to/your/aac/repo"] } } }',
  },
  {
    step: 3,
    title: 'Start Using',
    description: 'Ask your AI agent to interact with your architecture.',
    command: 'Ask your AI agent to "list my architecture standards"',
  },
];

export const MCP_RESOURCES: McpResource[] = [
  {
    uri: 'aac://systems',
    description: 'List all system architecture models',
    mimeType: 'application/json',
  },
  {
    uri: 'aac://systems/{id}',
    description: 'Read a specific system\'s C4 YAML model',
    mimeType: 'text/yaml',
  },
  {
    uri: 'aac://standards',
    description: 'List all enterprise architecture standards',
    mimeType: 'application/json',
  },
  {
    uri: 'aac://standards/{filename}',
    description: 'Read a specific standard\'s full YAML content',
    mimeType: 'text/yaml',
  },
  {
    uri: 'aac://waivers',
    description: 'List all architecture waivers with status',
    mimeType: 'application/json',
  },
  {
    uri: 'aac://waivers/active',
    description: 'List only approved, non-expired waivers',
    mimeType: 'application/json',
  },
  {
    uri: 'aac://waivers/{filename}',
    description: 'Read a specific waiver\'s full YAML content',
    mimeType: 'text/yaml',
  },
  {
    uri: 'aac://patterns',
    description: 'List all architecture patterns',
    mimeType: 'application/json',
  },
  {
    uri: 'aac://patterns/{id}',
    description: 'Read a specific pattern\'s YAML definition',
    mimeType: 'text/yaml',
  },
  {
    uri: 'aac://schemas/{type}',
    description: 'Read the JSON Schema for a given artifact type',
    mimeType: 'application/json',
  },
];

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'validate_architecture',
    description: 'Validate YAML content against enterprise JSON schemas',
    inputs: [
      {
        name: 'yamlContent',
        type: 'string',
        required: true,
        description: 'Raw YAML content to validate',
      },
      {
        name: 'type',
        type: 'string',
        required: false,
        description: 'Schema type: system, pattern, standard, or waiver. Auto-detected if omitted.',
      },
    ],
    outputFields: [
      { name: 'valid', type: 'boolean', description: 'Whether the YAML passed validation' },
      { name: 'type', type: 'string', description: 'The detected or specified schema type' },
      { name: 'errorCount', type: 'number', description: 'Number of validation errors' },
      { name: 'errors', type: 'array', description: 'List of validation error details' },
    ],
  },
  {
    name: 'lint_compliance',
    description: 'Run 5 enterprise architecture policy rules against system models',
    inputs: [
      {
        name: 'systemId',
        type: 'string',
        required: false,
        description: 'System ID to lint. Lints all systems if omitted.',
      },
    ],
    outputFields: [
      { name: 'systemsChecked', type: 'number', description: 'Number of systems checked' },
      { name: 'violationCount', type: 'number', description: 'Total number of violations found' },
      { name: 'violations', type: 'array', description: 'List of compliance violations' },
    ],
  },
  {
    name: 'scaffold_waiver',
    description: 'Generate a draft waiver YAML file for an architecture exception request',
    inputs: [
      {
        name: 'applicationId',
        type: 'string',
        required: true,
        description: 'The application requesting the waiver',
      },
      {
        name: 'standardId',
        type: 'string',
        required: true,
        description: 'The standard to request an exception from',
      },
      {
        name: 'rationale',
        type: 'string',
        required: true,
        description: 'Business justification for the exception',
      },
      {
        name: 'mitigatingControls',
        type: 'string[]',
        required: false,
        description: 'Compensating controls to mitigate risk',
      },
      {
        name: 'requestedDurationMonths',
        type: 'number',
        required: false,
        description: 'How long the waiver should last in months',
      },
    ],
    outputFields: [
      { name: 'filePath', type: 'string', description: 'Path to the generated waiver file' },
      { name: 'valid', type: 'boolean', description: 'Whether the generated waiver is valid' },
      { name: 'errors', type: 'array', description: 'Any validation errors in the generated waiver' },
    ],
  },
];

export const MCP_PROMPTS: McpPrompt[] = [
  {
    name: 'design_new_system',
    title: 'Design New System',
    description: 'Guided workflow to design a C4 architecture model conforming to enterprise standards',
    args: [
      { name: 'systemName', type: 'string', description: 'Name of the system to design' },
      { name: 'description', type: 'string', description: 'Brief description of the system purpose' },
    ],
  },
  {
    name: 'request_architecture_exception',
    title: 'Request Architecture Exception',
    description: 'Generate a formal waiver request to bypass an architecture standard',
    args: [
      { name: 'standardId', type: 'string', description: 'The standard to request an exception from' },
      { name: 'applicationId', type: 'string', description: 'The application requesting the exception' },
    ],
  },
];

export const IDE_CONFIG = `{
  "mcpServers": {
    "aac": {
      "command": "aac-mcp",
      "args": ["--root", "/path/to/your/aac/repo"]
    }
  }
}`;

export const LINT_RULES: Array<{ rule: string; description: string }> = [
  {
    rule: 'no-frontend-db-bypass',
    description: 'Frontends must not have direct relationships to databases',
  },
  {
    rule: 'no-empty-systems',
    description: 'Internal software systems must define at least one container',
  },
  {
    rule: 'no-orphaned-externals',
    description: 'External systems must be referenced in at least one relationship',
  },
  {
    rule: 'valid-deployment-refs',
    description: 'Deployment container instances must reference existing containers',
  },
  {
    rule: 'container-technology-required',
    description: 'Every container must specify a technology field',
  },
];
