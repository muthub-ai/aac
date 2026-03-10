#!/usr/bin/env bash
# Build an OPA bundle from the policy workspace.
# Usage: bash scripts/build-bundle.sh
#
# Produces: dist/policies.tar.gz
# This bundle can be loaded by an OPA server or sidecar:
#   opa run --server --bundle dist/policies.tar.gz

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Building OPA policy bundle..."

# Ensure dist directory exists
mkdir -p "$ROOT_DIR/dist"

# Format check
echo "  Checking formatting..."
opa fmt --fail "$ROOT_DIR/rules/"

# Syntax check
echo "  Checking syntax..."
opa check "$ROOT_DIR/rules/"

# Run tests before bundling
echo "  Running tests..."
opa test -v "$ROOT_DIR/rules/"

# Build the bundle
echo "  Creating bundle..."
opa build \
  --bundle "$ROOT_DIR/rules/" \
  --output "$ROOT_DIR/dist/policies.tar.gz"

echo "Bundle created: dist/policies.tar.gz"
echo "  Load with: opa run --server --bundle dist/policies.tar.gz"
