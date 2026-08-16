# Production AWS EKS Platform

A production-style DevOps platform built as a single monorepo. This project demonstrates the complete lifecycle of a containerized application — from application development and containerization to infrastructure provisioning, Kubernetes deployment, Helm packaging, CI/CD, GitOps, observability, security, and AI-assisted DevOps operations.

The project is being built incrementally. Each major milestone is designed, implemented, tested, troubleshot, documented, and validated before moving to the next stage.

---

## 🎯 Project Objective

The goal of this project is to design and build a production-style DevOps platform using modern cloud-native and DevOps practices.

The platform covers:

* Containerized application development
* Docker Compose-based local development
* Infrastructure as Code with Terraform
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
* AI-assisted DevOps workflows
* Security engineering
* Troubleshooting and operational documentation

The platform is developed locally and validated incrementally before moving workloads to AWS EKS. This approach reduces unnecessary cloud costs while allowing each platform layer to be tested independently.

---

## 🏗️ High-Level Architecture

The following represents the long-term production architecture of the platform.

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

The architecture is being implemented in phases rather than deploying the entire platform at once.

---

## 🏠 Current Local Architecture

The application has been developed and validated locally using Docker Compose and Kubernetes/Minikube.

### Docker Compose Architecture

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

### Kubernetes / Helm Architecture

The Kubernetes application stack is currently validated locally using Minikube.

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

The application stack is packaged using Helm.

The Helm layer provides:

* Reusable templates
* Values-driven configuration
* Namespace-aware deployment
* Application packaging
* Upgrade and rollback support
* Environment-specific configuration
* Consistent Kubernetes resource management

---

## ☸️ Kubernetes Platform Architecture

The Kubernetes implementation follows a production-oriented resource architecture.

```text
Namespace
   │
   ├── ConfigMaps
   ├── Secrets
   ├── ServiceAccounts
   ├── RBAC
   ├── ResourceQuota
   └── LimitRange
   │
   ▼
PostgreSQL StatefulSet
   │
   ├── PostgreSQL Service
   ├── Headless Service
   └── PersistentVolumeClaim
   │
   ▼
Backend Deployment
   │
   ├── Backend Service
   └── Backend HPA
   │
   ▼
Frontend Deployment
   │
   ├── Frontend Service
   └── Frontend HPA
   │
   ▼
NetworkPolicies
   │
   ├── Default Deny
   ├── Frontend Policy
   ├── Backend Policy
   └── PostgreSQL Policy
   │
   ▼
Kyverno Security Policies
   │
   ├── Approved Image Registry
   └── Run-As-Non-Root
   │
   ▼
Ingress
   │
   ├── /      → Frontend Service
   └── /api   → Backend Service
```

---

## 📦 Helm Architecture

The Kubernetes application stack has been packaged into a reusable Helm chart.

```text
helm/
├── Chart.yaml
├── values.yaml
├── .helmignore
└── templates/
    ├── application resources
    ├── networking resources
    ├── security resources
    ├── RBAC resources
    └── resource-management resources
```

The Helm chart manages the complete application platform, including:

* Frontend Deployment
* Backend Deployment
* PostgreSQL StatefulSet
* Kubernetes Services
* Ingress
* ConfigMaps
* Secrets
* Horizontal Pod Autoscalers
* NetworkPolicies
* ServiceAccounts
* RBAC
* ResourceQuota
* LimitRange
* Kyverno policies
* Persistent storage

The chart was validated locally using Minikube.

Validation included:

```text
helm lint
    ↓
helm template
    ↓
kubectl dry-run
    ↓
helm upgrade --install
    ↓
Kubernetes rollout validation
    ↓
Ingress/API testing
```

---

## 📁 Repository Structure

```text
production-aws-eks-platform/
│
├── application/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   ├── src/
│   │   │   ├── server.js
│   │   │   ├── app.js
│   │   │   ├── db.js
│   │   │   └── routes/
│   │   │       └── productRoutes.js
│   │   ├── package.json
│   │   └── package-lock.json
│   │
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   ├── src/
│   │   ├── package.json
│   │   └── package-lock.json
│   │
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── terraform/
│   ├── bootstrap/
│   ├── environments/
│   │   └── dev/
│   │       ├── backend.tf
│   │       ├── main.tf
│   │       ├── outputs.tf
│   │       ├── providers.tf
│   │       └── variables.tf
│   │
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
│   │   └── architecture.md
│   │
│   ├── docker/
│   │   └── docker.md
│   │
│   ├── helm/
│   │   ├── architecture.md
│   │   ├── deployment.md
│   │   └── troubleshooting.md
│   │
│   ├── kubernetes/
│   │   ├── architecture.md
│   │   ├── networking.md
│   │   ├── security.md
│   │   ├── testing.md
│   │   └── workloads.md
│   │
│   ├── terraform/
│   │   ├── README.md
│   │   ├── architecture.md
│   │   ├── backend.md
│   │   ├── bootstrap.md
│   │   ├── environment.md
│   │   ├── modules.md
│   │   ├── testing.md
│   │   └── workflow.md
│   │
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
* Alpine Linux-based container images

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

## 🤖 AI-Assisted DevOps

AI assistance is integrated into the engineering workflow as a technical assistant rather than a replacement for engineering decisions.

AI is used to support:

* Application code review
* Dockerfile analysis and optimization
* Container security review
* Terraform code review
* Terraform plan analysis
* Kubernetes troubleshooting
* Helm troubleshooting
* CI/CD failure analysis
* Log analysis
* Incident root-cause analysis
* Security recommendations
* Cost optimization

The workflow follows:

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

Infrastructure and application changes are reviewed, tested, and verified by the engineer before being applied.

---

# 🚀 Project Roadmap

## Phase 1 — Application ✅

* [x] Backend API foundation
* [x] `GET /health`
* [x] `GET /api/products`
* [x] `POST /api/products`
* [x] PostgreSQL integration
* [x] Frontend application
* [x] Frontend-to-backend communication
* [x] CORS configuration
* [x] Application documentation

---

## Phase 2 — Containerization ✅

* [x] Backend Dockerfile
* [x] Frontend Dockerfile
* [x] Multi-stage frontend Docker build
* [x] Nginx-based frontend runtime
* [x] Non-root container execution
* [x] PostgreSQL container
* [x] Docker Compose orchestration
* [x] Local multi-container testing
* [x] Container networking
* [x] Persistent PostgreSQL storage
* [x] Container health checks
* [x] Docker troubleshooting
* [x] Docker documentation
* [ ] Final container security review

---

## Phase 3 — AWS Infrastructure ✅

* [x] Terraform project structure
* [x] Terraform backend configuration
* [x] Terraform bootstrap configuration
* [x] Reusable Terraform module architecture
* [x] Environment-based Terraform structure
* [x] AWS provider configuration
* [x] Terraform variables and outputs
* [x] Terraform validation
* [x] Terraform formatting
* [x] Terraform planning
* [x] AWS VPC
* [x] Public subnets
* [x] Private subnets
* [x] Internet Gateway
* [x] NAT Gateway
* [x] Elastic IP
* [x] Public route tables
* [x] Private route tables
* [x] Route table associations
* [x] Security groups
* [x] IAM configuration
* [x] Amazon ECR
* [x] Amazon EKS module integration
* [x] Production-style Terraform architecture
* [x] Comprehensive Terraform documentation
* [x] Terraform testing and validation

---

## Phase 4 — Kubernetes ✅

* [x] Namespace
* [x] ConfigMaps
* [x] Secrets
* [x] PostgreSQL StatefulSet
* [x] PostgreSQL Services
* [x] Backend Deployment
* [x] Frontend Deployment
* [x] Backend and Frontend Services
* [x] Resource requests and limits
* [x] Liveness probes
* [x] Readiness probes
* [x] Startup probes
* [x] Persistent PostgreSQL storage
* [x] Ingress
* [x] Horizontal Pod Autoscaling
* [x] NetworkPolicies
* [x] RBAC and ServiceAccounts
* [x] ResourceQuota
* [x] LimitRange
* [x] Pod Security Standards
* [x] Kyverno security policies
* [x] Approved container registry policy
* [x] Run-as-non-root policy
* [x] Kubernetes validation and testing
* [x] Kubernetes troubleshooting
* [x] End-to-end Kubernetes testing
* [x] Kubernetes documentation

---

## Phase 5 — Helm ✅

The Kubernetes application stack has been packaged and validated as a reusable Helm chart.

* [x] Helm chart structure
* [x] `Chart.yaml`
* [x] `values.yaml`
* [x] Helm templates
* [x] Namespace-aware templates
* [x] Values-driven configuration
* [x] Frontend Deployment
* [x] Backend Deployment
* [x] PostgreSQL StatefulSet
* [x] Kubernetes Services
* [x] Ingress
* [x] ConfigMaps
* [x] Secrets
* [x] Persistent storage
* [x] Horizontal Pod Autoscaling
* [x] NetworkPolicies
* [x] RBAC
* [x] ServiceAccounts
* [x] ResourceQuota
* [x] LimitRange
* [x] Kyverno policies
* [x] Security contexts
* [x] Health probes
* [x] ConfigMap checksum rollout
* [x] Secret checksum rollout
* [x] Helm linting
* [x] Helm template validation
* [x] Kubernetes dry-run validation
* [x] Helm install validation
* [x] Helm upgrade validation
* [x] PostgreSQL troubleshooting
* [x] Persistent storage validation
* [x] Backend rollout validation
* [x] Ingress validation
* [x] End-to-end API validation
* [x] Helm troubleshooting documentation

---

## Phase 6 — CI/CD

* [ ] GitHub Actions
* [ ] Automated application testing
* [ ] Docker image build automation
* [ ] Image security scanning
* [ ] Amazon ECR authentication
* [ ] Push images to Amazon ECR
* [ ] Helm-based deployment automation
* [ ] Deploy to Amazon EKS

---

## Phase 7 — GitOps

* [ ] ArgoCD
* [ ] Git-based deployment configuration
* [ ] Automated synchronization
* [ ] Application health monitoring
* [ ] Environment promotion
* [ ] GitOps troubleshooting
* [ ] GitOps documentation

---

## Phase 8 — Observability

* [ ] Prometheus
* [ ] Grafana
* [ ] Loki
* [ ] Centralized logging
* [ ] Kubernetes metrics
* [ ] Application metrics
* [ ] Dashboards
* [ ] Alerting
* [ ] Observability troubleshooting
* [ ] Observability documentation

---

## Phase 9 — AI-Assisted DevOps

* [ ] Terraform plan analysis
* [ ] Kubernetes troubleshooting
* [ ] Helm troubleshooting assistance
* [ ] CI/CD failure analysis
* [ ] Log analysis
* [ ] Incident investigation
* [ ] Security recommendations
* [ ] Cost optimization
* [ ] Operational decision support

---

# 📊 Current Progress

### ✅ Completed

#### Application

* [x] Node.js backend application
* [x] Express API
* [x] Health endpoint
* [x] Products API
* [x] Product creation API
* [x] PostgreSQL database integration
* [x] React frontend
* [x] Frontend-to-backend API communication
* [x] CORS configuration
* [x] Application documentation

#### Containerization

* [x] Backend Dockerfile
* [x] Frontend multi-stage Dockerfile
* [x] Nginx runtime
* [x] Non-root containers
* [x] PostgreSQL container
* [x] Docker Compose
* [x] Container networking
* [x] Persistent storage
* [x] Health checks
* [x] Docker troubleshooting
* [x] Docker documentation

#### Terraform Infrastructure

* [x] Terraform bootstrap configuration
* [x] Remote backend configuration
* [x] Environment-based structure
* [x] Reusable Terraform modules
* [x] AWS provider configuration
* [x] Variable management
* [x] Outputs
* [x] VPC
* [x] Public subnets
* [x] Private subnets
* [x] Internet Gateway
* [x] NAT Gateway
* [x] Elastic IP
* [x] Route tables
* [x] Route table associations
* [x] Security groups
* [x] IAM module
* [x] Amazon ECR module
* [x] Amazon EKS module integration
* [x] Terraform testing
* [x] Comprehensive Terraform documentation

#### Kubernetes

* [x] Namespace and Pod Security Standards
* [x] ConfigMaps and Secrets
* [x] PostgreSQL StatefulSet
* [x] PostgreSQL Services
* [x] Backend Deployment and Service
* [x] Frontend Deployment and Service
* [x] Resource requests and limits
* [x] Startup, liveness, and readiness probes
* [x] Persistent storage
* [x] Horizontal Pod Autoscaling
* [x] Ingress routing
* [x] NetworkPolicies
* [x] RBAC and ServiceAccounts
* [x] ResourceQuota and LimitRange
* [x] Kyverno security policies
* [x] Kubernetes validation and testing
* [x] Kubernetes troubleshooting
* [x] Kubernetes documentation

#### Helm

* [x] Reusable Helm chart
* [x] Values-driven configuration
* [x] Namespace-aware templates
* [x] Application workloads
* [x] PostgreSQL StatefulSet
* [x] Networking and Ingress
* [x] Autoscaling
* [x] RBAC and ServiceAccounts
* [x] NetworkPolicies
* [x] Resource governance
* [x] Kyverno policies
* [x] Configuration checksum rollouts
* [x] Helm validation
* [x] Minikube deployment testing
* [x] End-to-end application validation
* [x] Helm troubleshooting documentation

---

### 🚧 Currently Working On

The following milestones have been completed and documented:

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

The next major milestone is **CI/CD automation with GitHub Actions**.

Upcoming CI/CD work includes:

* [ ] GitHub Actions workflow design
* [ ] Automated application validation
* [ ] Docker image builds
* [ ] Container image security scanning
* [ ] Amazon ECR authentication
* [ ] Image publishing to Amazon ECR
* [ ] Helm-based deployment workflow
* [ ] EKS deployment automation
* [ ] CI/CD troubleshooting and documentation

---

# 📚 Documentation

Detailed documentation is maintained under the `docs/` directory.

Each major platform milestone has its own documentation covering architecture, implementation, validation, troubleshooting, and engineering decisions.

---

## 🏗️ Architecture

* [Architecture Overview](docs/architecture/architecture.md)

The architecture documentation provides the overall platform design and explains how the application, infrastructure, Kubernetes, Helm, CI/CD, GitOps, and observability layers fit together.

---

## 🐳 Docker

* [Docker Containerization](docs/docker/docker.md)

The Docker documentation covers:

* Backend containerization
* Frontend multi-stage builds
* Nginx runtime
* Non-root containers
* PostgreSQL container
* Docker Compose
* Container networking
* Persistent storage
* Health checks
* Container troubleshooting
* Container security considerations

---

## ☸️ Kubernetes

The Kubernetes phase has been fully implemented, tested, troubleshot, and documented.

### Kubernetes Documentation Index

* [Kubernetes Architecture](docs/kubernetes/architecture.md)
* [Kubernetes Workloads](docs/kubernetes/workloads.md)
* [Kubernetes Networking](docs/kubernetes/networking.md)
* [Kubernetes Security](docs/kubernetes/security.md)
* [Kubernetes Testing & Validation](docs/kubernetes/testing.md)

The Kubernetes documentation covers:

* Namespace architecture
* ConfigMaps and Secrets
* PostgreSQL StatefulSet
* Backend and frontend workloads
* Kubernetes Services
* Persistent storage
* Resource requests and limits
* Startup, liveness, and readiness probes
* Horizontal Pod Autoscaling
* Ingress
* NetworkPolicies
* RBAC and ServiceAccounts
* ResourceQuota and LimitRange
* Pod Security Standards
* Kyverno policies
* Kubernetes testing
* Troubleshooting
* Engineering decisions

---

## ⎈ Helm

The Helm phase has been fully implemented and validated locally using Minikube.

### Helm Documentation Index

* [Helm Architecture](docs/helm/architecture.md)
* [Helm Deployment & Validation](docs/helm/deployment.md)
* [Helm Troubleshooting](docs/helm/troubleshooting.md)

The Helm documentation covers:

* Helm chart architecture
* Chart structure
* `Chart.yaml`
* `values.yaml`
* Helm templates
* Namespace-aware configuration
* Application workloads
* PostgreSQL StatefulSet
* Persistent storage
* Services and Ingress
* ConfigMaps and Secrets
* Configuration checksum rollouts
* Horizontal Pod Autoscaling
* NetworkPolicies
* RBAC and ServiceAccounts
* ResourceQuota and LimitRange
* Kyverno security policies
* Helm linting
* Helm template rendering
* Kubernetes dry-run validation
* Helm installation and upgrades
* Minikube deployment validation
* End-to-end API testing
* PostgreSQL troubleshooting
* Helm lifecycle troubleshooting
* Engineering lessons learned

### Helm Validation Workflow

The Helm milestone follows:

```text
Helm Chart Changes
        │
        ▼
   helm lint
        │
        ▼
  helm template
        │
        ▼
kubectl dry-run
        │
        ▼
helm upgrade --install
        │
        ▼
Kubernetes rollout validation
        │
        ▼
Ingress/API testing
        │
        ▼
Documentation
```

The Helm chart is currently validated locally rather than running continuously on AWS EKS in order to avoid unnecessary cloud infrastructure costs during development.

---

## 🏗️ Terraform

The Terraform phase has been fully documented with implementation guides, architecture explanations, testing procedures, troubleshooting notes, and engineering decisions.

### Terraform Documentation Index

* [Terraform Documentation Home](docs/terraform/README.md)
* [Terraform Architecture](docs/terraform/architecture.md)
* [Terraform Bootstrap](docs/terraform/bootstrap.md)
* [Terraform Remote Backend](docs/terraform/backend.md)
* [Terraform Modules](docs/terraform/modules.md)
* [Terraform Environment Structure](docs/terraform/environment.md)
* [Terraform Workflow](docs/terraform/workflow.md)
* [Terraform Testing & Validation](docs/terraform/testing.md)

The Terraform documentation covers:

* Infrastructure architecture
* Bootstrap process
* Remote backend configuration
* Terraform state management
* Module design
* Environment structure
* AWS networking
* IAM
* Amazon ECR
* Amazon EKS integration
* Infrastructure workflow
* Testing and validation
* Troubleshooting
* Best practices
* Engineering decisions

---

## 🧩 Application

Application documentation covers the application layer and its integration points.

Current application documentation includes:

* `application/application-overview.md`
* `application/troubleshooting-cors.md`

The application documentation explains:

* Backend API architecture
* Frontend application
* PostgreSQL integration
* API endpoints
* Frontend/backend communication
* CORS configuration
* Application troubleshooting

---

## 📋 Requirements

* [Project Requirements](docs/requirements.md)

The requirements document defines the original platform objectives and major technical requirements used to guide implementation.

---

## 📖 Documentation Philosophy

Documentation is treated as part of the implementation rather than an afterthought.

Every completed milestone documents:

* What was built
* Why it was built
* How it works
* How it was tested
* Problems encountered
* Troubleshooting steps
* Security considerations
* Engineering decisions
* Lessons learned
* Validation results

This allows the repository to demonstrate both the final architecture and the engineering process used to reach it.

## 🎯 Project Philosophy

This project focuses on understanding the **complete DevOps lifecycle**, rather than simply using individual tools.

The platform is developed incrementally so that each technology is understood in the context of the overall engineering workflow.

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

The objective is to build a production-style platform while understanding the engineering decisions, trade-offs, failures, troubleshooting techniques, validation methods, and operational practices involved at every stage.

---

## 👨‍💻 Author

**Rakesh Gangwar**

DevOps Engineer focused on AWS, Terraform, Docker, Kubernetes, CI/CD, Infrastructure as Code, and cloud-native technologies.

---

## 🚧 Project Status

**Status:** 🟢 Active Development

### ✅ Completed Milestones

* Application Development
* Docker Containerization
* Terraform Infrastructure
* AWS Networking Foundation
* Remote Backend Configuration
* Terraform Module Architecture
* Environment-Based Infrastructure
* Infrastructure Documentation
* Kubernetes Workloads
* Kubernetes Networking
* Kubernetes Security
* Kubernetes Testing and Validation
* Kubernetes Documentation
* Helm Packaging and Local Validation
* Helm Troubleshooting Documentation

### 🚧 Current Milestone

The Kubernetes and Helm phases have been completed and validated locally.

The next major milestone is **CI/CD automation** using GitHub Actions.

Upcoming work includes:

* GitHub Actions workflow design
* Automated application testing
* Docker image builds
* Container security scanning
* Amazon ECR integration
* Automated deployment workflow
* EKS deployment preparation

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

## 🎯 Long-Term Goal

This repository is intended to become a complete production-style DevOps reference project demonstrating:

* Modern application development
* Containerization with Docker
* Infrastructure as Code using Terraform
* AWS cloud infrastructure
* Kubernetes orchestration
* Helm package management
* CI/CD automation
* GitOps workflows
* Observability
* Security best practices
* AI-assisted DevOps engineering

The emphasis is not only on building infrastructure, but also on documenting:

* Engineering decisions
* Implementation details
* Troubleshooting
* Testing
* Security considerations
* Operational practices
* Lessons learned

---

## 🧭 Engineering Approach

The project is developed incrementally rather than building the entire platform at once.

Each phase follows a practical engineering lifecycle:

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
Document
  ↓
Commit
  ↓
Move to Next Phase
```

The project intentionally documents real implementation issues instead of presenting only the final successful configuration.

This includes:

* Configuration mistakes
* Kubernetes policy conflicts
* Container security issues
* Networking problems
* Application connectivity issues
* Infrastructure validation
* Testing results
* Engineering trade-offs
* Lessons learned

---

## 🧪 Testing Philosophy

Testing is performed at every stage before moving to the next milestone.

### Application Testing

* API health checks
* Backend API testing
* PostgreSQL connectivity testing
* Frontend API communication
* Browser-based validation
* CORS validation

### Docker Testing

* Docker image builds
* Container startup validation
* Docker Compose testing
* Service-to-service communication
* PostgreSQL persistence testing
* Container health checks

### Terraform Testing

* `terraform fmt`
* `terraform validate`
* `terraform plan`
* Infrastructure configuration review
* Module validation
* AWS resource verification

### Kubernetes Testing

* Manifest validation
* Namespace validation
* Deployment validation
* Service validation
* PostgreSQL StatefulSet validation
* Persistent storage validation
* Health probe validation
* HPA validation
* NetworkPolicy validation
* RBAC validation
* ResourceQuota and LimitRange validation
* Kyverno policy validation
* Ingress validation
* End-to-end application testing

### Helm Testing

* `helm lint`
* `helm template`
* Kubernetes dry-run validation
* Helm installation
* Helm upgrade testing
* Release status validation
* Deployment rollout validation
* Persistent storage validation
* Ingress/API validation
* Configuration checksum validation
* Helm troubleshooting

The Kubernetes and Helm implementations were tested locally using Minikube before the AWS EKS deployment stage to avoid unnecessary infrastructure costs during development.

---

## 🛡️ Security Approach

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

## 🧩 Kubernetes Design Principles

The Kubernetes implementation follows several production-oriented principles.

### Separation of Responsibilities

Different Kubernetes resources are organized by responsibility:

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

### Stateless Application Workloads

The frontend and backend applications run as Deployments with multiple replicas.

### Stateful Database Workload

PostgreSQL is implemented as a StatefulSet because the database requires stable identity and persistent storage.

### Service-Based Communication

Applications communicate through Kubernetes Services rather than directly targeting Pod IP addresses.

### Controlled Network Access

NetworkPolicies implement default-deny behavior and explicitly allow required application communication.

### Resource Governance

Resource requests, limits, ResourceQuota, and LimitRange help control cluster resource consumption.

### Autoscaling

Horizontal Pod Autoscalers allow the frontend and backend workloads to scale based on CPU and memory utilization.

---

## 📂 Kubernetes Documentation

The Kubernetes implementation is documented separately from the main README.

### Kubernetes Documentation Index

* [Kubernetes Architecture](docs/kubernetes/architecture.md)
* [Kubernetes Workloads](docs/kubernetes/workloads.md)
* [Kubernetes Networking](docs/kubernetes/networking.md)
* [Kubernetes Security](docs/kubernetes/security.md)
* [Kubernetes Testing & Validation](docs/kubernetes/testing.md)

The documentation covers:

* Namespace architecture
* ConfigMaps and Secrets
* PostgreSQL StatefulSet
* Backend and frontend workloads
* Services
* Persistent storage
* Health probes
* Horizontal Pod Autoscaling
* Ingress
* NetworkPolicies
* RBAC and ServiceAccounts
* ResourceQuota and LimitRange
* Pod Security Standards
* Kyverno policies
* Kubernetes testing
* Troubleshooting
* Engineering decisions

---

## 📦 Helm Documentation

The Helm implementation is documented separately under:

```text
docs/helm/
├── architecture.md
├── deployment.md
└── troubleshooting.md
```

### Helm Documentation Index

* [Helm Architecture](docs/helm/architecture.md)
* [Helm Deployment & Validation](docs/helm/deployment.md)
* [Helm Troubleshooting](docs/helm/troubleshooting.md)

The Helm documentation covers:

* Helm chart architecture
* Configurable values
* Namespace-aware templates
* Kubernetes resource packaging
* Stateful PostgreSQL deployment
* Persistent storage
* Secrets and ConfigMaps
* Security contexts
* HPA
* NetworkPolicies
* RBAC
* Resource governance
* Kyverno policies
* Helm linting
* Template rendering
* Kubernetes dry-run validation
* Helm installation and upgrades
* Configuration checksum rollouts
* PostgreSQL troubleshooting
* Ingress validation
* End-to-end API testing

The Helm chart was validated locally on Minikube before progressing to the CI/CD milestone.

---

## 🔧 Troubleshooting Documentation

Troubleshooting is treated as an important part of the project rather than something hidden from the final implementation.

Documented troubleshooting areas include:

* Application CORS issues
* Docker container issues
* Terraform validation and planning issues
* Kubernetes configuration issues
* PostgreSQL StatefulSet issues
* PostgreSQL health probe issues
* Security policy conflicts
* Kyverno admission failures
* NetworkPolicy behavior
* Kubernetes Ingress configuration
* Helm namespace configuration
* Helm template validation
* ConfigMap and Secret rollout behavior
* Resource and probe configuration

The purpose of documenting these issues is to demonstrate how production-oriented DevOps problems are investigated, corrected, validated, and converted into engineering lessons.

---

## 🧠 Lessons Learned

The project is designed to capture lessons learned throughout implementation.

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

## 🚀 Future Platform Architecture

The long-term platform will evolve from the current Kubernetes and Helm implementation into a complete DevOps delivery platform.

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

Future phases will add:

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

## 🤖 AI-Assisted DevOps Workflow

AI is used throughout the project as a technical assistant rather than as a replacement for engineering understanding.

The workflow follows:

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

Examples include:

```text
Dockerfile
    ↓
AI Review
    ↓
Security and Optimization Analysis
    ↓
Engineer Verification
    ↓
Build and Test
```

```text
Terraform Plan
    ↓
AI-Assisted Review
    ↓
Potential Risk Identification
    ↓
Engineer Verification
    ↓
Apply Infrastructure
```

```text
Kubernetes Deployment
    ↓
AI-Assisted Troubleshooting
    ↓
Configuration Review
    ↓
Engineer Validation
    ↓
Deploy to Cluster
```

The goal is to demonstrate practical AI-assisted DevOps workflows while maintaining human ownership of technical decisions.

---

## 📌 Important Project Principle

The project does not treat successful deployment as the only measure of completion.

A milestone is considered complete when it has been:

* Designed
* Implemented
* Tested
* Troubleshot
* Security-reviewed
* Documented
* Validated
* Committed to the repository

This approach ensures that the repository demonstrates not only **what was built**, but also:

* **Why it was built**
* **How it works**
* **How it was tested**
* **What failed**
* **How problems were solved**
* **What was learned**

---

## 🙌 Acknowledgements

This project is built through continuous learning, hands-on experimentation, testing, troubleshooting, and iterative improvement.

Every completed milestone includes implementation, validation, documentation, and engineering analysis to create a portfolio that reflects production-oriented DevOps practices rather than isolated tool demonstrations.

---

## ⭐ Support

If you find this project useful:

* ⭐ Star the repository
* 🍴 Fork the repository
* 💡 Share feedback or suggestions
* 🛠️ Follow future project updates as new phases are completed

---

## 📅 Next Milestone

➡️ **CI/CD Automation with GitHub Actions**

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

After CI/CD, the platform will progress toward **GitOps with ArgoCD**, followed by **Observability with Prometheus, Grafana, and Loki**.
