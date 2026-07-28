# Terraform Environment Documentation

## Overview

Terraform environments define where and how infrastructure is deployed.

In this project, environments are separated from Terraform modules to provide:

- Environment-specific configuration
- Safer deployments
- Better scalability
- Cleaner infrastructure management

Current environment:

```text
terraform/

└── environments/

    └── dev/
```

The environment layer consumes reusable Terraform modules and provides the required configuration values.

---

# Environment Architecture

The Terraform architecture follows this pattern:

```text
Environment Layer

        |
        |
        v

Reusable Modules

        |
        |
        v

AWS Infrastructure
```

Example:

```text
terraform/environments/dev

        |
        |
        +----------------+
        |                |
        v                v

   VPC Module       IAM Module

        |                |
        +-------+--------+

                |
                v

           EKS Module

                |
                v

           ECR Module
```

The environment layer controls:

- Which modules are deployed
- Module configuration
- AWS region
- Resource naming
- Environment-specific values

---

# Why Separate Environments?

A production platform normally contains multiple environments:

```text
Development

        |

Staging

        |

Production
```

Each environment should have independent infrastructure state.

Example:

```text
S3 Terraform State

|
├── dev/
│   └── terraform.tfstate
│
├── staging/
│   └── terraform.tfstate
│
└── production/
    └── terraform.tfstate
```

Benefits:

- Prevent accidental cross-environment changes
- Independent deployments
- Easier troubleshooting
- Better access control

---

# Current Directory Structure

The development environment contains:

```text
terraform/environments/dev/

├── backend.tf

├── main.tf

├── outputs.tf

├── providers.tf

├── terraform.tfvars

└── variables.tf
```

Each file has a specific responsibility.

---

# main.tf

Location:

```text
terraform/environments/dev/main.tf
```

Purpose:

Defines module usage and connects infrastructure components.

The environment calls reusable modules:

```text
main.tf

    |
    |
    +── VPC Module

    |
    +── IAM Module

    |
    +── EKS Module

    |
    +── ECR Module
```

Example:

```hcl
module "vpc" {

 source = "../../modules/vpc"

}
```

The environment does not directly create AWS resources.

Instead, it composes existing modules.

---

# providers.tf

Location:

```text
terraform/environments/dev/providers.tf
```

Purpose:

Defines Terraform providers.

Example:

```hcl
provider "aws" {

 region = var.aws_region

}
```

The AWS provider allows Terraform to communicate with AWS APIs.

---

# backend.tf

Location:

```text
terraform/environments/dev/backend.tf
```

Purpose:

Configures remote Terraform state storage.

Current backend:

```text
AWS S3

+

DynamoDB Locking
```

Configuration:

```hcl
terraform {

 backend "s3" {

   bucket         = "peeter-production-aws-eks-platform-tfstate"

   key            = "dev/terraform.tfstate"

   region         = "ap-south-1"

   dynamodb_table = "production-aws-eks-platform-lock"

   encrypt        = true

 }

}
```

This keeps development infrastructure state isolated.

---

# variables.tf

Location:

```text
terraform/environments/dev/variables.tf
```

Purpose:

Defines configurable environment inputs.

Examples:

```text
AWS Region

Environment Name

Cluster Name

Kubernetes Version

Network Configuration
```

Variables allow the same infrastructure code to support multiple environments.

---

# terraform.tfvars

Location:

```text
terraform/environments/dev/terraform.tfvars
```

Purpose:

Provides actual values for variables.

Example:

```hcl
environment = "dev"

cluster_name = "dev-eks"

aws_region = "ap-south-1"
```

The separation is:

```text
variables.tf

Defines what is required


terraform.tfvars

Provides actual values
```

---

# outputs.tf

Location:

```text
terraform/environments/dev/outputs.tf
```

Purpose:

Exposes useful infrastructure information.

Examples:

```text
VPC ID

Subnet IDs

EKS Cluster Name

EKS Endpoint

ECR Repository URLs
```

Outputs are useful for:

- Kubernetes configuration
- CI/CD pipelines
- Debugging
- Future modules

---

# Variable Flow

Terraform variable flow:

```text
terraform.tfvars

        |

        v

variables.tf

        |

        v

main.tf

        |

        v

Terraform Modules

        |

        v

AWS Resources
```

Example:

```text
cluster_name

        |

        v

EKS Module

        |

        v

Amazon EKS Cluster
```

---

# Module Integration

The development environment connects all modules.

Complete flow:

```text
                Dev Environment


                      |

        +-------------+-------------+

        |             |             |

        v             v             v


      VPC           IAM           ECR


                      |

                      v


                     EKS


                      |

                      v


             Kubernetes Platform
```

---

# Current Dev Infrastructure

The dev environment creates:

## Networking

```text
VPC

├── Public Subnets

├── Private Subnets

├── Internet Gateway

├── NAT Gateway

└── Route Tables
```

---

## Identity

```text
IAM

├── EKS Cluster Role

└── EKS Node Role
```

---

## Kubernetes Platform

```text
EKS

├── Control Plane

└── Managed Node Group
```

---

## Container Registry

```text
ECR

├── Backend Repository

└── Frontend Repository
```

---

# Deployment Workflow

The environment deployment process:

```text
terraform init

        |

        v

terraform validate

        |

        v

terraform plan

        |

        v

terraform apply

        |

        v

AWS Infrastructure
```

---

# Multi-Environment Expansion

Future structure:

```text
terraform/

├── environments/

│
├── dev/

│
├── staging/

│
└── production/
```

All environments reuse the same modules:

```text
modules/

├── vpc

├── iam

├── eks

└── ecr
```

Only values change.

Example:

Development:

```hcl
cluster_name = "dev-eks"
```

Production:

```hcl
cluster_name = "prod-eks"
```

---

# Environment Isolation Strategy

Each environment should have:

## Separate State

Example:

```text
dev/terraform.tfstate

production/terraform.tfstate
```

---

## Separate Variables

Example:

```text
dev.tfvars

production.tfvars
```

---

## Separate AWS Resources

Example:

```text
dev-vpc

prod-vpc
```

This prevents accidental infrastructure changes.

---

# Best Practices

## Keep Modules Generic

Modules should not contain:

- Environment names
- Hardcoded values
- Deployment-specific settings

---

## Keep Environment Configuration Separate

Environment folders should control:

- Naming
- Sizing
- Region
- Scaling settings

---

## Use Remote State

Each environment should use:

- S3 backend
- DynamoDB locking
- Encryption

---

# Future Improvements

Possible improvements:

## Multiple AWS Accounts

Recommended architecture:

```text
AWS Organization

├── Dev Account

├── Staging Account

└── Production Account
```

---

## Workspace or Folder Strategy

For larger platforms:

Options:

- Terraform workspaces
- Separate environment folders
- Terragrunt

---

## Environment-Specific Security

Future additions:

- Separate IAM permissions
- Different network policies
- Different cluster configurations

---

# Summary

The environment layer provides the connection between reusable Terraform modules and real AWS deployments.

Implemented:

```text
✅ Dev environment structure

✅ Module integration

✅ Remote backend configuration

✅ Variable management

✅ Infrastructure outputs
```

This design allows the platform to scale from a single development environment into a complete multi-environment AWS EKS platform.