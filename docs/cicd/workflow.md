# CI/CD Workflow

## Overview

This document describes the GitHub Actions CI/CD workflow implemented for the Production-Style AWS EKS DevOps Platform.

The workflow automates application testing, container image creation, Docker Hub publishing, and Helm-based Kubernetes deployment.

The workflow is defined in:

```text
.github/workflows/ci.yml
```

---

## Pipeline Trigger

The workflow is triggered by:

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
```

This means the pipeline runs when:

* Code is pushed to `main`
* A pull request targets `main`

---

## Pipeline Flow

The overall workflow follows:

```text
Code Push / Pull Request
          |
          v
   Backend Tests
          |
          v
 Frontend Lint + Build
          |
          v
   Docker Build
          |
          v
 Docker Hub Push
          |
          v
  Helm Deployment
          |
          v
 Minikube Validation
```

Each stage is designed to validate the previous stage before moving forward.

---

# 1. Backend Tests

The backend test job runs on an Ubuntu GitHub-hosted runner.

A PostgreSQL 16 service container is started for the tests.

### PostgreSQL configuration

```text
Database: products_db
User: app_user
Port: 5432
```

The PostgreSQL service includes a health check using:

```bash
pg_isready -U app_user -d products_db
```

The workflow waits for the database to become healthy before running the application tests.

---

## Node.js Setup

Node.js is configured using `actions/setup-node`.

The workflow uses Node.js 20 for the application runtime.

The npm cache is enabled using the backend lock file:

```text
application/backend/package-lock.json
```

---

## Dependency Installation

Backend dependencies are installed using:

```bash
npm ci
```

`npm ci` provides a clean and reproducible dependency installation based on the lock file.

---

## Test Database Initialization

The test database is initialized using:

```bash
psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f ../database/init.sql
```

The database password is provided through a GitHub Actions secret.

The workflow does not store the database password directly in the repository.

---

## Backend Tests

After the database is initialized, the backend test suite is executed using:

```bash
npm test
```

If the backend tests fail, the pipeline stops before the Docker build stage.

---

# 2. Frontend Lint and Build

The frontend job runs independently from the backend test job.

The working directory is:

```text
application/frontend
```

---

## Dependency Installation

Frontend dependencies are installed using:

```bash
npm ci
```

---

## Linting

ESLint is executed using:

```bash
npm run lint
```

This checks the frontend source code for configured linting issues.

---

## Production Build

The frontend production build is generated using:

```bash
npm run build
```

A successful build confirms that the frontend can be compiled for production.

---

# 3. Docker Build and Push

After the application validation stages succeed, the pipeline builds the backend and frontend container images.

The Docker stage performs:

```text
Authenticate with Docker Hub
          |
          v
Build Backend Image
          |
          v
Build Frontend Image
          |
          v
Tag Images
          |
          v
Push Images to Docker Hub
```

---

## Docker Hub Authentication

The workflow authenticates with Docker Hub using GitHub Actions secrets.

Credentials are not stored directly in the workflow file.

---

## Backend Image

The backend image is published to:

```text
docker.io/rakeshgang163/production-aws-eks-platform-backend
```

---

## Frontend Image

The frontend image is published to:

```text
docker.io/rakeshgang163/production-aws-eks-platform-frontend
```

---

## Image Tagging

The workflow uses a dynamic image-tagging approach so that container images can be associated with the CI/CD execution.

The generated tag is passed to the Helm deployment stage.

This avoids relying exclusively on a static image tag for CI/CD deployments.

---

# 4. Helm Validation

Before deployment, the Helm chart can be validated using:

```bash
helm lint helm
```

A successful validation produces:

```text
1 chart(s) linted, 0 chart(s) failed
```

The chart can also be rendered without installing it:

```bash
helm template production-aws-eks-platform helm
```

Rendered manifests can then be inspected to verify image repositories and tags.

For example:

```bash
grep -n "image:" /tmp/rendered.yaml
```

---

# 5. Helm Deployment

The CI/CD deployment uses:

```bash
helm upgrade --install
```

This command provides both installation and upgrade behavior.

If the release does not exist, Helm installs it.

If the release already exists, Helm upgrades it.

The release name is:

```text
production-aws-eks-platform
```

The current validation namespace is:

```text
production-eks-platform-helm
```

---

## Image Overrides

The backend and frontend image values can be overridden during deployment.

Example:

```bash
--set backend.image.repository=docker.io/rakeshgang163/production-aws-eks-platform-backend
--set backend.image.tag="$IMAGE_TAG"
--set frontend.image.repository=docker.io/rakeshgang163/production-aws-eks-platform-frontend
--set frontend.image.tag="$IMAGE_TAG"
```

This allows the same Helm chart to deploy different image versions without modifying the chart templates.

---

# 6. Kubernetes Validation

After Helm deployment, Kubernetes resources are checked.

The Helm release can be inspected using:

```bash
helm list -n production-eks-platform-helm
```

Expected status:

```text
STATUS: deployed
```

Pod status can be checked using:

```bash
kubectl get pods -n production-eks-platform-helm
```

The deployed image references can be inspected using:

```bash
kubectl get pods -n production-eks-platform-helm \
  -o jsonpath='{range .items[*]}{.metadata.name}{" -> "}{.spec.containers[0].image}{"\n"}{end}'
```

Expected application images:

```text
docker.io/rakeshgang163/production-aws-eks-platform-backend:<tag>

docker.io/rakeshgang163/production-aws-eks-platform-frontend:<tag>
```

---

# 7. Local Minikube Validation

The Kubernetes deployment layer is currently validated using Minikube.

The validation confirms that:

* Helm successfully deploys the application
* Backend pods become ready
* Frontend pods become ready
* PostgreSQL becomes ready
* Docker Hub images can be pulled
* Kubernetes workloads use the expected images
* Helm reports the release as deployed

The final AWS EKS deployment test is intentionally deferred until the remaining platform components are completed.

---

# 8. CI/CD Security Practices

The workflow follows several basic security practices.

### Secrets

Sensitive credentials are stored using GitHub Actions secrets.

Examples include:

```text
TEST_DB_PASSWORD
Docker Hub credentials
```

Secrets are not hard-coded into the workflow.

### Image Registry

Container images are published to dedicated Docker Hub repositories.

### Kubernetes Configuration

Deployment configuration is managed through Helm values rather than hard-coding image versions into individual Kubernetes manifests.

---

# 9. Current Workflow Status

The complete CI/CD workflow has been successfully executed.

Current stages:

```text
Backend Tests             ✅
Frontend Lint + Build     ✅
Docker Build              ✅
Docker Hub Push           ✅
Helm Validation           ✅
Helm Deployment           ✅
Minikube Validation      ✅
```

The CI/CD pipeline currently provides an automated path from source-code changes to a Helm-managed Kubernetes deployment.

Final AWS EKS integration testing remains a later project milestone.
