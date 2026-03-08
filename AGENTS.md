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

## Key Conventions

- Semantic Tailwind CSS tokens (light/dark themes via CSS custom properties in globals.css)
- No hardcoded hex colors in components — use `var(--token)` or Tailwind classes
- No `any` types, no `console.log` in production code
- Accessibility: all images have alt text, all buttons have aria-labels
