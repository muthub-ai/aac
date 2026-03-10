import type { CliCommand, ExitCode, ConfigField, QuickStartStep } from '@/types/utility';

export const QUICK_START_STEPS: QuickStartStep[] = [
  {
    step: 1,
    title: 'Install',
    description: 'Install the CLI globally from npm.',
    command: 'npm install -g @muthub-ai/aac',
  },
  {
    step: 2,
    title: 'Initialize',
    description: 'Set up the project structure and config.',
    command: 'aac init',
  },
  {
    step: 3,
    title: 'Validate',
    description: 'Validate your architecture artifacts.',
    command: 'aac validate standards/',
  },
];

export const CLI_COMMANDS: CliCommand[] = [
  {
    name: 'init',
    purpose: 'Initialize a new Architecture as Code project with config and standard directories.',
    synopsis: 'aac init',
    description:
      'Creates a .aacrc configuration file and the standard directory structure (model/, patterns/, standards/, waivers/, schema/) in the current working directory. Adds .gitkeep files to empty directories. Safely skips any files or directories that already exist.',
    examples: [
      {
        title: 'Initialize a new project',
        command: 'aac init',
      },
      {
        title: 'Initialize then create your first artifact',
        command: 'aac init && aac create system "Order Management"',
      },
    ],
    notes: [
      'Idempotent — safe to run multiple times without overwriting existing files.',
      'Creates .aacrc with default schema URL pointing to the GitHub repository.',
    ],
  },
  {
    name: 'create',
    purpose: 'Scaffold a boilerplate YAML artifact from a built-in template.',
    synopsis: 'aac create <TYPE> [NAME]',
    description:
      'Generates a new YAML artifact using a built-in template. The type determines which template and target directory to use. If a name is provided, it is slugified and used for the file and directory names. Without a name, defaults to my-<type>.',
    arguments: [
      {
        name: 'TYPE',
        required: true,
        description: 'The artifact type to create.',
        values: ['system', 'pattern', 'standard', 'waiver'],
      },
      {
        name: 'NAME',
        required: false,
        description: 'Human-readable name for the artifact. Slugified for file names.',
        default: 'my-<type>',
      },
    ],
    examples: [
      {
        title: 'Create a new system model',
        command: 'aac create system "Order Management"',
      },
      {
        title: 'Create an architecture pattern',
        command: 'aac create pattern "Event-Driven Messaging"',
      },
      {
        title: 'Create a standard with default name',
        command: 'aac create standard',
      },
      {
        title: 'Create a waiver request',
        command: 'aac create waiver "Legacy Encryption Exception"',
      },
    ],
    notes: [
      'System and pattern types create a subdirectory; standard and waiver types create a flat file.',
      'Exits with an error if the target file already exists to prevent accidental overwrites.',
    ],
  },
  {
    name: 'validate',
    purpose: 'Validate architecture artifacts against live enterprise JSON schemas.',
    synopsis: 'aac validate <FILEPATH> [FLAGS]',
    description:
      'Parses local YAML or JSON artifacts and validates them against the official enterprise schemas hosted on GitHub. Supports both individual files and directories. When given a directory, recursively discovers all .yaml, .yml, and .json files (excluding metadata.json and dotfiles). Schema type is auto-inferred from the file path when not explicitly set.',
    arguments: [
      {
        name: 'FILEPATH',
        required: true,
        description: 'Path to a YAML/JSON file or a directory of artifacts to validate.',
      },
    ],
    flags: [
      {
        long: '--type',
        short: '-t',
        argument: '<type>',
        description: 'Schema type. Auto-inferred from path if omitted.',
        default: 'inferred',
      },
      {
        long: '--output',
        short: '-o',
        argument: '<format>',
        description: 'Output format. Use json for machine-readable CI/CD output.',
        default: 'text',
      },
      {
        long: '--force-refresh',
        short: '-f',
        description: 'Bypass the local ETag cache and download the latest schema from GitHub.',
      },
    ],
    examples: [
      {
        title: 'Validate a system model with text output',
        command: 'aac validate ./model/ecommerce-platform/system.yaml --type system',
      },
      {
        title: 'Validate waivers with JSON output for CI/CD',
        command: 'aac validate ./waivers/ --type waiver --output json',
      },
      {
        title: 'Force a schema refresh before validating patterns',
        command: 'aac validate ./patterns/ --type pattern --force-refresh',
      },
      {
        title: 'Validate all standards in a directory',
        command: 'aac validate ./standards/',
      },
    ],
    notes: [
      'Type auto-inference reads the file path: model/ → system, patterns/ → pattern, standards/ → standard, waivers/ → waiver.',
      'Uses ETag-based HTTP caching. Schemas are stored in ~/.aac/cache/schemas/.',
      'Set GITHUB_TOKEN environment variable for authenticated access to private schema repositories.',
    ],
  },
];

export const EXIT_CODES: ExitCode[] = [
  {
    code: 0,
    label: 'SUCCESS',
    meaning: 'All operations completed successfully. All validations passed.',
  },
  {
    code: 1,
    label: 'SYSTEM_ERROR',
    meaning: 'System or configuration error — unknown type, file not found, schema fetch failure, or file already exists.',
  },
  {
    code: 2,
    label: 'VALIDATION_FAILED',
    meaning: 'One or more artifacts failed schema validation. Review the error output for details.',
  },
];

export const CONFIG_FIELDS: ConfigField[] = [
  {
    field: 'schemaBaseUrl',
    type: 'string',
    default: 'https://raw.githubusercontent.com/muthub-ai/aac/main/schema',
    description: 'Base URL for fetching remote JSON schemas.',
  },
  {
    field: 'cacheDirName',
    type: 'string',
    default: '.aac',
    description: 'Directory name under $HOME for the schema cache.',
  },
  {
    field: 'defaultBranch',
    type: 'string',
    default: 'main',
    description: 'Default git branch for schema resolution.',
  },
];

export const DEFAULT_AACRC = `{
  "schemaBaseUrl": "https://raw.githubusercontent.com/muthub-ai/aac/main/schema",
  "cacheDirName": ".aac",
  "defaultBranch": "main"
}`;

export const SCHEMA_TYPES = [
  { type: 'system', file: 'application-schema.json', note: 'Alias: application' },
  { type: 'pattern', file: 'pattern-schema.json', note: '' },
  { type: 'standard', file: 'standards.json', note: '' },
  { type: 'waiver', file: 'waivers.json', note: '' },
];
