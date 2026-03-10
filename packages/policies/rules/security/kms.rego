# METADATA
# title: Cryptography Key Management Standard
# description: >
#   Ensures containers handling sensitive data declare KMS encryption.
#   Containers tagged "sensitive" or "pii" must have encryption property
#   set to "kms" or "envelope".
# related_resources:
#   - ref: https://aac.muthub.org/standards/cryptography-key-management
# authors:
#   - name: Architecture Governance Team
# scope: package

package architecture.security

import rego.v1

# Sensitive tags that require encryption
sensitive_tags := {"sensitive", "pii", "phi", "pci"}

# Acceptable encryption methods
valid_encryption := {"kms", "envelope", "hsm"}

# Check if a container has any sensitive tag
container_is_sensitive(container) if {
	tags := split(lower(container.tags), ",")
	some tag in tags
	trim_space(tag) in sensitive_tags
}

# deny produces violation messages for unencrypted sensitive containers
deny contains msg if {
	some system in input.softwareSystems
	some container in system.containers
	container_is_sensitive(container)
	not container.properties.encryption
	msg := sprintf(
		"Security Standard Violation: Container '%s.%s' handles sensitive data but has no encryption configured. Set 'encryption' to 'kms', 'envelope', or 'hsm'.",
		[system.id, container.id],
	)
}

deny contains msg if {
	some system in input.softwareSystems
	some container in system.containers
	container_is_sensitive(container)
	container.properties.encryption
	not lower(container.properties.encryption) in valid_encryption
	msg := sprintf(
		"Security Standard Violation: Container '%s.%s' uses encryption method '%s' which is not approved. Must use one of: kms, envelope, hsm.",
		[system.id, container.id, container.properties.encryption],
	)
}
