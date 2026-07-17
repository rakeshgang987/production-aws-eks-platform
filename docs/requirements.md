# Project Requirements

## Project Name

Production AWS EKS Platform

## Objective

Build a production-style cloud platform on AWS using Infrastructure as Code and modern DevOps practices.

The platform will provision, deploy, monitor, and operate containerized applications on Amazon EKS.

## Core Goals

- Provision AWS infrastructure using Terraform.
- Build a secure and highly available VPC architecture.
- Deploy workloads on Amazon EKS.
- Containerize applications using Docker.
- Package Kubernetes applications using Helm.
- Build CI/CD pipelines using GitHub Actions.
- Implement monitoring using Prometheus and Grafana.
- Implement centralized logging using Loki.
- Implement GitOps using ArgoCD.
- Apply cloud and Kubernetes security best practices.
- Use AI-assisted DevOps workflows where appropriate.

## Core Technology Stack

### Cloud

- AWS
- Amazon EKS
- Amazon ECR
- VPC
- IAM
- Route 53
- Application Load Balancer

### Infrastructure as Code

- Terraform

### Containers and Orchestration

- Docker
- Kubernetes
- Helm

### CI/CD

- GitHub Actions

### Monitoring and Observability

- Prometheus
- Grafana
- Alertmanager
- Loki

### GitOps

- ArgoCD

### Security

- IAM
- Kubernetes RBAC
- Network Policies
- Trivy
- Secrets Management

### AI-Assisted DevOps

AI tools may be used to assist with:

- Terraform code review
- Kubernetes troubleshooting
- CI/CD debugging
- Log analysis
- Security analysis
- Documentation

AI assistance will not replace understanding of the underlying infrastructure.

## Project Principles

1. Infrastructure must be reproducible.
2. Infrastructure must be managed as code.
3. Secrets must never be committed to Git.
4. Infrastructure should follow the principle of least privilege.
5. Applications should be containerized.
6. Deployments should be automated.
7. Infrastructure and applications should be observable.
8. Every major component should be documented.
9. The platform should be designed with cost awareness.
10. Every technology used should be understood well enough to explain in an interview.