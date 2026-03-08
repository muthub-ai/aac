# Architecture as Code (aac)

An interactive, browser-based C4 architecture diagram designer with bi-directional YAML editing.

## Features

- **Split-pane layout** — Monaco YAML editor on the left, React Flow canvas on the right
- **Bi-directional sync** — Edit YAML to update the diagram, or drag nodes and draw connections to update the YAML
- **C4 Model node types** — Person, Software System, Container, and Component with standard C4 color coding
- **Auto layout** — Dagre-powered automatic graph layout
- **Live parsing** — Instant YAML parsing with error feedback

## Tech Stack

- **React** + **TypeScript** + **Vite**
- **@xyflow/react** — Node canvas for the visual diagram
- **@monaco-editor/react** — VS Code editor for the YAML pane
- **Zustand** — State management across both panes
- **js-yaml** — YAML parsing and serialization
- **@dagrejs/dagre** — Automatic directed-graph layout
- **Allotment** — Resizable split panes

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
  types/          # C4 domain types and YAML schema types
  store/          # Zustand state store
  parser/         # YAML <-> Graph conversion
  layout/         # Dagre auto-layout engine
  constants/      # C4 color palette
  utils/          # Debounce, sample YAML
  components/
    nodes/        # Custom React Flow node components
    EditorPane    # Monaco editor wrapper
    CanvasPane    # React Flow canvas wrapper
    Toolbar       # Top toolbar
```

## License

MIT
