# METADATA
# title: Cloud Workload Resource Rightsizing
# description: >
#   Ensures production compute deployment nodes have autoscaling enabled.
#   Applies to nodes with technology "Compute" in a "Production" environment.
# related_resources:
#   - ref: https://aac.muthub.org/standards/cloud-rightsizing
# authors:
#   - name: Architecture Governance Team
# scope: package

package architecture.finops

import rego.v1

# deny produces a set of violation messages.
# Each rule that contributes to deny adds a descriptive string.

deny contains msg if {
	some node in input.deploymentNodes
	lower(input.environment) == "production"
	lower(node.technology) == "compute"
	node.properties.autoscaling_enabled != "true"
	msg := sprintf(
		"FinOps Standard Violation: Production compute node '%s' must have 'autoscaling_enabled' set to 'true'.",
		[node.label],
	)
}
