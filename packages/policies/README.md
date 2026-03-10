# @muthub-ai/aac-policies

OPA Rego policies for Architecture as Code enterprise governance.

## Prerequisites

Install the [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/#running-opa) CLI:

```bash
# macOS
brew install opa

# Linux
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64_static
chmod 755 opa && sudo mv opa /usr/local/bin/
```

## Directory Structure

```
packages/policies/
├── data/                      # Static enterprise reference data
│   └── approved-unmanaged-dbs.json
├── rules/
│   ├── security/
│   │   ├── kms.rego           # Cryptography key management policy
│   │   └── kms_test.rego
│   ├── integration/
│   │   ├── gateway.rego       # API gateway integration policy
│   │   └── gateway_test.rego
│   └── finops/
│       ├── rightsizing.rego   # Cloud workload rightsizing policy
│       └── rightsizing_test.rego
└── scripts/
    └── build-bundle.sh        # Build OPA bundle for deployment
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run fmt` | Check Rego formatting (fails on violations) |
| `npm run check` | Syntax check and compile policies |
| `npm test` | Run all unit tests with verbose output |
| `npm run test:coverage` | Run tests with coverage analysis (JSON) |
| `npm run bundle` | Build deployable OPA bundle |

## Policy Domains

### Security — `architecture.security`

**KMS Policy** (`kms.rego`): Containers tagged `sensitive`, `pii`, `phi`, or `pci` must declare encryption using `kms`, `envelope`, or `hsm`.

### Integration — `architecture.integration`

**Gateway Policy** (`gateway.rego`): Containers tagged `external-facing` must be routed through an API gateway (Kong, Apigee, AWS API Gateway, Cloud Endpoints, or Envoy).

### FinOps — `architecture.finops`

**Rightsizing Policy** (`rightsizing.rego`): Production compute deployment nodes must have `autoscaling_enabled` set to `true`.

## Writing Tests

Every policy must have a corresponding `_test.rego` file. Tests use OPA's built-in framework:

```rego
package architecture.finops

import rego.v1

test_compliant_input if {
    mock_input := { ... }
    count(deny) == 0 with input as mock_input
}

test_non_compliant_input if {
    mock_input := { ... }
    count(deny) == 1 with input as mock_input
}
```

## CI Integration

The CI pipeline runs these checks on every PR:

1. `opa fmt --fail .` — formatting compliance
2. `opa check .` — syntax validation
3. `opa test -v ./rules/` — unit tests
4. `opa test --coverage ./rules/` — coverage analysis
