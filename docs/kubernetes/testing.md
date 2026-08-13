# Kubernetes Testing and Troubleshooting

## Overview

The Kubernetes phase of the `production-aws-eks-platform` project was tested locally using Minikube before moving toward AWS EKS deployment.

The testing approach followed:

Implement → Deploy → Observe → Troubleshoot → Fix → Retest → Document

This allowed Kubernetes configurations to be validated without keeping an AWS EKS cluster running continuously.

---

## Testing Environment

The Kubernetes workloads were tested using:

- Minikube
- kubectl
- Docker
- Kyverno
- NGINX Ingress
- Kubernetes Metrics Server where required for autoscaling tests

The namespace used by the application is:

`production-eks-platform`

---

## Kubernetes Components Tested

The testing phase covered the following components:

- Namespace
- ConfigMaps
- Secrets
- Deployments
- StatefulSet
- Services
- Headless Service
- Ingress
- Horizontal Pod Autoscaler
- NetworkPolicies
- RBAC
- ResourceQuota
- LimitRange
- Pod Security Standards
- Kyverno policies
- Security Contexts
- Health probes

---

## Deployment Validation

Before applying the workloads, the YAML manifests were reviewed for:

- Correct API versions
- Namespace configuration
- Resource names
- Labels and selectors
- Service ports
- Container ports
- ConfigMap references
- Secret references
- Security settings
- Resource requests and limits
- Probe configuration

The objective was to ensure that Services correctly selected the intended workloads and that dependent resources were created in the correct order.

---

## Namespace Testing

The application namespace was created using:

`kubernetes/namespace/namespace.yaml`

The namespace was verified using:

`kubectl get namespaces`

The expected namespace is:

`production-eks-platform`

The namespace also contains Pod Security Standards labels for the restricted profile.

---

## PostgreSQL Testing

PostgreSQL was deployed as a StatefulSet rather than a normal Deployment.

The PostgreSQL resources include:

- StatefulSet
- PostgreSQL Service
- PostgreSQL Headless Service
- Secret
- PersistentVolumeClaim generated from the StatefulSet volumeClaimTemplate

The StatefulSet was checked using:

`kubectl get statefulsets -n production-eks-platform`

Pods were checked using:

`kubectl get pods -n production-eks-platform`

The PostgreSQL Service was verified using:

`kubectl get svc -n production-eks-platform`

---

## PostgreSQL StatefulSet Validation

The StatefulSet was specifically tested for:

- Correct `serviceName`
- Stable pod identity
- Persistent storage configuration
- Secret-based credentials
- Resource requests and limits
- Security Context
- Readiness probe
- Liveness probe

The StatefulSet uses:

`postgres-headless`

as its required headless Service.

---

## PostgreSQL Security Troubleshooting

PostgreSQL presented an important security-related troubleshooting case.

The Kyverno policy required:

`runAsNonRoot: true`

The PostgreSQL container also has filesystem and runtime requirements that needed to be considered.

An initial configuration caused PostgreSQL startup problems because the container expected permissions that conflicted with the enforced non-root configuration.

The security context was adjusted to explicitly define:

- `runAsNonRoot`
- `runAsUser`
- `runAsGroup`
- `fsGroup`

along with:

- Dropped capabilities
- Disabled privilege escalation
- RuntimeDefault seccomp

This allowed the PostgreSQL workload to operate while satisfying the project's security requirements.

---

## Backend Testing

The backend Deployment was tested with:

- Two replicas
- ConfigMap configuration
- Secret configuration
- Resource requests
- Resource limits
- Startup probe
- Liveness probe
- Readiness probe
- Security Context
- ServiceAccount

The backend Service was verified to expose:

`TCP 3000`

The health endpoint used by the probes is:

`/health`

---

## Backend Health Probes

Three probes are configured.

### Startup Probe

The startup probe checks:

`/health`

It allows the application additional time to start before liveness checking becomes active.

### Readiness Probe

The readiness probe determines whether the pod is ready to receive traffic.

### Liveness Probe

The liveness probe determines whether the application is still functioning.

This prevents traffic from being sent to unhealthy pods and allows Kubernetes to restart containers that become unhealthy.

---

## Frontend Testing

The frontend Deployment was tested with:

- Two replicas
- ConfigMap configuration
- Resource requests and limits
- Startup probe
- Liveness probe
- Readiness probe
- Non-root execution
- Security Context
- Dedicated ServiceAccount

The frontend Service exposes:

`port 80`

and forwards traffic to:

`containerPort 8080`

---

## Service Connectivity Testing

Kubernetes Services were tested to verify stable internal communication.

The expected communication paths are:

Frontend → Backend

Backend → PostgreSQL

The frontend communicates with the backend through the application's `/api` route.

The backend communicates with PostgreSQL through:

`postgres-service:5432`

---

## DNS Testing

Kubernetes DNS was tested because Services depend on DNS-based service discovery.

For example:

`postgres-service`

resolves to the PostgreSQL Service inside the namespace.

DNS functionality is especially important when NetworkPolicies are enabled because DNS traffic must be explicitly allowed.

---

## Ingress Testing

The NGINX Ingress configuration was tested using the host:

`production-app.local`

The routing configuration is:

`/` → `frontend-service:80`

`/api` → `backend-service:3000`

The purpose of the test was to verify that the Ingress controller could correctly route frontend and backend traffic based on the request path.

---

## Ingress Troubleshooting

A significant troubleshooting issue occurred while enabling the Minikube NGINX Ingress addon.

Kyverno policies were configured to enforce:

- Approved image registry
- Non-root execution

The Minikube ingress-nginx components use images from:

`registry.k8s.io`

while the configured Kyverno registry policy allowed:

`docker.io/*`

As a result, Kyverno rejected ingress-nginx resources.

This demonstrated that admission policies affect not only application workloads but also infrastructure components deployed into the cluster.

---

## NetworkPolicy Testing

The networking layer was tested using a default-deny model.

The default policy blocks:

- Ingress
- Egress

Additional policies explicitly allow required communication.

Expected traffic:

Frontend → Backend: TCP 3000

Backend → PostgreSQL: TCP 5432

Workloads → Kubernetes DNS: UDP 53

Ingress Controller → Frontend: TCP 8080

The purpose of testing was to verify both successful communication and blocked unauthorized communication.

---

## RBAC Testing

RBAC resources were validated to ensure that workload identities and permissions were correctly configured.

The project uses dedicated ServiceAccounts:

- `backend-service-account`
- `frontend-service-account`
- `postgres-service-account`

The backend receives controlled permissions through Role and RoleBinding resources.

The project also includes a read-only Pod ClusterRole.

The objective is to demonstrate least-privilege Kubernetes API access rather than granting broad administrative permissions to application workloads.

---

## Resource Management Testing

The namespace contains:

- ResourceQuota
- LimitRange

ResourceQuota limits the total resource consumption of the namespace.

Configured limits include:

- CPU requests
- Memory requests
- CPU limits
- Memory limits
- Maximum pod count

LimitRange provides default and maximum resource settings for containers.

These resources were validated to ensure workloads contain appropriate resource definitions and remain within namespace-level constraints.

---

## HPA Testing

The project defines Horizontal Pod Autoscalers for:

- Backend
- Frontend

The HPAs use CPU and memory utilization metrics.

Backend:

- Minimum replicas: 2
- Maximum replicas: 5
- CPU target: 70%
- Memory target: 80%

Frontend:

- Minimum replicas: 2
- Maximum replicas: 4
- CPU target: 70%
- Memory target: 80%

Scaling behavior was configured to scale up quickly and scale down more conservatively.

HPA testing requires metrics to be available through the Kubernetes Metrics API.

---

## Kyverno Testing

Kyverno policies were tested as admission controls.

The project contains:

`require-run-as-nonroot`

and:

`require-approved-registry`

The policies use:

`validationFailureAction: Enforce`

Therefore, resources that violate the defined requirements are rejected.

This was used to validate that security policies were actively enforced rather than simply documented.

---

## Security Testing

Security testing covered:

- Non-root containers
- Security Contexts
- Linux capability restrictions
- Privilege escalation prevention
- Seccomp
- Pod Security Standards
- Kyverno policies
- RBAC
- NetworkPolicies

The testing demonstrated that security controls can affect workload scheduling and startup behavior and therefore need to be tested together with the application.

---

## Troubleshooting Methodology

When a Kubernetes workload failed, troubleshooting followed a layered approach.

### 1. Check Pod Status

`kubectl get pods -n production-eks-platform`

### 2. Inspect Pod Details

`kubectl describe pod <pod-name> -n production-eks-platform`

### 3. Check Logs

`kubectl logs <pod-name> -n production-eks-platform`

### 4. Check Services

`kubectl get svc -n production-eks-platform`

### 5. Check Endpoints

`kubectl get endpoints -n production-eks-platform`

### 6. Check Events

`kubectl get events -n production-eks-platform --sort-by=.lastTimestamp`

### 7. Check Policies

Review:

- NetworkPolicies
- Kyverno policies
- Pod Security settings
- RBAC

### 8. Verify Dependencies

Check whether:

- DNS is working
- Services select the correct pods
- Required Secrets exist
- Required ConfigMaps exist
- Dependent workloads are healthy

This approach prevents random configuration changes and helps isolate the actual failure layer.

---

## Key Lessons

The Kubernetes testing phase produced several important lessons.

### Security Policies Can Affect Infrastructure

Admission policies can block platform components such as ingress controllers.

### NetworkPolicies Require Explicit DNS Access

A default-deny policy can unintentionally break applications if DNS traffic is not allowed.

### StatefulSets Have Different Requirements

Databases require persistent storage, stable identity, and careful filesystem permissions.

### Probes Must Match Application Behavior

Incorrect health endpoints or timing values can cause healthy applications to be marked unhealthy.

### Resource Configuration Matters

Requests and limits affect scheduling, HPA behavior, and namespace quotas.

### Kubernetes Components Are Interdependent

A failure in one layer can appear as a problem in another layer.

For example:

Ingress → Service → NetworkPolicy → Pod → Application

must all work correctly for an external request to succeed.

---

## Current Status

The Kubernetes implementation has been successfully tested using Minikube.

The testing phase covered:

- Application workloads
- Services
- Ingress
- PostgreSQL StatefulSet
- Persistent storage
- NetworkPolicies
- RBAC
- Resource management
- HPA configuration
- Security Contexts
- Pod Security Standards
- Kyverno

The troubleshooting performed during this phase is considered an important part of the project's production-oriented Kubernetes learning.

The Kubernetes phase is now documented and forms the foundation for the next DevOps stages:

- Helm
- GitHub Actions CI/CD
- ArgoCD GitOps
- Prometheus
- Grafana
- Loki
- AI-assisted DevOps workflows