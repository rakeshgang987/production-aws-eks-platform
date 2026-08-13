# Kubernetes Networking

## Overview

The Kubernetes networking layer defines how traffic enters the application, how services communicate with workloads, and how NetworkPolicies restrict communication between components.

The project uses:

- Kubernetes Services
- NGINX Ingress
- ClusterIP services
- Headless Service for PostgreSQL
- NetworkPolicies
- Kubernetes DNS
- Default-deny network isolation

The goal is to provide predictable application connectivity while restricting unnecessary network access.

---

## Network Architecture

The application networking flow is:

Browser
   │
   │ HTTP
   ▼
NGINX Ingress
   │
   ├── `/` ──────► frontend-service:80
   │                       │
   │                       ▼
   │                  Frontend Pods
   │
   └── `/api` ───► backend-service:3000
                           │
                           ▼
                      Backend Pods
                           │
                           │ TCP 5432
                           ▼
                    postgres-service
                           │
                           ▼
                    PostgreSQL Pod

The database is not exposed through the Ingress.

---

## Kubernetes Services

Kubernetes Services provide stable network endpoints for application workloads.

The project uses the following Services:

- `frontend-service`
- `backend-service`
- `postgres-service`
- `postgres-headless`

All application Services operate inside the `production-eks-platform` namespace.

---

## Frontend Service

Manifest:

`kubernetes/frontend/frontend-service.yaml`

Service name:

`frontend-service`

Configuration:

- Type: `ClusterIP`
- Service port: `80`
- Target port: `8080`

The Service forwards traffic received on port `80` to frontend pods listening on port `8080`.

Traffic flow:

frontend-service:80
        │
        ▼
Frontend Pods:8080

The frontend Service is accessed externally through the NGINX Ingress.

---

## Backend Service

Manifest:

`kubernetes/backend/backend-service.yaml`

Service name:

`backend-service`

Configuration:

- Type: `ClusterIP`
- Service port: `3000`
- Target port: `3000`

Traffic flow:

backend-service:3000
        │
        ▼
Backend Pods:3000

The backend Service provides a stable internal endpoint for application traffic.

---

## PostgreSQL Service

Manifest:

`kubernetes/postgres/postgres-service.yaml`

Service name:

`postgres-service`

Configuration:

- Type: `ClusterIP`
- Service port: `5432`
- Target port: `5432`

The backend connects to PostgreSQL using:

`postgres-service:5432`

This means the backend does not need to know the IP address of the PostgreSQL pod.

Kubernetes Service discovery provides the stable endpoint.

---

## PostgreSQL Headless Service

Manifest:

`kubernetes/postgres/postgres-headless-service.yaml`

Service name:

`postgres-headless`

The Service uses:

`clusterIP: None`

This makes it a headless Service.

The headless Service is required by the PostgreSQL StatefulSet through:

`serviceName: postgres-headless`

Its purpose is to provide stable network identity for StatefulSet-managed database pods.

---

## Kubernetes DNS

Kubernetes DNS allows workloads to discover Services using DNS names rather than hard-coded IP addresses.

For example, the backend uses:

`postgres-service`

instead of connecting directly to a PostgreSQL pod IP.

The logical communication is:

Backend Pod
   │
   │ DNS lookup
   ▼
postgres-service
   │
   ▼
PostgreSQL Pod

This makes the application more resilient to pod restarts and IP address changes.

---

## Ingress

Manifest:

`kubernetes/ingress/ingress.yaml`

The project uses NGINX as the Kubernetes Ingress controller.

Ingress class:

`nginx`

Configured host:

`production-app.local`

The Ingress provides HTTP routing based on URL paths.

---

## Ingress Routing

The configured routing rules are:

`/` → `frontend-service:80`

`/api` → `backend-service:3000`

The request flow is:

Browser
   │
   │ production-app.local/
   ▼
NGINX Ingress
   │
   ▼
frontend-service
   │
   ▼
Frontend Pods

For API requests:

Browser
   │
   │ production-app.local/api
   ▼
NGINX Ingress
   │
   ▼
backend-service
   │
   ▼
Backend Pods

This allows the frontend and backend to share the same application host.

---

## Frontend API Routing

The frontend configuration uses:

`VITE_API_URL=/api`

This means the frontend does not need to directly expose or hard-code the backend Service address for browser requests.

A browser request such as:

`production-app.local/api/products`

is received by the Ingress and routed to:

`backend-service:3000`

This provides a cleaner external architecture and avoids exposing the backend Service directly to the external network.

---

## NetworkPolicy Architecture

NetworkPolicies are used to implement network isolation.

The project uses a default-deny policy followed by explicit allow policies.

NetworkPolicy manifests are located under:

`kubernetes/networkpolicy/`

The policies include:

- `default-deny.yaml`
- `frontend-policy.yaml`
- `backend-policy.yaml`
- `postgres-policy.yaml`

---

## Default Deny Policy

Manifest:

`kubernetes/networkpolicy/default-deny.yaml`

Policy:

`default-deny-all`

The policy selects all pods in the namespace.

It applies to:

- Ingress
- Egress

This creates a deny-by-default network security model.

Conceptually:

All Pods
   │
   ▼
Default Deny
   │
   ├── Ingress blocked
   └── Egress blocked

Specific communication paths are then allowed through additional NetworkPolicies.

---

## Frontend NetworkPolicy

Manifest:

`kubernetes/networkpolicy/frontend-policy.yaml`

The policy applies to:

`app: frontend`

### Allowed Ingress

Frontend pods accept traffic from the NGINX Ingress namespace.

The allowed port is:

`TCP 8080`

Flow:

Ingress Controller
       │
       │ TCP 8080
       ▼
Frontend Pods

### Allowed Egress

Frontend pods can communicate with backend pods on:

`TCP 3000`

They can also communicate with the Kubernetes DNS service on:

`UDP 53`

Therefore:

Frontend
   │
   ├── TCP 3000 ──► Backend
   │
   └── UDP 53 ────► DNS

---

## Backend NetworkPolicy

Manifest:

`kubernetes/networkpolicy/backend-policy.yaml`

The policy applies to:

`app: backend`

### Allowed Ingress

Backend pods accept traffic from frontend pods.

Allowed port:

`TCP 3000`

Flow:

Frontend
   │
   │ TCP 3000
   ▼
Backend

### Allowed Egress

Backend pods can communicate with PostgreSQL on:

`TCP 5432`

Backend pods can also communicate with Kubernetes DNS on:

`UDP 53`

Therefore:

Backend
   │
   ├── TCP 5432 ──► PostgreSQL
   │
   └── UDP 53 ────► DNS

---

## PostgreSQL NetworkPolicy

Manifest:

`kubernetes/networkpolicy/postgres-policy.yaml`

The policy applies to:

`app: postgres`

### Allowed Ingress

PostgreSQL accepts database traffic only from backend pods.

Allowed port:

`TCP 5432`

Flow:

Backend
   │
   │ TCP 5432
   ▼
PostgreSQL

### Allowed Egress

PostgreSQL is allowed to perform DNS resolution using:

`UDP 53`

No general outbound application traffic is allowed.

---

## Intended Network Flow

The complete permitted application flow is:

Browser
   │
   ▼
NGINX Ingress
   │
   ├──► Frontend
   │
   └──► Backend
            │
            ▼
        PostgreSQL

The NetworkPolicies prevent unrelated pod-to-pod communication.

---

## DNS Traffic

DNS is required for Kubernetes service discovery.

The NetworkPolicies therefore allow DNS traffic to the Kubernetes DNS namespace.

The allowed DNS protocol is:

`UDP 53`

This is important because without DNS access, workloads may be unable to resolve Kubernetes Service names such as:

`postgres-service`

---

## Network Security Model

The networking security model follows a least-connectivity approach.

Instead of allowing all workloads to communicate freely, the project starts with:

`Deny by default`

and then explicitly allows required traffic.

The intended communication matrix is:

Source | Destination | Port | Purpose

Ingress Controller → Frontend | TCP 8080 | HTTP application traffic

Frontend → Backend | TCP 3000 | API communication

Backend → PostgreSQL | TCP 5432 | Database communication

Frontend → DNS | UDP 53 | Service discovery

Backend → DNS | UDP 53 | Service discovery

PostgreSQL → DNS | UDP 53 | Service discovery

All other unnecessary traffic is blocked by the default-deny policy.

---

## Testing

The networking configuration was tested as part of the Kubernetes testing phase using Minikube.

Testing included:

- Kubernetes Service connectivity
- Frontend-to-backend communication
- Backend-to-PostgreSQL communication
- DNS resolution
- Ingress routing
- NetworkPolicy enforcement
- Default-deny behavior

The tests confirmed that the intended application communication paths worked while restricted paths were blocked according to the configured policies.

---

## Troubleshooting Considerations

NetworkPolicies can cause application connectivity failures when required traffic is not explicitly allowed.

During troubleshooting, the communication path should be checked layer by layer:

1. Pod status
2. Service endpoints
3. DNS resolution
4. NetworkPolicy rules
5. Application port
6. Ingress routing
7. Application-level health

For example, if the backend cannot connect to PostgreSQL, the investigation should verify:

Backend Pod
   ↓
DNS resolution
   ↓
postgres-service
   ↓
Port 5432
   ↓
PostgreSQL Pod
   ↓
PostgreSQL application

This layered troubleshooting approach helps identify whether the failure is caused by Kubernetes networking, service discovery, NetworkPolicy enforcement, or the application itself.

---

## AWS EKS Considerations

The same Kubernetes networking model can be used on AWS EKS, but the underlying networking implementation is provided by the AWS VPC CNI and the EKS networking environment.

When deployed to EKS, the project should additionally consider:

- VPC subnet design
- Security groups
- AWS VPC CNI
- Load balancer integration
- AWS EBS CSI Driver
- DNS configuration
- Ingress controller deployment
- NetworkPolicy support

The Kubernetes NetworkPolicies remain an application-level security control and should complement, rather than replace, AWS network security controls.

---

## Current Status

The Kubernetes networking configuration has been implemented and tested as part of the Kubernetes milestone.

The project uses:

- ClusterIP Services
- Headless Service
- NGINX Ingress
- Kubernetes DNS
- Default-deny NetworkPolicy
- Explicit frontend, backend, and PostgreSQL communication rules

The networking layer is designed to provide controlled connectivity between application components while minimizing unnecessary network access.