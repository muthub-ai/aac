# @muthub-ai/aac

**Architecture as Code CLI** — validate, scaffold, and manage architecture artifacts from the command line.

## Install

```bash
# npm (global)
npm install -g @muthub-ai/aac

# npx (no install)
npx @muthub-ai/aac validate model/

# Standalone binary (no Node.js required)
# Download from GitHub Releases: https://github.com/muthub-ai/aac/releases
```

## Commands

### `aac validate <path>`

Validate YAML/JSON files against live JSON Schema definitions.

```bash
aac validate model/                        # All system YAML in model/
aac validate standards/                    # All standards
aac validate waivers/                      # All waivers
aac validate patterns/                     # All patterns
aac validate file.yaml --type standard     # Single file with explicit type
aac validate standards/ --output json      # Machine-readable JSON output
aac validate standards/ --force-refresh    # Bypass schema cache
```

**Features:**
- Auto-infers schema type from directory name (`model/` -> system, `standards/` -> standard, etc.)
- Recursively validates all `.yaml`, `.yml`, `.json` files in directories
- ETag caching for remote schemas (stored in `~/.aac/cache/schemas/`)
- Offline fallback to cached schemas when network is unavailable
- JSON output mode for CI/CD integration

**Exit codes:**
| Code | Meaning |
|------|---------|
| 0 | All files valid |
| 1 | System error (bad arguments, missing files, schema fetch failure) |
| 2 | Validation failed (one or more files invalid) |

### `aac init`

Scaffold a new Architecture-as-Code project structure.

```bash
aac init
```

Creates:
```
.aacrc              # Configuration file
model/              # System architecture YAML
patterns/           # Architecture patterns
standards/          # Architecture standards
waivers/            # Exception waivers
schema/             # Local schema overrides
```

### `aac create <type> [name]`

Generate boilerplate YAML from templates.

```bash
aac create system "Payment Service"        # model/payment-service/system.yaml + metadata.json
aac create pattern "Circuit Breaker"       # patterns/circuit-breaker/pattern.yaml
aac create standard "API Security"         # standards/api-security.yaml
aac create waiver "Legacy Auth Bypass"     # waivers/legacy-auth-bypass.yaml
```

**Supported types:** `system`, `pattern`, `standard`, `waiver`

## Configuration

The `.aacrc` file (JSON) configures the CLI:

```json
{
  "schemaBaseUrl": "https://raw.githubusercontent.com/muthub-ai/aac/main/schema",
  "cacheDirName": ".aac",
  "defaultBranch": "main"
}
```

| Field | Description | Default |
|-------|-------------|---------|
| `schemaBaseUrl` | Base URL for fetching JSON Schema files | GitHub raw URL |
| `cacheDirName` | Directory name for schema cache (under `$HOME`) | `.aac` |
| `defaultBranch` | Git branch for schema URLs | `main` |

## Standalone Binary

Pre-built binaries are available for:

| Platform | Architecture |
|----------|-------------|
| Linux | x64, ARM64 |
| macOS | Apple Silicon (ARM64), Intel (x64) |
| Windows | x64 |

Download from [GitHub Releases](https://github.com/muthub-ai/aac/releases), extract the archive, and add the directory to your `PATH`.

The binary ships with a `templates/` folder — keep it alongside the `aac` executable.

## Development

```bash
# From the repo root
npm run cli -- validate model/      # Run via tsx (development)

# Build the npm package
cd cli && npm run build             # Compile TS -> JS + copy templates

# Build standalone binary (requires Bun)
cd cli && bun run scripts/build-binary.js
```

## License

MIT
