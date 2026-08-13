# Production AWS EKS Platform

A production-style DevOps platform built as a single monorepo. This project demonstrates the complete lifecycle of a containerized application—from application development and infrastructure provisioning to Kubernetes deployment, GitOps, observability, security, and AI-assisted DevOps operations.

The project is being built incrementally. Each major milestone is implemented, tested, troubleshot, and documented before moving to the next stage.

---

## 🎯 Project Objective

The goal of this project is to design and build a production-style platform on AWS using modern DevOps practices.

The platform will include:

* Containerized application
* Docker Compose-based local development environment
* Infrastructure as Code with Terraform
* AWS VPC networking
* Amazon EKS
* Kubernetes
* Helm
* GitHub Actions CI/CD
* Amazon ECR
* ArgoCD GitOps
* Prometheus
* Grafana
* Loki
* AI-assisted DevOps workflows
* Security and troubleshooting documentation

---

## 🏗️ High-Level Architecture

The following represents the target production architecture. The application is currently running locally using Docker Compose and Kubernetes and will later be deployed to Amazon EKS.

    Users
      │
      ▼
    ┌──────────────┐
    │   Ingress    │
    └──────┬───────┘
           │
    ┌──────┴────────────┐
    │                   │
    ▼                   ▼
    ┌──────────────┐    ┌──────────────┐
    │   Frontend   │    │ Backend API  │
    │ React + Nginx│    │ Node + Express│
    └──────────────┘    └──────┬───────┘
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
     Helm               ArgoCD          Observability
                                             │
                                  Prometheus + Grafana + Loki

### Current Local Architecture

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
    │       Docker Network + Persistent Volume            │
    └─────────────────────────────────────────────────────┘

### Kubernetes Application Architecture

    Namespace
       │
       ├── Secrets / ConfigMaps
       │
       ├── RBAC / ServiceAccounts
       │
       ├── ResourceQuota / LimitRange
       │
       ▼
    PostgreSQL StatefulSet
       │
       ├── PostgreSQL Service
       └── PostgreSQL Headless Service
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

---

## 📁 Repository Structure

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
    │
    ├── docs/
    │   ├── architecture/
    │   │   └── architecture.md
    │   ├── docker/
    │   │   └── docker.md
    │   ├── kubernetes/
    │   │   ├── architecture.md
    │   │   ├── networking.md
    │   │   ├── security.md
    │   │   ├── testing.md
    │   │   └── workloads.md
    │   ├── terraform/
    │   │   ├── README.md
    │   │   ├── architecture.md
    │   │   ├── backend.md
    │   │   ├── bootstrap.md
    │   │   ├── environment.md
    │   │   ├── modules.md
    │   │   ├── testing.md
    │   │   └── workflow.md
    │   └── requirements.md
    │
    ├── scripts/
    │
    └── README.md

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
* Ingress

### CI/CD & GitOps

* GitHub Actions
* ArgoCD

### Observability

* Prometheus
* Grafana
* Loki

---

## 🤖 AI-Assisted DevOps

AI assistance is integrated into the engineering workflow to support:

* Application code review
* Dockerfile analysis and optimization
* Container security review
* Terraform code review
* Terraform plan analysis
* Kubernetes troubleshooting
* CI/CD failure analysis
* Log analysis
* Incident root-cause analysis
* Cost optimization

AI is used as an engineering assistant. Infrastructure changes are reviewed, tested, and verified by the engineer before being applied.

### 🚀 Project Roadmap

### Phase 1 — Application ✅

* [x] Backend API foundation
* [x] `GET /health`
* [x] `GET /api/products`
* [x] `POST /api/products`
* [x] PostgreSQL integration
* [x] Frontend application
* [x] Frontend-to-backend communication
* [x] CORS configuration
* [x] Application documentation

### Phase 2 — Containerization ✅

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

### Phase 3 — AWS Infrastructure ✅

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

### Phase 4 — Kubernetes ✅

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

### Phase 5 — Helm

* [ ] Helm chart
* [ ] Values files
* [ ] Environment-specific configuration
* [ ] Helm deployment testing

### Phase 6 — CI/CD

* [ ] GitHub Actions
* [ ] Automated testing
* [ ] Docker image build
* [ ] Image security scanning
* [ ] Push images to Amazon ECR
* [ ] Deploy to Amazon EKS

### Phase 7 — GitOps

* [ ] ArgoCD
* [ ] Automated synchronization
* [ ] Environment promotion

### Phase 8 — Observability

* [ ] Prometheus
* [ ] Grafana
* [ ] Loki
* [ ] Centralized logging
* [ ] Metrics
* [ ] Dashboards
* [ ] Alerting

### Phase 9 — AI-Assisted DevOps

* [ ] Terraform plan analysis
* [ ] Kubernetes troubleshooting
* [ ] CI/CD failure analysis
* [ ] Log analysis
* [ ] Incident investigation
* [ ] Cost optimization
* [ ] Security recommendations

---

## 📊 Current Progress

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

---

### 🚧 Currently Working On

The Kubernetes phase has been completed and documented.

The next major milestone is **Helm**.

Upcoming work includes:

* [ ] Helm chart structure
* [ ] Helm templates
* [ ] Values files
* [ ] Environment-specific configuration
* [ ] Helm linting and validation
* [ ] Helm deployment testing

---

## 📚 Documentation

Detailed documentation is maintained under the `docs/` directory.

### Architecture

* [Architecture Overview](docs/architecture/architecture.md)

### Docker

* [Docker Containerization](docs/docker/docker.md)

### Kubernetes

The Kubernetes phase has been fully implemented, tested, troubleshot, and documented.

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
* Services
* Persistent storage
* Resource requests and limits
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

### Terraform

The Terraform phase has been fully documented with detailed implementation guides, architecture explanations, testing procedures, troubleshooting notes, and engineering decisions.

#### Terraform Documentation Index

* [Terraform Documentation Home](docs/terraform/README.md)
* [Terraform Architecture](docs/terraform/architecture.md)
* [Terraform Bootstrap](docs/terraform/bootstrap.md)
* [Terraform Remote Backend](docs/terraform/backend.md)
* [Terraform Modules](docs/terraform/modules.md)
* [Terraform Environment Structure](docs/terraform/environment.md)
* [Terraform Workflow](docs/terraform/workflow.md)
* [Terraform Testing & Validation](docs/terraform/testing.md)

These documents cover:

* Project architecture
* Bootstrap process
* Remote backend configuration
* Module design
* Environment structure
* Infrastructure workflow
* Testing and validation
* Troubleshooting
* Best practices
* Engineering decisions

### Application

Application documentation currently includes:

* `application/application-overview.md`
* `application/troubleshooting-cors.md`

### Requirements

* [Project Requirements](docs/requirements.md)

Every major milestone includes:

* What was built
* Why it was built
* How it works
* Problems encountered
* Troubleshooting steps
* AI-assisted analysis
* Lessons learned

---

## 🤖 AI-Assisted DevOps Workflow

AI is used throughout the project as a technical assistant rather than as a replacement for engineering understanding.

The workflow follows:

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

Examples include:

    Dockerfile
        ↓
    AI Review
        ↓
    Security and Optimization Analysis
        ↓
    Engineer Verification
        ↓
    Build and Test

    Terraform Plan
        ↓
    AI-Assisted Review
        ↓
    Potential Risk Identification
        ↓
    Engineer Verification
        ↓
    Apply Infrastructure

    Kubernetes Deployment
            ↓
    AI-Assisted Troubleshooting
            ↓
    Configuration Review
            ↓
    Engineer Validation
            ↓
    Deploy to Cluster

The goal is to demonstrate practical AI-assisted DevOps workflows while maintaining human ownership of technical decisions.

---

## 🎯 Project Philosophy

This project focuses on understanding the complete DevOps lifecycle rather than simply using individual tools.

The goal is to understand:

    Application
        ↓
    Containerization
        ↓
    Infrastructure as Code
        ↓
    Cloud
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

Each milestone follows this workflow:

    Design
        ↓
    Implement
        ↓
    Test
        ↓
    Troubleshoot
        ↓
    Use AI-Assisted Analysis
        ↓
    Document
        ↓
    Commit

The objective is to build a production-style platform while understanding the engineering decisions, trade-offs, failures, troubleshooting, testing, and operational practices involved at every stage of the DevOps lifecycle.

---

## 👨‍💻 Author

**Rakesh Gangwar**

DevOps Engineer focused on AWS, Terraform, Docker, Kubernetes, CI/CD, Infrastructure as Code, and cloud-native technologies.

---

## 🚧 Project Status

**Status:** 🟢 Active Development

### ✅ Completed Milestones

- Application Development
- Docker Containerization
- Terraform Infrastructure
- AWS Networking Foundation
- Remote Backend Configuration
- Terraform Module Architecture
- Environment-Based Infrastructure
- Infrastructure Documentation
- Kubernetes Workloads
- Kubernetes Networking
- Kubernetes Security
- Kubernetes Testing and Validation
- Kubernetes Documentation

### 🚧 Current Milestone

The Kubernetes phase has been completed successfully.

The next objective is to package the Kubernetes application stack using **Helm**.

Upcoming work includes:

- Helm Chart Structure
- Helm Templates
- Values Files
- Environment-Specific Configuration
- Helm Linting and Validation
- Helm Deployment Testing

---

## 📈 Project Progress

    Application                 ████████████████████ 100%

    Docker                      ████████████████████ 100%

    Terraform                   ████████████████████ 100%

    Kubernetes                  ████████████████████ 100%

    Helm                        ░░░░░░░░░░░░░░░░░░░░   0%

    GitHub Actions              ░░░░░░░░░░░░░░░░░░░░   0%

    ArgoCD                      ░░░░░░░░░░░░░░░░░░░░   0%

    Observability               ░░░░░░░░░░░░░░░░░░░░   0%

---

## 🎯 Long-Term Goal

This repository is intended to become a complete production-style DevOps reference project demonstrating:

- Modern application development
- Containerization with Docker
- Infrastructure as Code using Terraform
- AWS cloud infrastructure
- Kubernetes orchestration
- Helm package management
- CI/CD automation
- GitOps workflows
- Observability
- Security best practices
- AI-assisted DevOps engineering

The emphasis is not only on building infrastructure but also on documenting engineering decisions, implementation details, troubleshooting, testing, and lessons learned throughout the project.

---

## 🙌 Acknowledgements

This project is built through continuous learning, hands-on experimentation, testing, troubleshooting, and iterative improvement.

Every completed milestone includes implementation, validation, documentation, and engineering analysis to create a portfolio that reflects production-oriented DevOps practices rather than isolated tool demonstrations.

---

## ⭐ Support

If you found this project useful:

- ⭐ Star the repository
- 🍴 Fork the repository
- 💡 Share feedback or suggestions
- 🛠️ Follow future project updates as new phases are completed

---

## 📅 Next Milestone

➡️ **Helm Packaging for the Kubernetes Application**

The Terraform and Kubernetes phases have been completed successfully.

The next phase focuses on packaging the Kubernetes workloads using Helm, followed by CI/CD automation, GitOps with ArgoCD, and complete observability using Prometheus, Grafana, and Loki.

## 🔍 Engineering Approach

The project is developed incrementally rather than building the entire platform at once.

Each phase follows a practical engineering lifecycle:

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

The project intentionally documents real implementation issues and troubleshooting instead of presenting only the final successful configuration.

This includes:

- Configuration mistakes
- Kubernetes policy conflicts
- Container security issues
- Networking problems
- Application connectivity issues
- Infrastructure validation
- Testing results
- Engineering trade-offs
- Lessons learned

---

## 🧪 Testing Philosophy

Testing is performed at each stage before moving to the next milestone.

### Application Testing

- API health checks
- Backend API testing
- PostgreSQL connectivity testing
- Frontend API communication
- Browser-based validation
- CORS validation

### Docker Testing

- Docker image builds
- Container startup validation
- Docker Compose testing
- Service-to-service communication
- PostgreSQL persistence testing
- Container health checks

### Terraform Testing

- `terraform fmt`
- `terraform validate`
- `terraform plan`
- Infrastructure configuration review
- Module validation
- AWS resource verification

### Kubernetes Testing

- Manifest validation
- Namespace validation
- Deployment validation
- Service validation
- PostgreSQL StatefulSet validation
- Persistent storage validation
- Health probe validation
- HPA configuration validation
- NetworkPolicy validation
- RBAC validation
- ResourceQuota and LimitRange validation
- Kyverno policy validation
- Ingress validation
- End-to-end application testing

The Kubernetes implementation was tested and troubleshot locally before the AWS EKS deployment stage to avoid unnecessary infrastructure costs during development.

---

## 🛡️ Security Approach

Security is considered throughout the platform rather than being added as a final step.

Current Kubernetes security controls include:

- Pod Security Standards
- Non-root container execution
- Security contexts
- Dropped Linux capabilities
- Disabled privilege escalation
- RuntimeDefault seccomp profile
- Kyverno admission policies
- Approved container registry enforcement
- ResourceQuota
- LimitRange
- NetworkPolicies
- RBAC
- Dedicated ServiceAccounts
- Kubernetes Secrets
- Restricted network access

The project also documents security-related failures and policy conflicts encountered during Kubernetes testing.

---

## 🧩 Kubernetes Design Principles

The Kubernetes implementation follows several production-oriented principles.

### Separation of Responsibilities

Different Kubernetes resources are organized by responsibility:

- Namespace
- Workloads
- Services
- Configuration
- Secrets
- Networking
- Autoscaling
- RBAC
- Resource management
- Security policies

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

- [Kubernetes Architecture](docs/kubernetes/architecture.md)
- [Kubernetes Workloads](docs/kubernetes/workloads.md)
- [Kubernetes Networking](docs/kubernetes/networking.md)
- [Kubernetes Security](docs/kubernetes/security.md)
- [Kubernetes Testing & Validation](docs/kubernetes/testing.md)

The documentation is intentionally separated into focused files so that each major Kubernetes concept can be understood independently.

---

## 🔧 Troubleshooting Documentation

Troubleshooting is treated as an important part of the project rather than something hidden from the final implementation.

Documented troubleshooting areas include:

- Application CORS issues
- Docker container issues
- Terraform validation and planning issues
- Kubernetes configuration issues
- PostgreSQL StatefulSet issues
- Security policy conflicts
- Kyverno admission failures
- NetworkPolicy behavior
- Kubernetes ingress configuration
- Resource and probe configuration

The purpose of documenting these issues is to demonstrate how production-oriented DevOps problems are investigated and resolved.

---

## 🧠 Lessons Learned

The project is designed to capture lessons learned throughout implementation.

Important areas include:

- Understanding why infrastructure components are required
- Designing reusable Terraform modules
- Separating infrastructure environments
- Understanding Kubernetes workload types
- Choosing StatefulSet for PostgreSQL
- Understanding Kubernetes Services and DNS
- Designing default-deny NetworkPolicies
- Applying least-privilege RBAC
- Using resource governance controls
- Understanding admission policies
- Troubleshooting security policy conflicts
- Testing Kubernetes configurations before cloud deployment
- Using AI as an engineering assistant while maintaining human verification

---

## 🚀 Future Platform Architecture

The long-term platform will evolve from the current Kubernetes implementation into a complete DevOps delivery platform.

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
        ┌───────┼────────┐
        │       │        │
        ▼       ▼        ▼
    Frontend Backend PostgreSQL
        │       │        │
        └───────┼────────┘
                │
                ▼
        Observability Stack
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
    Prometheus Grafana Loki

Future phases will add Helm packaging, automated CI/CD, GitOps deployment, monitoring, centralized logging, alerting, and AI-assisted operational workflows.

---

## 📌 Important Project Principle

The project does not treat successful deployment as the only measure of completion.

A milestone is considered complete when it has been:

- Designed
- Implemented
- Tested
- Troubleshot
- Security-reviewed
- Documented
- Validated
- Committed to the repository

This approach ensures that the repository demonstrates not only **what was built**, but also **why it was built, how it works, how it was tested, and how problems were solved**.