<p align="center">
  <img src="public/logo.svg" width="80" height="80" alt="Architecture as Code logo" />
</p>

<h1 align="center">Architecture as Code</h1>

<p align="center">
  An interactive C4 architecture diagram editor with bidirectional YAML-to-canvas sync.<br />
  Define your system architecture in YAML. See it rendered as a live, editable diagram.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js 16.1" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white" alt="React 19.2" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Tests-169%20passing-22C55E?logo=vitest&logoColor=white" alt="169 tests passing" />
</p>

---

## Overview

**Architecture as Code (aac)** brings the C4 model to life. Instead of drawing boxes in a diagramming tool, you define your system architecture in a declarative YAML format. The editor parses it in real time, renders an interactive node graph, and syncs changes bidirectionally -- edit the YAML and the diagram updates; drag a node and the YAML updates.

### Key Features

- **Bidirectional Sync** -- YAML editor and visual canvas stay in sync. Edit either one and the other updates in real time (debounced at 300ms).
- **C4 Model Support** -- Persons, Software Systems, Containers, and Components with internal/external boundaries, following the [C4 model](https://c4model.com) standard.
- **Monaco Editor** -- Full-featured YAML editing with syntax highlighting, bracket matching, line numbers, and real-time validation error banners.
- **Interactive Canvas** -- Drag, pan, zoom, and connect nodes on a React Flow canvas with a minimap, background grid, and smooth-step edge routing.
- **Auto Layout** -- One-click Dagre-powered automatic graph layout with parent-child nesting.
- **Draw.io Export** -- Export your architecture diagram to Draw.io XML format with correct C4 styling, ready to open in [draw.io](https://draw.io).
- **Light & Dark Themes** -- GitHub-inspired color palette with full semantic token system. Toggle with one click.
- **Responsive Design** -- Resizable split panes on desktop (15/85 editor/canvas); tabbed layout on mobile.
- **Schema Validation** -- Zod v4 schemas validate YAML structure, relationship references, and system metadata with human-readable error messages.
- **Dashboard** -- Landing page with system catalog, pattern catalog, standards catalog, and utilities tabs with deep-linking via query params.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **UI** | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [Shadcn UI](https://ui.shadcn.com) |
| **Diagram Canvas** | [React Flow](https://reactflow.dev) (`@xyflow/react`) |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) (`@monaco-editor/react`) |
| **Graph Layout** | [Dagre](https://github.com/dagrejs/dagre) (`@dagrejs/dagre`) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Validation** | [Zod v4](https://zod.dev) |
| **YAML** | [js-yaml](https://github.com/nodeca/js-yaml) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) |
| **Testing** | [Vitest](https://vitest.dev), jsdom |
| **Language** | TypeScript 5 (`strict: true`, zero `any`) |

---

## Project Structure

```
aac/
├── model/                          # System architecture definitions
│   ├── demand-forecasting/
│   │   ├── metadata.json           # System metadata (name, stats, branch)
│   │   └── system.yaml             # C4 architecture in YAML
│   ├── ecommerce-platform/
│   ├── image-categorization/
│   └── ml-platform/
├── public/
│   └── logo.svg                    # App logo
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Landing page (/)
│   │   ├── dashboard/page.tsx      # System catalog (/dashboard)
│   │   ├── systems/[id]/page.tsx   # Diagram editor (/systems/:id)
│   │   ├── error.tsx               # Error boundary
│   │   ├── not-found.tsx           # Custom 404
│   │   ├── layout.tsx              # Root layout (fonts, providers)
│   │   └── globals.css             # Design tokens (light/dark themes)
│   ├── components/
│   │   ├── canvas/                 # React Flow canvas with minimap
│   │   ├── dashboard/              # System catalog, tabs, nav bar
│   │   ├── editor/                 # Monaco YAML editor
│   │   ├── landing/                # Landing page sections
│   │   ├── nodes/                  # C4 node renderers (person, system, container, component)
│   │   ├── providers/              # Theme provider & toggle
│   │   ├── toolbar/                # Toolbar (auto-layout, export, theme)
│   │   ├── ui/                     # Shadcn primitives (button, badge, tooltip, separator)
│   │   └── diagram-workspace.tsx   # Split-pane workspace (editor + canvas)
│   ├── hooks/                      # Custom hooks (debounce, mounted)
│   ├── lib/
│   │   ├── parser/                 # YAML <-> graph bidirectional conversion
│   │   ├── validation/             # Zod schemas + validation helpers
│   │   ├── layout/                 # Dagre auto-layout engine
│   │   ├── export/                 # Draw.io XML export
│   │   ├── model/                  # Filesystem model loader
│   │   ├── constants/              # C4 color palette
│   │   └── utils.ts                # Tailwind class merge helper
│   ├── store/                      # Zustand store (bidirectional graph state)
│   └── types/                      # TypeScript type definitions (C4, system, YAML schema)
├── vitest.config.ts
├── tsconfig.json
├── next.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.18
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

Open [http://localhost:3000](http://localhost:3000) to see the landing page. Navigate to the [dashboard](http://localhost:3000/dashboard) to browse systems, or click any system card to open the interactive diagram editor.

### Production Build

```bash
npm run build
npm start
```

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `next dev` | Start development server with Turbopack HMR |
| `npm run build` | `next build` | Create optimized production build |
| `npm start` | `next start` | Serve production build |
| `npm run lint` | `eslint` | Run ESLint checks |
| `npm test` | `vitest` | Run tests in watch mode |
| `npm run test:run` | `vitest run` | Single test run (CI-friendly) |
| `npm run test:coverage` | `vitest run --coverage` | Test run with V8 coverage report |

---

## Architecture

### Bidirectional Sync Flow

```
┌─────────────┐     updateFromYaml()     ┌─────────────────┐     applyDagreLayout()     ┌──────────────┐
│  Monaco      │ ──────────────────────▶  │  Zustand Store   │ ─────────────────────────▶ │  React Flow  │
│  YAML Editor │                          │                   │                            │  Canvas      │
│              │ ◀──────────────────────  │  yamlText         │ ◀───────────────────────── │              │
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
```

Each level maps to a custom React Flow node type with C4-standard colors and styling. Relationships are rendered as labeled edges with optional protocol annotations.

### YAML Schema

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

---

## Testing

The project uses [Vitest](https://vitest.dev) with 169 tests across 7 test suites covering all pure-logic modules:

| Test Suite | File | Tests | What It Covers |
|-----------|------|-------|----------------|
| YAML Parser | `parser/yaml-to-graph.test.ts` | 36 | YAML string to nodes/edges, boundary mapping, suffix resolution, edge cases |
| YAML Serializer | `parser/graph-to-yaml.test.ts` | 29 | Nodes/edges back to YAML, hierarchy nesting, boundary mapping |
| Schema Validation | `validation/system-schema.test.ts` | 15 | Zod schema validation, ref resolution, metadata validation |
| System Validation | `validation/validate-new-system.test.ts` | 23 | End-to-end validation pipeline, error categorization |
| Auto Layout | `layout/dagre-layout.test.ts` | 15 | Dagre positioning, parent-child grid, custom options |
| Draw.io Export | `export/drawio-export.test.ts` | 43 | XML generation, C4 styles, position offsets, HTML escaping |
| Utilities | `utils.test.ts` | 8 | Tailwind class merging, conflict resolution |

```bash
# Run all tests
npm run test:run

# Watch mode
npm test

# With coverage
npm run test:coverage
```

---

## Adding a New System

1. Create a new directory under `model/`:

```bash
mkdir model/my-system
```

2. Add `metadata.json`:

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

3. Add `system.yaml` following the C4 YAML schema (see [YAML Schema](#yaml-schema) above).

4. Restart the dev server. The new system will appear in the dashboard automatically.

> **Validation rules**: System IDs must be lowercase alphanumeric with hyphens (`/^[a-z0-9-]+$/`). All numeric fields must be non-negative integers. `lastScan` must be a valid ISO 8601 datetime.

---

## Included Systems

The project ships with 4 example architectures:

| System | Containers | Description |
|--------|-----------|-------------|
| **E-Commerce Platform** | 10 | Full e-commerce stack with web app, API, database, payment gateway, and more |
| **Demand Forecasting** | 7 | ML-powered demand prediction pipeline |
| **Image Categorization** | 3 | Image classification service with training and inference |
| **ML Platform** | 2 | Shared ML infrastructure platform |

---

## Design System

The app uses a GitHub-inspired semantic token system defined in `globals.css`, supporting light and dark themes:

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

All components use semantic Tailwind classes (`bg-card`, `text-foreground`, `border-border`) rather than hardcoded colors, ensuring consistent theming throughout the app.

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with feature overview and system cards |
| `/dashboard` | System catalog with tabbed navigation (applications, patterns, standards, utilities) |
| `/dashboard?tab=patterns` | Deep-link to a specific tab |
| `/systems/:id` | Interactive diagram editor for a specific system |

---

## License

This project is licensed under the [MIT License](LICENSE).
