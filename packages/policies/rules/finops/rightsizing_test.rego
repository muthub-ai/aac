package architecture.finops

import rego.v1

# Test 1: Compliant Production Compute Node
test_production_compute_with_autoscaling_allowed if {
	mock_input := {
		"environment": "Production",
		"deploymentNodes": [{
			"label": "Web Server",
			"technology": "Compute",
			"properties": {"autoscaling_enabled": "true"},
		}],
	}

	count(deny) == 0 with input as mock_input
}

# Test 2: Non-Compliant Production Compute Node
test_production_compute_without_autoscaling_denied if {
	mock_input := {
		"environment": "Production",
		"deploymentNodes": [{
			"label": "Batch Processor",
			"technology": "Compute",
			"properties": {"autoscaling_enabled": "false"},
		}],
	}

	count(deny) == 1 with input as mock_input
	deny["FinOps Standard Violation: Production compute node 'Batch Processor' must have 'autoscaling_enabled' set to 'true'."] with input as mock_input
}

# Test 3: Non-Production Environment — No Enforcement
test_staging_compute_without_autoscaling_allowed if {
	mock_input := {
		"environment": "Staging",
		"deploymentNodes": [{
			"label": "Dev Server",
			"technology": "Compute",
			"properties": {"autoscaling_enabled": "false"},
		}],
	}

	count(deny) == 0 with input as mock_input
}

# Test 4: Production Non-Compute Node — No Enforcement
test_production_storage_without_autoscaling_allowed if {
	mock_input := {
		"environment": "Production",
		"deploymentNodes": [{
			"label": "Object Storage",
			"technology": "Storage",
			"properties": {"autoscaling_enabled": "false"},
		}],
	}

	count(deny) == 0 with input as mock_input
}

# Test 5: Multiple Compute Nodes — Mixed Compliance
test_multiple_nodes_partial_compliance if {
	mock_input := {
		"environment": "Production",
		"deploymentNodes": [
			{
				"label": "App Server",
				"technology": "Compute",
				"properties": {"autoscaling_enabled": "true"},
			},
			{
				"label": "Worker Pool",
				"technology": "Compute",
				"properties": {"autoscaling_enabled": "false"},
			},
		],
	}

	count(deny) == 1 with input as mock_input
}
