# Kubernetes Workloads

## Overview

The Kubernetes workload layer contains the application and database workloads that run inside the `production-eks-platform` namespace.

The platform uses different Kubernetes workload types based on the requirements of each component:

- Deployment for the frontend
- Deployment for the backend API
- StatefulSet for PostgreSQL
- Horizontal Pod Autoscaler for frontend and backend scaling

The workload manifests are organized under the `kubernetes/` directory.

---

## Workload Architecture

The application workload structure is:

Frontend Deployment
        │
        ├── Frontend Pod
        └── Frontend Pod
                │
                ▼
        frontend-service

Backend Deployment
        │
        ├── Backend Pod
        └── Backend Pod
                │
                ▼
        backend-service
                │
                ▼
        postgres-service
                │
                ▼
        PostgreSQL StatefulSet
                │
                ▼
        Persistent Volume

---

## Frontend Deployment

The frontend application is deployed using a Kubernetes Deployment.

Manifest:

`kubernetes/frontend/frontend-deployment.yaml`

Configuration:

- Deployment name: `frontend`
- Namespace: `production-eks-platform`
- Initial replicas: `2`
- Container port: `8080`
- Service: `frontend-service`

Two replicas provide basic workload redundancy and allow the frontend service to distribute traffic between multiple pods.

The frontend container also defines CPU and memory requests and limits.

---

## Frontend Container Configuration

The frontend container uses:

- `runAsNonRoot: true`
- Explicit non-root user ID
- `allowPrivilegeEscalation: false`
- All Linux capabilities dropped
- `RuntimeDefault` seccomp profile
- `IfNotPresent` image pull policy

These settings reduce the container's privileges and provide additional runtime isolation.

The frontend also uses startup, liveness, and readiness probes.

---

## Frontend Health Probes

The frontend exposes HTTP traffic on port `8080`.

The probes check the frontend HTTP endpoint.

### Startup Probe

The startup probe gives the application time to initialize before Kubernetes begins relying on the liveness and readiness checks.

### Liveness Probe

The liveness probe determines whether the frontend container is still functioning.

If the container becomes unhealthy, Kubernetes can restart the container.

### Readiness Probe

The readiness probe determines whether the frontend pod is ready to receive traffic.

This prevents Kubernetes Services from sending traffic to a pod that has not successfully started.

---

## Backend Deployment

The backend API is deployed using a Kubernetes Deployment.

Manifest:

`kubernetes/backend/backend-deployment.yaml`

Configuration:

- Deployment name: `backend`
- Namespace: `production-eks-platform`
- Initial replicas: `2`
- Container port: `3000`
- Service: `backend-service`

The backend runs multiple replicas to provide application availability and allow the workload to scale horizontally.

---

## Backend Configuration

The backend receives configuration through:

- ConfigMap
- Secret

The ConfigMap contains non-sensitive application configuration:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`

The Secret contains sensitive database credentials:

- `DB_USER`
- `DB_PASSWORD`

Manifest files:

`kubernetes/backend/backend-configmap.yaml`

`kubernetes/backend/backend-secret.yaml`

---

## Backend Container Security

The backend container uses security hardening settings including:

- `runAsNonRoot: true`
- Explicit user ID
- `allowPrivilegeEscalation: false`
- Dropped Linux capabilities
- `RuntimeDefault` seccomp profile

These controls follow the project's Kubernetes security requirements and support the Kyverno admission policies used by the platform.

---

## Backend Health Probes

The backend exposes a health endpoint:

`/health`

The Deployment uses three health mechanisms.

### Startup Probe

The startup probe allows the application time to initialize before Kubernetes evaluates the normal health checks.

### Liveness Probe

The liveness probe checks whether the backend application is still functioning.

If the container becomes unhealthy, Kubernetes can restart it.

### Readiness Probe

The readiness probe determines whether the backend is ready to receive application traffic.

Only ready backend pods should receive traffic through the Kubernetes Service.

---

## PostgreSQL StatefulSet

PostgreSQL is deployed using a StatefulSet.

Manifest:

`kubernetes/postgres/postgres-statefulset.yaml`

Configuration:

- StatefulSet name: `postgres`
- Namespace: `production-eks-platform`
- Replicas: `1`
- Container port: `5432`
- Storage request: `10Gi`
- Access mode: `ReadWriteOnce`

PostgreSQL uses a StatefulSet because the database requires persistent storage and stable workload identity.

A Deployment is more appropriate for stateless workloads, while a StatefulSet provides features required for stateful applications.

---

## PostgreSQL Persistent Storage

The PostgreSQL StatefulSet uses a `volumeClaimTemplate`.

The current local configuration uses:

- Storage class: `standard`
- Requested storage: `10Gi`
- Access mode: `ReadWriteOnce`

The StatefulSet automatically creates a PersistentVolumeClaim for the database workload.

This allows PostgreSQL data to survive pod recreation.

The current storage configuration is intended for Minikube testing.

For AWS EKS, the planned storage implementation uses AWS EBS-backed persistent storage through the AWS EBS CSI Driver.

---

## PostgreSQL Services

Two services are used for PostgreSQL.

### PostgreSQL Service

Manifest:

`kubernetes/postgres/postgres-service.yaml`

Service:

`postgres-service`

Purpose:

The normal ClusterIP service provides a stable endpoint for backend-to-database communication.

The backend connects to:

`postgres-service:5432`

### PostgreSQL Headless Service

Manifest:

`kubernetes/postgres/postgres-headless-service.yaml`

Service:

`postgres-headless`

Purpose:

The headless service is required by the StatefulSet through the `serviceName` field.

It provides stable network identity for StatefulSet pods.

---

## PostgreSQL Security

The PostgreSQL workload uses Kubernetes security controls including:

- Non-root execution
- Explicit user and group configuration
- Dropped Linux capabilities
- Disabled privilege escalation
- RuntimeDefault seccomp profile
- Dedicated ServiceAccount
- NetworkPolicy restrictions
- Kubernetes Secret-based credentials

The PostgreSQL pod is only intended to accept database traffic from the backend workload.

---

## Horizontal Pod Autoscaling

The frontend and backend workloads use Horizontal Pod Autoscalers.

The HPAs are located under:

`kubernetes/autoscaling/`

### Backend HPA

Configuration:

- Minimum replicas: `2`
- Maximum replicas: `5`
- CPU target: `70%`
- Memory target: `80%`

Manifest:

`kubernetes/autoscaling/backend-hpa.yaml`

### Frontend HPA

Configuration:

- Minimum replicas: `2`
- Maximum replicas: `4`
- CPU target: `70%`
- Memory target: `80%`

Manifest:

`kubernetes/autoscaling/frontend-hpa.yaml`

The HPAs use `autoscaling/v2` and define controlled scale-up and scale-down behavior.

---

## Why Deployments and StatefulSet Are Used

The project intentionally uses different workload controllers.

### Deployment

Used for:

- Frontend
- Backend

Reason:

These workloads are stateless and can be safely replaced or scaled horizontally.

### StatefulSet

Used for:

- PostgreSQL

Reason:

PostgreSQL requires:

- Persistent storage
- Stable workload identity
- Stateful workload management

This separation demonstrates an important Kubernetes design principle: workload controllers should be selected based on application behavior rather than using the same controller for every component.

---

## Workload Resource Management

All major workloads define CPU and memory requests and limits.

### Frontend

Requests:

- CPU: `100m`
- Memory: `128Mi`

Limits:

- CPU: `250m`
- Memory: `256Mi`

### Backend

Requests:

- CPU: `250m`
- Memory: `256Mi`

Limits:

- CPU: `500m`
- Memory: `512Mi`

### PostgreSQL

Requests:

- CPU: `500m`
- Memory: `512Mi`

Limits:

- CPU: `1`
- Memory: `1Gi`

These values allow Kubernetes to make scheduling decisions and prevent individual workloads from consuming unlimited cluster resources.

---

## Service Accounts

The workloads use dedicated ServiceAccounts:

- `frontend-service-account`
- `backend-service-account`
- `postgres-service-account`

Manifest:

`kubernetes/rbac/serviceaccounts.yaml`

Using separate ServiceAccounts provides a foundation for applying workload-specific permissions rather than using the default ServiceAccount.

---

## Workload Communication

The intended application communication flow is:

Browser
   │
   ▼
NGINX Ingress
   │
   ├── `/` ──────► frontend-service
   │                    │
   │                    ▼
   │                Frontend Pods
   │
   └── `/api` ───► backend-service
                        │
                        ▼
                    Backend Pods
                        │
                        ▼
                  postgres-service
                        │
                        ▼
                  PostgreSQL Pod

NetworkPolicies restrict these communication paths so workloads cannot freely communicate with every other pod in the namespace.

---

## Workload Reliability

The workload configuration includes several mechanisms to improve reliability:

- Multiple frontend replicas
- Multiple backend replicas
- Startup probes
- Liveness probes
- Readiness probes
- Resource requests
- Resource limits
- Horizontal Pod Autoscaling
- Persistent storage for PostgreSQL
- Network isolation

Together, these features provide a more production-oriented Kubernetes workload design than deploying basic Pods without operational controls.

---

## Testing

The workload configuration was tested using Minikube.

Testing covered:

- Namespace deployment
- Frontend Deployment
- Backend Deployment
- PostgreSQL StatefulSet
- Kubernetes Services
- Persistent storage
- Health probes
- HPA configuration
- Workload connectivity
- NetworkPolicies
- Security controls
- Kyverno policy enforcement

The project also documented troubleshooting encountered during the Kubernetes testing phase, including security-policy conflicts involving Kyverno and infrastructure components.

---

## Current Status

The frontend, backend, and PostgreSQL workload definitions have been implemented and tested as part of the Kubernetes milestone.

The workload layer is currently documented as part of the project's Kubernetes documentation phase.

The next documentation areas cover the supporting Kubernetes platform controls such as networking, security, RBAC, and resource management.