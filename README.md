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
│   ├── environments/
│   │   └── dev/
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
* Amazon EKS
* Amazon ECR

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

---

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

### Phase 3 — AWS Infrastructure 🚧

* [x] Terraform project structure
* [x] Terraform VPC module
* [x] AWS VPC foundation
* [x] Terraform variables and outputs
* [x] Terraform validation and planning
* [ ] Public and private subnet design
* [ ] Route tables
* [ ] Internet Gateway
* [ ] NAT Gateway
* [ ] Security groups
* [ ] IAM configuration
* [ ] Amazon ECR
* [ ] Amazon EKS

### Phase 4 — Kubernetes

* [ ] Deployments
* [ ] Services
* [ ] ConfigMaps
* [ ] Secrets
* [ ] Resource requests and limits
* [ ] Health probes
* [ ] Ingress

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

### Phase 7 — GitOps

* [ ] ArgoCD
* [ ] Automated synchronization
* [ ] Environment promotion

### Phase 8 — Observability

* [ ] Prometheus
* [ ] Grafana
* [ ] Loki
* [ ] Centralized logging
* [ ] Metrics and dashboards
* [ ] Alerting

### Phase 9 — AI-Assisted DevOps

* [ ] Terraform plan analysis
* [ ] Kubernetes troubleshooting workflow
* [ ] CI/CD failure analysis
* [ ] Log analysis
* [ ] Incident investigation
* [ ] Cost and security recommendations

---

## 📊 Current Progress

### Completed

#### Application

* [x] Node.js backend application
* [x] Express API
* [x] Health endpoint
* [x] Products API
* [x] Product creation API
* [x] PostgreSQL database integration
* [x] React frontend application
* [x] Frontend-to-backend API communication
* [x] CORS configuration
* [x] Application documentation

#### Containerization

* [x] Backend Dockerfile
* [x] Frontend multi-stage Dockerfile
* [x] Nginx frontend runtime
* [x] Non-root container execution
* [x] PostgreSQL container
* [x] Docker Compose orchestration
* [x] Docker container networking
* [x] Persistent PostgreSQL storage
* [x] Container health checks
* [x] Docker troubleshooting and port conflict resolution
* [x] Docker documentation

#### Terraform Foundation

* [x] Terraform environment structure
* [x] Reusable VPC module
* [x] Terraform variables
* [x] Terraform outputs
* [x] AWS provider configuration
* [x] Terraform validation
* [x] Terraform plan
* [x] AWS VPC foundation

---

### Currently Working On

The next major milestone is completing the Terraform-managed AWS networking infrastructure.

Planned work:

* [ ] Public subnet design
* [ ] Private subnet design
* [ ] Internet Gateway
* [ ] NAT Gateway
* [ ] Route tables
* [ ] Security groups
* [ ] IAM configuration
* [ ] Amazon ECR
* [ ] Amazon EKS

---

## 📚 Documentation

Detailed documentation is maintained under the `docs/` directory.

### Architecture

* [Architecture Overview](docs/architecture/architecture.md)

### Docker

* [Docker Containerization](docs/docker/docker.md)

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
Infrastructure
    ↓
Cloud
    ↓
Kubernetes
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

The objective is to build a production-style platform while understanding the engineering decisions, trade-offs, failures, and troubleshooting involved at every stage.

---

## 👨‍💻 Author

**Rakesh Gangwar**

DevOps Engineer focused on AWS, Terraform, Docker, Kubernetes, CI/CD, and cloud-native technologies.

---

## 🚧 Project Status

**Active Development**

Application development and Docker containerization are complete.

The Terraform infrastructure foundation is complete, including the reusable VPC module and AWS VPC foundation.

The next milestone is to expand the VPC into a complete AWS networking layer with subnets, routing, NAT, security groups, and IAM before proceeding toward Amazon ECR and Amazon EKS.
