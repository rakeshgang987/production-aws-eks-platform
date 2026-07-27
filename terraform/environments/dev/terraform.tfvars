environment = "dev"

vpc_cidr = "10.0.0.0/16"

availability_zones = [
  "ap-south-1a",
  "ap-south-1b"
]

public_subnet_cidrs = [
  "10.0.1.0/24",
  "10.0.2.0/24"
]

private_subnet_cidrs = [
  "10.0.11.0/24",
  "10.0.12.0/24"
]

cluster_name = "dev-eks"

kubernetes_version = "1.33"

node_group_name = "dev-node-group"

frontend_repository_name = "frontend"

backend_repository_name = "backend"