# Terraform Modules Documentation

## Overview

Terraform modules are the foundation of reusable Infrastructure as Code.

In this project, Terraform infrastructure is organized into independent modules:

```text
terraform/

├── modules/

│
├── vpc/
│
├── iam/
│
├── eks/
│
└── ecr/
```

Each module has its own responsibility and can be reused across different environments.

The goal of this design is to create:

- Maintainable infrastructure code
- Reusable components
- Clear separation of responsibilities
- Easier environment management
- Production-style Terraform architecture

---

# Why Terraform Modules?

Without modules, all resources would exist in one large Terraform file.

Example:

```text
main.tf

|
├── VPC resources
├── IAM resources
├── EKS resources
├── ECR resources
└── Security resources
```

Problems:

- Difficult to maintain
- Hard to troubleshoot
- Less reusable
- Difficult for teams to collaborate

---

With modules:

```text
Environment

terraform/environments/dev

        |
        |
        v


Modules

├── VPC
├── IAM
├── EKS
└── ECR
```

Benefits:

- Each component has clear ownership
- Changes are isolated
- Code can be reused
- Easier testing and review

---

# Module Architecture

The project follows a standard Terraform module structure:

```text
terraform/modules/

module-name/

├── main.tf
├── variables.tf
└── outputs.tf
```

## main.tf

Contains:

- Resource definitions
- Infrastructure logic
- Terraform configuration

Example:

```hcl
resource "aws_vpc" "this" {

}
```

---

## variables.tf

Defines module inputs.

Example:

```hcl
variable "vpc_cidr" {

  type = string

}
```

Variables make modules configurable.

---

## outputs.tf

Defines values exposed to other modules.

Example:

```hcl
output "vpc_id" {

 value = aws_vpc.this.id

}
```

Outputs allow modules to communicate with each other.

---

# Module Communication Flow

The Terraform dependency flow:

```text
              Environment

                  |
                  |
                  v


              VPC Module

                  |
                  |
        +---------+---------+

        |                   |

        v                   v

   IAM Module          EKS Module


        |
        |
        v

    ECR Module
```

The environment layer connects modules together.

Modules do not directly depend on each other unless required.

---

# VPC Module

Location:

```text
terraform/modules/vpc
```

Purpose:

Creates AWS networking foundation for the platform.

---

## Resources Created

The VPC module creates:

```text
VPC

|
├── Internet Gateway
|
├── Public Subnets
|
├── Private Subnets
|
├── NAT Gateway
|
├── Elastic IP
|
├── Public Route Table
|
├── Private Route Table
|
└── Route Associations
```

---

## VPC Module Inputs

Examples:

```text
name

vpc_cidr

availability_zones

public_subnet_cidrs

private_subnet_cidrs
```

These allow different environments to customize networking.

Example:

Development:

```text
10.0.0.0/16
```

Production:

```text
10.10.0.0/16
```

---

## VPC Module Outputs

The module exposes:

```text
vpc_id

public_subnet_ids

private_subnet_ids
```

These values are consumed by other modules.

Example:

```text
VPC Module

private_subnet_ids

        |
        v

EKS Module
```

---

# IAM Module

Location:

```text
terraform/modules/iam
```

Purpose:

Creates AWS IAM roles required by Amazon EKS.

---

## Resources Created

```text
IAM Module

|
├── EKS Cluster Role
|
├── EKS Node Role
|
├── Cluster Policy Attachments
|
└── Node Policy Attachments
```

---

## EKS Cluster Role

Used by:

```text
EKS Control Plane
```

Required permissions:

- Manage AWS resources needed by EKS
- Control Kubernetes API infrastructure

---

## Worker Node Role

Used by:

```text
EC2 Worker Nodes
```

Required permissions:

- Kubernetes networking
- Container registry access
- Worker node operations

---

## IAM Outputs

The module exposes:

```text
cluster_role_arn

node_role_arn
```

These values are passed to the EKS module.

---

# EKS Module

Location:

```text
terraform/modules/eks
```

Purpose:

Creates the Amazon EKS Kubernetes platform.

---

## Resources Created

```text
EKS Module

|
├── EKS Cluster
|
└── Managed Node Group
```

---

## EKS Cluster

Responsible for:

- Kubernetes API server
- Control plane management
- Kubernetes cluster operations

---

## Managed Node Group

Provides:

- Worker nodes
- EC2 instances
- Kubernetes workload execution

Current architecture:

```text
EKS Control Plane

        |
        |
        v

Managed Node Group

        |
        |
        v

EC2 Instances
```

---

## EKS Module Inputs

Examples:

```text
cluster_name

kubernetes_version

subnet_ids

cluster_role_arn
```

---

## EKS Module Outputs

The module exposes:

```text
cluster_name

cluster_endpoint

cluster_arn
```

These outputs are later used for:

- kubectl configuration
- Kubernetes deployment
- CI/CD integration

---

# ECR Module

Location:

```text
terraform/modules/ecr
```

Purpose:

Creates Amazon Elastic Container Registry repositories.

---

## Resources Created

```text
ECR Module

|
├── Backend Repository
|
└── Frontend Repository
```

---

## Backend Repository

Stores:

```text
Backend Docker Images
```

Example:

```text
backend:v1
backend:v2
```

---

## Frontend Repository

Stores:

```text
Frontend Docker Images
```

Example:

```text
frontend:v1
frontend:v2
```

---

## ECR Outputs

The module exposes repository URLs.

Example:

```text
backend_repository_url

frontend_repository_url
```

These URLs are used by:

- Docker push operations
- Kubernetes deployments
- CI/CD pipelines

---

# Module Dependency Graph

Complete Terraform dependency flow:

```text
                 Environment

                      |
                      |

        +-------------+-------------+

        |                           |

        v                           v


       VPC                         IAM


        |                           |

        |                           |

        +-------------+-------------+

                      |

                      v


                    EKS


                      |

                      v


                    ECR
```

---

# Environment Usage

Modules are called from:

```text
terraform/environments/dev/main.tf
```

Example:

```hcl
module "vpc" {

 source = "../../modules/vpc"

}
```

The environment controls:

- Module selection
- Variable values
- Deployment configuration

---

# Reusability Across Environments

The same modules can support:

```text
terraform/

environments/

├── dev

├── staging

└── production
```

Example:

Same VPC module:

```text
modules/vpc
```

Different values:

```text
dev.tfvars

production.tfvars
```

This avoids duplicate infrastructure code.

---

# Module Design Principles Used

## Single Responsibility

Each module has one purpose.

Example:

```text
VPC Module
only manages networking
```

---

## Inputs and Outputs

Modules communicate through defined interfaces.

Example:

```text
VPC

outputs subnet IDs

        |

        v

EKS

uses subnet IDs
```

---

## Loose Coupling

Modules do not contain unnecessary dependencies.

This improves:

- Testing
- Maintenance
- Future changes

---

# Production Improvements

Future improvements for these modules:

## Common Tag Management

Introduce centralized tagging:

```text
Environment

ManagedBy

Project
```

---

## Variable Validation

Add validation rules for:

- CIDR blocks
- Kubernetes versions
- Resource names

---

## Enhanced IAM Security

Future improvements:

- IRSA integration
- Least privilege policies
- Custom IAM policies

---

## Advanced EKS Features

Possible additions:

- Karpenter
- Private API endpoint
- Cluster logging
- Security groups for pods

---

# Summary

The Terraform module architecture provides a scalable foundation for AWS infrastructure.

Implemented modules:

```text
✅ VPC

✅ IAM

✅ EKS

✅ ECR
```

The modular approach provides:

- Reusable infrastructure
- Cleaner code organization
- Environment scalability
- Easier maintenance
- Production-style Terraform design

This structure allows the platform to grow from a development environment into a multi-environment AWS EKS platform.