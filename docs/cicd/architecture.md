# CI/CD Architecture

## Overview

This document describes the CI/CD architecture implemented for the Production-Style AWS EKS DevOps Platform.

The CI/CD layer automates application validation, container image creation, image publishing, and Kubernetes deployment using GitHub Actions, Docker, Docker Hub, and Helm.

The Kubernetes deployment layer is currently validated locally using Minikube. AWS EKS integration testing is intentionally planned for the final stage of the project after the remaining platform components are completed.

---

## Architecture Flow

The CI/CD pipeline follows this flow:

```text
Developer
   |
   | Git Push / Pull Request
   v
GitHub Repository
   |
   v
GitHub Actions
   |
   +-----------------------------+
   |                             |
   v                             v
Backend Tests              Frontend Checks
   |                             |
   | PostgreSQL                  | Lint
   | Service Container           | Production Build
   v                             v
   +-------------+---------------+
                 |
                 v
          Docker Build
          |          |
          v          v
       Backend    Frontend
          |          |
          +----+-----+
               |
               v
          Docker Hub
               |
               v
        Helm Deployment
               |
               v
            Minikube
               |
               v
      Kubernetes Workloads
```

---

## Components

### 1. GitHub Repository

The GitHub repository contains the complete project source code and infrastructure configuration, including:

* Application source code
* Dockerfiles
* Kubernetes manifests
* Helm chart
* Terraform configuration
* GitHub Actions workflows
* Project documentation

The repository acts as the source of truth for the CI/CD pipeline.

---

### 2. GitHub Actions

GitHub Actions provides the automation layer for the CI/CD process.

The workflow is defined in:

```text
.github/workflows/ci.yml
```

The workflow is triggered by:

* Pushes to the `main` branch
* Pull requests targeting the `main` branch

The pipeline validates the application before building and publishing container images and performing the Helm deployment stage.

---

### 3. Backend Testing

The backend CI job runs on a GitHub-hosted Ubuntu runner.

A PostgreSQL 16 service container is used as the test database.

The backend pipeline performs:

```text
Install Dependencies
        ↓
Start PostgreSQL Service
        ↓
Initialize Test Database
        ↓
Run Backend Tests
```

This ensures that backend tests are executed against a real PostgreSQL service rather than a mocked database.

---

### 4. Frontend Validation

The frontend CI job performs application quality checks before the Docker image is built.

The workflow performs:

```text
Install Dependencies
        ↓
Run ESLint
        ↓
Production Build
```

This verifies that the frontend passes linting and can successfully generate a production build.

---

### 5. Docker

Docker is used to package the backend and frontend applications into independent container images.

The pipeline builds two images:

```text
Backend
docker.io/rakeshgang163/production-aws-eks-platform-backend

Frontend
docker.io/rakeshgang163/production-aws-eks-platform-frontend
```

Keeping the frontend and backend as separate images allows them to be independently versioned and deployed.

---

### 6. Docker Hub

Docker Hub acts as the container image registry.

The CI/CD pipeline authenticates with Docker Hub and publishes the successfully built images.

The repositories used by the project are:

```text
docker.io/rakeshgang163/production-aws-eks-platform-backend

docker.io/rakeshgang163/production-aws-eks-platform-frontend
```

The images are later referenced by the Helm deployment.

---

### 7. Helm

Helm provides the packaging and deployment layer for the Kubernetes application.

The Helm chart is located at:

```text
helm/
```

The chart contains templates for application and platform resources such as:

* Backend Deployment
* Frontend Deployment
* PostgreSQL StatefulSet
* Services
* Ingress
* ConfigMaps
* Secrets
* Horizontal Pod Autoscalers
* RBAC
* NetworkPolicies
* Resource management
* Security policies

Image repositories and tags are configurable through `values.yaml` and CI/CD overrides.

---

### 8. Kubernetes / Minikube

The Helm release is currently deployed and validated using Minikube.

The application is deployed into:

```text
production-eks-platform-helm
```

The expected workload structure is:

```text
Backend
  └── 2 replicas

Frontend
  └── 2 replicas

PostgreSQL
  └── StatefulSet
```

Minikube provides the local Kubernetes environment used to validate the CI/CD deployment before final AWS EKS testing.

---

## CI/CD Responsibility Boundaries

The pipeline separates responsibilities across different stages:

| Component      | Responsibility                      |
| -------------- | ----------------------------------- |
| GitHub         | Source control and workflow trigger |
| GitHub Actions | CI/CD automation                    |
| PostgreSQL     | Backend integration test dependency |
| Docker         | Application containerization        |
| Docker Hub     | Container image registry            |
| Helm           | Kubernetes packaging and deployment |
| Minikube       | Local Kubernetes validation         |
| AWS EKS        | Final production-style validation   |

---

## Current Deployment Boundary

The current CI/CD architecture has been validated through:

```text
GitHub Actions
      ↓
Backend / Frontend Validation
      ↓
Docker Build
      ↓
Docker Hub
      ↓
Helm
      ↓
Minikube
      ↓
Kubernetes
```

AWS EKS is intentionally not included in the current validation environment.

The final EKS integration test will be performed after the remaining platform components are completed.

---

## Design Goals

The CI/CD architecture was designed around the following goals:

* Automate repetitive validation steps
* Fail early when application tests fail
* Build reproducible container images
* Publish versioned images to a registry
* Deploy using the existing Helm chart
* Keep Kubernetes configuration reusable
* Validate deployments before final AWS integration
* Provide a foundation for future GitOps and observability improvements

---

## Future Evolution

The CI/CD architecture will be extended as the platform evolves.

Planned additions include:

* AWS EKS deployment
* ArgoCD GitOps
* Prometheus and Grafana observability
* Loki log aggregation
* Container image security scanning
* Deployment rollback strategies
* Environment-specific configuration
* Production-focused deployment controls

The current architecture establishes the CI/CD foundation while keeping final AWS EKS validation as a separate project milestone.
