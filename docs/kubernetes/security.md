# Kubernetes Security

## Overview

Security is an important part of the Kubernetes architecture for the `production-aws-eks-platform` project.

The Kubernetes security model uses multiple layers of controls rather than depending on a single security mechanism.

The implemented security controls include:

- Pod Security Standards
- Security Contexts
- Non-root containers
- Linux capability restrictions
- Seccomp
- RBAC
- Dedicated ServiceAccounts
- NetworkPolicies
- Kyverno admission policies
- Kubernetes Secrets
- Approved container image registry enforcement

The goal is to follow a defense-in-depth approach where multiple independent controls reduce the impact of a configuration error or compromised workload.

---

## Security Architecture

The security model can be represented as:

Kubernetes Namespace
        │
        ▼
Pod Security Standards
        │
        ▼
Security Contexts
        │
        ├── Non-root execution
        ├── No privilege escalation
        ├── Dropped capabilities
        └── Seccomp
        │
        ▼
RBAC
        │
        ▼
NetworkPolicies
        │
        ▼
Kyverno Admission Policies
        │
        ▼
Workload Deployment

Each layer provides a different security boundary.

---

## Pod Security Standards

The application namespace uses the Kubernetes Pod Security Standards `restricted` profile.

Manifest:

`kubernetes/namespace/namespace.yaml`

The namespace configures:

- Enforce
- Audit
- Warn

using the `restricted` profile.

The purpose is to enforce stronger security defaults for workloads running inside the application namespace.

The namespace configuration includes:

`pod-security.kubernetes.io/enforce: restricted`

`pod-security.kubernetes.io/audit: restricted`

`pod-security.kubernetes.io/warn: restricted`

This provides three levels of security handling:

- Enforce blocks workloads that violate the policy.
- Audit records violations.
- Warn informs users about violations.

---

## Security Context

Security Contexts are defined at both pod and container levels where required.

The workloads use security settings such as:

- `runAsNonRoot`
- `runAsUser`
- `runAsGroup`
- `allowPrivilegeEscalation`
- Linux capability restrictions
- Seccomp profile

These settings reduce the privileges available to application containers.

---

## Non-Root Containers

Application containers are configured to run as non-root users.

Backend:

`runAsNonRoot: true`

Frontend:

`runAsNonRoot: true`

PostgreSQL:

`runAsNonRoot: true`

Where required, explicit user IDs are configured.

For example, the backend uses:

`runAsUser: 1000`

The frontend uses:

`runAsUser: 101`

PostgreSQL uses explicit user and group configuration because the database workload has different filesystem and runtime requirements.

Running workloads as non-root reduces the potential impact of a container compromise.

---

## Privilege Escalation

Application containers explicitly disable privilege escalation using:

`allowPrivilegeEscalation: false`

This prevents processes inside the container from gaining additional privileges through mechanisms such as set-user-ID or set-group-ID binaries.

This setting is applied to the frontend, backend, and PostgreSQL workloads.

---

## Linux Capabilities

The workloads drop all Linux capabilities:

`capabilities:`

`drop:`

`- ALL`

Linux capabilities provide processes with specific privileged operations without giving them full root privileges.

Removing unnecessary capabilities reduces the attack surface of application containers.

---

## Seccomp

The workloads use:

`seccompProfile:`

`type: RuntimeDefault`

Seccomp restricts the system calls that containers can make to the Linux kernel.

Using the runtime default profile provides an additional security boundary without requiring a custom seccomp profile for the application.

---

## RBAC

Role-Based Access Control is used to restrict access to the Kubernetes API.

RBAC manifests are located under:

`kubernetes/rbac/`

The project includes:

- ServiceAccounts
- Role
- RoleBinding
- ClusterRole
- ClusterRoleBinding-style workload binding

The goal is to avoid granting unnecessary Kubernetes API permissions to application workloads.

---

## ServiceAccounts

Dedicated ServiceAccounts are created for each workload.

The project defines:

`backend-service-account`

`frontend-service-account`

`postgres-service-account`

Manifest:

`kubernetes/rbac/serviceaccounts.yaml`

Using dedicated ServiceAccounts provides a clear identity for each workload and allows permissions to be assigned independently.

---

## Backend RBAC

The backend ServiceAccount is associated with a Role and RoleBinding for ConfigMap access.

Role:

`backend-configmap-reader`

The Role allows:

- `get`
- `list`

on:

`configmaps`

Manifest:

`kubernetes/rbac/backend-role.yaml`

The RoleBinding connects the Role to:

`backend-service-account`

Manifest:

`kubernetes/rbac/backend-rolebinding.yaml`

This demonstrates namespace-scoped permission management.

---

## Pod Reader ClusterRole

The project also defines a ClusterRole named:

`pod-reader`

The ClusterRole provides:

- `get`
- `list`
- `watch`

permissions for Pods.

Manifest:

`kubernetes/rbac/pod-reader-clusterrole.yaml`

The backend ServiceAccount is bound to this ClusterRole through:

`backend-pod-reader-binding.yaml`

This demonstrates how Kubernetes can provide controlled read-only access to cluster resources.

---

## Network Security

NetworkPolicies provide workload-level network isolation.

The project uses a default-deny policy followed by explicit communication rules.

The security model is:

Default Deny
     │
     ├── Allow Ingress → Frontend
     ├── Allow Frontend → Backend
     ├── Allow Backend → PostgreSQL
     └── Allow DNS

This prevents workloads from freely communicating with every other pod.

Detailed networking information is documented in:

`docs/kubernetes/networking.md`

---

## Kyverno

Kyverno is used as an admission control layer.

The project defines Kyverno ClusterPolicies under:

`kubernetes/policies/`

Current policies include:

- Require non-root containers
- Require approved image registry

These policies are configured with:

`validationFailureAction: Enforce`

This means workloads violating the defined policies are rejected by the admission controller.

---

## Require Non-Root Policy

Manifest:

`kubernetes/policies/require-run-as-nonroot.yaml`

Policy name:

`require-run-as-nonroot`

The policy requires Pods to explicitly define:

`spec.securityContext.runAsNonRoot: true`

The purpose is to prevent workloads from being deployed without an explicit non-root security requirement.

This provides an additional admission-time check beyond the security settings defined in individual workload manifests.

---

## Approved Image Registry Policy

Manifest:

`kubernetes/policies/require-approved-registry.yaml`

Policy name:

`require-approved-registry`

The policy requires container images to come from the approved registry pattern:

`docker.io/*`

This provides a basic container supply-chain control by preventing workloads from using images from unapproved registries.

The policy can be extended in the future to support a stricter list of trusted registries and image verification mechanisms.

---

## Kyverno Troubleshooting

During Minikube testing, Kyverno enforcement caused a real infrastructure compatibility issue with the Minikube NGINX Ingress addon.

The project's Kyverno policies required:

- Approved image registry
- `runAsNonRoot: true`

The Minikube ingress-nginx components used images from:

`registry.k8s.io`

and some admission components did not satisfy the configured non-root requirement.

As a result, Kyverno rejected the ingress controller Deployment and admission Jobs.

This demonstrated an important production lesson:

Security policies can unintentionally block platform components if the policies are designed without considering the requirements of infrastructure workloads.

The issue was not treated as a reason to disable security controls. Instead, the conflict was investigated and documented as part of the Kubernetes troubleshooting process.

---

## PostgreSQL Security Considerations

PostgreSQL required additional security consideration because the official PostgreSQL container has specific runtime and filesystem requirements.

The project initially encountered a conflict between:

`runAsNonRoot: true`

and the PostgreSQL container's expected runtime behavior.

The solution involved explicitly configuring the PostgreSQL security context with:

- Non-root execution
- User ID
- Group ID
- `fsGroup`
- Dropped capabilities
- Disabled privilege escalation
- RuntimeDefault seccomp

This allowed the database workload to satisfy the security requirements while maintaining the filesystem permissions required by PostgreSQL.

---

## Kubernetes Secrets

Sensitive database configuration is stored in Kubernetes Secrets rather than ConfigMaps.

The project uses Secrets for:

- PostgreSQL credentials
- Backend database credentials

Examples include:

`postgres-secret`

`backend-secret`

Secrets are referenced by workloads through `secretKeyRef`.

This keeps sensitive values separate from normal application configuration.

For production AWS environments, additional secret-management solutions such as AWS Secrets Manager or External Secrets could be considered.

---

## Image Security

The Kubernetes workloads use explicitly defined container image references.

Examples include:

`docker.io/library/postgres:16-alpine`

and application images under the Docker registry namespace.

The Kyverno registry policy provides an admission-level control over which registries can be used.

Future improvements can include:

- Image digest pinning
- Image vulnerability scanning
- Signed images
- Cosign verification
- Private ECR repositories
- Automated image scanning in CI/CD

---

## Security Design Principles

The Kubernetes security architecture follows several principles.

### Least Privilege

Workloads should receive only the permissions they require.

### Defense in Depth

Security is implemented at multiple levels instead of relying on one control.

### Non-Root Execution

Containers should not require root privileges unless there is a justified requirement.

### Network Isolation

Workloads should only communicate with services they actually require.

### Admission Enforcement

Kyverno provides policy enforcement before workloads are accepted into the cluster.

### Secure Defaults

The namespace uses restricted Pod Security Standards and workloads define explicit security contexts.

### Separation of Secrets

Sensitive values are kept separate from normal application configuration.

---

## Security Testing

Security controls were tested during the Minikube Kubernetes testing phase.

Testing included:

- Pod Security Standards
- SecurityContext validation
- Non-root execution
- Kyverno policy enforcement
- Image registry validation
- RBAC configuration
- NetworkPolicy enforcement
- Secret-based configuration
- Container capability restrictions
- Privilege escalation restrictions

The testing also included intentional troubleshooting of policy violations to understand how Kubernetes admission controls behave.

---

## Current Status

The Kubernetes security layer has been implemented and tested as part of the Kubernetes milestone.

Implemented security controls include:

- Restricted Pod Security Standards
- Security Contexts
- Non-root containers
- Dropped capabilities
- Disabled privilege escalation
- RuntimeDefault seccomp
- Dedicated ServiceAccounts
- RBAC
- NetworkPolicies
- Kyverno admission policies
- Approved image registry enforcement
- Kubernetes Secrets

The security architecture is intentionally designed to be extended in future phases with stronger supply-chain security, centralized secret management, image signing, and CI/CD security controls.