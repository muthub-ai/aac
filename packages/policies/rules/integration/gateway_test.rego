package architecture.integration

import rego.v1

# Test 1: External-Facing Container Behind Gateway — Compliant
test_external_container_behind_gateway_allowed if {
	mock_input := {"softwareSystems": [{
		"id": "ECommerce",
		"containers": [
			{
				"id": "ApiGateway",
				"technology": "Kong",
				"tags": "gateway",
				"relationships": [{"destinationId": "ECommerce.WebApp"}],
			},
			{
				"id": "WebApp",
				"technology": "React",
				"tags": "webapp, external-facing",
				"relationships": [],
			},
		],
	}]}

	count(deny) == 0 with input as mock_input
}

# Test 2: External-Facing Container WITHOUT Gateway — Violation
test_external_container_without_gateway_denied if {
	mock_input := {"softwareSystems": [{
		"id": "ECommerce",
		"containers": [{
			"id": "WebApp",
			"technology": "React",
			"tags": "webapp, external-facing",
			"relationships": [],
		}],
	}]}

	count(deny) == 1 with input as mock_input
}

# Test 3: Internal Container Without Gateway — Allowed
test_internal_container_without_gateway_allowed if {
	mock_input := {"softwareSystems": [{
		"id": "ECommerce",
		"containers": [{
			"id": "OrderService",
			"technology": "Java",
			"tags": "microservice",
			"relationships": [],
		}],
	}]}

	count(deny) == 0 with input as mock_input
}

# Test 4: Gateway Itself Tagged External-Facing — Not a Violation
test_gateway_itself_external_facing_allowed if {
	mock_input := {"softwareSystems": [{
		"id": "ECommerce",
		"containers": [{
			"id": "ApiGateway",
			"technology": "Apigee",
			"tags": "gateway, external-facing",
			"relationships": [{"destinationId": "ECommerce.WebApp"}],
		}],
	}]}

	count(deny) == 0 with input as mock_input
}

# Test 5: Multiple External Containers — Partial Compliance
test_multiple_external_containers_partial if {
	mock_input := {"softwareSystems": [{
		"id": "Platform",
		"containers": [
			{
				"id": "Gateway",
				"technology": "AWS API Gateway",
				"tags": "gateway",
				"relationships": [{"destinationId": "Platform.AdminUI"}],
			},
			{
				"id": "AdminUI",
				"technology": "React",
				"tags": "webapp, external-facing",
				"relationships": [],
			},
			{
				"id": "PublicAPI",
				"technology": "Node.js",
				"tags": "api, external-facing",
				"relationships": [],
			},
		],
	}]}

	count(deny) == 1 with input as mock_input
}
