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
- `cli/` - Standalone CLI tool (`aac` command)
  - `cli/bin/aac.ts` - Commander.js entry point
  - `cli/src/commands/` - validate, init, create commands
  - `cli/src/utils/` - logger, config, exit-codes
  - `cli/src/templates/` - YAML/JSON scaffolding templates
  - `cli/src/schema-manager.ts` - Remote schema fetch with ETag caching
  - `cli/src/validator.ts` - AJV-based validation engine

## Test Infrastructure

- **Runner:** Vitest v3 with `globals: true`
- **Environment:** `node` by default; `jsdom` for export tests (via inline comment)
- **Tests live alongside source:** `*.test.ts` next to the module they test
- **Key test targets:** yaml-to-graph, graph-to-yaml, system-schema, validate-new-system, dagre-layout, drawio-export, utils, CLI (schema-manager, validator, commands, utils)

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

## CLI Tool (`aac`)

```bash
npm run cli -- --help                        # Show help
npm run cli -- validate model/               # Validate all system YAML in model/
npm run cli -- validate standards/           # Validate all standards
npm run cli -- validate waivers/             # Validate all waivers
npm run cli -- validate patterns/            # Validate all patterns
npm run cli -- validate file.yaml --type standard  # Validate a single file
npm run cli -- validate standards/ --output json   # JSON output
npm run cli -- validate standards/ --force-refresh # Skip ETag cache
npm run cli -- init                          # Scaffold project directories + .aacrc
npm run cli -- create standard "My Standard" # Create standard from template
npm run cli -- create system "My System"     # Create system (subdir + metadata.json)
npm run cli -- create waiver "My Waiver"     # Create waiver from template
npm run cli -- create pattern "My Pattern"   # Create pattern from template
```

- **Schema type inference:** auto-detects from directory (`model/` -> system, `standards/` -> standard, etc.)
- **ETag caching:** schemas cached in `~/.aac/cache/schemas/` with ETag validation
- **Exit codes:** 0 = success, 1 = system error, 2 = validation failed
- **Dependencies:** commander, chalk (ajv/ajv-formats already present)

## Git Workflow

- **Always work in a feature branch.** Never commit directly to `main`. Create a descriptive branch (e.g., `standards`, `fix-nav-links`) before making any changes.
- **Ask the user if anything is unclear** before proceeding — do not guess at requirements or make assumptions about ambiguous requests.
- **Before merging to `main`**, run the full verification suite and ensure everything passes:
  ```bash
  npm run test:run           # 348 tests must pass
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
