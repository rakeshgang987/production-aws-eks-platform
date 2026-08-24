# Prometheus Monitoring

## 1. Overview

The project uses the `kube-prometheus-stack` Helm chart to deploy Kubernetes monitoring components in the `monitoring` namespace.

The current monitoring setup includes:

* Prometheus
* Alertmanager
* Prometheus Operator
* Node Exporter
* kube-state-metrics
* Kyverno metrics collection through a Prometheus `ServiceMonitor`

Grafana is currently deployed as part of the stack, but no Grafana dashboards or custom Grafana configuration have been implemented yet. Therefore, Grafana is not documented as a completed feature.

---

## 2. Monitoring Architecture

```text
                         Kubernetes Cluster
                                |
                +---------------+---------------+
                |                               |
           Prometheus                       Alertmanager
                |
        +-------+--------+--------+
        |       |        |        |
      Node    kube-   Kyverno   Kubernetes
    Exporter  state    Metrics    Metrics
              Metrics      |
                           |
                    ServiceMonitor
```

Prometheus collects metrics from Kubernetes workloads and monitoring components.

The Kyverno `ServiceMonitor` allows Prometheus to discover and scrape Kyverno metrics from the Kyverno metrics service.

---

## 3. Monitoring Configuration

Monitoring configuration is stored under:

```text
monitoring/
├── kube-prometheus-values.yaml
└── kyverno-servicemonitor.yaml
```

The Prometheus stack is deployed in:

```text
monitoring
```

with Helm release:

```text
production-monitoring
```

The stack enables:

```yaml
prometheus:
  enabled: true

alertmanager:
  enabled: true

nodeExporter:
  enabled: true

kubeStateMetrics:
  enabled: true
```

---

## 4. kube-state-metrics Configuration

The kube-state-metrics image is explicitly configured to use:

```yaml
kube-state-metrics:
  image:
    registry: registry.k8s.io
    repository: kube-state-metrics/kube-state-metrics
    tag: v2.20.0
    pullPolicy: IfNotPresent
```

Resulting image:

```text
registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.20.0
```

This became important because of the project's Kyverno approved-registry policy.

---

## 5. Prometheus Stack Deployment

The monitoring stack was deployed using Helm:

```bash
helm upgrade production-monitoring /tmp/kube-prometheus-stack \
  --namespace monitoring \
  -f monitoring/kube-prometheus-values.yaml
```

A successful deployment returned:

```text
Release "production-monitoring" has been upgraded. Happy Helming!
STATUS: deployed
```

The monitoring components were then verified:

```bash
kubectl get pods -n monitoring
```

The final state showed all monitoring components running.

---

# 6. Kyverno Metrics Integration

Kyverno exposes Prometheus-compatible metrics through its metrics service.

The project adds the following ServiceMonitor:

```text
monitoring/kyverno-servicemonitor.yaml
```

The ServiceMonitor is deployed in the `monitoring` namespace and discovers the Kyverno metrics service in the `kyverno` namespace.

Configuration:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kyverno
  namespace: monitoring
  labels:
    release: production-monitoring
spec:
  namespaceSelector:
    matchNames:
      - kyverno
  selector:
    matchLabels:
      app.kubernetes.io/name: kyverno-admission-controller
  endpoints:
    - port: metrics-port
      path: /metrics
      interval: 30s
```

---

## 7. Kyverno Metrics Service

The Kyverno metrics service was verified with:

```bash
kubectl get svc -n kyverno kyverno-svc-metrics -o yaml
```

The service exposes:

```text
metrics-port
port: 8000
targetPort: 8000
```

Therefore, the ServiceMonitor scrapes:

```text
/metrics
```

using:

```text
metrics-port
```

every:

```text
30s
```

---

## 8. ServiceMonitor Validation

Verify that the ServiceMonitor exists:

```bash
kubectl get servicemonitor -n monitoring kyverno
```

Expected:

```text
NAME      AGE
kyverno   <age>
```

Verify the configured endpoint:

```bash
kubectl get servicemonitor -n monitoring kyverno -o yaml
```

Expected:

```yaml
endpoints:
  - interval: 30s
    path: /metrics
    port: metrics-port
```

This confirms that the Prometheus Operator has the Kyverno metrics configuration available.

---

# 9. Troubleshooting: kube-state-metrics ImagePullBackOff

## 9.1 Problem

After deploying the monitoring stack, kube-state-metrics was not starting:

```text
production-monitoring-kube-state-metrics-*   0/1   ImagePullBackOff
```

The other monitoring components were running successfully.

---

## 9.2 Investigation

The rendered Helm manifest was checked to identify the configured image:

```bash
helm template production-monitoring /tmp/kube-prometheus-stack \
  --namespace monitoring \
  -f monitoring/kube-prometheus-values.yaml \
  | grep -m1 -A2 "image:"
```

The kube-state-metrics image was:

```text
registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.20.0
```

The monitoring release was then upgraded, but Kyverno rejected the kube-state-metrics Deployment:

```text
admission webhook "validate.kyverno.svc-fail" denied the request
```

The important policy error was:

```text
require-approved-registry:
  validate-workload-image-registry:
  validation failure:
  Container images must come from an approved registry.
```

---

## 9.3 Root Cause

The Kyverno approved-registry policy originally allowed:

```text
docker.io/*
quay.io/*
ghcr.io/*
public.ecr.aws/*
```

However, kube-state-metrics uses:

```text
registry.k8s.io/*
```

Because `registry.k8s.io` was not included in the approved registry list, Kyverno blocked the kube-state-metrics Deployment.

Therefore, the issue was a **Kyverno policy configuration problem**, not a Prometheus configuration problem.

---

# 10. Resolution

The approved-registry policy was updated to include:

```text
registry.k8s.io/*
```

The final approved registry list is:

```text
docker.io/*
quay.io/*
ghcr.io/*
public.ecr.aws/*
registry.k8s.io/*
```

The policy was updated in both:

```text
helm/templates/policies/require-approved-registry.yaml
kubernetes/policies/require-approved-registry.yaml
```

The policy covers:

```text
Deployment
StatefulSet
DaemonSet
Job
CronJob
```

---

## 10.1 Helm Policy Validation

The Helm-rendered policy was checked with:

```bash
helm template production-aws-eks-platform helm \
  --namespace production-eks-platform-helm \
  | grep -A35 -B5 "validate-workload-image-registry"
```

The rendered policy confirmed:

```text
docker.io/*
quay.io/*
ghcr.io/*
public.ecr.aws/*
registry.k8s.io/*
```

This verified that the Helm template contained the updated registry list before synchronization.

---

# 11. Argo CD Synchronization

The project uses Argo CD to manage Kubernetes resources from Git.

After updating the Kyverno policy, the Argo CD application was hard-refreshed:

```bash
kubectl -n argocd annotate application production-aws-eks-platform \
  argocd.argoproj.io/refresh=hard --overwrite
```

The application temporarily showed:

```text
Synced   Progressing
```

After reconciliation, it returned to:

```text
Synced   Healthy
```

Validation:

```bash
kubectl get application production-aws-eks-platform -n argocd
```

Expected:

```text
NAME                          SYNC STATUS   HEALTH STATUS
production-aws-eks-platform   Synced        Healthy
```

---

# 12. Final Kyverno Policy Validation

The active Kyverno policy was verified:

```bash
kubectl get clusterpolicy require-approved-registry \
  -o jsonpath='{.spec.rules[*].match.any[*].resources.kinds}{"\n"}'
```

Expected:

```text
["Deployment","StatefulSet","DaemonSet","Job"] ["CronJob"]
```

The active policy was also checked for the new registry:

```bash
kubectl get clusterpolicy require-approved-registry -o yaml | grep "registry.k8s.io"
```

The active policy contained:

```text
registry.k8s.io/*
```

This confirmed that the updated policy was successfully applied to the cluster.

---

# 13. Final Monitoring Validation

After updating the Kyverno policy, the monitoring stack was upgraded again:

```bash
helm upgrade production-monitoring /tmp/kube-prometheus-stack \
  --namespace monitoring \
  -f monitoring/kube-prometheus-values.yaml
```

The Helm release completed successfully:

```text
STATUS: deployed
```

The monitoring pods were then verified:

```bash
kubectl get pods -n monitoring
```

Final state:

```text
alertmanager-production-monitoring-kube-alertmanager-0       2/2   Running
production-monitoring-grafana-*                              3/3   Running
production-monitoring-kube-operator-*                        1/1   Running
production-monitoring-kube-state-metrics-*                   1/1   Running
production-monitoring-prometheus-node-exporter-*             1/1   Running
prometheus-production-monitoring-kube-prometheus-0           2/2   Running
```

The important recovery was:

```text
kube-state-metrics

0/1 ImagePullBackOff
        ↓
1/1 Running
```

This confirmed that the Kyverno registry-policy conflict was resolved.

---

# 14. Final ServiceMonitor Validation

The Kyverno ServiceMonitor was verified:

```bash
kubectl get servicemonitor -n monitoring kyverno
```

Expected:

```text
NAME
kyverno
```

The endpoint was verified:

```bash
kubectl get servicemonitor -n monitoring kyverno -o yaml \
  | grep -A8 "endpoints:"
```

Expected:

```text
endpoints:
- interval: 30s
  path: /metrics
  port: metrics-port
```

This confirms that the Kyverno metrics scraping configuration is present.

---

# 15. Prometheus Target Validation

The Kyverno ServiceMonitor was verified from the Prometheus Targets page.

The Kyverno target showed:

Target: kyverno
Endpoint: /metrics
Service: kyverno-svc-metrics
Namespace: kyverno
Scrape status: UP
Availability: 1 / 1

This confirms the complete monitoring path:

Kyverno
    ↓
Kyverno metrics service
    ↓
ServiceMonitor
    ↓
Prometheus Operator
    ↓
Prometheus
    ↓
/metrics
    ↓
1 / 1 UP

This validates that Prometheus is successfully discovering and scraping Kyverno metrics.

# 16. Git Changes

Monitoring configuration was added under:

```text
monitoring/
├── kube-prometheus-values.yaml
└── kyverno-servicemonitor.yaml
```

The monitoring configuration was committed with:

```text
1ac152f feat: add monitoring configuration
```

The approved registry changes were committed with:

```text
ee9e2c4 fix: allow registry.k8s.io images
25aa90b fix: enforce approved registries on workloads
```

---

# 17. Current Status

## Completed

* [x] Prometheus stack deployed
* [x] Prometheus running
* [x] Alertmanager running
* [x] Prometheus Operator running
* [x] Node Exporter running
* [x] kube-state-metrics running
* [x] Kyverno ServiceMonitor created
* [x] Kyverno metrics service verified
* [x] `registry.k8s.io` added to approved registries
* [x] kube-state-metrics `ImagePullBackOff` resolved
* [x] Argo CD synchronization verified
* [x] Monitoring pods verified healthy
* [x] Kyverno metrics scraping configuration verified

## Not Yet Implemented

* [ ] Grafana dashboard configuration
* [ ] Custom Grafana dashboards
* [ ] Prometheus visualization through Grafana
* [ ] Grafana alerting configuration

Grafana is deployed as part of the Helm stack, but we have not configured dashboards or used Grafana for visualization yet. Grafana documentation will be created separately after its configuration is actually implemented.
