import type { QuickStartStep } from '@/types/utility';

export interface PipelineStage {
  stage: string;
  name: string;
  description: string;
  commands: string[];
  blocksDeply: boolean;
  exitBehavior: string;
  parallel?: boolean;
}

export interface ComplianceRule {
  name: string;
  rule: string;
  description: string;
  blocksDeply: boolean;
}

export interface OpaPolicy {
  domain: string;
  packageName: string;
  description: string;
  enforcement: string;
  severity: 'high' | 'medium';
}

export interface CliExitCode {
  code: number;
  label: string;
  meaning: string;
}

export const QUICK_START_STEPS: QuickStartStep[] = [
  {
    step: 1,
    title: 'Scaffold Model',
    description: 'Initialize your repository with the AAC directory structure and config file.',
    command: 'npx @muthub-ai/aac init',
  },
  {
    step: 2,
    title: 'Create System Model',
    description: 'Generate a C4 architecture model template for your application.',
    command: 'npx @muthub-ai/aac create system my-service',
  },
  {
    step: 3,
    title: 'Add Workflow',
    description: 'Copy the reference GitHub Actions workflow into your repository.',
    command: 'cp aac-validate.yml .github/workflows/',
  },
];

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    stage: '1',
    name: 'Quality Gate',
    description: 'Run application code linting and unit tests. This is your standard app-level quality gate before any architecture checks begin.',
    commands: ['npm run lint', 'npm run test'],
    blocksDeply: true,
    exitBehavior: 'Blocks on any non-zero exit code',
  },
  {
    stage: '2',
    name: 'Schema Validation',
    description: 'Validate model YAML against the enterprise JSON Schema (application-schema.json) with Ajv, Zod metadata validation, and cross-reference checks. Ensures structural correctness before compliance stages.',
    commands: ['aac validate model/ --type system --output json'],
    blocksDeply: true,
    exitBehavior: 'Exit 2 = validation failed, Exit 1 = system error',
  },
  {
    stage: '3a',
    name: 'App Architecture',
    description: 'Enforce 5 enterprise structural compliance rules: no frontend-to-database bypass, no empty systems, no orphaned externals, valid deployment references, and container technology required.',
    commands: ['npx tsx scripts/lint-architecture.ts'],
    blocksDeply: true,
    exitBehavior: 'Exit 1 = violations found',
    parallel: true,
  },
  {
    stage: '3b',
    name: 'Pattern Conformance',
    description: 'Validate architecture patterns against the pattern schema. Checks required components, relationship constraints, resource policies, and resiliency topology requirements.',
    commands: ['aac validate patterns/ --type pattern --output json'],
    blocksDeply: true,
    exitBehavior: 'Exit 2 = validation failed',
    parallel: true,
  },
  {
    stage: '3c',
    name: 'Standards Compliance',
    description: 'Validate enterprise architecture standards against the standards schema (draft 2020-12). Enforces requirement severity levels (MUST/MUST NOT/SHOULD), publication status, and architecture principles.',
    commands: ['aac validate standards/ --type standard --output json'],
    blocksDeply: true,
    exitBehavior: 'Exit 2 = validation failed',
    parallel: true,
  },
  {
    stage: '4',
    name: 'Policy Engine',
    description: 'Evaluate OPA Rego governance policies against the architecture model. Converts model YAML to JSON input and runs 3 policy packages covering security, FinOps, and integration domains.',
    commands: [
      'npx js-yaml model/*/system.yaml > /tmp/model.json',
      'opa eval -d policies/rules/ -i /tmp/model.json "data.architecture.security.deny"',
      'opa eval -d policies/rules/ -i /tmp/model.json "data.architecture.finops.deny"',
      'opa eval -d policies/rules/ -i /tmp/model.json "data.architecture.integration.deny"',
    ],
    blocksDeply: true,
    exitBehavior: 'Blocks if any deny set is non-empty',
  },
  {
    stage: '5',
    name: 'Build & Package',
    description: 'Application-specific build step. Compile, bundle, and package your application artifacts. This stage is fully customizable to your tech stack.',
    commands: ['docker build -t $IMAGE_TAG .'],
    blocksDeply: true,
    exitBehavior: 'Blocks on build failure',
  },
  {
    stage: '6',
    name: 'Deploy',
    description: 'Deploy to the target environment. Only runs after all validation gates pass. Customize for your deployment target (GKE, Cloud Run, ECS, etc.).',
    commands: ['gcloud run deploy $SERVICE --image $IMAGE_TAG --region $REGION'],
    blocksDeply: false,
    exitBehavior: 'Terminal stage',
  },
];

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    name: 'No Frontend-to-DB Bypass',
    rule: 'no-frontend-db-bypass',
    description: 'Frontend containers (React, Angular, Vue, iOS, Android) must not have direct relationships to database containers. All data access must be mediated through an API layer.',
    blocksDeply: true,
  },
  {
    name: 'No Empty Systems',
    rule: 'no-empty-systems',
    description: 'Internal software systems must define at least one container. External systems (tagged "external" or with no containers) are exempt. Catches incomplete architecture models.',
    blocksDeply: true,
  },
  {
    name: 'No Orphaned Externals',
    rule: 'no-orphaned-externals',
    description: 'External systems must be referenced in at least one relationship, either as a destination or by having outgoing relationships. Detects unused external dependencies.',
    blocksDeply: true,
  },
  {
    name: 'Valid Deployment References',
    rule: 'valid-deployment-refs',
    description: 'Every containerInstance.containerId in deployment nodes must reference a container that exists in the model. Catches stale or broken deployment configurations.',
    blocksDeply: true,
  },
  {
    name: 'Container Technology Required',
    rule: 'container-technology-required',
    description: 'Every container must have a non-empty technology field (e.g., "Node.js, Express" or "Cloud SQL for PostgreSQL"). Ensures models are not published in an incomplete state.',
    blocksDeply: true,
  },
];

export const OPA_POLICIES: OpaPolicy[] = [
  {
    domain: 'Security',
    packageName: 'architecture.security',
    description: 'Containers handling sensitive data must declare approved encryption. Containers tagged "sensitive", "pii", "phi", or "pci" require encryption set to "kms", "envelope", or "hsm".',
    enforcement: 'properties.encryption on all sensitive-tagged containers',
    severity: 'high',
  },
  {
    domain: 'FinOps',
    packageName: 'architecture.finops',
    description: 'Production compute deployment nodes must have autoscaling enabled. Non-production environments and non-compute nodes are exempt.',
    enforcement: 'autoscaling_enabled = true on production compute nodes',
    severity: 'medium',
  },
  {
    domain: 'Integration',
    packageName: 'architecture.integration',
    description: 'External-facing containers must be routed through an approved API gateway (Kong, Apigee, AWS API Gateway, Cloud Endpoints, Envoy). Direct external traffic is blocked.',
    enforcement: 'Gateway routing for all external-facing containers',
    severity: 'high',
  },
];

export const WORKFLOW_YAML = `name: Architecture Validation
on:
  pull_request:
    paths: ['model/**', 'patterns/**', 'standards/**']
  push:
    branches: [main]
    paths: ['model/**', 'patterns/**', 'standards/**']

concurrency:
  group: \${{ github.workflow }}-\${{ github.event.pull_request.number || github.sha }}
  cancel-in-progress: \${{ github.event_name == 'pull_request' }}

jobs:
  # Stage 1: Quality Gate
  quality-gate:
    name: "Quality Gate"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  # Stage 2: Schema Validation
  schema-validation:
    name: "Schema Validation"
    needs: quality-gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - name: Install AAC CLI
        run: npm install -g @muthub-ai/aac
      - name: Validate model against enterprise schemas
        run: aac validate model/ --type system --output json
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

  # Stage 3a: App Architecture (parallel)
  app-architecture:
    name: "App Architecture"
    needs: schema-validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - name: Run 5 architecture compliance rules
        run: npx tsx scripts/lint-architecture.ts

  # Stage 3b: Pattern Conformance (parallel)
  pattern-conformance:
    name: "Pattern Conformance"
    needs: schema-validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - name: Install AAC CLI
        run: npm install -g @muthub-ai/aac
      - name: Validate patterns against schema
        run: aac validate patterns/ --type pattern --output json
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

  # Stage 3c: Standards Compliance (parallel)
  standards-compliance:
    name: "Standards Compliance"
    needs: schema-validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - name: Install AAC CLI
        run: npm install -g @muthub-ai/aac
      - name: Validate standards against schema
        run: aac validate standards/ --type standard --output json
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

  # Stage 4: OPA Policy Evaluation
  policy-engine:
    name: "Policy Engine"
    needs: [app-architecture, pattern-conformance, standards-compliance]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install OPA CLI
        run: |
          curl -L -o /usr/local/bin/opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64_static
          chmod 755 /usr/local/bin/opa
      - name: Install js-yaml
        run: npm install -g js-yaml
      - name: Convert model YAML to JSON
        run: npx js-yaml model/*/system.yaml > /tmp/model.json
      - name: Evaluate security policies
        run: |
          result=$(opa eval -d policies/rules/ -i /tmp/model.json "data.architecture.security.deny")
          echo "$result"
          echo "$result" | grep -q '\\[\\]' || (echo "::error::Security policy violations found" && exit 1)
      - name: Evaluate FinOps policies
        run: |
          result=$(opa eval -d policies/rules/ -i /tmp/model.json "data.architecture.finops.deny")
          echo "$result"
          echo "$result" | grep -q '\\[\\]' || (echo "::error::FinOps policy violations found" && exit 1)
      - name: Evaluate integration policies
        run: |
          result=$(opa eval -d policies/rules/ -i /tmp/model.json "data.architecture.integration.deny")
          echo "$result"
          echo "$result" | grep -q '\\[\\]' || (echo "::error::Integration policy violations found" && exit 1)

  # Stage 5: Build & Package
  build:
    name: "Build & Package"
    needs: policy-engine
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build application
        run: echo "Add your build commands here"

  # Stage 6: Deploy
  deploy:
    name: "Deploy"
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Deploy to target environment
        run: echo "Add your deployment commands here"`;

export const AACRC_CONFIG = `{
  "schemaBaseUrl": "https://raw.githubusercontent.com/muthub-ai/aac/main/schema",
  "cacheDirName": ".aac",
  "defaultBranch": "main"
}`;

export const MODEL_STRUCTURE = `your-app-repo/
\u251c\u2500\u2500 .github/
\u2502   \u2514\u2500\u2500 workflows/
\u2502       \u2514\u2500\u2500 aac-validate.yml    \u2190 Reference pipeline
\u251c\u2500\u2500 model/
\u2502   \u2514\u2500\u2500 <system-name>/
\u2502       \u251c\u2500\u2500 system.yaml         \u2190 C4 architecture model
\u2502       \u2514\u2500\u2500 metadata.json       \u2190 System statistics
\u251c\u2500\u2500 patterns/
\u2502   \u2514\u2500\u2500 <pattern-name>/
\u2502       \u2514\u2500\u2500 pattern.yaml        \u2190 Architecture pattern
\u251c\u2500\u2500 standards/
\u2502   \u2514\u2500\u2500 <standard>.yaml         \u2190 Enterprise standard
\u251c\u2500\u2500 waivers/
\u2502   \u2514\u2500\u2500 <waiver>.yaml           \u2190 Exception request
\u251c\u2500\u2500 .aacrc                          \u2190 CLI config
\u2514\u2500\u2500 src/                            \u2190 Application source code`;

export const CLI_EXIT_CODES: CliExitCode[] = [
  {
    code: 0,
    label: 'Success',
    meaning: 'All validations passed. Safe to proceed to next stage.',
  },
  {
    code: 1,
    label: 'System Error',
    meaning: 'Schema fetch failed, file not found, or internal error. Check GITHUB_TOKEN and network connectivity.',
  },
  {
    code: 2,
    label: 'Validation Failed',
    meaning: 'One or more architecture artifacts failed validation. Review errors in output before merging.',
  },
];
