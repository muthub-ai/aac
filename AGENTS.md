# Architecture as Code (aac)

## Build & Test Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (Next.js 16 + Turbopack)
npm run lint         # ESLint
npm test             # Vitest watch mode
npm run test:run     # Vitest single run (CI)
npm run test:coverage # Vitest with coverage
```

## Project Structure

- `src/app/` - Next.js App Router pages (`/`, `/dashboard`, `/systems/[id]`)
- `src/components/` - React components (landing, dashboard, diagram, canvas, toolbar, nodes, ui)
- `src/lib/` - Pure logic modules (parser, validation, layout, export, utils)
- `src/store/` - Zustand state (use-graph-store.ts)
- `src/types/` - TypeScript types (c4.ts, system.ts, yaml-schema.ts)
- `model/` - System YAML + metadata files (4 systems)

## Test Infrastructure

- **Runner:** Vitest v3 with `globals: true`
- **Environment:** `node` by default; `jsdom` for export tests (via inline comment)
- **Tests live alongside source:** `*.test.ts` next to the module they test
- **Key test targets:** yaml-to-graph, graph-to-yaml, system-schema, validate-new-system, dagre-layout, drawio-export, utils

## CI/CD Pipeline Scripts

```bash
npm run validate:models    # Validate all model YAML against JSON Schema + Zod
npm run lint:architecture  # Enterprise architecture policy compliance checks
npm run build:diagrams     # Generate PlantUML + Draw.io diagrams from models
```

- Pipeline workflow: `.github/workflows/aac-pipeline.yml`
- Documentation: Asciidoctor.js (`@asciidoctor/core`) — pure Node.js, no Java
- AsciiDoc docs: `src/docs/` (generated diagrams go in `src/docs/diagrams/`)
- Scripts use `tsx` for TypeScript execution and relative imports (not `@/*` alias)

## Git Workflow

- **Always work in a feature branch.** Never commit directly to `main`. Create a descriptive branch (e.g., `standards`, `fix-nav-links`) before making any changes.
- **Ask the user if anything is unclear** before proceeding — do not guess at requirements or make assumptions about ambiguous requests.
- **Before merging to `main`**, run the full verification suite and ensure everything passes:
  ```bash
  npm run test:run           # 288 tests must pass
  npm run build              # Production build must succeed
  npm run lint               # No lint errors
  npm run validate:models    # All YAML models must be valid
  npm run lint:architecture  # Architecture policy compliance
  ```
- Only merge after all checks above pass with zero failures.

## Key Conventions

- Semantic Tailwind CSS tokens (light/dark themes via CSS custom properties in globals.css)
- No hardcoded hex colors in components — use `var(--token)` or Tailwind classes
- No `any` types, no `console.log` in production code
- Accessibility: all images have alt text, all buttons have aria-labels
