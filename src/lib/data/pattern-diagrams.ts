// PlantUML diagram sources for each pattern — context and container views
// Rendered at runtime via plantuml-encoder → https://www.plantuml.com/plantuml/svg/{encoded}

// ── Internal API Multi-regional ──────────────────────────────────────

export const INTERNAL_API_CONTEXT = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title System Context \u2014 Internal API Multi-regional VMs

Person(api_consumer, "Internal API Consumer", "Backend services and microservices that consume internal APIs")
Person(platform_eng, "Platform Engineer", "Provisions and manages infrastructure")
Person(sre, "SRE Team", "Monitors reliability and incident response")

System(internal_api, "Internal API Platform", "Multi-regional API deployment using Compute Engine MIGs with Internal HTTP(S) Load Balancing for HA and low latency")

System_Ext(cloud_iam, "Cloud IAM", "Identity and access management for service-to-service auth")
System_Ext(cloud_monitoring, "Cloud Monitoring", "Metrics, dashboards, and alerting")
System_Ext(cloud_logging, "Cloud Logging", "Centralized log aggregation and analysis")
System_Ext(secret_manager, "Secret Manager", "API keys, certificates, and credentials")

Rel(api_consumer, internal_api, "Sends API requests", "gRPC / REST over Internal LB")
Rel(platform_eng, internal_api, "Provisions and configures", "Terraform / gcloud CLI")
Rel(sre, cloud_monitoring, "Monitors SLIs/SLOs", "Dashboards & Alerts")
Rel(internal_api, cloud_iam, "Authenticates requests", "OAuth 2.0 / mTLS")
Rel(internal_api, cloud_monitoring, "Exports metrics", "OpenTelemetry")
Rel(internal_api, cloud_logging, "Streams logs", "Structured JSON logs")
Rel(internal_api, secret_manager, "Fetches secrets", "Secret Manager API")

@enduml`;

export const INTERNAL_API_CONTAINER = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

title Container Diagram \u2014 Internal API Multi-regional VMs

Person(api_consumer, "Internal API Consumer", "Backend services consuming APIs")

System_Boundary(api_platform, "Internal API Platform") {

  Container(global_lb, "Internal HTTP(S) Load Balancer", "Cloud Load Balancing", "Global internal L7 LB with URL map, SSL termination, and global access enabled")

  Container(backend_svc, "Backend Service", "Cloud Backend Service", "Routes traffic to healthy MIG backends with session affinity and connection draining")

  Container(health_check, "Health Check", "Cloud Health Check", "HTTP health probe on /healthz:8080 every 10s with 3-strike threshold")

  Boundary(region_a, "Region A \u2014 us-central1") {
    Container(mig_a, "Managed Instance Group A", "Compute Engine MIG", "2\u201310 auto-scaled VM instances running API service containers")
    ContainerDb(subnet_a, "Subnet A", "VPC Subnet 10.0.1.0/24", "Private subnet with Cloud NAT for egress")
  }

  Boundary(region_b, "Region B \u2014 us-east1") {
    Container(mig_b, "Managed Instance Group B", "Compute Engine MIG", "2\u201310 auto-scaled VM instances running API service containers")
    ContainerDb(subnet_b, "Subnet B", "VPC Subnet 10.0.2.0/24", "Private subnet with Cloud NAT for egress")
  }

  Container(autoscaler, "Autoscaler", "Compute Engine Autoscaler", "CPU-based scaling policy targeting 60% utilization")
}

System_Ext(cloud_iam, "Cloud IAM", "Service account auth")
System_Ext(monitoring, "Cloud Monitoring", "Metrics & alerts")

Rel(api_consumer, global_lb, "API requests", "gRPC / HTTPS")
Rel(global_lb, backend_svc, "Forwards to", "L7 routing rules")
Rel(backend_svc, mig_a, "Routes traffic", "Weighted round-robin")
Rel(backend_svc, mig_b, "Routes traffic", "Weighted round-robin")
Rel(health_check, mig_a, "Probes /healthz", "HTTP:8080")
Rel(health_check, mig_b, "Probes /healthz", "HTTP:8080")
Rel(autoscaler, mig_a, "Scales replicas", "CPU target 60%")
Rel(autoscaler, mig_b, "Scales replicas", "CPU target 60%")
Rel(mig_a, subnet_a, "Deployed in", "Private IP")
Rel(mig_b, subnet_b, "Deployed in", "Private IP")
Rel_L(mig_a, cloud_iam, "Authenticates", "Service Account")
Rel_R(mig_b, monitoring, "Exports metrics", "OpenTelemetry")

@enduml`;

// ── Data Platform BigQuery ───────────────────────────────────────────

export const DATA_PLATFORM_CONTEXT = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title System Context \u2014 Enterprise Data Warehouse with BigQuery

Person(data_eng, "Data Engineer", "Builds and maintains data pipelines and transformations")
Person(data_analyst, "Data Analyst", "Creates reports, dashboards, and ad-hoc queries")
Person(ml_eng, "ML Engineer", "Trains models using BigQuery ML on warehouse data")
Person(business_user, "Business User", "Consumes dashboards and KPI reports via Looker")

System(data_warehouse, "Enterprise Data Warehouse", "Serverless analytics platform using BigQuery with decoupled storage/compute, ETL pipelines, and integrated ML")

System_Ext(source_systems, "Source Systems", "Operational databases (PostgreSQL, MySQL), SaaS apps (Salesforce, SAP)")
System_Ext(cloud_iam, "Cloud IAM", "Column-level security and data access governance")
System_Ext(cloud_monitoring, "Cloud Monitoring", "Pipeline health metrics and alerting")
System_Ext(data_catalog, "Data Catalog", "Metadata management, data lineage, and discovery")

Rel(source_systems, data_warehouse, "Streams events & batch exports", "Pub/Sub, Cloud Storage")
Rel(data_eng, data_warehouse, "Builds & monitors pipelines", "Dataflow, dbt, SQL")
Rel(data_analyst, data_warehouse, "Queries data & builds reports", "BigQuery SQL, Looker")
Rel(ml_eng, data_warehouse, "Trains ML models", "BigQuery ML, SQL")
Rel(business_user, data_warehouse, "Views dashboards", "Looker, Data Studio")
Rel(data_warehouse, cloud_iam, "Enforces access policies", "Policy Tags, IAM Conditions")
Rel(data_warehouse, cloud_monitoring, "Exports pipeline metrics", "Cloud Monitoring API")
Rel(data_warehouse, data_catalog, "Registers metadata", "Data Catalog API")

@enduml`;

export const DATA_PLATFORM_CONTAINER = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

title Container Diagram \u2014 Enterprise Data Warehouse with BigQuery

Person(data_eng, "Data Engineer", "Pipeline development")
Person(analyst, "Data Analyst", "SQL queries & reports")
Person(business, "Business User", "Dashboard consumer")

System_Boundary(dwh, "Enterprise Data Warehouse Platform") {

  Boundary(ingestion, "Ingestion Layer") {
    Container(pubsub, "Cloud Pub/Sub", "Messaging", "Real-time event streaming at 100K msgs/sec with exactly-once delivery")
    Container(gcs_raw, "Cloud Storage \u2014 Raw Zone", "Object Storage", "Landing zone for batch files and streaming micro-batches")
  }

  Boundary(processing, "Processing Layer") {
    Container(dataflow, "Cloud Dataflow", "Apache Beam", "Managed ETL/ELT pipelines with autoscaling up to 50 workers")
    Container(dbt, "dbt Transformations", "dbt Core", "SQL-based data models, tests, and documentation")
  }

  Boundary(serving, "Serving Layer") {
    ContainerDb(bq_warehouse, "BigQuery Datasets", "BigQuery", "Partitioned by ingestion_time, clustered by customer_id and region")
    Container(bq_ml, "BigQuery ML", "BigQuery", "In-warehouse ML model training (linear regression, XGBoost, deep learning)")
    Container(gcs_staged, "Cloud Storage \u2014 Curated Zone", "Object Storage", "Processed Parquet/Avro files for external consumption")
  }

  Boundary(consumption, "Consumption Layer") {
    Container(looker, "Looker", "BI Platform", "Self-service dashboards, explores, and scheduled reports")
    Container(iam_security, "IAM Column-level Security", "Cloud IAM + Policy Tags", "Fine-grained access control on PII and sensitive columns")
  }
}

System_Ext(sources, "Source Systems", "PostgreSQL, MySQL, Salesforce, SAP")

Rel(sources, pubsub, "Streams change events", "CDC / Pub/Sub")
Rel(sources, gcs_raw, "Batch exports", "CSV, JSON, Avro")
Rel(pubsub, dataflow, "Triggers processing", "Streaming pipeline")
Rel(gcs_raw, dataflow, "Reads raw files", "Batch pipeline")
Rel(dataflow, bq_warehouse, "Loads transformed data", "BigQuery Write API")
Rel(dataflow, gcs_staged, "Writes curated files", "Parquet/Avro")
Rel(dbt, bq_warehouse, "Transforms & models", "SQL views & tables")
Rel(data_eng, dataflow, "Develops pipelines", "Python / Java SDK")
Rel(data_eng, dbt, "Authors models", "dbt CLI")
Rel(analyst, bq_warehouse, "Queries datasets", "BigQuery SQL")
Rel(analyst, looker, "Builds reports", "LookML")
Rel(business, looker, "Views dashboards", "Browser")
Rel(bq_warehouse, bq_ml, "Trains models on", "SQL ML queries")
Rel(bq_warehouse, iam_security, "Enforces policies", "Policy Tags")
Rel(looker, bq_warehouse, "Reads data", "BigQuery JDBC")

@enduml`;

// ── AI/ML Model Inference ────────────────────────────────────────────

export const AIML_CONTEXT = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title System Context \u2014 AI-ML Model Deployment & Inferencing

Person(ml_eng, "ML Engineer", "Trains models, deploys to endpoints, monitors performance")
Person(data_scientist, "Data Scientist", "Experiments with models, evaluates metrics, publishes to registry")
Person(api_consumer, "API Consumer", "Internal services that call prediction endpoints")

System(ml_platform, "ML Model Serving Platform", "Production-ready model serving using Vertex AI for real-time inference, autoscaling, traffic splitting, and model monitoring")

System_Ext(ci_cd, "CI/CD Pipeline", "Automated model training, validation, and deployment via Cloud Build")
System_Ext(cloud_iam, "Cloud IAM", "Service account auth and prediction route access control")
System_Ext(feature_store, "Feature Store", "Low-latency online feature serving for real-time model inputs")
System_Ext(cloud_monitoring, "Cloud Monitoring", "Endpoint latency, throughput, and error rate dashboards")
System_Ext(cloud_logging, "Cloud Logging", "Prediction request/response logging and audit trail")

Rel(ml_eng, ml_platform, "Deploys & monitors models", "Vertex AI SDK, gcloud")
Rel(data_scientist, ml_platform, "Publishes trained models", "Vertex AI Model Registry")
Rel(api_consumer, ml_platform, "Sends prediction requests", "REST / gRPC")
Rel(ci_cd, ml_platform, "Triggers automated deployments", "Cloud Build + Vertex Pipelines")
Rel(ml_platform, cloud_iam, "Authenticates callers", "OAuth 2.0 / Service Account")
Rel(ml_platform, feature_store, "Fetches features at inference time", "Feature Store Online API")
Rel(ml_platform, cloud_monitoring, "Exports endpoint metrics", "OpenTelemetry")
Rel(ml_platform, cloud_logging, "Logs predictions", "Structured JSON")

@enduml`;

export const AIML_CONTAINER = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

title Container Diagram \u2014 AI-ML Model Deployment & Inferencing

Person(ml_eng, "ML Engineer", "Deploys and monitors")
Person(api_consumer, "API Consumer", "Prediction requests")

System_Boundary(ml_platform, "ML Model Serving Platform") {

  Boundary(registry, "Model Management") {
    Container(model_registry, "Model Registry", "Vertex AI", "Versioned model artifacts with lineage tracking and approval workflows")
    Container(model_storage, "Model Artifact Storage", "Cloud Storage", "Trained model binaries, serving containers, and config files")
  }

  Boundary(serving, "Serving Infrastructure") {
    Container(endpoint, "Vertex AI Endpoint", "Vertex AI", "Managed prediction endpoint with traffic splitting: 90% v2 / 10% v3-canary")
    Container(prediction_v2, "Prediction Service v2", "TensorFlow Serving", "Primary model serving 90% traffic, n1-standard-4 + NVIDIA T4 GPU, 1\u201320 replicas")
    Container(prediction_v3, "Prediction Service v3 (Canary)", "PyTorch Serve", "Canary model serving 10% traffic for A/B evaluation")
  }

  Boundary(ops, "Operations & Monitoring") {
    Container(model_monitor, "Model Monitoring", "Vertex AI", "Continuous data drift detection, feature skew analysis, and prediction quality alerts")
    Container(ml_pipeline, "ML CI/CD Pipeline", "Cloud Build + Vertex Pipelines", "Automated training, evaluation, validation, and blue-green deployment")
  }

  Boundary(features, "Feature Serving") {
    ContainerDb(feature_store, "Feature Store", "Vertex AI Feature Store", "Low-latency online serving of pre-computed features for inference")
  }
}

System_Ext(cloud_iam, "Cloud IAM", "Access control")
System_Ext(monitoring, "Cloud Monitoring", "Metrics & alerts")

Rel(ml_eng, model_registry, "Registers model versions", "Vertex AI SDK")
Rel(ml_eng, ml_pipeline, "Triggers deployments", "Cloud Build API")
Rel(model_registry, model_storage, "Stores artifacts", "GCS bucket")
Rel(model_registry, endpoint, "Deploys to", "Model deployment config")
Rel(api_consumer, endpoint, "Prediction requests", "REST / gRPC")
Rel(endpoint, prediction_v2, "Routes 90% traffic", "Traffic split")
Rel(endpoint, prediction_v3, "Routes 10% traffic", "Canary split")
Rel(prediction_v2, feature_store, "Fetches features", "Online serving API")
Rel(prediction_v3, feature_store, "Fetches features", "Online serving API")
Rel(model_monitor, prediction_v2, "Monitors predictions", "Sampling pipeline")
Rel(model_monitor, prediction_v3, "Monitors predictions", "Sampling pipeline")
Rel(ml_pipeline, model_registry, "Publishes models", "After validation")
Rel(endpoint, cloud_iam, "Authenticates", "Service Account")
Rel(model_monitor, monitoring, "Sends drift alerts", "Cloud Monitoring API")

@enduml`;
