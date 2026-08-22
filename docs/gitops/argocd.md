# Argo CD and GitOps

## Overview

Argo CD is used in this project to implement a GitOps deployment workflow for the Kubernetes application.

The Helm chart remains the deployment package, while GitHub acts as the source of truth for the desired Kubernetes state.

The GitOps workflow is:

```text
Developer
    |
    | git push
    v
GitHub Repository
    |
    v
Argo CD
    |
    | Automated Sync
    v
Helm Chart
    |
    v
Kubernetes
    |
    +-------------------+
    |                   |
    v                   v
Application         Infrastructure
Workloads           Resources
```

The initial implementation was validated on Minikube. The same GitOps architecture will later be enhanced for Amazon EKS.

---

## Why Argo CD?

Without Argo CD, a change to the Helm values file does not automatically update the running Kubernetes workloads.

For example:

```yaml
backend:
  replicaCount: 4
```

Changing the Git file alone does not change the running deployment.

A manual Helm operation would normally be required:

```bash
helm upgrade production-aws-eks-platform helm \
  -n production-eks-platform-helm
```

With Argo CD, Git becomes the desired state.

After:

```bash
git commit
git push
```

Argo CD detects the new Git revision and reconciles Kubernetes automatically.

This removes the need for manually running `helm upgrade` for Git-managed application changes.

---

## Argo CD Installation

Argo CD was installed into a dedicated namespace:

```text
argocd
```

The Argo CD installation was validated with:

```bash
kubectl get pods -n argocd
```

All core components reached `Running` and `Ready` state.

The installed components included:

* Application Controller
* ApplicationSet Controller
* Dex Server
* Notifications Controller
* Redis
* Repo Server
* Argo CD Server

Argo CD custom resources were also verified:

```bash
kubectl get crd | grep argoproj
```

The following CRDs were present:

```text
applications.argoproj.io
applicationsets.argoproj.io
appprojects.argoproj.io
```

---

## Argo CD Application

The repository contains:

```text
argocd/application.yaml
```

The Application connects Argo CD to the project's GitHub repository:

```yaml
source:
  repoURL: https://github.com/rakeshgang987/production-aws-eks-platform.git
  targetRevision: main
  path: helm
```

The destination is the existing Helm deployment namespace:

```yaml
destination:
  server: https://kubernetes.default.svc
  namespace: production-eks-platform-helm
```

The namespace is intentionally not created by Argo CD:

```yaml
syncOptions:
  - CreateNamespace=false
```

The namespace already exists and is managed as part of the project's Kubernetes/Helm deployment design.

---

## Automated Synchronization

The Argo CD Application uses:

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

### Automated Sync

When the Git repository changes, Argo CD detects the new revision and reconciles the Kubernetes resources automatically.

This means application deployment changes no longer require a manual:

```bash
helm upgrade
```

for changes represented in Git.

### Pruning

With:

```yaml
prune: true
```

resources removed from the desired Helm configuration can also be removed from the cluster during reconciliation.

This helps prevent obsolete resources from remaining in Kubernetes.

### Self-Healing

With:

```yaml
selfHeal: true
```

Argo CD continuously compares the desired state in Git with the live Kubernetes state.

If the live state is changed manually and no longer matches Git, Argo CD can reconcile it back to the desired configuration.

---

## GitOps Validation

The GitOps workflow was validated using a real application change.

### Initial State

The backend initially used:

```yaml
backend:
  replicaCount: 2
```

The application was already:

```text
Sync Status: Synced
Health Status: Healthy
```

### Git Change

The backend replica count was changed from:

```yaml
replicaCount: 2
```

to:

```yaml
replicaCount: 3
```

Only this value was changed.

The change was committed and pushed to GitHub.

### Argo CD Reconciliation

After the Git push, Argo CD detected the new repository revision and automatically synchronized the Helm chart.

No manual application deployment command was executed.

In particular, the change did not require:

```bash
helm upgrade
```

or:

```bash
kubectl apply
```

### Kubernetes Validation

The backend deployment was then verified in Kubernetes.

The expected final state was:

```text
backend replicas = 3
```

The Argo CD Application returned:

```text
Sync Status:   Synced
Health Status: Healthy
```

This successfully demonstrated:

```text
Git change
    |
    v
GitHub
    |
    v
Argo CD detects revision
    |
    v
Automated synchronization
    |
    v
Helm rendering
    |
    v
Kubernetes deployment updated
```

---

## Kyverno and Argo CD Compatibility

During Argo CD installation, the project's Kyverno admission policies initially blocked several Argo CD components.

The original registry policy only approved:

```text
docker.io/*
```

However, the official Argo CD installation uses images from multiple registries.

The installation included images from:

```text
quay.io
ghcr.io
public.ecr.aws
```

The registry policy was therefore expanded to allow:

```yaml
anyPattern:
  - spec:
      containers:
        - image: "docker.io/*"
  - spec:
      containers:
        - image: "quay.io/*"
  - spec:
      containers:
        - image: "ghcr.io/*"
  - spec:
      containers:
        - image: "public.ecr.aws/*"
```

This preserved registry enforcement instead of disabling the Kyverno security policy.

---

## Kyverno Non-Root Policy Conflict

The `require-run-as-nonroot` policy initially blocked Argo CD components that did not explicitly satisfy:

```yaml
securityContext:
  runAsNonRoot: true
```

Argo CD is a platform control-plane component rather than part of the application workload.

The policy was therefore updated to exclude the dedicated Argo CD namespace:

```yaml
exclude:
  any:
    - resources:
        namespaces:
          - argocd
```

This keeps the non-root policy enforced for application workloads while allowing the Argo CD control plane to use its required security configuration.

The exception is intentionally scoped to:

```text
argocd
```

rather than disabling the policy globally.

---

## CRD Installation Issue

During installation, the `applicationsets.argoproj.io` CRD produced:

```text
metadata.annotations: Too long:
must have at most 262144 bytes
```

The issue was related to the large CRD manifest and client-side apply metadata.

The CRD was subsequently present in the cluster and verified with:

```bash
kubectl get crd | grep argoproj
```

The final cluster contained:

```text
applications.argoproj.io
applicationsets.argoproj.io
appprojects.argoproj.io
```

---

## Server-Side Apply Conflict

During the installation process, a server-side apply conflict was also observed for:

```text
argocd-applicationset-controller
```

The conflicting field was:

```text
.spec.template.spec.containers[name="argocd-applicationset-controller"]
.env[name="NAMESPACE"].valueFrom.fieldRef
```

This was treated as an installation reconciliation issue rather than modifying the application's GitOps configuration.

After the installation completed, the Argo CD ApplicationSet controller reached:

```text
Running
Ready
```

and the complete Argo CD control plane became healthy.

---

## Final Argo CD Validation

The final Argo CD installation was validated using:

```bash
kubectl get pods -n argocd
```

All core Argo CD pods reached:

```text
1/1 Running
```

The application was verified with:

```bash
kubectl get applications.argoproj.io -n argocd
```

Final state:

```text
production-aws-eks-platform
Synced
Healthy
```

The managed application namespace was also verified:

```bash
kubectl get all -n production-eks-platform-helm
```

The application workloads remained healthy, including:

* Backend Deployment
* Frontend Deployment
* PostgreSQL StatefulSet
* Backend HPA
* Frontend HPA
* Kubernetes Services

---

## Engineering Lessons Learned

### Git is the Desired State

Argo CD changes the deployment model from:

```text
Engineer
   |
   v
Manual Helm/Kubectl command
   |
   v
Kubernetes
```

to:

```text
Engineer
   |
   v
Git
   |
   v
Argo CD
   |
   v
Kubernetes
```

### Security Policies Must Consider Platform Components

Kyverno policies should be strict, but platform components may have different operational requirements from application workloads.

The solution was not to disable security enforcement globally.

Instead:

* Required registries were explicitly approved.
* The non-root exception was scoped only to the Argo CD namespace.
* Application workloads remained subject to the security policies.

### Local Validation Before EKS

Argo CD was first validated on Minikube to avoid unnecessary AWS costs and to identify integration problems before moving the complete GitOps workflow to EKS.

The EKS implementation can later build on this validated design.

---

## Current Scope

The Minikube Argo CD implementation intentionally remains simple.

Implemented:

* Argo CD
* GitHub repository integration
* Helm-based application deployment
* Automated synchronization
* Self-healing
* Pruning
* Application health monitoring
* Git revision tracking
* GitOps validation

Advanced Argo CD features are intentionally deferred until the EKS phase.

Future EKS enhancements may include:

* Argo CD Projects and RBAC
* ApplicationSet
* Notifications
* Production secret management
* Multi-environment GitOps
* Progressive delivery
* Advanced deployment strategies

These features will be introduced only when they provide a real production requirement.

---

## Final GitOps Architecture

```text
                    GitHub
                       |
                       | Git Push
                       v
                 +-------------+
                 |   Argo CD   |
                 +-------------+
                    |    |    |
                    |    |    |
              Sync  | SelfHeal |
                    |    |    |
                    v    v    v
                 +-------------+
                 |    Helm     |
                 |    Chart    |
                 +-------------+
                       |
                       v
                 +-------------+
                 | Kubernetes  |
                 |  Minikube   |
                 +-------------+
                  /     |      \
                 /      |       \
            Backend  Frontend  PostgreSQL
                 |
                HPA

            Kyverno Admission Control
                     |
                     v
             Policy Enforcement
```

The Minikube GitOps milestone is considered complete after successfully demonstrating Git-driven automated reconciliation of the application.
