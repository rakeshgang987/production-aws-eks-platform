# Helm Deployment and Validation

## Overview

The application was migrated from standalone Kubernetes manifests to a reusable Helm chart as part of the production-style AWS EKS platform project.

The Helm chart packages the complete application stack into a single deployable unit, including:

* Frontend
* Backend API
* PostgreSQL StatefulSet
* Services
* Ingress
* ConfigMaps
* Secrets
* Horizontal Pod Autoscalers
* NetworkPolicies
* ServiceAccounts
* RBAC
* ResourceQuota
* LimitRange
* Kyverno security policies
* PostgreSQL persistent storage

The Helm chart was developed and validated locally on Minikube before the platform is deployed to Amazon EKS.

---

## Helm Chart Structure

The chart is located under:

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

---

## Helm Values

Application configuration is centralized in `helm/values.yaml`.

The chart defines configurable values for:

* Replica counts
* Container images
* Image pull policies
* Service ports
* Application configuration
* Resource requests and limits
* Security contexts
* HPA configuration
* Ingress hostname
* PostgreSQL configuration
* ServiceAccount creation
* Secret creation
* Kyverno policies

This allows the same chart to be reused across environments without modifying the Kubernetes templates directly.

---

## Namespace

The Helm deployment uses the dedicated namespace:

```text
production-eks-platform-helm
```

The namespace is intentionally different from the earlier Kubernetes deployment namespace.

All Helm resources use:

```yaml
namespace: {{ .Release.Namespace }}
```

This makes the chart namespace-aware and allows the same chart to be installed into different namespaces.

Example:

```bash
helm upgrade --install production-aws-eks-platform ./helm \
  -n production-eks-platform-helm \
  --set ingress.host=helm-production-app.local \
  --set secrets.postgres.password='app_password'
```

---

## Application Architecture

The Helm release deploys the following application components:

```text
                    Ingress
                       │
              helm-production-app.local
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        Frontend Service    Backend Service
             │                   │
             ▼                   ▼
        Frontend Pods        Backend Pods
                                 │
                                 ▼
                         PostgreSQL Service
                                 │
                                 ▼
                         PostgreSQL Pod
                                 │
                                 ▼
                              PVC
```

The backend exposes the `/api/products` endpoint and communicates with PostgreSQL using the Kubernetes service:

```text
postgres-service:5432
```

---

## Backend Deployment

The backend is deployed as a Kubernetes Deployment with two replicas by default.

Configuration includes:

* Resource requests and limits
* Startup probe
* Liveness probe
* Readiness probe
* Non-root execution
* Dropped Linux capabilities
* `RuntimeDefault` seccomp profile
* Disabled privilege escalation
* Dedicated ServiceAccount
* ConfigMap-based configuration
* Secret-based database credentials

Example security configuration:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  seccompProfile:
    type: RuntimeDefault
```

---

## Frontend Deployment

The frontend is deployed as a Kubernetes Deployment with two replicas.

The frontend uses:

* Nginx
* Resource requests and limits
* Startup probe
* Liveness probe
* Readiness probe
* Non-root execution
* Dropped capabilities
* RuntimeDefault seccomp profile
* Dedicated ServiceAccount

The frontend is exposed internally through:

```text
frontend-service:80
```

---

## PostgreSQL StatefulSet

PostgreSQL is deployed using a StatefulSet instead of a Deployment because database workloads require stable identity and persistent storage.

The StatefulSet uses:

```text
postgres-0
```

and a persistent volume claim:

```text
postgres-storage-postgres-0
```

The PostgreSQL container uses:

```text
postgres:16-alpine
```

Persistent storage was successfully validated with:

```bash
kubectl get pvc -n production-eks-platform-helm
```

Result:

```text
NAME                          STATUS   CAPACITY   ACCESS MODES   STORAGECLASS
postgres-storage-postgres-0   Bound    10Gi       RWO            standard
```

This confirms that PostgreSQL successfully obtained persistent storage from the Minikube `standard` StorageClass.

---

## PostgreSQL Initialization

Database initialization is handled using:

```text
postgres-initdb-configmap.yaml
```

The initialization script creates the required application table and inserts initial test data.

The final API response confirmed that the database initialization worked:

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

---

## Secrets Management

Database credentials are supplied through Kubernetes Secrets.

The Helm chart contains:

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

The password is supplied during deployment instead of hardcoding the runtime password into the deployment command.

Example:

```bash
--set secrets.postgres.password='app_password'
```

The deployed Kubernetes Secret was verified using:

```bash
kubectl get secret postgres-secret \
  -n production-eks-platform-helm \
  -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d
```

The resulting password matched the Helm deployment value.

> Note: The example password used during local Minikube testing is for development/testing only. Production deployments should use an external secret-management solution such as AWS Secrets Manager, External Secrets, or another secure secret provider.

---

## PostgreSQL Probe Troubleshooting

During validation, PostgreSQL initially reported errors such as:

```text
FATAL: role "postgres" does not exist
```

The probe was originally checking PostgreSQL using the `postgres` role.

However, the Helm configuration creates the application database user:

```text
app_user
```

The PostgreSQL readiness and liveness probes were therefore changed to:

```yaml
readinessProbe:
  exec:
    command:
      - pg_isready
      - -U
      - app_user

livenessProbe:
  exec:
    command:
      - pg_isready
      - -U
      - app_user
```

After this change, PostgreSQL became healthy without the repeated probe failures.

A subsequent log check showed:

```text
database system is ready to accept connections
```

with no further probe-related fatal errors.

### Lesson Learned

Health probes must validate the application using credentials and database configuration that actually exist inside the workload.

Using the default PostgreSQL role in a probe is incorrect when the deployment intentionally creates and uses a different database role.

---

## Persistent Volume Behavior During Helm Lifecycle

The Helm release was uninstalled and redeployed during troubleshooting.

The previous PVC was removed and a new PVC was created during the fresh deployment.

Example:

```text
postgres-storage-postgres-0
```

was recreated with a new volume identity while retaining the requested:

```text
10Gi
RWO
standard
```

This validated that the StatefulSet correctly requested persistent storage through its `volumeClaimTemplates`.

---

## ConfigMap and Secret Checksum Annotations

One important Helm improvement was adding checksum annotations to application pod templates.

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

The checksum values are calculated from the corresponding ConfigMaps and Secrets.

This ensures that when configuration changes, the Deployment pod template changes and Kubernetes performs a rolling update.

Without this mechanism, updating a ConfigMap or Secret does not automatically recreate existing application pods.

### Validation

The rendered Helm manifest was checked and confirmed to contain:

```text
checksum/config
checksum/secret
```

The backend Deployment was then upgraded and Kubernetes created new backend pods.

The rollout was verified using:

```bash
kubectl rollout status deployment/backend \
  -n production-eks-platform-helm
```

Result:

```text
deployment "backend" successfully rolled out
```

This confirmed that the checksum mechanism successfully triggered the expected rolling deployment.

---

## Horizontal Pod Autoscaling

Both application components have HPAs.

Backend:

```text
backend-hpa
```

Frontend:

```text
frontend-hpa
```

Validation:

```bash
kubectl get hpa -n production-eks-platform-helm
```

Example result:

```text
NAME           REFERENCE             TARGETS
backend-hpa    Deployment/backend   cpu: 0%/70%, memory: 5%/80%
frontend-hpa   Deployment/frontend  cpu: 1%/70%, memory: 1%/80%
```

Backend configuration:

```text
Minimum replicas: 2
Maximum replicas: 5
CPU target: 70%
Memory target: 80%
```

Frontend configuration:

```text
Minimum replicas: 2
Maximum replicas: 4
CPU target: 70%
Memory target: 80%
```

This provides a production-style baseline for horizontal application scaling.

---

## NetworkPolicies

The Helm chart implements a default-deny network model.

Policies include:

```text
default-deny-all
backend-network-policy
frontend-network-policy
postgres-network-policy
```

Validation:

```bash
kubectl get networkpolicy \
  -n production-eks-platform-helm
```

The policies ensure that application communication is explicitly controlled instead of allowing unrestricted pod-to-pod traffic.

---

## RBAC and ServiceAccounts

The chart creates dedicated ServiceAccounts:

```text
backend-service-account
frontend-service-account
postgres-service-account
```

RBAC resources are also included for the backend.

The chart contains:

* ClusterRole
* Role
* RoleBindings
* Pod reader permissions
* Backend ConfigMap access

This follows the principle of least privilege instead of using unrestricted default service accounts.

---

## Resource Management

The Helm chart includes:

```text
ResourceQuota
LimitRange
```

These provide namespace-level resource governance.

Resource requests and limits are also configured for application containers.

Example backend configuration:

```text
Requests:
  CPU: 250m
  Memory: 256Mi

Limits:
  CPU: 500m
  Memory: 512Mi
```

This prevents workloads from consuming unlimited cluster resources.

---

## Kyverno Security Policies

The Helm chart includes two Kyverno ClusterPolicies:

```text
require-approved-registry
require-run-as-nonroot
```

The policies enforce:

1. Approved container image registries
2. Non-root container execution

During earlier Minikube testing, these policies exposed an important compatibility issue with the Minikube NGINX Ingress addon because the addon uses images from `registry.k8s.io`.

This was documented as a real security-policy interaction rather than bypassing the policy.

The application workloads were subsequently configured to satisfy the security requirements.

---

## Ingress

The application is exposed through an NGINX Ingress.

The Helm value controls the hostname:

```yaml
ingress:
  host: helm-production-app.local
```

The deployment was tested using the Minikube IP and Host header:

```bash
curl -s \
  -H "Host: helm-production-app.local" \
  http://192.168.49.2/api/products
```

Successful response:

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

This confirms the complete request path:

```text
Client
  ↓
Minikube IP
  ↓
Ingress
  ↓
Backend Service
  ↓
Backend Pod
  ↓
PostgreSQL Service
  ↓
PostgreSQL Pod
  ↓
Persistent Volume
```

---

## Helm Validation

The chart was first validated with:

```bash
helm lint ./helm
```

Result:

```text
1 chart(s) linted, 0 chart(s) failed
```

The only message was the optional recommendation that `Chart.yaml` could contain an icon.

No linting errors were reported.

---

## Rendered Manifest Validation

The chart was rendered without installing it:

```bash
helm template production-aws-eks-platform ./helm \
  --namespace production-eks-platform-helm \
  --set ingress.host=helm-production-app.local \
  --set secrets.postgres.password='app_password' \
  > /tmp/production-aws-eks-platform-final.yaml
```

The generated manifests were then validated using:

```bash
kubectl apply --dry-run=client \
  -f /tmp/production-aws-eks-platform-final.yaml
```

The dry run successfully validated:

* NetworkPolicies
* ResourceQuota
* LimitRange
* ServiceAccounts
* Secrets
* ConfigMaps
* RBAC
* Services
* Deployments
* HPAs
* StatefulSet
* Ingress
* Kyverno policies

This provided validation of the rendered Kubernetes resources before applying them.

---

## Helm Installation and Upgrade

The application was deployed using:

```bash
helm upgrade --install production-aws-eks-platform ./helm \
  -n production-eks-platform-helm \
  --set ingress.host=helm-production-app.local \
  --set secrets.postgres.password='app_password'
```

The Helm release was successfully deployed.

The release was upgraded multiple times during development and reached a successful deployed state.

Validation:

```bash
helm status production-aws-eks-platform \
  -n production-eks-platform-helm
```

The final release status was:

```text
STATUS: deployed
```

---

## Final Workload Validation

The final workload state was verified using:

```bash
kubectl get pods \
  -n production-eks-platform-helm
```

Expected healthy state:

```text
backend    2/2 Running
frontend   2/2 Running
postgres   1/1 Running
```

The backend rollout was also verified:

```bash
kubectl rollout status deployment/backend \
  -n production-eks-platform-helm
```

Result:

```text
deployment "backend" successfully rolled out
```

---

## Final Application Test

The most important end-to-end validation was the API request through Ingress:

```bash
curl -s \
  -H "Host: helm-production-app.local" \
  http://192.168.49.2/api/products
```

Successful response:

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

This confirms that the Helm-managed application stack was operational from the ingress layer through the backend and database.

---

## Helm Milestone Status

The Helm milestone is considered complete for local Kubernetes validation.

### Completed

* Helm chart created
* Configurable `values.yaml`
* Namespace-aware templates
* Backend Deployment
* Frontend Deployment
* PostgreSQL StatefulSet
* Persistent storage
* Services
* Ingress
* ConfigMaps
* Secrets
* HPA
* NetworkPolicies
* RBAC
* ServiceAccounts
* ResourceQuota
* LimitRange
* Kyverno policies
* Security contexts
* Health probes
* ConfigMap/Secret checksum rollouts
* PostgreSQL initialization
* Helm lint validation
* Helm template validation
* Kubernetes dry-run validation
* Helm install/upgrade validation
* Application endpoint validation
* PostgreSQL troubleshooting
* Rolling deployment validation

### Current Environment

The Helm chart has been validated locally on:

```text
Minikube
```

The AWS EKS deployment remains a later infrastructure milestone because the EKS environment is intentionally not being kept running during local development to avoid unnecessary AWS costs.

---

## Key Lessons Learned

### 1. Helm should package the entire application platform

A production-style Helm chart should not only template Deployments. It should package the surrounding operational resources required to run the application safely.

### 2. Stateful workloads require persistent storage

PostgreSQL was implemented as a StatefulSet with a PVC rather than treating the database as a stateless Deployment.

### 3. Health probes must match real application configuration

The PostgreSQL probe initially checked the wrong database role. Changing the probe to `app_user` aligned the health check with the actual database configuration.

### 4. Configuration changes should trigger rolling updates

Checksum annotations ensure that ConfigMap and Secret changes result in new application pods.

### 5. Security policies can expose real platform compatibility issues

Kyverno restrictions affected the Minikube NGINX Ingress addon because of its image registry and security configuration. This demonstrated the importance of validating security policies against the complete platform rather than only application workloads.

### 6. Validate rendered manifests before deployment

The workflow used:

```text
helm lint
      ↓
helm template
      ↓
kubectl apply --dry-run=client
      ↓
helm upgrade --install
      ↓
kubectl rollout status
      ↓
application/API validation
```

This provides a repeatable deployment validation workflow suitable for future CI/CD automation.

---

## Next Milestone

With the Helm milestone completed and documented, the next major portfolio milestone is:

```text
Observability
     │
     ├── Prometheus
     ├── Grafana
     └── Loki
```

Prometheus and Grafana will be introduced next to provide Kubernetes and application-level monitoring.
