<p align="center">
  <img src="public/logo.svg" width="80" height="80" alt="Architecture as Code logo" />
</p>

<h1 align="center">Architecture as Code</h1>

<p align="center">
  Define, validate, visualize, and govern enterprise system architectures from declarative YAML.<br />
  A full-lifecycle platform with an interactive diagram editor, CLI toolchain, AI-native MCP server, OPA policy engine, governance pipeline, and auto-published documentation site.
</p>

<p align="center">
  <a href="https://aac.muthub.org/"><img src="https://img.shields.io/badge/Live%20Site-aac.muthub.org-2563eb?style=flat-square" alt="Live Site" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js&style=flat-square" alt="Next.js 16.1" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/Tests-388%20passing-22C55E?logo=vitest&logoColor=white&style=flat-square" alt="388 tests passing" />
  <img src="https://img.shields.io/badge/MCP-1.0-8B5CF6?style=flat-square" alt="MCP Server" />
  <img src="https://img.shields.io/badge/OPA-Rego-326DE6?logo=openpolicyagent&logoColor=white&style=flat-square" alt="OPA Rego" />
</p>

---

## Why Architecture as Code?

Most organizations store architecture knowledge in slide decks and wiki pages that drift from reality within weeks. **Architecture as Code** treats architecture definitions as source code: version-controlled YAML files that are validated against schemas, linted for policy compliance, rendered into interactive diagrams, and automatically published -- all through a CI/CD pipeline.

The result is a single source of truth that stays in sync with the codebase, enforces enterprise standards, and makes architecture knowledge accessible to every engineer -- including AI coding agents.

---

## Platform Overview

```
                                    Architecture as Code
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                                                                          │
    │   YAML Sources         Toolchain              Outputs                    │
    │   ────────────         ─────────              ───────                    │
    │                                                                          │
    │   model/          ──>  CLI (aac)          ──> Interactive Diagram Editor │
    │   patterns/       ──>  MCP Server         ──> Published Documentation   │
    │   standards/      ──>  CI/CD Pipeline     ──> PlantUML + Draw.io Export │
    │   waivers/        ──>  JSON Schema + Zod  ──> PR Feedback (diagrams)    │
    │   schema/         ──>  OPA Policy Engine  ──> GitHub Pages              │
    │                                                                          │
    └──────────────────────────────────────────────────────────────────────────┘
```

| Capability | Description |
|------------|-------------|
| **Interactive Diagram Editor** | Bidirectional sync between a Monaco YAML editor and a React Flow canvas. Edit YAML and the diagram updates; drag a node and the YAML updates. |
| **CLI Toolchain** | `aac init`, `aac create`, `aac validate` -- scaffold projects, generate boilerplate, validate artifacts against live schemas with ETag caching. |
| **MCP Server** | Expose architecture data to AI coding agents via the Model Context Protocol. 10 resources, 3 tools, 2 guided prompts. Works with VS Code Copilot, Cursor, Claude Desktop. |
| **Policy Engine** | OPA Rego policies for enterprise governance: security (KMS encryption), integration (API gateway), and FinOps (autoscaling). Built-in test framework with 100% coverage target. |
| **Pattern Catalog** | 6 reusable architecture patterns with C4 diagrams, NFR targets, cost profiles, and getting-started guides. |
| **Standards Catalog** | 9 enterprise standards with RFC 2119 requirements, verification methods, and approved solutions. |
| **Waiver Registry** | 10 architecture exceptions with risk assessments, compensating controls, financial impact, and remediation plans. |
| **Governance Pipeline** | 9-job CI/CD pipeline: schema validation, 5-rule compliance linter, OPA policy checks, diagram generation, and auto-publish to GitHub Pages. |

---

## Live Site

**[https://aac.muthub.org/](https://aac.muthub.org/)**

Auto-published on every push to `main`. Includes system detail pages, pattern catalog, standards catalog, waiver registry, and pipeline visualization.

---

## Quick Start

### Prerequisites

- **Node.js** >= 22 (see `.nvmrc`)
- **npm** >= 9

### Install & Run

```bash
git clone https://github.com/muthub-ai/aac.git
cd aac
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The [dashboard](http://localhost:3000/dashboard) shows all systems, patterns, standards, waivers, and developer utilities.

### CLI

```bash
npm install -g @muthub-ai/aac

aac init                                    # Scaffold project structure
aac create system "Order Management"        # Generate boilerplate YAML
aac validate model/ --type system           # Validate against live schemas
aac validate standards/ --output json       # JSON output for CI/CD
```

### MCP Server (for AI Agents)

```bash
npm install -g @muthub-ai/aac-mcp-server

# Test with the MCP Inspector
npx @modelcontextprotocol/inspector aac-mcp -- --root /path/to/your/aac/repo
```

Or add to your IDE's MCP configuration (VS Code, Cursor, Claude Desktop):

```json
{
  "mcpServers": {
    "aac": {
      "command": "aac-mcp",
      "args": ["--root", "/path/to/your/aac/repo"]
    }
  }
}
```

### Policy Engine (OPA/Rego)

```bash
# Install OPA
brew install opa

# Run policy tests
cd packages/policies && npm test

# Check coverage
npm run test:coverage

# Build deployable bundle
npm run bundle
```

---

## MCP Server

The MCP server exposes enterprise architecture governance data to AI coding agents via the [Model Context Protocol](https://modelcontextprotocol.io). It runs as a local subprocess over stdio, giving agents structured access to your architecture repository.

### Resources (10 endpoints)

| URI | Description |
|-----|-------------|
| `aac://systems` | List all system models |
| `aac://systems/{id}` | Read a system's C4 YAML |
| `aac://standards` | List all architecture standards |
| `aac://standards/{filename}` | Read a standard's YAML |
| `aac://waivers` | List all waivers with status |
| `aac://waivers/active` | List only approved, non-expired waivers |
| `aac://waivers/{filename}` | Read a waiver's YAML |
| `aac://patterns` | List all architecture patterns |
| `aac://patterns/{id}` | Read a pattern's YAML |
| `aac://schemas/{type}` | Read the JSON Schema for a given artifact type |

### Tools

| Tool | Description |
|------|-------------|
| `validate_architecture` | Validate YAML against JSON Schemas (auto-detects type) |
| `lint_compliance` | Run 5 enterprise policy rules against system models |
| `scaffold_waiver` | Generate a pre-filled waiver YAML from parameters |

### Prompts

| Prompt | Description |
|--------|-------------|
| `design_new_system` | Guided workflow to design a C4 model conforming to enterprise standards |
| `request_architecture_exception` | Generate a formal waiver request to bypass an architecture standard |

---

## CLI

The CLI validates architecture artifacts against live enterprise schemas hosted on GitHub, with ETag-based caching for offline support.

| Command | Description |
|---------|-------------|
| `aac init` | Scaffold `.aacrc` config + directory structure (`model/`, `patterns/`, `standards/`, `waivers/`, `schema/`) |
| `aac create <type> [name]` | Generate boilerplate YAML for `system`, `pattern`, `standard`, or `waiver` |
| `aac validate <path> [flags]` | Validate YAML against live JSON Schemas. Supports directories, type auto-inference, JSON output, and `--force-refresh`. |

Exit codes: `0` success, `1` system error, `2` validation failed.

---

## Policy Engine

Enterprise architecture governance policies written in [Rego](https://www.openpolicyagent.org/docs/latest/policy-language/) and enforced by the [Open Policy Agent](https://www.openpolicyagent.org/) (OPA). Policies are unit-tested with OPA's built-in test framework and validated in CI on every pull request.

### Policy Rules

| Domain | Policy | Package | Severity |
|--------|--------|---------|----------|
| **Security** | Cryptography Key Management | `architecture.security` | High |
| **Integration** | API Gateway Routing | `architecture.integration` | High |
| **FinOps** | Cloud Workload Rightsizing | `architecture.finops` | Medium |

### CI Pipeline Commands

| Step | Command | Description |
|------|---------|-------------|
| Format | `opa fmt --fail .` | Strict Rego formatting compliance |
| Syntax | `opa check .` | Compile policies, catch unresolved variables |
| Test | `opa test -v ./rules/` | Run all `_test.rego` files (fails build on failure) |
| Coverage | `opa test --coverage ./rules/` | Measure test coverage (100% target) |

### Bundle Deployment

```bash
cd packages/policies && npm run bundle
# Produces: dist/policies.tar.gz
# Load with: opa run --server --bundle dist/policies.tar.gz
```

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
                                          └─────────────────┘
```

1. **YAML -> Canvas**: Edit YAML -> debounced parse -> `yamlToGraph()` -> Zod validation -> `applyDagreLayout()` -> render
2. **Canvas -> YAML**: Drag/connect nodes -> `graphToYaml()` -> update editor
3. **Sync guard**: `syncSource` flag prevents infinite update loops

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

Each level maps to a custom React Flow node with C4-standard styling. Relationships are labeled edges with optional protocol annotations.

### CI/CD Pipeline

9-job pipeline with 5 parallel domain stages:

```
                ┌─────────────────┐
                │   Lint & Test    │   ← Quality Gate (388 tests)
                └────────┬────────┘
     ┌───────────────────┼───────────────────┬──────────────┐
     │           ┌───────┼───────┐           │              │
     ▼           ▼       ▼       ▼           ▼              ▼
┌──────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
│   App    │ │Patterns│ │Standards│ │ Waivers  │ │ Policies │
│Architect.│ │Catalog │ │ Catalog │ │ Registry │ │ OPA/Rego │
└────┬─────┘ └───┬────┘ └────┬────┘ └────┬─────┘ └────┬─────┘
     └────────────┼──────────┼───────────┼────────────┘
                ┌─▼──────────────┐
                │    Assemble     │   ← Merge Artifacts
                └────────┬────────┘
                ┌────────┴────────┐
                ▼                 ▼
         ┌────────────┐   ┌────────────┐
         │  PR Review  │   │  Publish   │   ← Deploy
         └────────────┘   └────────────┘
```

**Compliance rules enforced:**

1. No frontend container may connect directly to a database
2. Every internal system must define at least one container
3. No orphaned external systems
4. Deployment container references must resolve to defined containers
5. Every container must specify its technology

---

## Project Structure

```
aac/
├── .github/workflows/aac-pipeline.yml     # 9-job CI/CD pipeline
├── .vscode/mcp.json                       # VS Code MCP server configuration
├── model/                                 # System architecture definitions (4 systems)
│   ├── demand-forecasting/
│   ├── ecommerce-platform/
│   ├── image-categorization/
│   └── ml-platform/
├── patterns/                              # Architecture pattern definitions (6 patterns)
├── standards/                             # Enterprise standards (9 YAML files)
├── waivers/                               # Architecture waivers (10 YAML files)
├── schema/                                # JSON Schema definitions (5 schemas)
├── cli/                                   # CLI package (@muthub-ai/aac)
│   ├── bin/aac.ts                         #   Entry point: init, create, validate
│   └── src/                               #   Schema manager, validators, templates
├── mcp-server/                            # MCP server package (@muthub-ai/aac-mcp-server)
│   ├── bin/aac-mcp.ts                     #   Entry point: stdio transport
│   └── src/
│       ├── lib/                           #   Core: repo-resolver, schema-loader, validator
│       ├── resources/                     #   10 resource endpoints
│       ├── tools/                         #   3 tool handlers
│       └── prompts/                       #   2 guided workflows
├── packages/policies/                     # OPA Rego policy engine
│   ├── rules/                             #   3 governance domains (security, integration, finops)
│   ├── data/                              #   Static enterprise reference data
│   └── scripts/                           #   Bundle build script
├── scripts/                               # Build & governance scripts (9 scripts)
├── src/
│   ├── app/                               # Next.js App Router (/, /dashboard, /systems/[id])
│   ├── components/                        # 40+ React components
│   │   ├── canvas/                        #   React Flow canvas
│   │   ├── dashboard/                     #   Catalogs, utilities, system cards
│   │   ├── editor/                        #   Monaco YAML editor
│   │   ├── landing/                       #   Landing page sections
│   │   ├── nodes/                         #   C4 node renderers (6 types)
│   │   └── ui/                            #   Shadcn primitives
│   ├── lib/                               # Pure logic modules
│   │   ├── parser/                        #   YAML <-> graph bidirectional conversion
│   │   ├── validation/                    #   Zod schemas + validation
│   │   ├── layout/                        #   Dagre auto-layout
│   │   ├── export/                        #   Draw.io XML + PlantUML
│   │   └── data/                          #   Pattern, CLI, MCP, Policy Engine data
│   ├── store/                             # Zustand store
│   └── types/                             # TypeScript types
└── build/                                 # Generated artifacts (gitignored)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **UI** | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [Shadcn UI](https://ui.shadcn.com) |
| **Diagram Canvas** | [React Flow](https://reactflow.dev) (`@xyflow/react`) |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **Graph Layout** | [Dagre](https://github.com/dagrejs/dagre) |
| **State** | [Zustand 5](https://zustand-demo.pmnd.rs/) |
| **Validation** | [Zod v4](https://zod.dev) + [Ajv](https://ajv.js.org) (JSON Schema draft-07 & 2020-12) |
| **MCP** | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) (stdio transport) |
| **CLI** | [Commander.js](https://github.com/tj/commander.js), [Chalk](https://github.com/chalk/chalk) |
| **Policy Engine** | [Open Policy Agent](https://www.openpolicyagent.org/) (Rego) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Testing** | [Vitest](https://vitest.dev) (388 tests across 22 suites) |
| **Documentation** | Custom static site generator, [Asciidoctor.js](https://docs.asciidoctor.org/asciidoctor.js/) |
| **CI/CD** | GitHub Actions, [GitHub Pages](https://pages.github.com) |
| **Runtime** | Node.js 22, TypeScript 5 (`strict: true`, zero `any`) |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with Turbopack HMR |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest watch mode |
| `npm run test:run` | Single test run (CI) |
| `npm run test:coverage` | Coverage report |
| `npm run validate:models` | Validate all YAML models against JSON Schema + Zod |
| `npm run validate:standards` | Validate standards against JSON Schema (draft 2020-12) |
| `npm run validate:waivers` | Validate waivers against JSON Schema (draft 2020-12) |
| `npm run lint:architecture` | Enterprise policy compliance checks (5 rules) |
| `npm run build:diagrams` | Generate PlantUML + Draw.io diagrams |
| `npm run build:docs` | Generate documentation site |
| `npm run build:patterns` | Generate pattern catalog pages |
| `npm run build:standards` | Generate standards catalog pages |
| `npm run build:waivers` | Generate waiver registry pages |
| `npm run policy:test` | Run OPA Rego policy unit tests |
| `npm run policy:fmt` | Check Rego formatting compliance |

---

## System Models

4 example architectures in `model/`:

| System | Containers | Description |
|--------|-----------|-------------|
| **E-Commerce Platform** | 10 | Full stack: web app, API gateway, database, payment, messaging |
| **Demand Forecasting** | 7 | ML-powered demand prediction with feature store and model serving |
| **Image Categorization** | 3 | Image classification with training and inference |
| **ML Platform** | 2 | Shared ML infrastructure with model registry |

### Adding a New System

1. Create `model/my-system/metadata.json` with system metadata
2. Create `model/my-system/system.yaml` following the C4 YAML schema
3. Restart dev server -- the system appears in the dashboard and will be validated by CI on the next push

Or use the CLI:

```bash
aac create system "Order Management"
```

---

## Testing

388 tests across 22 suites:

| Area | Suites | Tests | Scope |
|------|--------|-------|-------|
| **App** (`src/lib/`) | 13 | 310 | Parser, validation, layout, export, graph filtering, utilities, policy engine data |
| **CLI** (`cli/src/`) | 6 | 52 | Commands (init, create, validate), schema manager, config, logger |
| **MCP Server** (`mcp-server/src/`) | 3 | 26 | Schema loader, validator (AJV + draft-2020-12), repo resolver |

```bash
npm run test:run                  # All 388 tests
cd mcp-server && npm test         # MCP server tests only
```

---

## Dashboard

The Next.js dashboard at `/dashboard` provides 5 tabs:

| Tab | Content |
|-----|---------|
| **Application Catalog** | System cards with container counts, links to interactive diagram editor |
| **Pattern Catalog** | 6 patterns with search, category filters, and detail drawer |
| **Standards Catalog** | 9 standards with domain tags and compliance status |
| **Waiver Registry** | 10 waivers with risk severity badges and lifecycle status |
| **Utilities** | CLI documentation, MCP Server documentation, Policy Engine documentation, and upcoming tools |

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | System catalog with tabbed navigation |
| `/dashboard?tab=patterns` | Pattern catalog |
| `/dashboard?tab=standards` | Standards catalog |
| `/dashboard?tab=waivers` | Waiver registry |
| `/dashboard?tab=utilities` | Developer utilities (CLI, MCP Server, Policy Engine) |
| `/systems/:id` | Interactive diagram editor |

---

## Acknowledgements

- [C4 Model](https://c4model.com/) by Simon Brown
- [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- [Open Policy Agent](https://www.openpolicyagent.org/) by the CNCF
- [React Flow](https://reactflow.dev/) for the interactive canvas
- [Shadcn UI](https://ui.shadcn.com/) for accessible component primitives

---

## License

This project is licensed under the [MIT License](LICENSE).
