# Helm Troubleshooting

## Overview

The Helm chart was developed and validated locally using Minikube before the platform is deployed to Amazon EKS.

During implementation, several real Kubernetes and Helm issues were encountered. These issues were investigated, corrected, validated, and documented as part of the Helm milestone.

This document records the important troubleshooting scenarios and the engineering lessons learned from them.

---

## 1. Helm Chart Linting

The first validation step was checking whether the Helm chart was structurally valid.

Command:

```bash
helm lint ./helm
```

Result:

```text
==> Linting ./helm
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, 0 chart(s) failed
```

The chart passed linting successfully.

The `Chart.yaml` icon message is only an optional recommendation and does not indicate a chart failure.

### Lesson Learned

Helm linting should be performed before rendering or deploying a chart because it provides an early check for common chart structure and template problems.

---

## 2. Namespace Migration

One important change during Helm validation was moving the Helm deployment to a dedicated namespace.

The Helm environment uses:

```text
production-eks-platform-helm
```

The earlier Kubernetes implementation used a different namespace.

The Helm templates were therefore changed to use:

```yaml
namespace: {{ .Release.Namespace }}
```

instead of hardcoding the previous namespace.

### Validation

The rendered manifests were generated with:

```bash
helm template production-aws-eks-platform ./helm \
  --namespace production-eks-platform-helm \
  --set ingress.host=helm-production-app.local \
  --set secrets.postgres.password='app_password' \
  > /tmp/production-aws-eks-platform-final.yaml
```

The generated resources were then validated using:

```bash
kubectl apply --dry-run=client \
  -f /tmp/production-aws-eks-platform-final.yaml
```

The resources were rendered with the expected Helm namespace.

### Lesson Learned

Helm charts should avoid unnecessary hardcoded namespaces. Using `.Release.Namespace` makes the chart reusable across development, testing, staging, and production environments.

---

## 3. PostgreSQL Probe Failure

During Helm validation, PostgreSQL initially reported errors similar to:

```text
FATAL: role "postgres" does not exist
```

The problem was caused by the PostgreSQL health probes.

The probe was checking PostgreSQL using the default:

```text
postgres
```

role.

However, the Helm configuration intentionally created the application database user:

```text
app_user
```

Therefore the probe was checking for a role that did not exist in the configured database environment.

### Original Problem

The PostgreSQL health check was effectively validating:

```text
pg_isready -U postgres
```

while the actual application database user was:

```text
app_user
```

### Resolution

The readiness and liveness probes were changed to use:

```yaml
readinessProbe:
  exec:
    command:
      - pg_isready
      - -U
      - app_user
```

and:

```yaml
livenessProbe:
  exec:
    command:
      - pg_isready
      - -U
      - app_user
```

After the change, PostgreSQL became healthy.

The logs subsequently showed:

```text
database system is ready to accept connections
```

without the repeated probe-related failures.

### Lesson Learned

Health probes must reflect the actual application configuration.

A probe should not assume default credentials or roles when the workload intentionally uses custom database configuration.

---

## 4. PostgreSQL StatefulSet and Persistent Storage

PostgreSQL is deployed as a StatefulSet because it requires persistent storage and stable workload identity.

The StatefulSet creates a PVC through its `volumeClaimTemplates`.

The expected storage configuration was:

```text
Capacity:     10Gi
Access Mode:  RWO
StorageClass: standard
```

Validation was performed using:

```bash
kubectl get pvc \
  -n production-eks-platform-helm
```

The PVC reached:

```text
STATUS: Bound
```

This confirmed that Minikube successfully provisioned persistent storage for PostgreSQL.

### Helm Lifecycle Observation

During troubleshooting, the Helm release was removed and deployed again.

The PostgreSQL PVC was recreated during the fresh deployment.

The new PVC retained the requested storage configuration:

```text
10Gi
RWO
standard
```

### Lesson Learned

Stateful workloads require explicit consideration of storage lifecycle behavior.

Deleting and recreating a release can affect persistent resources depending on how those resources are managed. Production deployments should therefore define and document the intended storage lifecycle before destructive operations.

---

## 5. ConfigMap and Secret Change Detection

A configuration problem was considered during Helm development: changing a ConfigMap or Secret does not automatically change the Pod template of an existing Deployment.

Without an additional mechanism, Kubernetes may continue running existing Pods even after the configuration resource changes.

### Resolution

Checksum annotations were added to the Deployment pod templates.

Backend:

```yaml
annotations:
  checksum/config: ...
  checksum/secret: ...
```

Frontend:

```yaml
annotations:
  checksum/config: ...
```

The checksum is calculated from the corresponding configuration resource.

The architecture becomes:

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

### Validation

The rendered Helm output was checked for:

```text
checksum/config
checksum/secret
```

The backend Deployment was then upgraded.

The rollout was verified using:

```bash
kubectl rollout status deployment/backend \
  -n production-eks-platform-helm
```

Result:

```text
deployment "backend" successfully rolled out
```

### Lesson Learned

Configuration changes should be connected to workload rollout behavior.

Checksum annotations provide a simple and reliable Helm pattern for triggering rolling updates when ConfigMaps or Secrets change.

---

## 6. Kyverno and Minikube Ingress Conflict

The project already contains Kyverno security policies enforcing:

```text
Approved container registry
Run-as-non-root
```

During earlier Minikube testing, the NGINX Ingress addon encountered compatibility problems with these policies.

The Minikube ingress-nginx components use images from:

```text
registry.k8s.io
```

while the project's Kyverno policy restricted approved images to the configured registry requirements.

The ingress components also did not satisfy the project's `runAsNonRoot` policy requirements in the same way as the application workloads.

As a result, Kyverno denied some Minikube ingress resources.

### Important Observation

This was not treated as a reason to remove the security policies.

Instead, the issue demonstrated that admission policies affect the entire Kubernetes platform, including infrastructure components installed by development tools.

### Engineering Decision

The application security policies were retained.

The conflict was documented as a platform compatibility issue between:

```text
Minikube Ingress Addon
        +
Kyverno Admission Policies
```

### Lesson Learned

Security policies should be tested against the complete platform rather than only application workloads.

A policy that works for application Pods can still interfere with cluster addons or infrastructure components.

---

## 7. Secret Configuration Validation

The Helm chart uses two Secrets:

```text
postgres-secret
backend-secret
```

The PostgreSQL Secret contains:

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
```

The backend Secret contains:

```text
DB_USER
DB_PASSWORD
```

The password was supplied during Helm deployment through:

```bash
--set secrets.postgres.password='app_password'
```

The deployed Secret was verified using:

```bash
kubectl get secret postgres-secret \
  -n production-eks-platform-helm \
  -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d
```

The decoded value matched the Helm deployment value.

### Lesson Learned

Configuration supplied through Helm should be validated at the Kubernetes resource level.

It is not enough to confirm that Helm accepted a value; the generated Kubernetes Secret and the workload consuming it should also be checked.

### Production Consideration

The password used during local Minikube testing is development-only.

Production deployments should use a dedicated secret-management solution such as AWS Secrets Manager, External Secrets, or another secure secret provider.

---

## 8. Helm Template Validation

Before installing the chart, the templates were rendered into Kubernetes manifests.

Command:

```bash
helm template production-aws-eks-platform ./helm \
  --namespace production-eks-platform-helm \
  --set ingress.host=helm-production-app.local \
  --set secrets.postgres.password='app_password' \
  > /tmp/production-aws-eks-platform-final.yaml
```

The generated manifests were then checked using:

```bash
kubectl apply --dry-run=client \
  -f /tmp/production-aws-eks-platform-final.yaml
```

The dry run successfully processed resources including:

```text
NetworkPolicies
ResourceQuota
LimitRange
ServiceAccounts
Secrets
ConfigMaps
RBAC
Services
Deployments
HPAs
StatefulSet
Ingress
Kyverno policies
```

### Lesson Learned

Rendering a Helm chart before installation makes it easier to identify template and Kubernetes resource problems without modifying the cluster.

---

## 9. Helm Install and Upgrade Troubleshooting

The Helm release was managed using:

```bash
helm upgrade --install production-aws-eks-platform ./helm \
  -n production-eks-platform-helm \
  --set ingress.host=helm-production-app.local \
  --set secrets.postgres.password='app_password'
```

The release was upgraded multiple times during development while configuration and troubleshooting changes were introduced.

The final release reached:

```text
STATUS: deployed
```

Validation:

```bash
helm status production-aws-eks-platform \
  -n production-eks-platform-helm
```

### Lesson Learned

`helm upgrade --install` provides a convenient repeatable workflow during development because the same command can create the release when it does not exist and upgrade it when it does.

---

## 10. Backend Rollout Validation

After configuration changes, the backend Deployment was explicitly checked.

Command:

```bash
kubectl rollout status deployment/backend \
  -n production-eks-platform-helm
```

Successful result:

```text
deployment "backend" successfully rolled out
```

This confirmed that the Deployment reached its expected rollout state after configuration changes.

### Lesson Learned

A successful Helm command does not necessarily mean that the application itself is healthy.

Helm release status should be followed by Kubernetes workload and application-level validation.

---

## 11. Final Pod Validation

The final workload state was checked using:

```bash
kubectl get pods \
  -n production-eks-platform-helm
```

The expected healthy state was:

```text
backend    2/2 Running
frontend   2/2 Running
postgres   1/1 Running
```

This validated the basic runtime state of the application workloads.

---

## 12. Ingress and End-to-End API Troubleshooting

The application was tested through the NGINX Ingress rather than directly accessing the backend Pod.

The configured hostname was:

```text
helm-production-app.local
```

The request was sent using the Minikube IP and Host header:

```bash
curl -s \
  -H "Host: helm-production-app.local" \
  http://192.168.49.2/api/products
```

The successful response was:

```json
[
  {
    "id": 1,
    "name": "Laptop",
    "price": "75000.00"
  },
  {
    "id": 2,
    "name": "Keyboard",
    "price": "2500.00"
  }
]
```

This validated the complete application path:

```text
Client
  ↓
Minikube IP
  ↓
NGINX Ingress
  ↓
Backend Service
  ↓
Backend Pod
  ↓
PostgreSQL Service
  ↓
PostgreSQL Pod
  ↓
Persistent Storage
```

### Lesson Learned

End-to-end validation is more valuable than checking individual resources independently.

A healthy Pod does not guarantee that the complete request path is working.

---

## 13. Namespace Consistency Validation

During the transition from standalone Kubernetes manifests to Helm, namespace references needed to be reviewed carefully.

The Helm deployment uses:

```text
production-eks-platform-helm
```

The rendered resources were checked to ensure that namespace-scoped resources were associated with the Helm release namespace.

This prevented resources from being accidentally split between the old Kubernetes namespace and the new Helm namespace.

### Lesson Learned

Namespace mismatches can create confusing failures where Services, Secrets, ConfigMaps, and workloads appear healthy individually but cannot communicate because they exist in different namespaces.

Namespace consistency should therefore be validated after migrating existing manifests into Helm.

---

## 14. Helm Validation Workflow

The final troubleshooting and validation workflow follows:

```text
        Helm Chart Changes
                │
                ▼
           helm lint
                │
                ▼
          helm template
                │
                ▼
       kubectl dry-run
                │
                ▼
       Helm install/upgrade
                │
                ▼
       Helm release status
                │
                ▼
        Pod/Deployment checks
                │
                ▼
        Service/Ingress checks
                │
                ▼
       Database validation
                │
                ▼
       End-to-end API test
```

This workflow reduces the chance of discovering configuration problems only after deployment.

---

## 15. Key Troubleshooting Lessons

### Health Checks Must Match Reality

PostgreSQL probes initially checked the wrong database role.

The solution was to make the probes match the actual configured user.

### Security Policies Affect the Whole Cluster

Kyverno policies can affect cluster addons and infrastructure components, not only application Pods.

### Namespace Changes Must Be Systematic

Migrating from standalone Kubernetes manifests to Helm requires reviewing every namespace reference.

### Configuration Changes Need Rollout Handling

ConfigMap and Secret changes should trigger application rollouts when workloads depend on updated values.

### Stateful Workloads Need Storage Planning

PostgreSQL storage behavior must be considered when installing, upgrading, uninstalling, or recreating Helm releases.

### Helm Success Is Not Application Success

A Helm release can report a successful deployment while an application workload still has runtime problems.

Kubernetes and application-level validation are therefore required after every significant change.

### Render Before Deploy

`helm template` combined with `kubectl apply --dry-run=client` provides an additional validation layer before changing the cluster.

---

## 16. Final Helm Troubleshooting Status

The major Helm troubleshooting issues encountered during local validation were resolved or documented.

### Resolved

* PostgreSQL probe role mismatch
* Namespace migration
* Helm template validation
* Configuration checksum rollouts
* Secret value validation
* StatefulSet persistent storage validation
* Backend rollout validation
* Ingress/API validation

### Documented Platform Interaction

* Kyverno policy interaction with Minikube NGINX Ingress components

### Final Environment

```text
Platform: Minikube
Helm Release: production-aws-eks-platform
Namespace: production-eks-platform-helm
Ingress Host: helm-production-app.local
```

The Helm chart reached a successfully deployed and validated state during local testing.

---

## Conclusion

The Helm milestone demonstrated that packaging Kubernetes resources into a Helm chart introduces more than simple templating.

The migration required validating:

```text
Configuration
     ↓
Namespaces
     ↓
Security Policies
     ↓
Networking
     ↓
Persistent Storage
     ↓
Health Probes
     ↓
Rollouts
     ↓
Ingress
     ↓
Application Behavior
```

The troubleshooting process helped verify that the Helm chart preserves the production-oriented Kubernetes architecture while making the platform reusable and configurable.

The next major portfolio milestone is observability with:

```text
Prometheus
Grafana
Loki
```
