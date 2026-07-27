module "vpc" {
  source = "../../modules/vpc"

  name     = var.environment
  vpc_cidr = var.vpc_cidr

  availability_zones = var.availability_zones

  public_subnet_cidrs = var.public_subnet_cidrs

  private_subnet_cidrs = var.private_subnet_cidrs
}

module "iam" {
  source = "../../modules/iam"

  name = var.environment
}

module "eks" {
  source = "../../modules/eks"

  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version

  subnet_ids       = module.vpc.private_subnet_ids
  cluster_role_arn = module.iam.eks_cluster_role_arn

  node_group_name = var.node_group_name
  node_role_arn   = module.iam.eks_node_role_arn
}

module "ecr_frontend" {
  source = "../../modules/ecr"

  repository_name = var.frontend_repository_name
}

module "ecr_backend" {
  source = "../../modules/ecr"

  repository_name = var.backend_repository_name
}