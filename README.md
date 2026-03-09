<p align="center">
  <img src="public/logo.svg" width="80" height="80" alt="Architecture as Code logo" />
</p>

<h1 align="center">Architecture as Code</h1>

<p align="center">
  Define, validate, visualize, and publish enterprise system architectures from declarative YAML.<br />
  A full-lifecycle platform: interactive C4 diagram editor, pattern catalog, standards catalog, CI/CD governance pipeline, and auto-generated documentation site.
</p>

<p align="center">
  <a href="https://aac.muthub.org/"><img src="https://img.shields.io/badge/Live%20Site-aac.muthub.org-2563eb?style=flat-square" alt="Live Site" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js&style=flat-square" alt="Next.js 16.1" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React 19.2" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Tests-288%20passing-22C55E?logo=vitest&logoColor=white&style=flat-square" alt="288 tests passing" />
</p>

---

## Why Architecture as Code?

Most organizations store architecture knowledge in slide decks and wiki pages that drift from reality within weeks of creation. **Architecture as Code** treats architecture definitions as source code: version-controlled YAML files that are validated, linted for policy compliance, and automatically rendered into interactive diagrams and a published documentation site -- all through a CI/CD pipeline.

The result is a single source of truth that stays in sync with the codebase, enforces enterprise standards, and makes architecture knowledge accessible to every engineer on the team.

---

## What This Project Does

| Capability | Description |
|------------|-------------|
| **Interactive Diagram Editor** | Bidirectional sync between a Monaco YAML editor and a React Flow canvas. Edit YAML and the diagram updates; drag a node and the YAML updates. |
| **C4 Model Support** | Full C4 hierarchy: Persons, Software Systems, Containers, Components, Deployment Nodes, and Infrastructure Nodes with boundary classification. |
| **Pattern Catalog** | 6 reusable enterprise architecture patterns with C4 diagrams, design considerations, NFR targets, cost profiles, and getting-started guides. |
| **Standards Catalog** | 9 enterprise architecture standards covering AI/ML governance, cryptography, data platforms, resiliency, API integration, IaC, FinOps, and IAM -- each with RFC 2119 requirements, guidelines, solutions, and authoritative sources. |
| **Governance Pipeline** | 7-job CI/CD pipeline with parallel domain stages: quality gate, then App Architecture / Patterns / Standards in parallel, assembly, PR feedback, and GitHub Pages deployment. |
| **Published Documentation** | Auto-generated static site with system detail pages, pattern catalog, standards catalog, pipeline visualization, and lightbox diagram zoom. Deployed to GitHub Pages on every merge to `main`. |
| **Multi-Format Export** | Export diagrams to PlantUML (`.puml`) and Draw.io XML (`.drawio.xml`) with correct C4 styling. |

---

## Live Site

The documentation site is auto-published on every push to `main`:

**[https://aac.muthub.org/](https://aac.muthub.org/)**

| Page | URL |
|------|-----|
| Homepage (system catalog, stats, pipeline) | [`/`](https://aac.muthub.org/) |
| System detail (per-system diagrams, containers, actors) | [`/systems/{id}.html`](https://aac.muthub.org/systems/ecommerce-platform.html) |
| Pattern catalog index | [`/patterns/`](https://aac.muthub.org/patterns/) |
| Pattern detail (diagrams, NFRs, cost, getting started) | [`/patterns/{id}.html`](https://aac.muthub.org/patterns/public-web-application.html) |
| Standards catalog index | [`/standards/`](https://aac.muthub.org/standards/) |
| Standard detail (requirements, guidelines, solutions) | [`/standards/{id}.html`](https://aac.muthub.org/standards/ml-model-governance.html) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **UI** | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [Shadcn UI](https://ui.shadcn.com) |
| **Diagram Canvas** | [React Flow](https://reactflow.dev) (`@xyflow/react`) |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) (`@monaco-editor/react`) |
| **Graph Layout** | [Dagre](https://github.com/dagrejs/dagre) (`@dagrejs/dagre`) |
| **State** | [Zustand 5](https://zustand-demo.pmnd.rs/) |
| **Validation** | [Zod v4](https://zod.dev) + [Ajv](https://ajv.js.org) (JSON Schema draft-07 & draft 2020-12) |
| **YAML** | [js-yaml](https://github.com/nodeca/js-yaml) |
| **Diagram Export** | [plantuml-encoder](https://github.com/markushedvall/plantuml-encoder), custom Draw.io XML generator |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) |
| **Testing** | [Vitest](https://vitest.dev) (288 tests), jsdom |
| **Documentation** | Custom static site generator (TypeScript), [Asciidoctor.js](https://docs.asciidoctor.org/asciidoctor.js/) |
| **CI/CD** | GitHub Actions, [GitHub Pages](https://pages.github.com) |
| **Runtime** | Node.js 22, TypeScript 5 (`strict: true`, zero `any`) |

---

## Project Structure

```
aac/
├── .github/workflows/
│   └── aac-pipeline.yml              # 7-job CI/CD pipeline (parallel domain stages)
├── model/                             # System architecture definitions (YAML + metadata)
│   ├── demand-forecasting/
│   ├── ecommerce-platform/
│   ├── image-categorization/
│   └── ml-platform/
├── patterns/                          # Pattern definitions (YAML + PlantUML diagrams)
│   ├── internal-api-multiregional/
│   ├── data-platform-bq/
│   └── aiml-model-inference/
├── standards/                         # Architecture standard definitions (9 YAML files)
│   ├── ml-model-governance.yaml
│   ├── cryptography-key-management.yaml
│   ├── api-microservices-integration.yaml
│   └── ... (9 total)
├── schema/                            # JSON Schema definitions
│   ├── application-schema.json        #   C4 model YAML validation (draft-07)
│   ├── pattern-schema.json            #   Pattern definition validation (draft-07)
│   ├── patterns-schema.json           #   Pattern catalog entry validation (draft-07)
│   └── standards.json                 #   Architecture standard validation (draft 2020-12)
├── scripts/                           # Build & governance scripts
│   ├── validate-models.ts             #   Model schema validation (Ajv + Zod)
│   ├── validate-standards.ts          #   Standards schema validation (Ajv 2020-12)
│   ├── lint-architecture.ts           #   Enterprise policy linter (5 rules)
│   ├── build-diagrams.ts              #   PlantUML + Draw.io generation
│   ├── build-docs.ts                  #   Documentation site generator
│   ├── build-pattern-pages.ts         #   Pattern catalog page generator
│   └── build-standard-pages.ts        #   Standards catalog page generator
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── page.tsx                   #   Landing page (/)
│   │   ├── dashboard/page.tsx         #   System & pattern catalog (/dashboard)
│   │   ├── systems/[id]/page.tsx      #   Interactive diagram editor (/systems/:id)
│   │   └── globals.css                #   Design tokens (light/dark themes)
│   ├── components/                    # 40+ React components
│   │   ├── canvas/                    #   React Flow canvas with minimap
│   │   ├── dashboard/                 #   Catalog tabs, pattern/standards catalogs, system cards
│   │   ├── editor/                    #   Monaco YAML editor
│   │   ├── landing/                   #   Landing page sections
│   │   ├── nodes/                     #   C4 node renderers (6 types)
│   │   ├── providers/                 #   Theme provider & toggle
│   │   ├── toolbar/                   #   Toolbar (auto-layout, export, theme)
│   │   └── ui/                        #   Shadcn primitives
│   ├── lib/
│   │   ├── parser/                    #   YAML <-> graph bidirectional conversion
│   │   ├── validation/                #   Zod schemas + validation helpers
│   │   ├── layout/                    #   Dagre auto-layout engine
│   │   ├── export/                    #   Draw.io XML + PlantUML export
│   │   ├── data/                      #   Pattern catalog data
│   │   └── model/                     #   Filesystem model & standards loader
│   ├── store/                         # Zustand store (bidirectional graph state)
│   └── types/                         # TypeScript types (C4, system, pattern, standard, YAML schema)
└── build/                             # Generated artifacts (gitignored)
    ├── microsite/output/              #   Documentation site (HTML)
    ├── patterns/                      #   Pattern pages (HTML)
    └── standards/                     #   Standards pages (HTML)
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 22 (see `.nvmrc`)
- **npm** >= 9

### Installation

```bash
git clone https://github.com/muthub-ai/aac.git
cd aac
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Navigate to the [dashboard](http://localhost:3000/dashboard) to browse systems and patterns, or click any system card to open the interactive diagram editor.

### Production Build

```bash
npm run build
npm start
```

---

## Available Scripts

### Application

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with Turbopack HMR |
| `npm run build` | Create optimized production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint checks |

### Testing

| Script | Description |
|--------|-------------|
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Single test run (CI-friendly) |
| `npm run test:coverage` | Test run with V8 coverage report |

### Governance & Documentation

| Script | Description |
|--------|-------------|
| `npm run validate:models` | Validate all YAML models against JSON Schema + Zod |
| `npm run validate:standards` | Validate all standards YAML against JSON Schema (draft 2020-12) |
| `npm run lint:architecture` | Enterprise architecture policy compliance checks |
| `npm run build:diagrams` | Generate PlantUML + Draw.io diagrams from models |
| `npm run build:docs` | Generate documentation site to `build/microsite/output/` |
| `npm run build:patterns` | Generate pattern catalog pages to `build/patterns/` |
| `npm run build:standards` | Generate standards catalog pages to `build/standards/` |

---

## Architecture

### Bidirectional Sync Flow

```
┌─────────────┐     updateFromYaml()     ┌─────────────────┐     applyDagreLayout()     ┌──────────────┐
│  Monaco      │ ──────────────────────>  │  Zustand Store   │ ─────────────────────────> │  React Flow  │
│  YAML Editor │                          │                   │                            │  Canvas      │
│              │ <──────────────────────  │  yamlText         │ <───────────────────────── │              │
└─────────────┘     updateFromCanvas()    │  nodes[]          │     onNodesChange()        └──────────────┘
                                          │  edges[]          │     onEdgesChange()
                                          │  syncSource       │     onConnect()
                                          │  parseError       │
                                          └─────────────────┘
```

1. **YAML -> Canvas**: User edits YAML -> debounced (300ms) -> `js-yaml` parse -> `yamlToGraph()` -> Zod validation -> `applyDagreLayout()` -> render nodes/edges
2. **Canvas -> YAML**: User drags/connects nodes -> `graphToYaml()` -> update Monaco editor
3. **Sync guard**: A `syncSource` flag (`'yaml' | 'canvas' | null`) prevents infinite update loops

### C4 Model Hierarchy

```
Person (actor)
Software System
  └── Container
        └── Component
Deployment Node
  └── Infrastructure Node
        └── Container Instance
```

Each level maps to a custom React Flow node type with C4-standard colors and styling. Relationships are rendered as labeled edges with optional protocol annotations.

### CI/CD Pipeline

Every push triggers a 7-job governance pipeline organized into 4 phases. The three domain-specific build stages run **in parallel** after the quality gate:

```
                ┌─────────────────┐
                │   Lint & Test    │   ← Quality Gate
                └────────┬────────┘
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼      ← Parallel Build
   ┌────────────┐  ┌──────────┐  ┌───────────┐
   │    App     │  │ Patterns │  │ Standards │
   │Architecture│  │          │  │           │
   │            │  │ Catalog  │  │ Schema    │
   │ Schema     │  │ 10 pages │  │ Validation│
   │ Compliance │  │          │  │ Catalog   │
   │ Diagrams   │  │          │  │ 10 pages  │
   │ Docs       │  │          │  │           │
   └─────┬──────┘  └────┬─────┘  └─────┬─────┘
         └───────────────┼──────────────┘
                ┌────────▼────────┐
                │    Assemble     │   ← Merge Artifacts
                └────────┬────────┘
                ┌────────┴────────┐
                ▼                 ▼
         ┌────────────┐   ┌────────────┐
         │  PR Review  │   │  Publish   │   ← Deploy
         │ (PRs only)  │   │ (main only)│
         └────────────┘   └────────────┘
```

| Phase | Job | Sub-stages | Impact |
|-------|-----|------------|--------|
| **Quality Gate** | **Lint & Test** | ESLint, Vitest (288 tests) | Blocks merge |
| **Build** | **App Architecture** | Schema validation (Ajv + Zod), Architecture compliance (5 policy rules), Diagram generation (PlantUML + Draw.io), Documentation rendering (Asciidoctor.js) | Blocks merge |
| **Build** | **Patterns** | Pattern catalog generation (10 HTML pages) | Required |
| **Build** | **Standards** | Schema validation (Ajv 2020-12), Standards catalog generation (10 HTML pages) | Blocks merge |
| **Assembly** | **Assemble** | Merge docs + patterns + standards into unified microsite | Required |
| **Deploy** | **PR Review** | Post diagram previews to PR comments | PRs only |
| **Deploy** | **Publish** | Deploy to GitHub Pages via `gh-pages` branch | Main only |

Architecture policy rules enforced in the App Architecture stage:

1. No frontend container may connect directly to a database (must go through an API layer)
2. Every system must define at least one container
3. No orphaned external systems (must have at least one relationship)
4. Deployment container references must resolve to defined containers
5. Every container must specify its technology

---

## Pattern Catalog

The platform ships with 6 reusable architecture patterns, each documented to production-grade depth:

| Pattern | Category | Maturity | Exposure |
|---------|----------|----------|----------|
| Internal API (Multi-Regional VMs) | Compute | Production Ready | Internal |
| Enterprise Data Warehouse (BigQuery) | Database | Production Ready | Internal |
| AI/ML Model Inference | AI + ML | Beta | Internal |
| Internal Web Application | Compute | Production Ready | Internal |
| Public Web Application | Compute | Production Ready | External |
| Managed File Transfer | Networking | Beta | External |

Each pattern includes:

- **Architecture Overview** -- prose description of the design
- **C4 Diagrams** -- System Context and Container-level PlantUML diagrams
- **Design Considerations** -- 3-4 key architectural decisions
- **Products Used** -- technology table with roles
- **Non-Functional Requirements** -- availability, latency, throughput, RPO/RTO targets
- **Advantages & Considerations** -- pros/cons analysis
- **Constraints & Limitations** -- known boundaries
- **Cost Profile** -- cost estimation guidance
- **Getting Started** -- step-by-step onboarding

Patterns are browsable in the [Next.js dashboard](http://localhost:3000/dashboard?tab=patterns) and on the [published documentation site](https://muthub-ai.github.io/aac/patterns/).

---

## Standards Catalog

The platform ships with 9 enterprise architecture standards, each validated against a JSON Schema (draft 2020-12) and published as static HTML pages:

| Standard | ID | Domain | Status | Lifecycle |
|----------|-----|--------|--------|-----------|
| ML Model Governance | STD-AIML-001 | AI / ML | Approved | Standard |
| Cryptography & Key Management | STD-SEC-001 | Security | Approved | Standard |
| Data Platform & Warehousing | STD-DATA-001 | Data | Approved | Provisional |
| Multi-Region Resiliency | STD-INFRA-001 | Infrastructure | Approved | Standard |
| API & Microservices Integration | STD-INT-001 | Integration | Approved | Standard |
| Generative AI Usage | STD-AIML-002 | AI / ML | Draft | Draft |
| Infrastructure as Code | STD-DEVOPS-001 | DevOps | Approved | Provisional |
| Cloud Rightsizing & FinOps | STD-FINOPS-001 | FinOps | Approved | Provisional |
| Customer IAM (CIAM) | STD-IAM-001 | Identity | Approved | Retired |

Each standard includes:

- **Scope** -- in-scope and out-of-scope boundaries
- **Requirements** -- RFC 2119 severity levels (MUST, SHOULD, MUST NOT) with rationale, verification method, and platform applicability
- **Guidelines** -- recommended practices and implementation advice
- **Solutions** -- approved technology solutions with context
- **Authoritative Sources** -- links to governing standards and regulations
- **Definitions** -- glossary of domain-specific terms
- **FAQs** -- frequently asked questions
- **Revision History** -- change log with authors and reviewers

Standards are browsable in the [Next.js dashboard](http://localhost:3000/dashboard?tab=standards) and on the [published documentation site](https://muthub-ai.github.io/aac/standards/).

---

## System Models

The project ships with 4 example system architectures defined in `model/`:

| System | Containers | Description |
|--------|-----------|-------------|
| **E-Commerce Platform** | 10 | Full e-commerce stack: web app, API gateway, database, payment gateway, messaging |
| **Demand Forecasting** | 7 | ML-powered demand prediction pipeline with feature store and model serving |
| **Image Categorization** | 3 | Image classification service with training and inference endpoints |
| **ML Platform** | 2 | Shared ML infrastructure platform with model registry |

### YAML Schema

System architectures are defined in a declarative YAML format following the C4 model:

```yaml
actors:
  customer:
    type: Person
    label: Customer
    description: End user of the platform
    boundary: External

softwareSystems:
  ecommerce:
    label: E-Commerce Platform
    description: Handles orders and payments
    boundary: Internal
    containers:
      webApp:
        label: Web Application
        technology: React / Next.js
        description: Customer-facing storefront
        components:
          catalog:
            label: Product Catalog
            technology: React
            description: Browsable product listings

relationships:
  - from: customer
    to: webApp
    label: Browses products
    protocol: HTTPS
```

### Adding a New System

1. Create `model/my-system/metadata.json`:

```json
{
  "id": "my-system",
  "name": "My System",
  "repoCount": 1,
  "linesOfCode": 5000,
  "deployableUnits": 2,
  "domainModules": 3,
  "domainObjects": 10,
  "domainBehaviors": 20,
  "lastScan": "2025-01-15T12:00:00Z",
  "branchName": "main"
}
```

2. Create `model/my-system/system.yaml` following the C4 YAML schema above.

3. Restart the dev server. The new system appears in the dashboard automatically and will be validated, diagrammed, and published by the CI pipeline on the next push.

> **Validation rules**: System IDs must be lowercase alphanumeric with hyphens (`/^[a-z0-9-]+$/`). All numeric fields must be non-negative integers. `lastScan` must be a valid ISO 8601 datetime.

---

## JSON Schemas

Four JSON Schema files in `schema/` define the contract for all architecture data:

| Schema | Draft | Validates | Key Structures |
|--------|-------|-----------|----------------|
| `application-schema.json` | draft-07 | `model/*/system.yaml` | C4 hierarchy (System -> Container -> Component), People, Relationships, Deployment Nodes, Views |
| `pattern-schema.json` | draft-07 | `patterns/*/pattern.yaml` | Pattern definitions with validation rules, resiliency patterns, components, deployment model |
| `patterns-schema.json` | draft-07 | Pattern catalog entries | UI-facing metadata: id, version, name, category, maturity, exposure, tags |
| `standards.json` | 2020-12 | `standards/*.yaml` | Architecture standards with metadata, scope, requirements (RFC 2119), guidelines, solutions, authoritative sources, definitions, FAQs |

---

## Testing

288 tests across 10 suites covering all pure-logic modules:

| Test Suite | File | Tests | Coverage |
|-----------|------|-------|----------|
| YAML Parser | `parser/yaml-to-graph.test.ts` | 46 | YAML to nodes/edges, boundary mapping, suffix resolution, edge cases |
| YAML Serializer | `parser/graph-to-yaml.test.ts` | 29 | Nodes/edges back to YAML, hierarchy nesting, boundary mapping |
| Schema Transform | `parser/new-to-old-transform.test.ts` | 29 | Schema migration transforms |
| View Filtering | `graph/filter-by-view.test.ts` | 21 | C4 view filtering (system context, container, deployment) |
| PlantUML Export | `export/plantuml-export.test.ts` | 51 | PlantUML syntax generation, C4 stereotypes, relationship labels |
| Draw.io Export | `export/drawio-export.test.ts` | 43 | XML generation, C4 styles, position offsets, HTML escaping |
| Schema Validation | `validation/system-schema.test.ts` | 23 | Zod schema validation, ref resolution, metadata validation |
| System Validation | `validation/validate-new-system.test.ts` | 23 | End-to-end validation pipeline, error categorization |
| Auto Layout | `layout/dagre-layout.test.ts` | 15 | Dagre positioning, parent-child grid, custom options |
| Utilities | `utils.test.ts` | 8 | Tailwind class merging, conflict resolution |

```bash
npm run test:run          # Single run (CI)
npm test                  # Watch mode
npm run test:coverage     # With V8 coverage
```

---

## Design System

GitHub-inspired semantic token system with automatic light/dark mode support:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `#f6f8fa` | `#0d1117` | Page background |
| `--foreground` | `#1f2328` | `#e6edf3` | Primary text |
| `--card` | `#ffffff` | `#161b22` | Card surfaces |
| `--border` | `#d0d7de` | `#30363d` | Borders and dividers |
| `--ring` | `#2563eb` | `#58a6ff` | Focus rings and accents |
| `--muted-foreground` | `#656d76` | `#8b949e` | Secondary text |
| `--success` | `#1a7f37` | `#238636` | Success states |
| `--destructive` | `#cf222e` | `#f85149` | Error states |

All components use semantic Tailwind classes (`bg-card`, `text-foreground`, `border-border`) rather than hardcoded colors. The published documentation site shares the same token system for visual consistency across the interactive app and static pages.

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with feature overview and system cards |
| `/dashboard` | System catalog with tabbed navigation |
| `/dashboard?tab=patterns` | Pattern catalog with search, filters, and detail drawer |
| `/dashboard?tab=standards` | Standards catalog |
| `/dashboard?tab=utilities` | Utilities catalog |
| `/systems/:id` | Interactive diagram editor for a specific system |

---

## Acknowledgements

- [C4 Model](https://c4model.com/) by Simon Brown
- [PlantUML](https://plantuml.com/) for diagram rendering
- [React Flow](https://reactflow.dev/) for the interactive canvas
- [Shadcn UI](https://ui.shadcn.com/) for accessible component primitives

---

## License

This project is licensed under the [MIT License](LICENSE).
