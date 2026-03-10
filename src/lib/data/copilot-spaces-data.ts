import type { QuickStartStep } from '@/types/utility';

export interface CopilotSpace {
  name: string;
  purpose: string;
  sources: string[];
  instruction: string;
  spaceUrl: string;
}

export interface StrategicBenefit {
  title: string;
  description: string;
}

export interface RagStep {
  step: number;
  title: string;
  description: string;
}

export const QUICK_START_STEPS: QuickStartStep[] = [
  {
    step: 1,
    title: 'Create a Space',
    description: 'Navigate to github.com/copilot/spaces and create an organization-owned Space for your architecture domain.',
    command: 'https://github.com/copilot/spaces',
  },
  {
    step: 2,
    title: 'Attach Sources',
    description: 'Add specific folders from your muthub-ai/aac repository. GitHub automatically builds a semantic search index.',
    command: 'Attach /patterns and /standards folders from muthub-ai/aac',
  },
  {
    step: 3,
    title: 'IDE Integration',
    description: 'Configure the GitHub MCP server in VS Code or Cursor to access Spaces directly in your editor.',
    command: 'gh copilot spaces list',
  },
];

export const COPILOT_SPACES: CopilotSpace[] = [
  {
    name: 'Data & AI Architecture Standards',
    purpose: 'ML pipeline architectures and Vertex AI deployment code that adhere to data governance and model monitoring standards.',
    sources: [
      'standards/ml-model-governance.yaml',
      'standards/generative-ai-usage.yaml',
      'standards/data-platform-warehousing.yaml',
      'patterns/aiml-model-inference/',
      'patterns/data-platform-bq/',
    ],
    instruction: 'You are an Enterprise Architect AI specializing in Data and AI systems. Generate ML pipeline architectures, Vertex AI deployment code, and BigQuery configurations that strictly adhere to the attached data governance and model monitoring standards. Never suggest unmanaged databases or unapproved model serving frameworks.',
    spaceUrl: 'https://github.com/copilot/spaces/muthub-ai/2',
  },
  {
    name: 'Infrastructure Resilience Patterns',
    purpose: 'Terraform for active-active multi-region deployments with strict autoscaling and encryption rules.',
    sources: [
      'standards/multi-region-resiliency.yaml',
      'standards/cloud-rightsizing.yaml',
      'standards/infrastructure-as-code.yaml',
      'standards/cryptography-key-management.yaml',
      'patterns/internal-api-multiregional/',
    ],
    instruction: 'You are an Enterprise Architect AI specializing in cloud infrastructure resilience. Generate Terraform modules and deployment configurations for active-active multi-region architectures with strict autoscaling rules, KMS encryption, and infrastructure-as-code best practices. All resources must comply with the attached standards.',
    spaceUrl: 'https://github.com/copilot/spaces/muthub-ai/1',
  },
];

export const RAG_ARCHITECTURE: RagStep[] = [
  {
    step: 1,
    title: 'Continuous Indexing',
    description: 'GitHub automatically builds and maintains a semantic search index of attached repository folders. As standards merge to main, the index updates instantly.',
  },
  {
    step: 2,
    title: 'Custom Instructions',
    description: 'Each Space has a permanent system prompt that constrains the AI to your enterprise context. The model only recommends approved tools, patterns, and encryption methods.',
  },
  {
    step: 3,
    title: 'Contextual Grounding',
    description: 'When an engineer asks a question, Copilot searches the indexed Space, retrieves the exact YAML patterns or standards required, and appends them to the prompt before sending to the language model.',
  },
];

export const STRATEGIC_BENEFITS: StrategicBenefit[] = [
  {
    title: 'Eliminates Hallucination',
    description: 'Grounding Copilot in your specific Space forces the model to recommend only approved tools and patterns. No more suggestions for unlicensed or non-compliant technologies.',
  },
  {
    title: 'Zero Context Switching',
    description: 'Standards are surfaced directly in the IDE chat window during the coding phase. Engineers never leave their workflow to search documentation.',
  },
  {
    title: 'Accelerates Onboarding',
    description: 'New engineers ask the Space to generate compliant configurations instead of memorizing 50-page standards documents. The AI executes requirements perfectly.',
  },
  {
    title: 'Reduces ARB Rejections',
    description: 'Code generated using the exact schemas your CI/CD pipeline validates against. First-pass merge success rate increases dramatically.',
  },
];

export const IDE_MCP_CONFIG = `{
  "mcpServers": {
    "github": {
      "command": "gh",
      "args": ["copilot", "mcp-server"]
    }
  }
}`;

export const EXAMPLE_PROMPT = `Using the Copilot Space "Data & AI Architecture Standards",
write the Terraform for a compliant BigQuery data pipeline
with KMS encryption and model monitoring enabled.`;

export const ACCESS_CONTROL_ROLES: Array<{ role: string; audience: string; permissions: string }> = [
  {
    role: 'Viewer',
    audience: 'All developers',
    permissions: 'Query the Space from IDE or web, view attached sources and instructions',
  },
  {
    role: 'Editor',
    audience: 'Architecture team',
    permissions: 'Modify sources, update custom instructions, manage Space settings',
  },
];
