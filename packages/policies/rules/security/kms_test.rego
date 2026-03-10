package architecture.security

import rego.v1

# Test 1: Sensitive Container WITH KMS — Compliant
test_sensitive_container_with_kms_allowed if {
	mock_input := {"softwareSystems": [{
		"id": "PaymentService",
		"containers": [{
			"id": "PaymentDB",
			"tags": "database, sensitive",
			"properties": {"encryption": "kms"},
		}],
	}]}

	count(deny) == 0 with input as mock_input
}

# Test 2: Sensitive Container WITHOUT Encryption — Violation
test_sensitive_container_without_encryption_denied if {
	mock_input := {"softwareSystems": [{
		"id": "PaymentService",
		"containers": [{
			"id": "PaymentDB",
			"tags": "database, pii",
			"properties": {},
		}],
	}]}

	count(deny) == 1 with input as mock_input
}

# Test 3: Sensitive Container with Invalid Encryption — Violation
test_sensitive_container_with_invalid_encryption_denied if {
	mock_input := {"softwareSystems": [{
		"id": "PaymentService",
		"containers": [{
			"id": "PaymentDB",
			"tags": "database, sensitive",
			"properties": {"encryption": "aes-256-local"},
		}],
	}]}

	count(deny) == 1 with input as mock_input
}

# Test 4: Non-Sensitive Container Without Encryption — Allowed
test_non_sensitive_container_without_encryption_allowed if {
	mock_input := {"softwareSystems": [{
		"id": "WebApp",
		"containers": [{
			"id": "Frontend",
			"tags": "webapp",
			"properties": {},
		}],
	}]}

	count(deny) == 0 with input as mock_input
}

# Test 5: Envelope Encryption — Compliant
test_envelope_encryption_allowed if {
	mock_input := {"softwareSystems": [{
		"id": "DataPlatform",
		"containers": [{
			"id": "DataWarehouse",
			"tags": "database, phi",
			"properties": {"encryption": "envelope"},
		}],
	}]}

	count(deny) == 0 with input as mock_input
}

# Test 6: HSM Encryption — Compliant
test_hsm_encryption_allowed if {
	mock_input := {"softwareSystems": [{
		"id": "CryptoService",
		"containers": [{
			"id": "KeyVault",
			"tags": "sensitive, pci",
			"properties": {"encryption": "hsm"},
		}],
	}]}

	count(deny) == 0 with input as mock_input
}
