import { Terminal, Bot, Server, Shield } from 'lucide-react';
import type { UtilityInfo } from '@/types/utility';

export const UTILITIES: UtilityInfo[] = [
  {
    id: 'cli',
    name: 'CLI Tool',
    tagline: 'Validate, scaffold, and manage architecture artifacts from the terminal',
    icon: Terminal,
    color: 'ring',
    status: 'available',
    version: '1.0.2',
    installCommand: 'npm install -g @muthub-ai/aac',
    packageName: '@muthub-ai/aac',
    links: [
      { label: 'npm', url: 'https://www.npmjs.com/package/@muthub-ai/aac' },
      { label: 'GitHub', url: 'https://github.com/muthub-ai/aac' },
    ],
    features: [
      'Schema validation against live enterprise schemas',
      'Project scaffolding with aac init',
      'Boilerplate artifact generation for all types',
      'ETag-based schema caching for offline use',
      'JSON output for CI/CD pipeline integration',
      'POSIX-compliant exit codes',
    ],
  },
  {
    id: 'ai-agent',
    name: 'AI Agent',
    tagline: 'Autonomous architecture review, compliance checking, and artifact generation',
    icon: Bot,
    color: 'chart-5',
    status: 'coming-soon',
    features: [
      'Automated architecture compliance review',
      'Natural language to YAML artifact generation',
      'Architecture drift detection and alerting',
      'Pattern recommendation engine',
      'Pull request review integration',
      'Context-aware architecture Q&A',
    ],
  },
  {
    id: 'mcp-server',
    name: 'MCP Server',
    tagline: 'Model Context Protocol server for IDE and AI tool integrations',
    icon: Server,
    color: 'success',
    status: 'available',
    version: '1.0.0',
    installCommand: 'npm install -g @muthub-ai/aac-mcp-server',
    packageName: '@muthub-ai/aac-mcp-server',
    links: [
      { label: 'GitHub', url: 'https://github.com/muthub-ai/aac' },
    ],
    features: [
      'Read system models, standards, waivers, and patterns via MCP resources',
      'Validate architecture YAML against enterprise schemas',
      'Run 5 enterprise compliance policy rules',
      'Scaffold waiver requests for architecture exceptions',
      'Guided workflows for system design and exception requests',
      'Works with Cursor, Claude Desktop, and any MCP-compatible IDE',
    ],
  },
  {
    id: 'policy-engine',
    name: 'Policy Engine',
    tagline: 'OPA Rego policies for enterprise architecture governance at scale',
    icon: Shield,
    color: 'chart-4',
    status: 'available',
    version: '1.0.0',
    links: [
      { label: 'GitHub', url: 'https://github.com/muthub-ai/aac' },
      { label: 'OPA Docs', url: 'https://www.openpolicyagent.org/docs/latest/' },
    ],
    features: [
      'Rego policies for security, integration, and FinOps governance',
      'Built-in OPA test framework with 100% coverage target',
      'CI/CD pipeline integration with format, syntax, and test checks',
      'Deployable OPA bundle for server or sidecar consumption',
      'Static enterprise reference data for cross-policy decisions',
      'Three governance domains: Security, Integration, FinOps',
    ],
  },
];

export const UTILITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ring: { bg: 'bg-ring/10', text: 'text-ring', border: 'border-ring/20' },
  'chart-5': { bg: 'bg-chart-5/10', text: 'text-chart-5', border: 'border-chart-5/20' },
  success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  'chart-4': { bg: 'bg-chart-4/10', text: 'text-chart-4', border: 'border-chart-4/20' },
};
