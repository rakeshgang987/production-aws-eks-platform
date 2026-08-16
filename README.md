# Production AWS EKS Platform

A production-style DevOps platform built as a single monorepo. The project demonstrates the complete lifecycle of a containerized application — from application development and containerization to infrastructure provisioning, Kubernetes, Helm, CI/CD, GitOps, observability, security, and AI-assisted DevOps operations.

The platform is developed incrementally. Each milestone is designed, implemented, tested, troubleshot, documented, and validated before moving to the next stage.

---

## 🎯 Project Objective

The goal is to build a production-oriented DevOps platform using modern cloud-native practices and understand the engineering decisions behind each layer.

The platform covers:

* Application development
* Docker and Docker Compose
* Terraform Infrastructure as Code
* AWS VPC networking
* Amazon ECR
* Amazon EKS
* Kubernetes
* Helm
* GitHub Actions CI/CD
* ArgoCD GitOps
* Prometheus
* Grafana
* Loki
* Security engineering
* Troubleshooting and validation
* AI-assisted DevOps workflows

Development and validation are performed locally whenever possible before moving workloads to AWS EKS. This reduces unnecessary cloud costs while allowing each platform layer to be tested independently.

---

## 🏗️ High-Level Architecture

The long-term platform architecture is:

```text
                              Users
                                │
                                ▼
                         ┌──────────────┐
                         │   Ingress    │
                         └──────┬───────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
                  ▼                           ▼
          ┌──────────────┐            ┌──────────────┐
          │   Frontend   │            │ Backend API  │
          │ React + Nginx│            │Node + Express│
          └──────────────┘            └──────┬───────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │  PostgreSQL  │
                                      └──────────────┘

                           Amazon EKS
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
           Helm               ArgoCD        Observability
                                                  │
                                       ┌──────────┼──────────┐
                                       │          │          │
                                       ▼          ▼          ▼
                                   Prometheus  Grafana     Loki
```

The complete platform is being implemented in phases rather than deploying everything simultaneously.

---

## 🏠 Current Local Architecture

The application has been developed and validated locally using Docker Compose and Kubernetes/Minikube.

### Docker Compose

```text
┌─────────────────────────────────────────────────────┐
│              Docker Compose Environment             │
│                                                     │
│  ┌──────────────┐      ┌──────────────┐             │
│  │   Frontend   │─────▶│ Backend API  │             │
│  │ React + Nginx│      │ Node + Express│            │
│  │    :5173     │      │    :3000     │             │
│  └──────────────┘      └──────┬───────┘             │
│                               │                     │
│                               ▼                     │
│                       ┌──────────────┐              │
│                       │  PostgreSQL  │              │
│                       │    :5432     │              │
│                       └──────────────┘              │
│                                                     │
│            Docker Network + Persistent Volume       │
└─────────────────────────────────────────────────────┘
```

### Kubernetes / Helm

```text
                         Ingress
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
          Frontend Service       Backend Service
                 │                     │
                 ▼                     ▼
          Frontend Pods           Backend Pods
                                       │
                                       ▼
                              PostgreSQL Service
                                       │
                                       ▼
                              PostgreSQL Pod
                                       │
                                       ▼
                              Persistent Storage
```

The Kubernetes application stack is packaged using Helm and validated locally with Minikube.

---

## ☸️ Kubernetes Platform

The Kubernetes layer follows production-oriented design principles:

* Namespace isolation
* Deployments for stateless frontend/backend workloads
* StatefulSet for PostgreSQL
* Kubernetes Services for application communication
* Persistent storage for PostgreSQL
* Resource requests and limits
* Horizontal Pod Autoscaling
* NetworkPolicies
* RBAC and ServiceAccounts
* ResourceQuota and LimitRange
* Pod Security Standards
* Kyverno admission policies
* Health probes
* Ingress routing

Detailed Kubernetes architecture and implementation information is maintained under [`docs/kubernetes/`](docs/kubernetes/).

---

## 📦 Helm

The Kubernetes application stack has been packaged into a reusable Helm chart.

```text
helm/
├── Chart.yaml
├── values.yaml
├── .helmignore
└── templates/
```

The chart manages the application resources required by the platform, including workloads, Services, Ingress, configuration, security, autoscaling, networking, RBAC, resource governance, and persistent storage.

The Helm implementation has been validated locally using:

```text
helm lint
      ↓
helm template
      ↓
kubectl dry-run
      ↓
helm upgrade --install
      ↓
rollout validation
      ↓
Ingress/API testing
```

Detailed Helm documentation is available under [`docs/helm/`](docs/helm/).

---

## 🔗 Platform Flow

The overall engineering flow is:

```text
Application
    ↓
Docker
    ↓
Terraform
    ↓
AWS Infrastructure
    ↓
Kubernetes
    ↓
Helm
    ↓
GitHub Actions
    ↓
Amazon ECR
    ↓
ArgoCD
    ↓
Amazon EKS
    ↓
Prometheus + Grafana + Loki
```
## 📁 Repository Structure

```text
production-aws-eks-platform/
│
├── application/
│   ├── backend/
│   ├── frontend/
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── terraform/
│   ├── bootstrap/
│   ├── environments/
│   │   └── dev/
│   └── modules/
│       ├── ecr/
│       ├── eks/
│       ├── iam/
│       └── vpc/
│
├── kubernetes/
│   ├── autoscaling/
│   ├── backend/
│   ├── frontend/
│   ├── ingress/
│   ├── namespace/
│   ├── networkpolicy/
│   ├── policies/
│   ├── postgres/
│   ├── rbac/
│   ├── resource-management/
│   └── secrets/
│
├── helm/
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── .helmignore
│   └── templates/
│
├── docs/
│   ├── architecture/
│   ├── docker/
│   ├── helm/
│   ├── kubernetes/
│   ├── terraform/
│   └── requirements.md
│
├── scripts/
│
└── README.md
```

---

## 🧰 Technology Stack

### Application

* Node.js
* Express
* React
* Vite
* PostgreSQL

### Containers

* Docker
* Docker Compose
* Nginx
* Alpine Linux-based images

### Cloud & Infrastructure

* AWS
* Terraform
* Amazon VPC
* Amazon ECR
* Amazon EKS

### Kubernetes

* Kubernetes
* Helm
* NGINX Ingress
* Horizontal Pod Autoscaler
* NetworkPolicies
* RBAC
* Kyverno

### CI/CD & GitOps

* GitHub Actions
* ArgoCD

### Observability

* Prometheus
* Grafana
* Loki

---

# 🚀 Project Roadmap

## Phase 1 — Application ✅

* [x] Backend API foundation
* [x] Health endpoint
* [x] Products API
* [x] Product creation API
* [x] PostgreSQL integration
* [x] React frontend
* [x] Frontend/backend communication
* [x] CORS configuration
* [x] Application documentation

## Phase 2 — Containerization ✅

* [x] Backend Dockerfile
* [x] Frontend multi-stage Dockerfile
* [x] Nginx runtime
* [x] Non-root containers
* [x] PostgreSQL container
* [x] Docker Compose
* [x] Container networking
* [x] Persistent PostgreSQL storage
* [x] Health checks
* [x] Docker troubleshooting and documentation
* [ ] Final container security review

## Phase 3 — AWS Infrastructure ✅

* [x] Terraform project structure
* [x] Remote backend
* [x] Terraform bootstrap
* [x] Reusable modules
* [x] Environment-based structure
* [x] AWS provider configuration
* [x] Variables and outputs
* [x] Terraform validation and planning
* [x] AWS VPC
* [x] Public/private subnets
* [x] Internet Gateway
* [x] NAT Gateway
* [x] Elastic IP
* [x] Route tables
* [x] Security groups
* [x] IAM
* [x] Amazon ECR
* [x] Amazon EKS module integration
* [x] Terraform testing and documentation

## Phase 4 — Kubernetes ✅

* [x] Namespace
* [x] ConfigMaps and Secrets
* [x] PostgreSQL StatefulSet
* [x] PostgreSQL Services
* [x] Backend Deployment and Service
* [x] Frontend Deployment and Service
* [x] Resource requests and limits
* [x] Startup, liveness, and readiness probes
* [x] Persistent storage
* [x] Ingress
* [x] Horizontal Pod Autoscaling
* [x] NetworkPolicies
* [x] RBAC and ServiceAccounts
* [x] ResourceQuota and LimitRange
* [x] Pod Security Standards
* [x] Kyverno security policies
* [x] Kubernetes validation and testing
* [x] Troubleshooting and documentation

## Phase 5 — Helm ✅

* [x] Helm chart structure
* [x] `Chart.yaml`
* [x] `values.yaml`
* [x] Helm templates
* [x] Namespace-aware configuration
* [x] Values-driven configuration
* [x] Application workloads
* [x] PostgreSQL StatefulSet
* [x] Services and Ingress
* [x] ConfigMaps and Secrets
* [x] Persistent storage
* [x] HPA
* [x] NetworkPolicies
* [x] RBAC and ServiceAccounts
* [x] ResourceQuota and LimitRange
* [x] Kyverno policies
* [x] Security contexts
* [x] Health probes
* [x] Configuration checksum rollouts
* [x] Helm linting
* [x] Template validation
* [x] Kubernetes dry-run validation
* [x] Helm install and upgrade validation
* [x] Minikube deployment testing
* [x] End-to-end API validation
* [x] Helm troubleshooting documentation

## Phase 6 — CI/CD 🚧

* [ ] GitHub Actions
* [ ] Automated application testing
* [ ] Docker image build automation
* [ ] Image security scanning
* [ ] Amazon ECR authentication
* [ ] Push images to Amazon ECR
* [ ] Helm-based deployment automation
* [ ] EKS deployment preparation

## Phase 7 — GitOps

* [ ] ArgoCD
* [ ] Git-based deployment configuration
* [ ] Automated synchronization
* [ ] Application health monitoring
* [ ] Environment promotion
* [ ] GitOps troubleshooting and documentation

## Phase 8 — Observability

* [ ] Prometheus
* [ ] Grafana
* [ ] Loki
* [ ] Centralized logging
* [ ] Kubernetes metrics
* [ ] Application metrics
* [ ] Dashboards
* [ ] Alerting
* [ ] Observability troubleshooting and documentation

## Phase 9 — AI-Assisted DevOps

* [ ] Terraform plan analysis
* [ ] Kubernetes troubleshooting
* [ ] Helm troubleshooting
* [ ] CI/CD failure analysis
* [ ] Log analysis
* [ ] Incident investigation
* [ ] Security recommendations
* [ ] Cost optimization
* [ ] Operational decision support

# 📊 Current Status

**Status:** 🟢 Active Development

The following milestones have been completed:

```text
Application
    ↓
Docker
    ↓
Terraform / AWS Infrastructure
    ↓
Kubernetes
    ↓
Helm
```

The current Helm implementation has been validated locally using Minikube.

### Current Milestone

**CI/CD Automation with GitHub Actions**

Upcoming work:

* GitHub Actions workflow design
* Automated application validation
* Docker image builds
* Container security scanning
* Amazon ECR authentication
* Image publishing
* Helm-based deployment workflow
* EKS deployment preparation
* CI/CD troubleshooting and documentation

---

## 📈 Project Progress

```text
Application                 ████████████████████ 100%

Docker                      ████████████████████ 100%

Terraform                   ████████████████████ 100%

Kubernetes                  ████████████████████ 100%

Helm                        ████████████████████ 100%

GitHub Actions              ░░░░░░░░░░░░░░░░░░░░   0%

ArgoCD                      ░░░░░░░░░░░░░░░░░░░░   0%

Observability               ░░░░░░░░░░░░░░░░░░░░   0%

AI-Assisted Operations      ░░░░░░░░░░░░░░░░░░░░   0%
```

---

# 📚 Documentation

Detailed engineering documentation is maintained under [`docs/`](docs/).

The README intentionally provides a high-level overview while implementation details, troubleshooting, validation procedures, and engineering decisions are maintained in focused documentation.

---

## 🏗️ Architecture

* [Architecture Overview](docs/architecture/architecture.md)

Covers the overall platform architecture and how the application, infrastructure, Kubernetes, Helm, CI/CD, GitOps, and observability layers fit together.

---

## 🐳 Docker

* [Docker Documentation](docs/docker/docker.md)

Covers:

* Backend and frontend containerization
* Multi-stage builds
* Nginx runtime
* Non-root containers
* PostgreSQL
* Docker Compose
* Container networking
* Persistent storage
* Health checks
* Troubleshooting
* Security considerations

---

## 🏗️ Terraform

* [Terraform Documentation](docs/terraform/README.md)
* [Terraform Architecture](docs/terraform/architecture.md)
* [Terraform Bootstrap](docs/terraform/bootstrap.md)
* [Remote Backend](docs/terraform/backend.md)
* [Terraform Modules](docs/terraform/modules.md)
* [Environment Structure](docs/terraform/environment.md)
* [Terraform Workflow](docs/terraform/workflow.md)
* [Testing & Validation](docs/terraform/testing.md)

The Terraform documentation covers:

* Infrastructure architecture
* Bootstrap process
* Remote state management
* Reusable modules
* Environment structure
* AWS networking
* IAM
* Amazon ECR
* Amazon EKS integration
* Testing
* Troubleshooting
* Engineering decisions

---

## ☸️ Kubernetes

* [Kubernetes Architecture](docs/kubernetes/architecture.md)
* [Kubernetes Workloads](docs/kubernetes/workloads.md)
* [Kubernetes Networking](docs/kubernetes/networking.md)
* [Kubernetes Security](docs/kubernetes/security.md)
* [Kubernetes Testing & Validation](docs/kubernetes/testing.md)

The Kubernetes documentation covers:

* Namespace architecture
* Workloads
* PostgreSQL StatefulSet
* Services
* Persistent storage
* Health probes
* HPA
* Ingress
* NetworkPolicies
* RBAC
* ResourceQuota and LimitRange
* Pod Security Standards
* Kyverno
* Validation and testing
* Troubleshooting
* Engineering decisions

---

## ⎈ Helm

* [Helm Architecture](docs/helm/architecture.md)
* [Helm Deployment & Validation](docs/helm/deployment.md)
* [Helm Troubleshooting](docs/helm/troubleshooting.md)

The Helm documentation covers:

* Chart architecture
* `Chart.yaml`
* `values.yaml`
* Templates
* Namespace-aware configuration
* Application workloads
* PostgreSQL
* Persistent storage
* Services and Ingress
* ConfigMaps and Secrets
* Checksum rollouts
* HPA
* NetworkPolicies
* RBAC
* Resource governance
* Kyverno
* Helm validation
* Minikube deployment
* Troubleshooting
* Engineering lessons

---

## 🧩 Application

Application documentation covers:

* Backend API architecture
* Frontend application
* PostgreSQL integration
* API endpoints
* Frontend/backend communication
* CORS configuration
* Application troubleshooting

Related documentation:

* `application/application-overview.md`
* `application/troubleshooting-cors.md`

---

## 📋 Requirements

* [Project Requirements](docs/requirements.md)

The requirements document defines the original platform objectives and technical requirements used to guide implementation.

# 🧪 Testing & Validation

Testing is performed at every stage before moving to the next milestone.

## Application Testing

* API health checks
* Backend API testing
* PostgreSQL connectivity
* Frontend API communication
* Browser validation
* CORS validation

## Docker Testing

* Docker image builds
* Container startup validation
* Docker Compose testing
* Service-to-service communication
* PostgreSQL persistence
* Container health checks

## Terraform Testing

* `terraform fmt`
* `terraform validate`
* `terraform plan`
* Configuration review
* Module validation
* AWS resource verification

## Kubernetes Testing

* Manifest validation
* Namespace validation
* Deployment validation
* Service validation
* StatefulSet validation
* Persistent storage validation
* Health probe validation
* HPA validation
* NetworkPolicy validation
* RBAC validation
* ResourceQuota and LimitRange validation
* Kyverno policy validation
* Ingress validation
* End-to-end application testing

## Helm Testing

* `helm lint`
* `helm template`
* Kubernetes dry-run
* Helm installation
* Helm upgrade
* Release status validation
* Deployment rollout validation
* Persistent storage validation
* Ingress/API validation
* Configuration checksum validation
* Troubleshooting

Kubernetes and Helm were validated locally using Minikube before the AWS EKS deployment stage to avoid unnecessary infrastructure costs during development.

---

# 🛡️ Security Approach

Security is considered throughout the platform rather than being added as a final step.

Current Kubernetes security controls include:

* Pod Security Standards
* Non-root container execution
* Security contexts
* Dropped Linux capabilities
* Disabled privilege escalation
* RuntimeDefault seccomp profile
* Kyverno admission policies
* Approved container registry enforcement
* ResourceQuota
* LimitRange
* NetworkPolicies
* RBAC
* Dedicated ServiceAccounts
* Kubernetes Secrets
* Restricted network access

The project also documents security-related failures and policy conflicts encountered during Kubernetes and Minikube testing.

---

# 🧭 Engineering Approach

The platform is developed incrementally instead of building the entire system at once.

Each phase follows:

```text
Plan
  ↓
Design
  ↓
Implement
  ↓
Validate
  ↓
Troubleshoot
  ↓
Security Review
  ↓
Document
  ↓
Commit
  ↓
Move to Next Phase
```

The project intentionally documents real implementation problems rather than presenting only the final successful configuration.

Examples include:

* Configuration mistakes
* Kubernetes policy conflicts
* Container security issues
* Networking problems
* Application connectivity issues
* Infrastructure validation failures
* Testing results
* Engineering trade-offs
* Lessons learned

---

# 🧩 Kubernetes Design Principles

The Kubernetes implementation follows production-oriented principles.

### Separation of Responsibilities

Resources are organized by responsibility:

* Namespace
* Workloads
* Services
* Configuration
* Secrets
* Networking
* Autoscaling
* RBAC
* Resource management
* Security policies

### Stateless Workloads

Frontend and backend applications run as Deployments with multiple replicas.

### Stateful Database

PostgreSQL uses a StatefulSet because the database requires stable identity and persistent storage.

### Service-Based Communication

Applications communicate through Kubernetes Services rather than directly targeting Pod IP addresses.

### Controlled Network Access

NetworkPolicies provide default-deny behavior and explicitly allow required communication.

### Resource Governance

Resource requests, limits, ResourceQuota, and LimitRange help control resource consumption.

### Autoscaling

Horizontal Pod Autoscalers allow frontend and backend workloads to scale based on resource utilization.

---

# 🔧 Troubleshooting Philosophy

Troubleshooting is treated as an important part of the engineering process.

Documented troubleshooting includes:

* Application CORS issues
* Docker container issues
* Terraform validation and planning issues
* Kubernetes configuration problems
* PostgreSQL StatefulSet issues
* PostgreSQL health probe issues
* Kyverno admission failures
* Security policy conflicts
* NetworkPolicy behavior
* Ingress configuration
* Helm namespace configuration
* Helm template validation
* ConfigMap and Secret rollout behavior
* Resource and probe configuration

The goal is to demonstrate how DevOps problems are investigated, corrected, validated, and converted into reusable engineering knowledge.

---

# 🤖 AI-Assisted DevOps

AI is used as a technical assistant rather than as a replacement for engineering understanding.

AI assistance supports:

* Application code review
* Dockerfile analysis
* Container security review
* Terraform code review
* Terraform plan analysis
* Kubernetes troubleshooting
* Helm troubleshooting
* CI/CD failure analysis
* Log analysis
* Incident investigation
* Security recommendations
* Cost optimization

The workflow is:

```text
Engineer
    │
    ▼
Define Problem
    │
    ▼
AI-Assisted Analysis
    │
    ▼
Review Suggestions
    │
    ▼
Implement Changes
    │
    ▼
Test and Validate
    │
    ▼
Document Lessons Learned
```

AI-generated suggestions are reviewed and verified by the engineer before changes are applied.

### Example Workflow

```text
Kubernetes Issue
      ↓
AI-Assisted Troubleshooting
      ↓
Configuration Review
      ↓
Engineer Verification
      ↓
Implementation
      ↓
Testing
      ↓
Documentation
```

The goal is to demonstrate practical AI-assisted DevOps workflows while maintaining human ownership of technical decisions.

# 🧠 Lessons Learned

The project captures lessons learned throughout implementation rather than documenting only the final configuration.

Important areas include:

* Understanding why infrastructure components are required
* Designing reusable Terraform modules
* Separating infrastructure environments
* Understanding Kubernetes workload types
* Choosing StatefulSet for PostgreSQL
* Understanding Kubernetes Services and DNS
* Designing default-deny NetworkPolicies
* Applying least-privilege RBAC
* Using resource governance controls
* Understanding admission policies
* Troubleshooting security policy conflicts
* Designing reusable Helm templates
* Managing configuration through Helm values
* Triggering application rollouts after configuration changes
* Validating rendered Kubernetes manifests
* Testing Kubernetes configurations before cloud deployment
* Using AI as an engineering assistant while maintaining human verification

---

# 🚀 Future Platform Architecture

The long-term platform will evolve into a complete DevOps delivery platform.

```text
Developer
    │
    ▼
Git Repository
    │
    ▼
GitHub Actions
    │
    ├── Test
    ├── Build
    ├── Security Scan
    └── Push Image
            │
            ▼
         Amazon ECR
            │
            ▼
          ArgoCD
            │
            ▼
        Amazon EKS
            │
      ┌─────┼─────────┐
      │     │         │
      ▼     ▼         ▼
  Frontend Backend PostgreSQL
      │     │         │
      └─────┼─────────┘
            │
            ▼
    Observability Stack
            │
      ┌─────┼─────────┐
      ▼     ▼         ▼
 Prometheus Grafana  Loki
```

Future phases will introduce:

* Automated CI/CD
* Container image security scanning
* Amazon ECR publishing
* EKS deployment automation
* Helm-based application delivery
* GitOps with ArgoCD
* Metrics collection
* Centralized logging
* Dashboards
* Alerting
* AI-assisted operational workflows

---

# 🎯 Project Philosophy

This project focuses on understanding the **complete DevOps lifecycle**, rather than simply using individual tools.

```text
Application
    ↓
Containerization
    ↓
Infrastructure as Code
    ↓
Cloud Infrastructure
    ↓
Kubernetes
    ↓
Helm
    ↓
CI/CD
    ↓
GitOps
    ↓
Observability
    ↓
Incident Response
    ↓
AI-Assisted DevOps
```

Each milestone follows:

```text
Design
   ↓
Implement
   ↓
Test
   ↓
Troubleshoot
   ↓
AI-Assisted Analysis
   ↓
Document
   ↓
Commit
```

The objective is to understand not only **what** is being built, but also:

* Why it is required
* How it works
* How it is validated
* What failed
* How problems were solved
* What engineering trade-offs were made
* What was learned

---

# 📌 Definition of Done

A milestone is not considered complete simply because the deployment works.

A milestone is considered complete when it has been:

* Designed
* Implemented
* Tested
* Troubleshot
* Security-reviewed
* Validated
* Documented
* Committed to the repository

This ensures the repository demonstrates both the final implementation and the engineering process behind it.

---

# 📅 Next Milestone

## CI/CD Automation with GitHub Actions

The Terraform, Kubernetes, and Helm phases have been completed and validated locally.

The next phase focuses on building the automated delivery pipeline:

```text
Git Push
   ↓
GitHub Actions
   ↓
Automated Tests
   ↓
Docker Build
   ↓
Security Scan
   ↓
Amazon ECR
   ↓
EKS Deployment
```

After CI/CD, the platform will progress toward:

```text
CI/CD
  ↓
GitOps with ArgoCD
  ↓
Observability
  ↓
AI-Assisted Operations
```

---

# 🎯 Long-Term Goal

This repository is intended to become a complete production-style DevOps reference project demonstrating:

* Modern application development
* Docker containerization
* Infrastructure as Code with Terraform
* AWS cloud infrastructure
* Kubernetes orchestration
* Helm package management
* CI/CD automation
* GitOps workflows
* Observability
* Security engineering
* AI-assisted DevOps

The emphasis is on building a portfolio that demonstrates **engineering capability rather than isolated tool usage**.

---

# 👨‍💻 Author

**Rakesh Gangwar**

DevOps Engineer focused on:

* AWS
* Terraform
* Docker
* Kubernetes
* CI/CD
* Infrastructure as Code
* Cloud-native technologies

---

## ⭐ Support

If you find this project useful:

* ⭐ Star the repository
* 🍴 Fork the repository
* 💡 Share feedback or suggestions
* 🛠️ Follow future project updates as new phases are completed

---

## 📖 Documentation Philosophy

Documentation is treated as part of the implementation rather than an afterthought.

Detailed documentation records:

* Architecture
* Implementation
* Validation
* Troubleshooting
* Security considerations
* Engineering decisions
* Lessons learned

The main README intentionally remains concise and acts as the **entry point to the project**, while the `docs/` directory contains the deeper technical documentation.
