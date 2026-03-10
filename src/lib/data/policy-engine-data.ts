import type { QuickStartStep } from '@/types/utility';

export interface PolicyRule {
  name: string;
  domain: string;
  package_name: string;
  description: string;
  enforces: string;
  severity: 'high' | 'medium';
}

export interface CiCommand {
  name: string;
  command: string;
  description: string;
  failsBuild: boolean;
}

export const QUICK_START_STEPS: QuickStartStep[] = [
  {
    step: 1,
    title: 'Install OPA',
    description: 'Install the Open Policy Agent CLI on your system.',
    command: 'brew install opa',
  },
  {
    step: 2,
    title: 'Run Tests',
    description: 'Execute all policy unit tests with verbose output.',
    command: 'cd packages/policies && npm test',
  },
  {
    step: 3,
    title: 'Check Coverage',
    description: 'Analyze test coverage to ensure all rules are exercised.',
    command: 'cd packages/policies && npm run test:coverage',
  },
];

export const POLICY_RULES: PolicyRule[] = [
  {
    name: 'Cloud Workload Rightsizing',
    domain: 'FinOps',
    package_name: 'architecture.finops',
    description: 'Production compute deployment nodes must have autoscaling enabled.',
    enforces: 'autoscaling_enabled = true on all production compute nodes',
    severity: 'medium',
  },
  {
    name: 'Cryptography Key Management',
    domain: 'Security',
    package_name: 'architecture.security',
    description: 'Containers handling sensitive data must declare KMS, envelope, or HSM encryption.',
    enforces: 'encryption property on containers tagged sensitive, pii, phi, or pci',
    severity: 'high',
  },
  {
    name: 'API Gateway Integration',
    domain: 'Integration',
    package_name: 'architecture.integration',
    description: 'External-facing containers must be routed through an approved API gateway.',
    enforces: 'gateway routing for all external-facing containers',
    severity: 'high',
  },
];

export const CI_COMMANDS: CiCommand[] = [
  {
    name: 'Format Check',
    command: 'opa fmt --fail .',
    description: 'Ensures all policies adhere to strict Rego formatting standards.',
    failsBuild: true,
  },
  {
    name: 'Syntax Check',
    command: 'opa check .',
    description: 'Compiles policies to catch syntax errors or unresolved variables.',
    failsBuild: true,
  },
  {
    name: 'Unit Tests',
    command: 'opa test -v ./rules/',
    description: 'Runs all _test.rego files. Fails immediately if any test does not pass.',
    failsBuild: true,
  },
  {
    name: 'Coverage Analysis',
    command: 'opa test --coverage --format json ./rules/',
    description: 'Measures test coverage. Enforces 100% coverage for all governance rules.',
    failsBuild: false,
  },
];

export const SAMPLE_TEST = `package architecture.finops

import rego.v1

test_production_compute_with_autoscaling_allowed if {
    mock_input := {
        "environment": "Production",
        "deploymentNodes": [{
            "label": "Web Server",
            "technology": "Compute",
            "properties": {"autoscaling_enabled": "true"}
        }]
    }
    count(deny) == 0 with input as mock_input
}`;

export const DIRECTORY_STRUCTURE = `packages/policies/
├── package.json
├── data/
│   └── approved-unmanaged-dbs.json
├── rules/
│   ├── security/
│   │   ├── kms.rego
│   │   └── kms_test.rego
│   ├── integration/
│   │   ├── gateway.rego
│   │   └── gateway_test.rego
│   └── finops/
│       ├── rightsizing.rego
│       └── rightsizing_test.rego
└── scripts/
    └── build-bundle.sh`;
