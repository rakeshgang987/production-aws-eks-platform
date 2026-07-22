# Production AWS EKS Platform

A production-style DevOps platform built as a single monorepo. This project demonstrates the complete lifecycle of a containerized application—from application development and infrastructure provisioning to Kubernetes deployment, GitOps, observability, security, and AI-assisted DevOps operations.

---

## 🎯 Project Objective

The goal of this project is to design and build a production-style platform on AWS using modern DevOps practices.

The platform will include:

- Containerized application
- Infrastructure as Code with Terraform
- AWS VPC networking
- Amazon EKS
- Kubernetes
- Helm
- GitHub Actions CI/CD
- Amazon ECR
- ArgoCD GitOps
- Prometheus
- Grafana
- Loki
- AI-assisted DevOps workflows
- Security and troubleshooting documentation

---

## 🏗️ High-Level Architecture

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
       │    React     │         │ Node + Express│
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

---

## 📁 Repository Structure

```text
production-aws-eks-platform/
│
├── application/
│   ├── backend/
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
│   │   ├── src/
│   │   ├── package.json
│   │   └── package-lock.json
│   │
│   └── docker-compose.yml
│
├── terraform/
│   ├── environments/
│   │   └── dev/
│   │
│   └── modules/
│       └── vpc/
│
├── kubernetes/
│
├── helm/
│
├── docs/
│   ├── architecture/
│   ├── application/
│   │   ├── application-overview.md
│   │   └── troubleshooting-cors.md
│   ├── infrastructure/
│   ├── kubernetes/
│   ├── security/
│   ├── troubleshooting/
│   ├── observability/
│   └── ai-assisted-devops/
│
├── scripts/
│
└── README.md
```

---

## 🧰 Technology Stack

### Application

- Node.js
- Express
- React
- Vite
- PostgreSQL

### Containers

- Docker
- Docker Compose

### Cloud & Infrastructure

- AWS
- Terraform
- Amazon VPC
- Amazon EKS
- Amazon ECR

### Kubernetes

- Kubernetes
- Helm
- Ingress

### CI/CD & GitOps

- GitHub Actions
- ArgoCD

### Observability

- Prometheus
- Grafana
- Loki

### AI-Assisted DevOps

AI assistance will be integrated throughout the project for:

- Application code review
- Security analysis
- Dockerfile optimization
- Terraform code and plan review
- Kubernetes troubleshooting
- CI/CD failure analysis
- Log analysis
- Incident root-cause analysis
- Cost optimization

---

## 🚀 Project Roadmap

### Phase 1 — Application ✅

- [x] Backend API foundation
- [x] `GET /health`
- [x] `GET /api/products`
- [x] `POST /api/products`
- [x] PostgreSQL integration
- [x] Frontend application
- [x] Frontend-to-backend communication
- [x] CORS configuration
- [x] Application documentation

### Phase 2 — Containerization 🚧

- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] PostgreSQL container
- [ ] Docker Compose
- [ ] Local multi-container testing
- [ ] Container security review

### Phase 3 — AWS Infrastructure

- [x] Terraform project structure
- [x] AWS VPC
- [ ] Public and private subnets
- [ ] Route tables
- [ ] Internet Gateway
- [ ] NAT Gateway
- [ ] Security groups
- [ ] IAM
- [ ] Amazon EKS

### Phase 4 — Kubernetes

- [ ] Deployments
- [ ] Services
- [ ] ConfigMaps
- [ ] Secrets
- [ ] Resource requests and limits
- [ ] Health probes
- [ ] Ingress

### Phase 5 — Helm

- [ ] Helm chart
- [ ] Values files
- [ ] Environment-specific configuration
- [ ] Helm deployment testing

### Phase 6 — CI/CD

- [ ] GitHub Actions
- [ ] Automated testing
- [ ] Docker image build
- [ ] Image security scanning
- [ ] Push images to Amazon ECR

### Phase 7 — GitOps

- [ ] ArgoCD
- [ ] Automated synchronization
- [ ] Environment promotion

### Phase 8 — Observability

- [ ] Prometheus
- [ ] Grafana
- [ ] Loki
- [ ] Centralized logging
- [ ] Metrics and dashboards
- [ ] Alerting

### Phase 9 — AI-Assisted DevOps

- [ ] Terraform plan analysis
- [ ] Kubernetes troubleshooting workflow
- [ ] CI/CD failure analysis
- [ ] Log analysis
- [ ] Incident investigation
- [ ] Cost and security recommendations

---

## 📊 Current Progress

### Completed

- [x] Terraform infrastructure foundation
- [x] AWS VPC created using Terraform
- [x] Node.js backend application
- [x] Express API
- [x] Health endpoint
- [x] Products API
- [x] Product creation API
- [x] PostgreSQL database integration
- [x] React frontend application
- [x] Frontend-to-backend API communication
- [x] CORS configuration
- [x] Application documentation

### Currently Working On

- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] Docker Compose
- [ ] Local multi-container testing
- [ ] Container security review

---

## 📚 Documentation

Detailed documentation will be added under:

```text
docs/
├── architecture/
├── application/
│   ├── application-overview.md
│   └── troubleshooting-cors.md
├── infrastructure/
├── kubernetes/
├── security/
├── troubleshooting/
├── observability/
└── ai-assisted-devops/
```

Every major milestone will include:

- What was built
- Why it was built
- How it works
- Problems encountered
- Troubleshooting steps
- AI-assisted analysis
- Lessons learned

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

---

## 👨‍💻 Author

**Rakesh Gangwar**

DevOps Engineer focused on AWS, Terraform, Docker, Kubernetes, CI/CD, and cloud-native technologies.