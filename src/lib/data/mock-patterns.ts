import yaml from 'js-yaml';
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
  INTERNAL_WEBAPP_CONTEXT,
  INTERNAL_WEBAPP_CONTAINER,
  PUBLIC_WEBAPP_CONTEXT,
  PUBLIC_WEBAPP_CONTAINER,
  FILE_TRANSFER_CONTEXT,
  FILE_TRANSFER_CONTAINER,
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
  // ────────────────────────────────────────────────────────────────────
  // 1. Internal API — Multi-regional VMs
  // ────────────────────────────────────────────────────────────────────
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
    architectureOverview:
      'This pattern deploys a multi-tier internal API across two or more Google Cloud regions using Compute Engine Managed Instance Groups (MIGs). Traffic is distributed by a global internal HTTP(S) load balancer that routes requests to the nearest healthy backend, minimising latency for internal consumers.\n\nEach region contains an independently auto-scaled MIG running containerised API workloads on hardened OS images. The MIGs are deployed into private subnets within a shared VPC, ensuring no public IP addresses are exposed. Cloud NAT provides controlled egress for dependency fetches and outbound calls.\n\nThe load balancer performs continuous health checks and automatically drains unhealthy instances. Global access is enabled so that clients in any region can reach the API through a single internal VIP, regardless of which region the backends reside in. This architecture is designed to withstand a full regional outage while maintaining API availability.',
    designConsiderations: [
      {
        title: 'Regional Independence',
        description: 'Each region operates as a self-contained failure domain. Instance templates, autoscaler policies, and health checks are configured per-region so that an outage in one region does not cascade to the other. Data replication between regions is handled asynchronously to avoid cross-region latency on the write path.',
      },
      {
        title: 'Autoscaling Strategy',
        description: 'CPU-based autoscaling targets 60% utilisation with a 90-second stabilisation window. Each MIG scales between 2 (minimum for HA) and 10 instances. For latency-sensitive APIs, consider custom metrics (e.g., request queue depth) exported via OpenTelemetry as the scaling signal.',
      },
      {
        title: 'Health Checking & Draining',
        description: 'HTTP health probes hit /healthz on port 8080 every 10 seconds with a 3-strike threshold. Connection draining is set to 60 seconds, ensuring in-flight requests complete before an instance is removed from the pool.',
      },
      {
        title: 'Security Boundary',
        description: 'All traffic flows over private RFC 1918 addresses within the VPC. Service-to-service authentication uses OAuth 2.0 with Workload Identity Federation or mTLS via Cloud Service Mesh. No API keys or static credentials are stored on instances — all secrets are fetched at boot from Secret Manager.',
      },
    ],
    productsUsed: [
      { name: 'Compute Engine MIG', role: 'Auto-scaled VM fleet running API containers' },
      { name: 'Internal HTTP(S) Load Balancer', role: 'Global L7 traffic distribution with URL maps and SSL termination' },
      { name: 'Cloud IAM', role: 'Service account authentication and least-privilege access' },
      { name: 'Secret Manager', role: 'Secure storage for API keys, certificates, and credentials' },
      { name: 'Cloud Monitoring', role: 'Metrics, dashboards, SLI/SLO tracking, and alerting' },
      { name: 'Cloud Logging', role: 'Centralised structured log aggregation and analysis' },
      { name: 'Cloud NAT', role: 'Controlled outbound egress for private instances' },
    ],
    nonFunctionalRequirements: [
      { metric: 'Availability', target: '99.95% (multi-region active-active)' },
      { metric: 'Latency (p99)', target: '< 150 ms intra-region, < 300 ms cross-region' },
      { metric: 'Recovery Time Objective', target: '< 60 seconds (automatic failover)' },
      { metric: 'Recovery Point Objective', target: '0 (stateless API tier)' },
      { metric: 'Max Throughput', target: '10,000 RPS per region (auto-scaled)' },
      { metric: 'Encryption', target: 'TLS 1.3 in transit, CMEK at rest' },
    ],
    constraints: [
      'Requires a shared VPC with at least two regional subnets provisioned by the network team',
      'Instance templates must use approved hardened OS images from the golden image pipeline',
      'Cross-region data replication is not included — consuming services must handle eventual consistency',
      'Maximum of 10 instances per MIG; higher scale requires quota increase approval',
      'Global access on the load balancer adds a small latency overhead (~2 ms) for cross-region routing',
    ],
    costProfile:
      'Medium-High. Primary cost drivers are Compute Engine instances (minimum 4 VMs across 2 regions), internal load balancer forwarding rules, and inter-region network egress. Reserved instances or committed use discounts can reduce compute costs by 30-55%. Estimated monthly cost: $1,200–$3,500 depending on instance types and traffic volume.',
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
    docsUrl: 'https://muthub-ai.github.io/aac/patterns/internal-api-multiregional.html',
    downloads: 1_842,
    stars: 4.7,
    diagrams: [
      { label: 'System Context', plantumlSource: INTERNAL_API_CONTEXT },
      { label: 'Container', plantumlSource: INTERNAL_API_CONTAINER },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  // 2. Enterprise Data Warehouse with BigQuery
  // ────────────────────────────────────────────────────────────────────
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
    architectureOverview:
      'This pattern establishes a modern enterprise data warehouse on Google BigQuery with a layered architecture separating ingestion, processing, serving, and consumption tiers.\n\nThe ingestion layer accepts both real-time event streams via Cloud Pub/Sub and batch file loads from Cloud Storage. Data flows through Cloud Dataflow (Apache Beam) pipelines for cleansing, deduplication, and transformation before landing in partitioned and clustered BigQuery datasets.\n\ndbt handles the semantic modelling layer, producing well-tested dimensional models, incremental materializations, and automated documentation. The consumption layer exposes data through Looker for self-service BI, BigQuery ML for in-warehouse predictive analytics, and authorized views for governed data sharing across organizational boundaries.\n\nIAM column-level security with policy tags ensures PII and sensitive fields are protected at the field level, while Data Catalog provides metadata management, lineage tracking, and data discovery across the entire warehouse.',
    designConsiderations: [
      {
        title: 'Partitioning & Clustering',
        description: 'All fact tables are partitioned by ingestion_time (daily granularity) and clustered by the two most common filter columns (typically customer_id and region). This reduces query scan volume by 80-95% for typical analytic queries and directly lowers on-demand query costs.',
      },
      {
        title: 'Cost Management',
        description: 'On-demand pricing is used for development and ad-hoc queries. Production workloads use BigQuery Editions with autoscaling slots to provide predictable pricing. Slot reservations are sized at baseline load with burst capacity for peak hours.',
      },
      {
        title: 'Data Quality',
        description: 'dbt tests run on every pipeline execution to enforce not-null constraints, referential integrity, accepted value ranges, and row-count thresholds. Failed tests trigger Cloud Monitoring alerts and block downstream materializations.',
      },
      {
        title: 'Data Governance',
        description: 'Policy tags are applied at the column level to classify PII (name, email, SSN) and financial data. IAM conditions enforce that only authorized roles can access tagged columns. All access is logged to Cloud Audit Logs for compliance reporting.',
      },
    ],
    productsUsed: [
      { name: 'BigQuery', role: 'Serverless data warehouse with columnar storage and SQL engine' },
      { name: 'Cloud Pub/Sub', role: 'Real-time event streaming ingestion at scale' },
      { name: 'Cloud Dataflow', role: 'Managed Apache Beam ETL/ELT pipeline execution' },
      { name: 'Cloud Storage', role: 'Raw and curated data lake zones' },
      { name: 'BigQuery ML', role: 'In-warehouse ML model training and prediction' },
      { name: 'Looker', role: 'Self-service BI dashboards and governed data explores' },
      { name: 'Data Catalog', role: 'Metadata management, lineage, and discovery' },
      { name: 'Cloud IAM', role: 'Column-level security via policy tags' },
    ],
    nonFunctionalRequirements: [
      { metric: 'Availability', target: '99.99% (BigQuery SLA)' },
      { metric: 'Query Latency (p95)', target: '< 10 seconds for standard analytic queries' },
      { metric: 'Data Freshness', target: '< 5 minutes (streaming), < 1 hour (batch)' },
      { metric: 'Storage Scale', target: 'Petabyte-scale with automatic tiering' },
      { metric: 'Concurrent Users', target: '500+ concurrent Looker/SQL users' },
      { metric: 'Data Retention', target: '7 years (long-term storage tier)' },
    ],
    constraints: [
      'All source systems must publish events to Pub/Sub or land files in Cloud Storage — direct database connections are not supported',
      'dbt models must pass all quality tests before promotion to the serving layer',
      'Column-level security policy tags must be applied during the data modelling phase, not retroactively',
      'BigQuery slot reservations require capacity planning approval from FinOps',
      'Cross-region dataset replication is not enabled by default — requires explicit configuration for DR',
    ],
    costProfile:
      'Medium. BigQuery on-demand pricing charges $6.25/TB scanned; Editions autoscaling slots provide cost predictability for production loads. Dataflow costs scale with worker count and duration. Storage costs decrease automatically after 90 days of no edits (long-term storage pricing at 50% discount). Estimated monthly cost: $2,000–$8,000 depending on query volume and data size.',
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
    docsUrl: 'https://muthub-ai.github.io/aac/patterns/data-platform-bq.html',
    downloads: 3_215,
    stars: 4.9,
    diagrams: [
      { label: 'System Context', plantumlSource: DATA_PLATFORM_CONTEXT },
      { label: 'Container', plantumlSource: DATA_PLATFORM_CONTAINER },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  // 3. AI-ML Model Deployment & Inferencing
  // ────────────────────────────────────────────────────────────────────
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
    architectureOverview:
      'This pattern provides a production-grade ML model serving infrastructure built on Vertex AI. It supports the complete model lifecycle from registry to endpoint deployment, canary rollouts, and continuous monitoring.\n\nTrained model artifacts are stored in the Vertex AI Model Registry with full version lineage. Deployments target managed Vertex AI Endpoints that support traffic splitting — enabling canary releases where a new model version serves a configurable percentage of traffic (e.g., 10%) alongside the stable version (90%).\n\nEach model version runs in its own serving container (TensorFlow Serving, PyTorch Serve, or custom) on dedicated compute with optional GPU acceleration. The endpoint auto-scales replicas based on request load, scaling from 1 to 20 instances with zero downtime.\n\nThe operations layer includes continuous model monitoring that detects data drift, feature skew, and prediction quality degradation. A fully automated ML CI/CD pipeline triggers retraining when quality thresholds are breached, validates the new model, and performs blue-green deployments.',
    designConsiderations: [
      {
        title: 'Model Serving Strategy',
        description: 'Online prediction endpoints are used for real-time, low-latency inference (< 100 ms). For batch scoring use cases, Vertex AI Batch Prediction jobs process large datasets asynchronously. The choice depends on latency requirements and request volume patterns.',
      },
      {
        title: 'Traffic Splitting & Canary Releases',
        description: 'New model versions are deployed with 10% traffic allocation for A/B evaluation. If quality metrics (accuracy, latency p99, error rate) meet thresholds after a 24-hour bake period, traffic is gradually ramped to 100%. Rollback is automatic if metrics degrade.',
      },
      {
        title: 'Feature Serving',
        description: 'The Vertex AI Feature Store provides low-latency online serving of pre-computed features. This ensures training-serving consistency (avoiding training-serving skew) and reduces inference-time compute by caching expensive feature transformations.',
      },
      {
        title: 'GPU Acceleration',
        description: 'Models requiring GPU acceleration are deployed on NVIDIA T4 or A100 nodes. GPU utilisation is monitored to right-size accelerator allocation. For cost optimisation, consider CPU-only serving for smaller models where inference latency is not GPU-bound.',
      },
    ],
    productsUsed: [
      { name: 'Vertex AI Endpoints', role: 'Managed prediction endpoints with autoscaling and traffic splitting' },
      { name: 'Vertex AI Model Registry', role: 'Versioned model artifact storage with lineage tracking' },
      { name: 'Vertex AI Feature Store', role: 'Low-latency online feature serving for inference' },
      { name: 'Vertex AI Model Monitoring', role: 'Continuous drift detection and quality alerting' },
      { name: 'Cloud Build + Vertex Pipelines', role: 'Automated ML CI/CD for training, validation, and deployment' },
      { name: 'Cloud Storage', role: 'Model artifact and training data storage' },
      { name: 'Cloud Monitoring', role: 'Endpoint performance metrics and SLO dashboards' },
    ],
    nonFunctionalRequirements: [
      { metric: 'Inference Latency (p99)', target: '< 100 ms (online prediction)' },
      { metric: 'Availability', target: '99.9% (managed endpoint SLA)' },
      { metric: 'Autoscale Range', target: '1–20 replicas per model version' },
      { metric: 'Canary Bake Period', target: '24 hours before full rollout' },
      { metric: 'Model Retraining SLA', target: '< 4 hours from drift detection to deployment' },
      { metric: 'Data Drift Detection', target: 'Continuous monitoring with 1-hour evaluation window' },
    ],
    constraints: [
      'Model artifacts must be registered in the Model Registry with proper versioning before deployment',
      'GPU-accelerated endpoints require quota approval for NVIDIA T4/A100 nodes in the target region',
      'All prediction requests must be authenticated via service accounts — public endpoints are not permitted',
      'Feature Store entities must be pre-populated before model deployment (no lazy feature computation)',
      'Maximum model size for online serving is 10 GB; larger models require custom container optimisations',
    ],
    costProfile:
      'High. Primary cost drivers are compute instances (especially GPU-equipped nodes), sustained endpoint uptime, and Feature Store online serving. Costs scale linearly with prediction QPS. NVIDIA T4 nodes cost ~$0.35/hr; A100 nodes ~$2.93/hr. Estimated monthly cost: $3,000–$15,000 depending on GPU usage and traffic volume.',
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
    docsUrl: 'https://muthub-ai.github.io/aac/patterns/aiml-model-inference.html',
    downloads: 726,
    stars: 4.3,
    diagrams: [
      { label: 'System Context', plantumlSource: AIML_CONTEXT },
      { label: 'Container', plantumlSource: AIML_CONTAINER },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  // 4. Internal Web Application
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'internal-web-application',
    version: '1.3.0',
    name: 'Internal Web Application',
    description:
      'Secure internal-facing web application hosted on Cloud Run behind Identity-Aware Proxy (IAP) for zero-trust employee access with corporate SSO, private VPC networking, and managed backing services.',
    category: 'compute',
    tags: ['Cloud Run', 'IAP', 'Web Application', 'Private Cloud', 'SSO'],
    exposure: 'internal',
    icon: 'Globe',
    color: 'tab-active',
    architectureOverview:
      'This pattern provides a production-ready architecture for internal web applications accessible only to authenticated employees via Google Cloud Identity-Aware Proxy (IAP). It follows a zero-trust security model where every request is verified regardless of network location.\n\nThe web application is deployed as a serverless container on Cloud Run, which auto-scales from zero to 50 instances based on request load. IAP sits in front of Cloud Run and enforces context-aware access policies — verifying user identity (via corporate SSO/SAML 2.0), device posture, and IP allowlists before forwarding any request.\n\nThe application follows a standard 3-tier architecture: a React single-page application served as static assets, a Node.js/Express backend API handling business logic, and managed data services (Cloud SQL PostgreSQL for persistence, Memorystore Redis for sessions and caching). All backing services are accessed through a Serverless VPC Access connector, ensuring traffic never leaves the private network.\n\nCloud Monitoring provides application performance metrics, uptime checks, and custom SLO dashboards. All access events are logged for security audit compliance.',
    designConsiderations: [
      {
        title: 'Zero-Trust Access Model',
        description: 'IAP verifies every request with cryptographic JWT tokens containing user identity and device context. There is no implicit trust based on network location — even requests originating from the corporate network must pass IAP authentication. This eliminates the need for traditional VPN-based access.',
      },
      {
        title: 'Serverless VPC Connectivity',
        description: 'Cloud Run connects to Cloud SQL and Memorystore via a Serverless VPC Access connector using /28 subnet allocation. The connector supports up to 1 Gbps throughput per instance. For high-throughput workloads, consider Direct VPC Egress as an alternative.',
      },
      {
        title: 'Session Management',
        description: 'User sessions are stored in Memorystore (Redis) rather than in-memory, enabling zero-downtime Cloud Run instance cycling. Session TTL aligns with the IAP session timeout (default 1 hour) to prevent session desync.',
      },
      {
        title: 'Database Connection Pooling',
        description: 'Cloud Run instances use the Cloud SQL Auth Proxy sidecar for IAM-based database authentication. Connection pooling is configured with a max of 5 connections per instance to prevent exhausting the Cloud SQL connection limit during autoscale spikes.',
      },
    ],
    productsUsed: [
      { name: 'Cloud Run', role: 'Serverless container hosting with auto-scaling 0–50 instances' },
      { name: 'Identity-Aware Proxy (IAP)', role: 'Zero-trust access gateway with SSO and device posture verification' },
      { name: 'Cloud SQL (PostgreSQL)', role: 'Managed relational database with HA regional failover' },
      { name: 'Memorystore (Redis)', role: 'Session store and application cache' },
      { name: 'Serverless VPC Access', role: 'Private network connectivity from Cloud Run to VPC resources' },
      { name: 'Secret Manager', role: 'Application secrets, DB credentials, and API keys' },
      { name: 'Cloud Monitoring', role: 'Application metrics, uptime checks, and SLO dashboards' },
    ],
    nonFunctionalRequirements: [
      { metric: 'Availability', target: '99.95% (Cloud Run SLA + IAP SLA)' },
      { metric: 'Latency (p95)', target: '< 200 ms for page loads' },
      { metric: 'Autoscale Range', target: '0–50 instances (scale-to-zero enabled)' },
      { metric: 'Cold Start', target: '< 3 seconds (container startup)' },
      { metric: 'Concurrent Users', target: '500+ simultaneous authenticated users' },
      { metric: 'Encryption', target: 'TLS 1.3 in transit, CMEK at rest for Cloud SQL' },
    ],
    constraints: [
      'Requires corporate identity provider integration (Google Workspace, Okta, Azure AD) for IAP SSO',
      'Cloud Run container images must be stored in Artifact Registry within the same project or a shared registry',
      'VPC connector subnet must be a dedicated /28 CIDR not used by other resources',
      'Cloud SQL instance must be in the same region as the Cloud Run service for low-latency access',
      'Maximum request timeout is 60 minutes (Cloud Run limit) — long-running jobs should use Cloud Tasks',
    ],
    costProfile:
      'Low-Medium. Cloud Run charges only for active request processing time (scale-to-zero eliminates idle costs). Cloud SQL is the largest fixed cost component (~$50–200/month for a db-f1-micro to db-custom-2-8192 instance). Memorystore basic tier starts at ~$30/month. Estimated monthly cost: $150–$600 for moderate internal workloads.',
    advantages: [
      'Zero-trust access via IAP eliminates VPN dependency',
      'Serverless auto-scaling from zero to handle burst traffic',
      'Fully managed backing services (Cloud SQL, Memorystore) reduce ops burden',
      'Corporate SSO integration with SAML 2.0 and OIDC',
    ],
    considerations: [
      'Cold start latency for Cloud Run instances after scale-to-zero',
      'VPC connector throughput limits for high-volume database workloads',
      'IAP session timeout configuration must align with SSO provider',
      'Cloud SQL connection pooling required for concurrent request spikes',
    ],
    gettingStarted: [
      { step: 1, title: 'Create a VPC network with private subnets and configure a Serverless VPC Access connector.' },
      { step: 2, title: 'Provision Cloud SQL (PostgreSQL) and Memorystore (Redis) instances within the VPC.' },
      { step: 3, title: 'Containerize the web application and deploy to Cloud Run with the VPC connector attached.' },
      { step: 4, title: 'Enable Identity-Aware Proxy on the Cloud Run service and configure SSO with your identity provider.' },
      { step: 5, title: 'Set up Cloud Monitoring dashboards, uptime checks, and alerting policies.' },
    ],
    maturity: 'Production Ready',
    maintainerTeam: 'Platform Engineering',
    docsUrl: 'https://muthub-ai.github.io/aac/patterns/internal-web-application.html',
    downloads: 2_456,
    stars: 4.6,
    diagrams: [
      { label: 'System Context', plantumlSource: INTERNAL_WEBAPP_CONTEXT },
      { label: 'Container', plantumlSource: INTERNAL_WEBAPP_CONTAINER },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  // 5. Public Web Application
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'public-web-application',
    version: '2.0.0',
    name: 'Public Web Application',
    description:
      'Globally distributed public-facing web application with Cloud CDN for edge caching, Cloud Armor WAF for DDoS and OWASP protection, external HTTPS load balancing, and Cloud Run for serverless container hosting with automatic scaling.',
    category: 'compute',
    tags: ['Cloud Run', 'CDN', 'Cloud Armor', 'Web Application', 'Public Facing'],
    exposure: 'external',
    icon: 'Globe',
    color: 'tab-active',
    architectureOverview:
      'This pattern delivers a globally available public web application with enterprise-grade security, performance, and scalability. The architecture places Google Cloud\'s edge network at the front — handling SSL termination, CDN caching, and WAF filtering before requests reach the origin.\n\nIncoming HTTPS traffic hits the external global load balancer, which terminates TLS 1.3 with managed SSL certificates. Cloud Armor evaluates every request against OWASP CRS 3.3 rules, geo-restriction policies, rate limits (10K req/min per IP), and adaptive protection powered by ML-based anomaly detection.\n\nClean traffic passes through Cloud CDN, which caches static assets at 100+ edge PoPs worldwide with a 98% cache hit ratio for typical web applications. Cache misses are forwarded to the origin — a Next.js SSR application running on Cloud Run with Incremental Static Regeneration (ISR).\n\nThe backend tier consists of a separate Cloud Run API service handling business logic, Cloud Run Jobs for async task processing, and a data tier with Cloud SQL (PostgreSQL), Memorystore (Redis), and Cloud Storage. Firebase Authentication provides user identity management with email, social login, and multi-factor authentication support.',
    designConsiderations: [
      {
        title: 'Edge Caching Strategy',
        description: 'Cloud CDN is configured with Cache-Control headers set at the application level. Static assets (JS, CSS, images) use immutable content hashing with 30-day TTL. Dynamic pages use short TTLs (60s) with stale-while-revalidate. Cache key policies exclude query parameters that do not affect content.',
      },
      {
        title: 'DDoS & WAF Protection',
        description: 'Cloud Armor provides multi-layered protection: L3/L4 volumetric DDoS mitigation at the Google edge, L7 OWASP CRS rules for application-layer attacks, IP reputation-based blocking, and adaptive protection that auto-detects and mitigates novel attack patterns. Rate limiting is applied per-IP to prevent abuse.',
      },
      {
        title: 'Frontend / Backend Separation',
        description: 'The Next.js frontend and API backend are deployed as separate Cloud Run services with independent scaling profiles. The frontend optimises for render latency (1 vCPU, 512 MB), while the API optimises for concurrent request handling (concurrency 80). This separation allows independent deployment cycles.',
      },
      {
        title: 'Authentication Flow',
        description: 'Firebase Authentication handles the user identity lifecycle — sign-up, sign-in (email, Google, Apple, GitHub), MFA enrollment, and session management. The API service validates Firebase ID tokens using the Admin SDK. Token refresh is handled transparently by the client SDK.',
      },
    ],
    productsUsed: [
      { name: 'External HTTPS Load Balancer', role: 'Global L7 load balancing with managed SSL certificates' },
      { name: 'Cloud CDN', role: 'Global edge caching at 100+ PoPs' },
      { name: 'Cloud Armor', role: 'WAF with OWASP CRS, DDoS protection, and adaptive threat detection' },
      { name: 'Cloud Run', role: 'Serverless container hosting for frontend SSR and backend API' },
      { name: 'Cloud SQL (PostgreSQL)', role: 'Managed relational database with HA failover and read replicas' },
      { name: 'Memorystore (Redis)', role: 'Session store, API cache, and rate limit counters' },
      { name: 'Cloud Storage', role: 'User uploads, media assets, and static file hosting' },
      { name: 'Firebase Authentication', role: 'User identity management with MFA support' },
    ],
    nonFunctionalRequirements: [
      { metric: 'Availability', target: '99.99% (global load balancer SLA)' },
      { metric: 'Time to First Byte (p95)', target: '< 200 ms (CDN cache hit)' },
      { metric: 'CDN Cache Hit Ratio', target: '> 95% for static assets' },
      { metric: 'DDoS Mitigation', target: 'Automatic, < 10 seconds detection-to-mitigation' },
      { metric: 'Autoscale Range', target: '0–100 instances per Cloud Run service' },
      { metric: 'Max Concurrent Users', target: '50,000+' },
      { metric: 'Encryption', target: 'TLS 1.3 everywhere, CMEK for data at rest' },
    ],
    constraints: [
      'Cloud Armor advanced features (adaptive protection, bot management) require Cloud Armor Enterprise subscription',
      'Cloud CDN does not cache responses with Set-Cookie headers — session-dependent content bypasses cache',
      'Next.js ISR pages have a minimum revalidation interval of 1 second',
      'Cloud Run request timeout is limited to 60 minutes — WebSocket connections require alternative solutions',
      'Firebase Authentication free tier allows 10K verifications/month; paid plan required beyond that',
      'Multi-region Cloud SQL replication requires custom setup — not included in this base pattern',
    ],
    costProfile:
      'Medium. Cloud CDN significantly reduces origin load (and cost) by serving 95%+ of static requests from edge cache. Cloud Run charges are usage-based with scale-to-zero. Cloud Armor standard rules are included with the load balancer; advanced features add ~$200/month. Estimated monthly cost: $500–$3,000 depending on traffic volume and Cloud Armor tier.',
    advantages: [
      'Global edge caching via Cloud CDN delivers sub-100ms latency worldwide',
      'Cloud Armor WAF provides enterprise-grade DDoS and OWASP top-10 protection',
      'Serverless compute auto-scales 0 to 100 instances with zero cluster management',
      'TLS 1.3 termination at the load balancer with managed SSL certificates',
    ],
    considerations: [
      'CDN cache invalidation requires careful Cache-Control header strategy',
      'Cloud Armor advanced rules (adaptive protection) incur additional cost',
      'SSR cold starts impact Time-to-First-Byte under sudden traffic spikes',
      'Multi-region database replication needed for true global HA',
    ],
    gettingStarted: [
      { step: 1, title: 'Configure an external HTTPS load balancer with managed SSL certificates and URL maps.' },
      { step: 2, title: 'Enable Cloud CDN on the backend service with appropriate cache TTLs and cache key policies.' },
      { step: 3, title: 'Create Cloud Armor security policies with OWASP CRS rules, rate limiting, and geo-restrictions.' },
      { step: 4, title: 'Deploy the frontend (Next.js SSR) and backend API as separate Cloud Run services.' },
      { step: 5, title: 'Provision Cloud SQL, Memorystore, and Cloud Storage for the data tier with VPC connectors.' },
      { step: 6, title: 'Integrate Firebase Authentication for user sign-in and set up Cloud Monitoring with SLO alerting.' },
    ],
    maturity: 'Production Ready',
    maintainerTeam: 'Web Platform',
    docsUrl: 'https://muthub-ai.github.io/aac/patterns/public-web-application.html',
    downloads: 4_130,
    stars: 4.8,
    diagrams: [
      { label: 'System Context', plantumlSource: PUBLIC_WEBAPP_CONTEXT },
      { label: 'Container', plantumlSource: PUBLIC_WEBAPP_CONTAINER },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  // 6. Managed File Transfer
  // ────────────────────────────────────────────────────────────────────
  {
    id: 'managed-file-transfer',
    version: '1.1.0',
    name: 'Managed File Transfer',
    description:
      'Secure B2B file exchange platform using Cloud Storage, Storage Transfer Service, and a managed SFTP gateway with automated validation, PII scanning, format transformation, and immutable audit logging.',
    category: 'networking',
    tags: ['SFTP', 'Cloud Storage', 'File Transfer', 'B2B', 'Data Integration'],
    exposure: 'external',
    icon: 'Network',
    color: 'chart-1',
    architectureOverview:
      'This pattern implements a fully managed file transfer platform for secure B2B data exchange with external partners. It replaces traditional self-hosted SFTP servers with a cloud-native architecture that provides automated processing, compliance scanning, and immutable audit trails.\n\nPartners connect via two ingress channels: a managed SFTP gateway (Cloud Run + OpenSSH) with per-partner chroot isolation and public key authentication, or an HTTPS Upload API that supports signed-URL resumable uploads up to 5 TB. Both channels land files in a Cloud Storage landing zone bucket.\n\nFile arrival triggers an event-driven processing pipeline via Eventarc. The File Validation Service performs schema validation (CSV headers, XML/JSON schemas), checksum verification, file-type detection, and malware scanning via ClamAV. Cloud DLP then scans for PII and applies automatic redaction rules.\n\nValid files flow to a Cloud Dataflow transform pipeline for format conversion (CSV to Parquet, XML to JSON), decompression, and data enrichment. Processed files land in a curated zone bucket ready for downstream consumption. The archive zone uses Coldline storage with lifecycle policies for long-term retention.\n\nEvery file operation — upload, validation, transformation, access — is logged to an immutable audit trail in Cloud Logging and BigQuery, satisfying SOX, HIPAA, and PCI-DSS compliance requirements.',
    designConsiderations: [
      {
        title: 'Partner Isolation',
        description: 'Each partner gets a dedicated chroot directory on the SFTP gateway, a unique SSH key pair, and IP allowlist rules. This prevents cross-partner data access and provides per-partner throughput monitoring. Partner credentials are managed via Secret Manager with automated rotation.',
      },
      {
        title: 'Event-Driven Processing',
        description: 'Eventarc triggers on GCS object.finalize events provide immediate file processing without polling. The trigger delivers exactly-once semantics using Cloud Functions v2 with automatic retries. Processing latency from upload to validated output is typically under 5 minutes for files up to 1 GB.',
      },
      {
        title: 'PII Detection & Redaction',
        description: 'Cloud DLP inspection templates are configured to detect 50+ PII types including SSN, credit card numbers, email addresses, and phone numbers. Detected PII is automatically redacted (replaced with tokens) before files enter the processed zone. DLP findings are logged for compliance reporting.',
      },
      {
        title: 'Storage Lifecycle Management',
        description: 'Files move through three storage tiers: landing zone (Standard, 7-day retention), processed zone (Standard, indefinite), and archive zone (Coldline, 90-day minimum). Lifecycle policies automatically transition files between tiers. Object versioning on the landing zone provides protection against accidental overwrites.',
      },
    ],
    productsUsed: [
      { name: 'Cloud Storage', role: 'Multi-tier file storage (landing, processed, archive zones)' },
      { name: 'Cloud Run', role: 'SFTP gateway and HTTPS upload API hosting' },
      { name: 'Eventarc', role: 'Event-driven pipeline orchestration on file arrival' },
      { name: 'Cloud DLP', role: 'Automated PII detection and redaction' },
      { name: 'Cloud Dataflow', role: 'File format conversion and data transformation' },
      { name: 'Storage Transfer Service', role: 'Scheduled and on-demand cross-bucket transfers' },
      { name: 'Cloud KMS', role: 'Customer-managed encryption keys (CMEK) for data at rest' },
      { name: 'Cloud Logging + BigQuery', role: 'Immutable audit trail and compliance reporting' },
    ],
    nonFunctionalRequirements: [
      { metric: 'Processing Latency', target: '< 5 minutes (upload to validated output for files < 1 GB)' },
      { metric: 'Max File Size', target: '5 TB (HTTPS resumable upload), 1 TB (SFTP)' },
      { metric: 'Throughput', target: '1 Gbps per SFTP gateway endpoint' },
      { metric: 'Availability', target: '99.95% (Cloud Storage SLA)' },
      { metric: 'Encryption', target: 'TLS 1.2+ in transit, CMEK (AES-256) at rest' },
      { metric: 'Audit Retention', target: '7 years (BigQuery long-term storage)' },
      { metric: 'PII Detection Accuracy', target: '> 99% for configured info types' },
    ],
    constraints: [
      'SFTP gateway requires a static external IP address — provisioned through Cloud NAT or a reserved IP',
      'Cloud DLP scanning adds 30–120 seconds per file depending on file size and complexity',
      'Coldline storage has a 90-day minimum storage duration — early deletion incurs charges',
      'Partner onboarding requires manual SSH key exchange and IP allowlist coordination (typically 2–5 business days)',
      'Dataflow pipeline workers require VPC access if transformations call internal services',
      'Maximum 10,000 Eventarc triggers per project — contact Google for quota increases for high-volume scenarios',
    ],
    costProfile:
      'Low-Medium. Cloud Storage (Standard) costs $0.020/GB/month; Coldline at $0.004/GB/month for archives. Cloud Run SFTP gateway costs are minimal for typical B2B volumes. Cloud DLP costs $1–3 per GB scanned. Dataflow costs depend on worker count and processing duration. Estimated monthly cost: $300–$2,000 depending on file volume and DLP scanning.',
    advantages: [
      'Managed SFTP gateway eliminates self-hosted server maintenance',
      'Automated DLP scanning catches PII before files reach downstream systems',
      'Event-driven processing pipeline handles files within minutes of upload',
      'Immutable audit trail satisfies SOX, HIPAA, and PCI-DSS compliance requirements',
    ],
    considerations: [
      'SFTP gateway throughput limited to 1 Gbps per endpoint',
      'Large file processing (>10 GB) requires Dataflow autoscaling tuning',
      'Partner onboarding requires SSH key exchange and IP allowlist coordination',
      'Coldline storage minimum 90-day retention increases archive costs for short-lived files',
    ],
    gettingStarted: [
      { step: 1, title: 'Create Cloud Storage buckets for landing, processed, and archive zones with appropriate lifecycle policies.' },
      { step: 2, title: 'Deploy the SFTP gateway on Cloud Run with partner-specific chroot directories and public key authentication.' },
      { step: 3, title: 'Configure Eventarc triggers on the landing zone bucket to invoke the file validation service.' },
      { step: 4, title: 'Set up Cloud DLP inspection templates for PII detection and automatic redaction rules.' },
      { step: 5, title: 'Deploy the Dataflow transform pipeline for file format conversion and data enrichment.' },
      { step: 6, title: 'Configure audit logging to Cloud Logging and BigQuery, and set up alerting for failed transfers.' },
    ],
    maturity: 'Beta',
    maintainerTeam: 'Integration Services',
    docsUrl: 'https://muthub-ai.github.io/aac/patterns/managed-file-transfer.html',
    downloads: 987,
    stars: 4.4,
    diagrams: [
      { label: 'System Context', plantumlSource: FILE_TRANSFER_CONTEXT },
      { label: 'Container', plantumlSource: FILE_TRANSFER_CONTAINER },
    ],
  },
];

// ── Generate yamlContent for every pattern ───────────────────────────
// Serializes the architecture-relevant fields into a clean YAML document
// matching the on-disk pattern.yaml schema.

function generatePatternYaml(p: PatternData): string {
  const doc = {
    pattern: {
      id: p.id,
      version: p.version,
      name: p.name,
      description: p.description,
      category: p.category,
      exposure: p.exposure,
      metadata: {
        owner_team: p.maintainerTeam,
        tags: p.tags,
      },
      products_used: p.productsUsed.map((pu) => ({
        name: pu.name,
        role: pu.role,
      })),
      non_functional_requirements: p.nonFunctionalRequirements.map((n) => ({
        metric: n.metric,
        target: n.target,
      })),
      design_considerations: p.designConsiderations.map((dc) => ({
        title: dc.title,
        description: dc.description,
      })),
      advantages: p.advantages,
      considerations: p.considerations,
      constraints: p.constraints,
      cost_profile: p.costProfile,
      getting_started: p.gettingStarted.map((gs) => ({
        step: gs.step,
        title: gs.title,
      })),
    },
  };
  return yaml.dump(doc, { lineWidth: 100, noRefs: true, sortKeys: false });
}

for (const p of MOCK_PATTERNS) {
  p.yamlContent = generatePatternYaml(p);
}
