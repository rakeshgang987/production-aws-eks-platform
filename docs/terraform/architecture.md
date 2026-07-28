# Terraform Architecture

## Overview

The Terraform architecture for the `production-aws-eks-platform` project is designed using a modular and environment-based approach.

The goal is to create a scalable AWS infrastructure foundation that can support Kubernetes workloads while following Infrastructure as Code (IaC) best practices.

The architecture separates:

- Bootstrap infrastructure
- Reusable Terraform modules
- Environment-specific configurations

This separation improves maintainability, scalability, and safety when managing cloud infrastructure.

---

# High-Level Architecture

The Terraform architecture follows this flow:

```text
Developer
    |
    |
Terraform Configuration
    |
    |
Terraform Modules
    |
    |
AWS Infrastructure
    |
    |
    +----------------+
    |                |
    v                v
 Networking       Kubernetes Platform

 VPC              EKS
 IAM              Node Groups
 ECR
```

Terraform acts as the single source of truth for AWS infrastructure.

---

# Terraform Project Design

The Terraform project is divided into three main layers:

```text
terraform/
|
├── bootstrap/
|
├── modules/
|
└── environments/
```

Each layer has a specific responsibility.

---

# Bootstrap Layer

## Purpose

The bootstrap layer creates the foundation required for Terraform remote state management.

The bootstrap project is independent from the main infrastructure because it manages the resources Terraform depends on.

Architecture:

```text
terraform/bootstrap

        |
        |
        +----------------+
        |                |
        v                v

    Amazon S3       DynamoDB

 Terraform State   State Locking
```

Resources created:

- S3 bucket for Terraform state storage
- DynamoDB table for state locking

---

## Why Separate Bootstrap?

The bootstrap project is separated because of dependency management.

Terraform infrastructure requires a backend to store state.

However, the backend itself must be created before Terraform can use it.

The order is:

```text
Create Bootstrap Resources

        |
        v

Configure Remote Backend

        |
        v

Deploy AWS Infrastructure
```

This prevents circular dependencies.

---

# Remote State Architecture

Terraform state contains information about managed infrastructure.

Instead of storing state locally:

```text
terraform.tfstate
        |
        |
        v

Developer Machine
```

The project uses remote state:

```text
Terraform

    |
    |
    v

Amazon S3 Bucket

    |
    |
    +---- State File


DynamoDB

    |
    |
    +---- State Lock
```

Benefits:

- Centralized state management
- Team collaboration support
- Protection against concurrent changes
- State recovery using S3 versioning

---

# Module Architecture

Terraform infrastructure is organized into reusable modules.

Current modules:

```text
modules/

├── vpc/
├── iam/
├── ecr/
└── eks/
```

Each module has:

```text
module/

├── main.tf
├── variables.tf
└── outputs.tf
```

This provides:

- Clear responsibility separation
- Reusable infrastructure components
- Easier testing and maintenance

---

# Module Communication

Modules communicate using variables and outputs.

Example:

```text
VPC Module

Creates:

- VPC
- Subnets
- Networking


        |
        |
        v


EKS Module

Receives:

- Private subnet IDs
- VPC information
```

The EKS module does not create or search for networking resources.

It consumes outputs provided by the VPC module.

This keeps modules independent and reusable.

---

# VPC Architecture

The VPC module creates the AWS networking foundation.

Architecture:

```text
AWS VPC
|
|
+-- Public Subnets
|       |
|       +-- Internet Gateway
|
|
+-- Private Subnets
        |
        +-- NAT Gateway
        |
        +-- EKS Worker Nodes
```

Components:

- VPC
- Public subnets
- Private subnets
- Internet Gateway
- NAT Gateway
- Route tables
- Route table associations

---

# IAM Architecture

The IAM module creates permissions required by Amazon EKS.

Architecture:

```text
IAM Module

      |
      |
      +----------------+
      |                |
      v                v

EKS Cluster Role   Worker Node Role
```

Cluster role:

Used by the EKS control plane.

Worker node role:

Used by EC2 worker nodes running Kubernetes workloads.

Attached permissions include:

- EKS cluster permissions
- Worker node permissions
- Amazon VPC CNI permissions
- ECR image pull permissions

---

# ECR Architecture

The ECR module provides private container registries.

Architecture:

```text
Application Source

        |
        |
        v

Docker Image

        |
        |
        v

Amazon ECR

        |
        |
        v

Kubernetes Deployment
```

Repositories created:

- Frontend repository
- Backend repository

These repositories will store application container images.

---

# EKS Architecture

The EKS module creates the Kubernetes platform.

Architecture:

```text
Amazon EKS

    |
    |
    +----------------+
    |                |
    v                v

Control Plane    Managed Node Group

                 |
                 |
                 v

             Kubernetes Pods
```

Implemented components:

- EKS cluster
- Managed node group
- Kubernetes networking integration

---

# Environment Architecture

Terraform uses environment-specific configurations.

Current structure:

```text
terraform/

└── environments/

    └── dev/
```

The environment contains:

- Provider configuration
- Backend configuration
- Module references
- Environment variables
- Outputs

Future expansion:

```text
terraform/

└── environments/

    ├── dev/
    |
    ├── staging/
    |
    └── production/
```

The same modules can be reused across environments.

---

# Design Decisions

## Modular Terraform Design

Modules were used to avoid duplicate infrastructure code.

Benefits:

- Easier maintenance
- Reusable components
- Cleaner architecture

---

## Managed Node Groups Instead of Karpenter

The project uses Amazon EKS managed node groups.

Reason:

The current goal is to establish a reliable Kubernetes foundation.

Karpenter will be considered as a future improvement for dynamic node provisioning.

---

## IRSA as Future Improvement

The current IAM implementation provides the required EKS foundation.

IRSA (IAM Roles for Service Accounts) will be added later for workload-level AWS permissions.

Future model:

```text
Application Pod

      |
      v

Kubernetes Service Account

      |
      v

IAM Role

      |
      v

Specific AWS Permissions
```

This provides better least-privilege security.

---

## Single NAT Gateway for Development

The development environment uses a single NAT Gateway.

Reason:

- Lower AWS cost
- Suitable for learning and portfolio environment

Production environments may use multiple NAT Gateways across Availability Zones for higher availability.

---

# Future Improvements

Possible future Terraform improvements:

## Security

- IRSA implementation
- Least privilege IAM policies
- Secrets Manager integration
- Network policies

## Scalability

- Karpenter integration
- Multi-environment deployment
- Multi-account AWS architecture

## Operations

- Terraform CI/CD pipeline
- Policy as Code
- Automated security scanning

---

# Summary

The Terraform architecture provides a production-style AWS foundation using:

- Modular Terraform design
- Remote state management
- Environment separation
- Reusable infrastructure components

This foundation is designed to support the next layers of the platform:

- Kubernetes deployments
- Helm
- GitHub Actions
- ArgoCD
- Monitoring