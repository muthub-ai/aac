# METADATA
# title: API Gateway Integration Standard
# description: >
#   Ensures external-facing containers route through an API gateway.
#   Containers tagged "external-facing" must have a relationship from
#   a gateway component, not receive direct external traffic.
# related_resources:
#   - ref: https://aac.muthub.org/standards/api-microservices-integration
# authors:
#   - name: Architecture Governance Team
# scope: package

package architecture.integration

import rego.v1

# Gateway technology keywords
gateway_technologies := {"api gateway", "kong", "apigee", "aws api gateway", "cloud endpoints", "envoy"}

# Check if a container is an API gateway
is_gateway(container) if {
	lower(container.technology) in gateway_technologies
}

is_gateway(container) if {
	tags := split(lower(container.tags), ",")
	some tag in tags
	trim_space(tag) == "gateway"
}

# Check if a container is external-facing
is_external_facing(container) if {
	tags := split(lower(container.tags), ",")
	some tag in tags
	trim_space(tag) == "external-facing"
}

# Collect all gateway container IDs
gateway_ids contains id if {
	some system in input.softwareSystems
	some container in system.containers
	is_gateway(container)
	id := sprintf("%s.%s", [system.id, container.id])
}

# Collect containers that receive traffic from a gateway
served_by_gateway contains dest if {
	some system in input.softwareSystems
	some container in system.containers
	gateway_id := sprintf("%s.%s", [system.id, container.id])
	gateway_id in gateway_ids
	some rel in container.relationships
	dest := rel.destinationId
}

# deny: external-facing containers without gateway routing
deny contains msg if {
	some system in input.softwareSystems
	some container in system.containers
	is_external_facing(container)
	not is_gateway(container)
	container_id := sprintf("%s.%s", [system.id, container.id])
	not container_id in served_by_gateway
	msg := sprintf(
		"Integration Standard Violation: External-facing container '%s.%s' is not routed through an API gateway. All external traffic must pass through an approved gateway.",
		[system.id, container.id],
	)
}
