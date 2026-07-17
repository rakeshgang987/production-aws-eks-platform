module "vpc" {
  source = "../../modules/vpc"

  name     = "dev"
  vpc_cidr = "10.0.0.0/16"
}