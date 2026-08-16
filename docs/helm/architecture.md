# Helm Architecture

## Overview

The Kubernetes application was originally maintained as a collection of standalone Kubernetes manifests.

As the platform evolved, Helm was introduced to package the complete Kubernetes application stack into a reusable and configurable chart.

The Helm chart is located under:

```text
helm/
```

The chart packages the application workloads, networking, security, resource management, autoscaling, configuration, and supporting Kubernetes resources into a single deployable unit.

The architecture is designed so that the same Helm chart can be reused across environments by changing values instead of modifying Kubernetes templates.

---

## Helm Chart Architecture

```text
                         Helm Chart
                              │
                              ▼
                         values.yaml
                              │
                              ▼
                         templates/
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
      Application         Database            Platform
       Workloads          Workload            Resources
          │                   │                   │
     ┌────┴────┐              │          ┌────────┼────────┐
     │         │              │          │        │        │
     ▼         ▼              ▼          ▼        ▼        ▼
 Frontend   Backend       PostgreSQL   RBAC    Network   Security
 Deployment Deployment    StatefulSet  /SA     Policies  Policies
     │         │              │
     ▼         ▼              ▼
  Service    Service       Services
     │         │              │
     └────┬────┴──────────────┘
          │
          ▼
        Ingress
```

Additional platform resources include:

* Horizontal Pod Autoscalers
* ResourceQuota
* LimitRange
* ConfigMaps
* Secrets
* PersistentVolumeClaims

---

## Chart Structure

The Helm chart follows a responsibility-based template structure.

```text
helm/
├── Chart.yaml
├── values.yaml
├── .helmignore
└── templates/
    ├── backend-configmap.yaml
    ├── backend-deployment.yaml
    ├── backend-hpa.yaml
    ├── backend-secret.yaml
    ├── backend-service.yaml
    ├── frontend-configmap.yaml
    ├── frontend-deployment.yaml
    ├── frontend-hpa.yaml
    ├── frontend-service.yaml
    ├── ingress.yaml
    ├── postgres-headless-service.yaml
    ├── postgres-initdb-configmap.yaml
    ├── postgres-secret.yaml
    ├── postgres-service.yaml
    ├── postgres-statefulset.yaml
    ├── serviceaccounts.yaml
    │
    ├── networkpolicy/
    │   ├── backend-policy.yaml
    │   ├── default-deny.yaml
    │   ├── frontend-policy.yaml
    │   └── postgres-policy.yaml
    │
    ├── policies/
    │   ├── require-approved-registry.yaml
    │   └── require-run-as-nonroot.yaml
    │
    ├── rbac/
    │   ├── backend-pod-reader-binding.yaml
    │   ├── backend-role.yaml
    │   ├── backend-rolebinding.yaml
    │   └── pod-reader-clusterrole.yaml
    │
    └── resource-management/
        ├── limit-range.yaml
        └── resource-quota.yaml
```

The structure separates Kubernetes resources by responsibility while keeping them inside a single Helm release.

---

## Values-Driven Configuration

The main configuration file is:

```text
helm/values.yaml
```

The chart uses values to control configuration such as:

* Replica counts
* Container images
* Image pull policies
* Service ports
* Resource requests
* Resource limits
* Security contexts
* Health probes
* HPA settings
* Ingress hostname
* PostgreSQL configuration
* ServiceAccount creation
* Secret creation
* Kyverno policy configuration

The templates reference these values through Helm expressions.

This separates configuration from Kubernetes resource definitions and allows the chart to be reused without directly editing the templates.

---

## Namespace-Aware Architecture

The Helm chart does not depend on a hardcoded application namespace.

Resources use the Helm release namespace:

```yaml
namespace: {{ .Release.Namespace }}
```

This allows the same chart to be installed into different namespaces without modifying the templates.

For the current Helm validation environment, the release uses:

```text
production-eks-platform-helm
```

This namespace was intentionally separated from the earlier standalone Kubernetes deployment namespace.

The architecture therefore supports:

```text
Helm Chart
    │
    ├── Environment A
    │      └── Namespace A
    │
    ├── Environment B
    │      └── Namespace B
    │
    └── Environment C
           └── Namespace C
```

---

## Application Workloads

### Frontend

The frontend runs as a Kubernetes Deployment.

```text
Frontend Deployment
        │
        ├── Multiple replicas
        ├── Resource requests and limits
        ├── Health probes
        ├── Security context
        └── ServiceAccount
                │
                ▼
        Frontend Service
```

The frontend is exposed internally through:

```text
frontend-service:80
```

---

### Backend

The backend runs as a Kubernetes Deployment.

```text
Backend Deployment
        │
        ├── Multiple replicas
        ├── Resource requests and limits
        ├── Startup probe
        ├── Liveness probe
        ├── Readiness probe
        ├── Security context
        ├── ConfigMap
        ├── Secret
        └── ServiceAccount
                │
                ▼
        Backend Service
```

The backend communicates with PostgreSQL through:

```text
postgres-service:5432
```

---

## Stateful Database Architecture

PostgreSQL is intentionally implemented as a StatefulSet.

```text
              PostgreSQL StatefulSet
                       │
                       ▼
                   postgres-0
                       │
                       ▼
                    PVC
                       │
                       ▼
               Persistent Storage
```

A StatefulSet was selected instead of a Deployment because PostgreSQL requires stable identity and persistent storage.

The chart also creates:

```text
postgres-service
postgres-headless
```

The headless service supports StatefulSet network identity, while the normal service provides stable application connectivity.

---

## Configuration Architecture

Application configuration is separated from container images using ConfigMaps.

```text
ConfigMaps
    │
    ├── Backend configuration
    ├── Frontend configuration
    └── PostgreSQL initialization
```

Sensitive database credentials are separated into Kubernetes Secrets:

```text
Secrets
    │
    ├── postgres-secret
    └── backend-secret
```

This allows normal configuration and sensitive credentials to be managed independently.

For production AWS deployments, sensitive credentials should be integrated with a dedicated secret-management solution.

---

## Configuration Change Detection

The backend and frontend deployments use checksum annotations for configuration changes.

The architecture follows:

```text
ConfigMap / Secret
        │
        ▼
Checksum
        │
        ▼
Pod Template Annotation
        │
        ▼
Deployment Template Changes
        │
        ▼
Rolling Update
```

This ensures that relevant ConfigMap or Secret changes modify the Deployment pod template and cause Kubernetes to create new application pods.

---

## Service Architecture

Kubernetes Services provide stable communication endpoints.

```text
Ingress
   │
   ├── frontend-service
   │
   └── backend-service
                  │
                  ▼
           postgres-service
```

Pods are not accessed directly by their IP addresses.

Services provide stable DNS-based communication between application components.

---

## Ingress Architecture

The Helm chart packages an NGINX Ingress resource.

```text
                    Client
                      │
                      ▼
                  NGINX Ingress
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
        Frontend Service   Backend Service
              │                │
              ▼                ▼
        Frontend Pods      Backend Pods
```

The hostname is configurable through:

```yaml
ingress:
  host: helm-production-app.local
```

The Ingress provides the external entry point for the application and routes traffic to the appropriate Kubernetes Services.

---

## Autoscaling Architecture

Both frontend and backend workloads have Horizontal Pod Autoscalers.

```text
             HPA
              │
       ┌──────┴──────┐
       ▼             ▼
   Frontend        Backend
   Deployment      Deployment
       │             │
       ▼             ▼
    2 → 4 pods     2 → 5 pods
```

The HPAs use CPU and memory utilization targets.

This provides a scalable baseline for the stateless frontend and backend workloads.

---

## Network Security Architecture

The Helm chart implements a default-deny network model.

```text
                 Default Deny
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
      Frontend     Backend    PostgreSQL
       Policy       Policy       Policy
          │           │           │
          └────── Allowed Traffic ─┘
```

The goal is to explicitly allow required application communication rather than permitting unrestricted pod-to-pod traffic.

The chart includes:

* Default deny policy
* Frontend network policy
* Backend network policy
* PostgreSQL network policy

---

## RBAC Architecture

Dedicated ServiceAccounts are created for the application workloads.

```text
ServiceAccounts
      │
      ├── frontend-service-account
      ├── backend-service-account
      └── postgres-service-account
```

Backend RBAC resources provide the permissions required by the backend workload.

The chart includes:

* ClusterRole
* Role
* RoleBindings
* Pod reader permissions
* Backend ConfigMap access

The architecture follows the principle of least privilege instead of relying on unrestricted default ServiceAccounts.

---

## Resource Governance

The chart includes namespace-level resource governance:

```text
ResourceQuota
      │
      ▼
Namespace Resource Limits

LimitRange
      │
      ▼
Container and Pod Resource Constraints
```

Individual workloads also define CPU and memory requests and limits.

This creates multiple layers of resource control and helps prevent workloads from consuming unlimited cluster resources.

---

## Kubernetes Security Architecture

The Helm chart packages Kyverno security policies:

```text
Kyverno
   │
   ├── require-approved-registry
   │
   └── require-run-as-nonroot
```

Application containers are also configured with security contexts that include:

* Non-root execution
* Dropped Linux capabilities
* Disabled privilege escalation
* RuntimeDefault seccomp profile

Security is therefore implemented at both:

```text
Workload Security
       +
Admission Policy
```

---

## Helm Release Model

All resources are packaged into a single Helm release:

```text
production-aws-eks-platform
```

The release manages:

```text
Application
    +
Database
    +
Networking
    +
Security
    +
RBAC
    +
Autoscaling
    +
Resource Governance
```

This provides a consistent lifecycle for the Kubernetes application stack.

The release can be installed or upgraded using:

```bash
helm upgrade --install
```

---

## Architecture Design Principles

The Helm implementation follows several production-oriented principles.

### Reusability

The same chart can be reused across environments by changing values.

### Separation of Configuration

Configuration is maintained in `values.yaml` instead of being hardcoded into templates.

### Namespace Awareness

Templates use the Helm release namespace rather than depending on a fixed namespace.

### Security by Default

NetworkPolicies, RBAC, security contexts, ResourceQuota, LimitRange, and Kyverno policies are packaged with the application.

### Stateful and Stateless Separation

Frontend and backend use Deployments, while PostgreSQL uses a StatefulSet.

### Operational Readiness

Health probes, autoscaling, persistent storage, and configuration checksum rollouts are included.

### Validation Before Deployment

The chart follows a validation workflow:

```text
helm lint
      ↓
helm template
      ↓
kubectl dry-run
      ↓
Helm install/upgrade
      ↓
Kubernetes rollout validation
      ↓
Application testing
```

---

## Helm and the Existing Kubernetes Manifests

The Helm chart does not change the underlying Kubernetes architecture.

Instead, Helm provides a reusable packaging and configuration layer around the Kubernetes resources already designed during the Kubernetes phase.

The standalone Kubernetes manifests remain useful for understanding individual resources, while the Helm chart provides:

* Parameterization
* Reusability
* Consistent release management
* Environment-specific configuration
* Upgrade support
* Rollback capability
* Centralized application packaging

This creates a progression:

```text
Standalone Kubernetes Manifests
            │
            ▼
       Helm Packaging
            │
            ▼
       CI/CD Automation
            │
            ▼
          GitOps
```

---

## Current Architecture Status

The Helm architecture has been implemented and validated locally using Minikube.

Current Helm environment:

```text
Platform: Minikube
Release: production-aws-eks-platform
Namespace: production-eks-platform-helm
```

The Helm chart is now ready to become the packaging layer for the later CI/CD and GitOps phases.

The next major platform milestone is observability using:

```text
Prometheus
Grafana
Loki
```
