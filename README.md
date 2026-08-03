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

The following represents the target production architecture. The application is currently running locally using Docker Compose and will later be deployed to Amazon EKS.

```text
                         Users
                           │
                           ▼
                    ┌──────────────┐
                    │   Ingress    │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌──────────────┐         ┌──────────────┐
       │   Frontend   │         │ Backend API  │
       │ React + Nginx│         │ Node + Express│
       └──────────────┘         └──────┬───────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  PostgreSQL  │
                              └──────────────┘

                         Amazon EKS
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
      Helm                 ArgoCD              Observability
                                                    │
                                     Prometheus + Grafana + Loki
```

### Current Local Architecture

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
│       Docker Network + Persistent Volume            │
└─────────────────────────────────────────────────────┘
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
│
├── helm/
│
├── docs/
│   ├── architecture/
│   │   └── architecture.md
│   ├── docker/
│   │   └── docker.md
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
* Ingress

### CI/CD & GitOps

* GitHub Actions
* ArgoCD

### Observability

* Prometheus
* Grafana
* Loki

### AI-Assisted DevOps

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
## 🚀 Project Roadmap

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

### Phase 4 — Kubernetes 🚧

* [ ] Namespace
* [ ] ConfigMaps
* [ ] Secrets
* [ ] PostgreSQL Deployment
* [ ] Backend Deployment
* [ ] Frontend Deployment
* [ ] Services
* [ ] Resource requests and limits
* [ ] Health probes
* [ ] Ingress
* [ ] End-to-end Kubernetes deployment

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

---

### 🚧 Currently Working On

The next major milestone is deploying the application to Kubernetes.

Upcoming work includes:

* [ ] Kubernetes manifests
* [ ] Namespace
* [ ] ConfigMaps
* [ ] Secrets
* [ ] PostgreSQL Deployment
* [ ] Backend Deployment
* [ ] Frontend Deployment
* [ ] Services
* [ ] Ingress
* [ ] Kubernetes testing

---

## 📚 Documentation

Detailed documentation is maintained under the `docs/` directory.

### Architecture

* [Architecture Overview](docs/architecture/architecture.md)

### Docker

* [Docker Containerization](docs/docker/docker.md)

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

## 🎯 Project Philosophy

This project focuses on understanding the complete DevOps lifecycle rather than simply using individual tools.

The goal is to understand:

```text
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
```

Each milestone follows this workflow:

```text
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
```

The objective is to build a production-style platform while understanding the engineering decisions, trade-offs, failures, troubleshooting, and operational practices involved at every stage of the DevOps lifecycle.

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

### 🚧 Current Milestone

The project is now entering the **Kubernetes** phase.

The next objective is to deploy the complete application stack onto Amazon EKS using production-style Kubernetes manifests.

Upcoming work includes:

- Kubernetes Namespace
- ConfigMaps
- Secrets
- PostgreSQL Deployment
- Backend Deployment
- Frontend Deployment
- Services
- Ingress
- Resource Requests & Limits
- Liveness & Readiness Probes
- Persistent Storage
- End-to-End Kubernetes Validation

---

## 📈 Project Progress

```text
Application                 ████████████████████ 100%

Docker                      ████████████████████ 100%

Terraform                   ████████████████████ 100%

Kubernetes                  ░░░░░░░░░░░░░░░░░░░░   0%

Helm                        ░░░░░░░░░░░░░░░░░░░░   0%

GitHub Actions              ░░░░░░░░░░░░░░░░░░░░   0%

ArgoCD                      ░░░░░░░░░░░░░░░░░░░░   0%

Observability               ░░░░░░░░░░░░░░░░░░░░   0%
```

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

➡️ **Production Kubernetes Deployment on Amazon EKS**

The Terraform phase has been completed successfully.

The next phase focuses on deploying the application to Kubernetes, followed by Helm packaging, CI/CD automation, GitOps with ArgoCD, and complete observability using Prometheus, Grafana, and Loki.
