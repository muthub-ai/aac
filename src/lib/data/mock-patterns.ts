import {
  Brain,
  BarChart3,
  Globe,
  Server,
  Database,
  MessageSquare,
  Network,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import type { PatternData, PatternCategory } from '@/types/pattern';
import {
  INTERNAL_API_CONTEXT,
  INTERNAL_API_CONTAINER,
  DATA_PLATFORM_CONTEXT,
  DATA_PLATFORM_CONTAINER,
  AIML_CONTEXT,
  AIML_CONTAINER,
} from './pattern-diagrams';

// ── Categories ───────────────────────────────────────────────────────

export const PATTERN_CATEGORIES: PatternCategory[] = [
  { id: 'ai-ml', label: 'AI + Machine Learning', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'api', label: 'API', icon: Globe },
  { id: 'compute', label: 'Compute', icon: Server },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'messaging', label: 'Messaging', icon: MessageSquare },
  { id: 'networking', label: 'Networking', icon: Network },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'storage', label: 'Storage', icon: HardDrive },
];

// ── Category header colors (Tailwind-compatible tokens) ──────────────

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'ai-ml': { bg: 'bg-chart-5/15', text: 'text-chart-5' },
  analytics: { bg: 'bg-chart-3/15', text: 'text-chart-3' },
  api: { bg: 'bg-ring/15', text: 'text-ring' },
  compute: { bg: 'bg-tab-active/15', text: 'text-tab-active' },
  database: { bg: 'bg-chart-2/15', text: 'text-chart-2' },
  messaging: { bg: 'bg-chart-4/15', text: 'text-chart-4' },
  networking: { bg: 'bg-chart-1/15', text: 'text-chart-1' },
  security: { bg: 'bg-warning/15', text: 'text-warning' },
  storage: { bg: 'bg-muted-foreground/15', text: 'text-muted-foreground' },
};

// ── Mock Patterns ────────────────────────────────────────────────────

export const MOCK_PATTERNS: PatternData[] = [
  {
    id: 'internal-api-multiregional',
    version: '2.1.0',
    name: 'Internal API Pattern — Multi-regional VMs',
    description:
      'Multi-regional deployment of internal APIs using Compute Engine Managed Instance Groups (MIGs) and Internal HTTP(S) Load Balancing for high availability and low latency.',
    category: 'compute',
    tags: ['Private Cloud', 'Compute Engine', 'Load Balancing', 'High Availability'],
    exposure: 'internal',
    icon: 'Server',
    color: 'tab-active',
    advantages: [
      'High availability across regions',
      'Localized low latency for internal clients',
      'Resilience against regional outages',
    ],
    considerations: [
      'Increased infrastructure cost',
      'Complexity in cross-region data replication',
      'Requires global VPC routing',
    ],
    gettingStarted: [
      { step: 1, title: 'Set up VPC network and subnets in at least two target regions.' },
      { step: 2, title: 'Create Compute Engine instance templates and regional Managed Instance Groups (MIGs).' },
      { step: 3, title: 'Configure a global internal HTTP(S) load balancer with global access enabled.' },
      { step: 4, title: 'Set up backend services, health checks, and autoscaling policies.' },
    ],
    maturity: 'Production Ready',
    maintainerTeam: 'Platform Infrastructure',
    docsUrl: 'https://aac.muthub.org/patterns/internal-api-multiregional',
    downloads: 1_842,
    stars: 4.7,
    diagrams: [
      { label: 'System Context', plantumlSource: INTERNAL_API_CONTEXT },
      { label: 'Container', plantumlSource: INTERNAL_API_CONTAINER },
    ],
  },
  {
    id: 'data-platform-bq',
    version: '1.4.0',
    name: 'Enterprise Data Warehouse with BigQuery',
    description:
      'Fully managed, serverless enterprise data warehouse architecture using BigQuery, decoupled storage/compute, and integrated ML capabilities.',
    category: 'database',
    tags: ['Analytics', 'Serverless', 'BigQuery', 'Data Warehouse'],
    exposure: 'internal',
    icon: 'Database',
    color: 'chart-2',
    advantages: [
      'Petabyte-scale analytics without infrastructure management',
      'Built-in BigQuery ML for predictive analytics',
      'Seamless integration with Cloud Storage and Dataflow',
    ],
    considerations: [
      'Query cost predictability (on-demand vs. capacity pricing)',
      'Requires strict partitioning/clustering for performance',
      'Data residency compliance',
    ],
    gettingStarted: [
      { step: 1, title: 'Set up a secure data ingestion pipeline via Cloud Pub/Sub or Cloud Storage.' },
      { step: 2, title: 'Transform data using ETL/ELT processes via Cloud Dataflow or dbt.' },
      { step: 3, title: 'Load processed data into partitioned and clustered BigQuery datasets.' },
      { step: 4, title: 'Implement IAM column-level security and expose data to BI tools like Looker.' },
    ],
    maturity: 'Production Ready',
    maintainerTeam: 'Data Engineering',
    docsUrl: 'https://aac.muthub.org/patterns/data-platform-bq',
    downloads: 3_215,
    stars: 4.9,
    diagrams: [
      { label: 'System Context', plantumlSource: DATA_PLATFORM_CONTEXT },
      { label: 'Container', plantumlSource: DATA_PLATFORM_CONTAINER },
    ],
  },
  {
    id: 'aiml-model-inference',
    version: '1.0.0',
    name: 'AI-ML Model Deployment & Inferencing',
    description:
      'Production-ready machine learning model serving using Vertex AI for real-time online inference, autoscaling, and A/B testing.',
    category: 'ai-ml',
    tags: ['Vertex AI', 'MLOps', 'Inference', 'Model Serving'],
    exposure: 'internal',
    icon: 'Brain',
    color: 'chart-5',
    advantages: [
      'Fully managed endpoints with automatic scaling',
      'Built-in traffic splitting for canary deployments',
      'Integrated model monitoring for data drift',
    ],
    considerations: [
      'Cold start latency for large models',
      'Endpoint compute costs (especially with GPUs)',
      'Strict IAM access controls for prediction routes',
    ],
    gettingStarted: [
      { step: 1, title: 'Upload the trained ML model artifact to the Vertex AI Model Registry.' },
      { step: 2, title: 'Create a dedicated Vertex AI Endpoint.' },
      { step: 3, title: 'Deploy the model to the endpoint, specifying the target machine type and accelerators (e.g., NVIDIA GPUs).' },
      { step: 4, title: 'Configure performance monitoring, logging, and establish operational runbooks.' },
    ],
    maturity: 'Beta',
    maintainerTeam: 'ML Platform',
    docsUrl: 'https://aac.muthub.org/patterns/aiml-model-inference',
    downloads: 726,
    stars: 4.3,
    diagrams: [
      { label: 'System Context', plantumlSource: AIML_CONTEXT },
      { label: 'Container', plantumlSource: AIML_CONTAINER },
    ],
  },
];
