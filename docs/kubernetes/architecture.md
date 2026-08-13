# Kubernetes Architecture

## Overview

The Kubernetes phase of the `production-aws-eks-platform` project deploys the application stack using production-style Kubernetes resources.

The platform consists of three main application components:

- React frontend
- Node.js / Express backend API
- PostgreSQL database

The Kubernetes implementation was designed with a focus on:

- Workload separation
- Service-based communication
- Persistent database storage
- Ingress-based HTTP routing
- Resource management
- Autoscaling
- Network isolation
- Workload security
- Kubernetes-native configuration management

The Kubernetes workloads were tested locally using Minikube before the application deployment phase on AWS EKS.

---

## High-Level Architecture

                              ┌─────────────────────┐
                              │       Browser       │
                              └──────────┬──────────┘
                                         │
                                         │ HTTP
                                         ▼
                              ┌─────────────────────┐
                              │    NGINX Ingress    │
                              │ production-app.local│
                              └──────────┬──────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                        /                                /api
                         │                               │
                         ▼                               ▼
                ┌─────────────────┐             ┌─────────────────┐
                │ Frontend Service│             │ Backend Service │
                │      :80        │             │      :3000      │
                └────────┬────────┘             └────────┬────────┘
                         │                               │
                         ▼                               ▼
                ┌─────────────────┐             ┌─────────────────┐
                │ Frontend        │             │ Backend         │
                │ Deployment      │             │ Deployment      │
                │                 │             │                 │
                │ 2 replicas      │             │ 2 replicas      │
                │ Port 8080       │             │ Port 3000       │
                └─────────────────┘             └────────┬────────┘
                                                         │
                                                         │ TCP 5432
                                                         ▼
                                                ┌─────────────────┐
                                                │ PostgreSQL      │
                                                │ StatefulSet     │
                                                │                 │
                                                │ 1 replica       │
                                                │ Persistent PVC  │
                                                │ Port 5432       │
                                                └─────────────────┘

---

## Kubernetes Namespace

All application resources are deployed into a dedicated namespace:

production-eks-platform

The namespace provides logical isolation for the application components and Kubernetes resources.

The namespace also applies Kubernetes Pod Security Standards using the `restricted` security profile.

The namespace configuration is located at:

kubernetes/namespace/namespace.yaml

---

## Application Components

### Frontend

The frontend is deployed using a Kubernetes Deployment.

Configuration:

Deployment:
  frontend

Replicas:
  2

Container Port:
  8080

Service:
  frontend-service

Service Port:
  80

The frontend container is exposed internally through `frontend-service`.

The frontend configuration uses:

VITE_API_URL=/api

This allows browser API requests to use the same host through the Ingress routing configuration.

Manifest:

kubernetes/frontend/frontend-deployment.yaml

---

### Backend

The backend is a Node.js / Express API deployed using a Kubernetes Deployment.

Configuration:

Deployment:
  backend

Replicas:
  2

Container Port:
  3000

Service:
  backend-service

Service Port:
  3000

The backend receives database configuration through a ConfigMap and Secret.

Manifest files:

kubernetes/backend/backend-deployment.yaml

kubernetes/backend/backend-service.yaml

kubernetes/backend/backend-configmap.yaml

kubernetes/backend/backend-secret.yaml

---

### PostgreSQL

PostgreSQL is deployed using a StatefulSet rather than a standard Deployment.

Configuration:

StatefulSet:
  postgres

Replicas:
  1

Container Port:
  5432

Service:
  postgres-service

Headless Service:
  postgres-headless

Storage:
  10Gi PVC

The StatefulSet uses a `volumeClaimTemplate` to provision persistent storage for PostgreSQL.

The headless service is required by the StatefulSet configuration and provides stable network identity.

Manifest files:

kubernetes/postgres/postgres-statefulset.yaml

kubernetes/postgres/postgres-service.yaml

kubernetes/postgres/postgres-headless-service.yaml

---

## Service Architecture

Kubernetes Services provide stable network endpoints for the application workloads.

frontend-service
        │
        ▼
frontend pods

backend-service
        │
        ▼
backend pods

postgres-service
        │
        ▼
postgres pod

postgres-headless
        │
        ▼
postgres StatefulSet identity

The services use `ClusterIP` for internal application communication.

The application does not directly expose the backend or PostgreSQL database to the external network.

---

## Ingress Architecture

NGINX Ingress is used as the HTTP entry point for the application.

The configured host is:

production-app.local

Routing rules:

/       → frontend-service:80
/api    → backend-service:3000

Therefore, incoming requests follow this model:

Browser
   │
   ▼
production-app.local
   │
   ▼
NGINX Ingress
   │
   ├── / ──────► frontend-service
   │
   └── /api ───► backend-service

Ingress manifest:

kubernetes/ingress/ingress.yaml

---

## Frontend and Backend Request Flow

The frontend is configured with:

VITE_API_URL=/api

Therefore, the browser can request:

production-app.local/api/products

The NGINX Ingress routes the request to:

backend-service:3000

This provides a cleaner application architecture than exposing the backend service directly to the browser.

The resulting flow is:

Browser
   │
   │ GET /api/products
   ▼
NGINX Ingress
   │
   │ /api
   ▼
backend-service
   │
   ▼
Backend Pod
   │
   │ PostgreSQL :5432
   ▼
postgres-service
   │
   ▼
PostgreSQL

---

## Configuration and Secrets

Application configuration is separated from container images using Kubernetes ConfigMaps.

Sensitive database credentials are stored using Kubernetes Secrets.

### Backend ConfigMap

Contains non-sensitive configuration such as:

- PORT
- DB_HOST
- DB_PORT
- DB_NAME

### Backend Secret

Contains database credentials such as:

- DB_USER
- DB_PASSWORD

### PostgreSQL Secret

PostgreSQL credentials are also provided through a Kubernetes Secret.

This separation prevents configuration values from being hard-coded directly into the workload manifests.

---

## Resource Management

The Kubernetes namespace uses both `ResourceQuota` and `LimitRange`.

### ResourceQuota

Namespace-level limits:

CPU requests:       4 CPU
Memory requests:    4Gi
CPU limits:         8 CPU
Memory limits:      8Gi
Maximum pods:       20

Manifest:

kubernetes/resource-management/resource-quota.yaml

### LimitRange

Container-level boundaries include:

Minimum CPU:        50m
Minimum Memory:     64Mi

Maximum CPU:        2
Maximum Memory:     2Gi

Default CPU:        500m
Default Memory:     512Mi

Default Request CPU:
100m

Default Request Memory:
128Mi

Manifest:

kubernetes/resource-management/limit-range.yaml

---

## Autoscaling

Horizontal Pod Autoscalers are configured for the frontend and backend workloads.

### Backend HPA

Minimum replicas: 2
Maximum replicas: 5
CPU target:       70%
Memory target:    80%

### Frontend HPA

Minimum replicas: 2
Maximum replicas: 4
CPU target:       70%
Memory target:    80%

The HPA configuration also includes controlled scale-up and scale-down behavior to avoid unnecessary scaling fluctuations.

Manifests:

kubernetes/autoscaling/backend-hpa.yaml

kubernetes/autoscaling/frontend-hpa.yaml

---

## Persistent Storage

PostgreSQL uses persistent storage through a StatefulSet `volumeClaimTemplate`.

Current local configuration:

Storage Class:
standard

Requested Storage:
10Gi

Access Mode:
ReadWriteOnce

The local configuration is intended for Minikube testing.

For AWS EKS, the intended storage implementation is AWS EBS-backed persistent storage using the AWS EBS CSI Driver.

This allows the database storage architecture to be adapted for the AWS environment without changing the fundamental StatefulSet design.

---

## Security Architecture

Security controls are applied at multiple layers.

                    Kubernetes Namespace
                           │
                           ▼
                Pod Security Standards
                           │
                           ▼
                    Security Context
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
           RBAC                  NetworkPolicies
              │                         │
              └────────────┬────────────┘
                           ▼
                       Kyverno
                           │
                           ▼
                 Admission Enforcement

Implemented security controls include:

- Restricted Pod Security Standards
- Dedicated ServiceAccounts
- RBAC
- `runAsNonRoot`
- Explicit user and group configuration where required
- Dropped Linux capabilities
- `allowPrivilegeEscalation: false`
- RuntimeDefault seccomp profiles
- NetworkPolicies
- Kyverno admission policies
- Kubernetes Secrets

Detailed security information is documented separately in:

docs/kubernetes/security.md

---

## Network Architecture

A default-deny NetworkPolicy provides the baseline network security model.

Additional NetworkPolicies define the permitted communication paths between workloads.

Conceptually:

Default Deny
     │
     ├── Frontend traffic
     │
     ├── Backend traffic
     │
     ├── PostgreSQL traffic
     │
     └── DNS traffic

This reduces unnecessary network connectivity between workloads.

Detailed networking configuration is documented in:

docs/kubernetes/networking.md

---

## Reliability Architecture

The application workloads use Kubernetes health probes.

### Backend

The backend includes:

- Startup probe
- Liveness probe
- Readiness probe

Health endpoint:

/health

### Frontend

The frontend includes:

- Startup probe
- Liveness probe
- Readiness probe

Health checks target the frontend HTTP endpoint.

These probes allow Kubernetes to distinguish between:

- A container that is starting
- A container that is unhealthy
- A container that is ready to receive traffic

---

## Kubernetes Testing Environment

The Kubernetes configuration was tested locally using Minikube.

Local testing allowed the project to validate:

- Namespace creation
- Workload deployment
- Service discovery
- Application connectivity
- PostgreSQL connectivity
- Persistent storage
- Ingress
- NetworkPolicies
- RBAC
- Resource management
- HPA configuration
- Security policies
- Kyverno admission behavior

This approach reduced AWS costs while allowing the Kubernetes implementation to be developed and validated before the full EKS workload deployment.

---

## AWS EKS Relationship

The Kubernetes manifests are designed as the workload layer of the broader AWS platform.

The overall project architecture is:

Terraform
   │
   ├── VPC
   ├── IAM
   ├── ECR
   └── EKS
        │
        ▼
   Kubernetes
        │
        ├── Namespace
        ├── Frontend
        ├── Backend
        ├── PostgreSQL
        ├── Services
        ├── Ingress
        ├── HPA
        ├── RBAC
        ├── NetworkPolicies
        └── Security Policies

Terraform is responsible for provisioning the AWS infrastructure, while Kubernetes is responsible for deploying and managing the application workloads.

---

## Design Principles

The Kubernetes implementation follows several production-oriented principles:

1. **Separation of workloads**  
   Frontend, backend, and database workloads are managed independently.

2. **Stable service discovery**  
   Kubernetes Services provide stable endpoints for application communication.

3. **Persistent database storage**  
   PostgreSQL uses a StatefulSet with persistent storage.

4. **Controlled external access**  
   NGINX Ingress provides the external HTTP entry point.

5. **Least-privilege security**  
   RBAC and dedicated ServiceAccounts limit Kubernetes API permissions.

6. **Network isolation**  
   NetworkPolicies restrict unnecessary pod-to-pod communication.

7. **Resource governance**  
   Resource requests, limits, ResourceQuota, and LimitRange prevent uncontrolled resource consumption.

8. **Application reliability**  
   Health probes allow Kubernetes to manage unhealthy or unready workloads.

9. **Automatic scaling**  
   HPAs provide controlled horizontal scaling for frontend and backend workloads.

10. **Admission control**  
    Kyverno enforces security and image-registry requirements.

---

## Current Status

The Kubernetes architecture and workload configuration have been implemented and tested as a project milestone.

The current phase focuses on documenting the implementation, architecture, security controls, reliability mechanisms, and troubleshooting lessons learned.

The next major project phase after completing the Kubernetes documentation is:

Helm
   ↓
GitHub Actions CI/CD
   ↓
ArgoCD GitOps
   ↓
Prometheus + Grafana
   ↓
Loki
   ↓
AI-assisted DevOps workflows

These components are planned next and are not represented as completed Kubernetes functionality.