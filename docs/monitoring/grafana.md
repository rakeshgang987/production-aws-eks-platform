# Grafana Monitoring

## 1. Overview

Grafana is used in the project to visualize Kubernetes and Prometheus metrics through dashboards.

Grafana is deployed as part of the `kube-prometheus-stack` Helm release in the `monitoring` namespace.

The monitoring stack consists of:

* Prometheus — metrics collection and storage
* Grafana — metrics visualization and dashboards
* Alertmanager — alert handling, grouping, routing, and notifications
* Prometheus Operator — manages Prometheus and Alertmanager resources
* Node Exporter — node-level metrics
* kube-state-metrics — Kubernetes object and workload metrics
* Kyverno ServiceMonitor — exposes Kyverno metrics to Prometheus

Grafana does not collect metrics directly. It queries Prometheus and displays the metrics through dashboards.

---

## 2. Grafana Architecture

```text
                         Kubernetes Cluster
                                |
                +---------------+---------------+
                |                               |
                v                               v
          Node Exporter                  kube-state-metrics
                |                               |
                +---------------+---------------+
                                |
                                v
                           Prometheus
                                |
                                v
                             Grafana
                                |
                                v
                          Dashboards
```

Alerting is handled separately:

```text
PrometheusRule
      |
      v
Prometheus
      |
      v
Alertmanager
      |
      v
Notification Handling
```

Therefore:

```text
Prometheus  -> Collects and evaluates metrics
Grafana     -> Visualizes metrics
Alertmanager -> Handles alerts
```

---

## 3. Grafana Configuration

Monitoring configuration is stored under:

```text
monitoring/

├── kube-prometheus-values.yaml
└── kyverno-servicemonitor.yaml
```

The monitoring stack is deployed in:

```text
monitoring
```

with Helm release:

```text
production-monitoring
```

Grafana is enabled through:

```yaml
grafana:
  enabled: true
```

The monitoring stack also enables:

```yaml
prometheus:
  enabled: true

alertmanager:
  enabled: true

grafana:
  enabled: true

nodeExporter:
  enabled: true

kubeStateMetrics:
  enabled: true
```

---

## 4. Grafana Deployment

Grafana is deployed by the `kube-prometheus-stack` Helm release.

Verify the deployment:

```bash
kubectl get deployment -n monitoring production-monitoring-grafana
```

Verify the pod:

```bash
kubectl get pods -n monitoring | grep grafana
```

The Grafana deployment is:

```text
production-monitoring-grafana
```

The Grafana workload was verified as running successfully.

---

## 5. Grafana Service and Local Access

Verify the Grafana service:

```bash
kubectl get svc -n monitoring | grep grafana
```

Grafana can be exposed locally using:

```bash
kubectl port-forward -n monitoring \
  svc/production-monitoring-grafana 3001:80
```

Grafana is then available at:

```text
http://localhost:3001
```

The Grafana UI was successfully accessed through the local port-forward.

---

## 6. Grafana Data Sources

Grafana has two configured data sources:

```text
Prometheus
Alertmanager
```

Prometheus is configured as the default data source.

The Prometheus data source points to:

```text
http://production-monitoring-kube-prometheus.monitoring:9090/
```

The Alertmanager data source points to:

```text
http://production-monitoring-kube-alertmanager.monitoring:9093/
```

The data sources were verified through the Grafana API.

An unauthenticated request:

```bash
kubectl exec -n monitoring deployment/production-monitoring-grafana -- \
  curl -s http://localhost:3000/api/datasources
```

returned:

```text
Unauthorized
```

This confirmed that the Grafana API requires authentication.

After authentication:

```bash
kubectl exec -n monitoring deployment/production-monitoring-grafana -- \
  curl -s -u "admin:<GRAFANA_PASSWORD>" \
  http://localhost:3000/api/datasources
```

the configured data sources were returned.

The verified Prometheus data source:

```text
Name:     Prometheus
Type:     prometheus
Access:   proxy
URL:      http://production-monitoring-kube-prometheus.monitoring:9090/
Default:  true
```

The verified Alertmanager data source:

```text
Name:     Alertmanager
Type:     alertmanager
Access:   proxy
URL:      http://production-monitoring-kube-alertmanager.monitoring:9093/
```

---

## 7. Prometheus Data Source Health Check

The Grafana connection to Prometheus was tested with:

```bash
kubectl exec -n monitoring deployment/production-monitoring-grafana -- \
  curl -s -u "admin:<GRAFANA_PASSWORD>" \
  "http://localhost:3000/api/datasources/uid/prometheus/health"
```

The successful response was:

```json
{
  "details": {
    "application": "Prometheus",
    "features": {
      "rulerApiEnabled": false
    }
  },
  "message": "Successfully queried the Prometheus API.",
  "status": "OK"
}
```

This confirms that Grafana can successfully communicate with Prometheus.

The verified flow is:

```text
Grafana
   |
   v
Prometheus Data Source
   |
   v
Prometheus
   |
   v
Kubernetes Metrics
```

---

## 8. Kubernetes Dashboards

The Grafana instance contains Kubernetes dashboards provided by the monitoring stack.

The dashboards display Kubernetes resource information including:

```text
CPU Utilisation
CPU Requests Commitment
CPU Limits Commitment
Memory Utilisation
Memory Requests Commitment
Memory Limits Commitment
CPU Usage
CPU Quota
Memory
Namespace
Pods
Workloads
CPU Requests
CPU Limits
```

The dashboard also provides namespace-level views.

Namespaces visible in the dashboard included:

```text
argocd
production-eks-platform-helm
kyverno
kube-system
ingress-nginx
monitoring
```

This confirms that Grafana is successfully visualizing Kubernetes metrics from Prometheus.

---

## 9. Terminal Validation of CPU Metrics

Grafana displays CPU utilisation using Prometheus metrics.

The corresponding PromQL query was tested directly against Prometheus:

```promql
100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))
```

The query was executed with:

```bash
curl -sG 'http://localhost:9090/api/v1/query' \
  --data-urlencode \
  'query=100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))'
```

Prometheus returned a successful result:

```text
status: success
```

with the current CPU utilisation value.

This provided a terminal-level validation of the metric being used by Grafana.

---

## 10. Kubernetes Resource Dashboard Validation

The Kubernetes resource dashboard provides namespace-level resource information such as:

```text
Namespace
Pods
Workloads
CPU Requests
CPU Limits
```

The dashboard showed namespaces including:

```text
argocd
production-eks-platform-helm
kyverno
kube-system
ingress-nginx
monitoring
```

The dashboard data is supplied by Prometheus.

The relationship is:

```text
Kubernetes Resources
        |
        v
kube-state-metrics
        |
        v
Prometheus
        |
        v
Grafana
        |
        v
Kubernetes Dashboard
```

---

## 11. Grafana Dashboard Configuration

The Kubernetes dashboards are provided by the monitoring stack.

Dashboard definitions are stored in Kubernetes ConfigMaps.

The relevant ConfigMap was:

```text
production-monitoring-kube-k8s-resources-cluster
```

It was inspected using:

```bash
kubectl get configmap \
  production-monitoring-kube-k8s-resources-cluster \
  -n monitoring \
  -o jsonpath='{.data}' | head -c 500
```

The output confirmed that the ConfigMap contains the Kubernetes dashboard JSON definition.

The dashboard therefore exists as part of the deployed monitoring stack rather than being manually created from scratch.

---

## 12. Alertmanager Integration

Alertmanager is responsible for handling alerts generated by Prometheus.

Prometheus evaluates `PrometheusRule` resources.

When an alert condition is satisfied, Prometheus sends the alert to Alertmanager.

The flow is:

```text
PrometheusRule
      |
      v
Prometheus
      |
      | Alert
      v
Alertmanager
      |
      +--> Group alerts
      |
      +--> Route alerts
      |
      +--> Handle notifications
```

Grafana and Alertmanager have different responsibilities:

```text
Grafana
  |
  +--> Visualizes metrics
  +--> Displays dashboards
  +--> Queries Prometheus

Alertmanager
  |
  +--> Receives alerts
  +--> Groups alerts
  +--> Routes alerts
  +--> Handles notifications
```

---

## 13. Alertmanager Deployment Validation

The Alertmanager resource was verified with:

```bash
kubectl get alertmanager -n monitoring
```

The deployed resource was:

```text
production-monitoring-kube-alertmanager
```

The verified state was:

```text
VERSION       v0.34.0
REPLICAS      1
READY         1
RECONCILED    True
AVAILABLE     True
```

The Alertmanager services were verified with:

```bash
kubectl get svc -n monitoring | grep alertmanager
```

The main Alertmanager service was:

```text
production-monitoring-kube-alertmanager
```

---

## 14. Prometheus to Alertmanager Integration

Prometheus was verified to reference the deployed Alertmanager instance.

The configuration was checked with:

```bash
kubectl get prometheus production-monitoring-kube-prometheus \
  -n monitoring \
  -o jsonpath='{.spec.alerting.alertmanagers}'
```

The result showed:

```json
[
  {
    "apiVersion": "v2",
    "name": "production-monitoring-kube-alertmanager",
    "namespace": "monitoring",
    "pathPrefix": "/",
    "port": "http-web"
  }
]
```

The same configuration was verified with:

```bash
kubectl get prometheus production-monitoring-kube-prometheus \
  -n monitoring \
  -o yaml | grep -A10 -B2 alertmanager
```

The relevant configuration is:

```yaml
alerting:
  alertmanagers:
  - apiVersion: v2
    name: production-monitoring-kube-alertmanager
    namespace: monitoring
    pathPrefix: /
    port: http-web
```

This confirms that Prometheus is configured to send alerts to Alertmanager.

---

## 15. Alertmanager Runtime Validation

Alertmanager logs were checked using:

```bash
kubectl logs -n monitoring \
  alertmanager-production-monitoring-kube-alertmanager-0 \
  --tail=50
```

The logs confirmed:

```text
Starting Alertmanager
Listening on address=[::]:9093
Loading configuration file
Completed loading of configuration file
```

This confirms that Alertmanager started successfully and loaded its configuration.

---

## 16. Prometheus Alert Rules

The monitoring stack provides Kubernetes alerting rules through `PrometheusRule` resources.

Available rules include:

```text
KubePodCrashLooping
KubePodNotReady
KubeDeploymentGenerationMismatch
KubeDeploymentReplicasMismatch
KubeDeploymentRolloutStuck
KubeStatefulSetReplicasMismatch
KubeStatefulSetGenerationMismatch
KubeStatefulSetUpdateNotRolledOut
KubeDaemonSetRolloutStuck
KubeContainerWaiting
KubeJobFailed
KubeHpaReplicasMismatch
KubeHpaMaxedOut
CPUThrottlingHigh
KubePersistentVolumeFillingUp
KubePersistentVolumeErrors
KubeAPIDown
KubeAPIInstanceUnreachable
```

The rules can be listed with:

```bash
kubectl get prometheusrules -n monitoring
```

---

## 17. CrashLoopBackOff Alert Test

A temporary test namespace was created:

```text
monitoring-alert-test
```

A test pod was intentionally configured to fail so that Kubernetes would place it into `CrashLoopBackOff`.

Kyverno initially rejected the first test because the pod did not specify:

```yaml
securityContext:
  runAsNonRoot: true
```

The test workload was then created with the required security context.

The resulting pod entered:

```text
CrashLoopBackOff
```

The state was verified with:

```bash
kubectl get pod -n monitoring-alert-test
```

The pod showed:

```text
NAME         READY   STATUS
crash-test   0/1     CrashLoopBackOff
```

---

## 18. Prometheus CrashLoopBackOff Metric Validation

The Kubernetes state metric was queried directly from Prometheus:

```promql
kube_pod_container_status_waiting_reason{
  reason="CrashLoopBackOff",
  namespace="monitoring-alert-test"
}
```

The query was executed with:

```bash
curl -sG 'http://localhost:9090/api/v1/query' \
  --data-urlencode \
  'query=kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff",namespace="monitoring-alert-test"}' \
  | python3 -m json.tool
```

Prometheus returned the `crash-test` pod with:

```text
namespace: monitoring-alert-test
pod: crash-test
container: crash-test
reason: CrashLoopBackOff
value: 1
```

This confirmed that Prometheus was receiving the Kubernetes state metric.

---

## 19. KubePodCrashLooping Rule Validation

The actual `KubePodCrashLooping` rule was inspected with:

```bash
kubectl get prometheusrule -n monitoring \
  production-monitoring-kube-kubernetes-apps \
  -o jsonpath='{range .spec.groups[*].rules[?(@.alert=="KubePodCrashLooping")]}{.alert}{"\n"}{.expr}{"\n"}{.for}{"\n"}{.labels}{"\n"}{.annotations}{"\n"}{end}'
```

The configured rule is:

```text
Alert:
KubePodCrashLooping
```

Expression:

```promql
max_over_time(kube_pod_container_status_waiting_reason{
  reason="CrashLoopBackOff",
  job="kube-state-metrics",
  namespace=~".*"
}[5m]) >= 1
```

The configured duration is:

```text
15m
```

The severity is:

```text
warning
```

Therefore, the alert is not expected to become firing immediately.

It must remain in the required condition for the configured `15m` duration.

---

## 20. Alert State Validation

The alert state was checked directly through the Prometheus API:

```bash
curl -sG 'http://localhost:9090/api/v1/query' \
  --data-urlencode \
  'query=ALERTS{alertname="KubePodCrashLooping",namespace="monitoring-alert-test"}' \
  | python3 -c \
  'import sys,json; d=json.load(sys.stdin); print([(x["metric"]["alertstate"], x["metric"]["pod"]) for x in d["data"]["result"]])'
```

During the test, the result was:

```text
[('pending', 'crash-test')]
```

This confirms that:

```text
CrashLoopBackOff
      |
      v
Kubernetes metric
      |
      v
Prometheus rule
      |
      v
KubePodCrashLooping
      |
      v
Pending
```

The `pending` state is expected because the rule has a `15m` duration.

The test therefore verified the alert detection pipeline without immediately treating the temporary test as a production failure.

---

## 21. Final Monitoring and Grafana Architecture

The completed monitoring architecture is:

```text
                         Kubernetes Cluster
                                |
          +---------------------+---------------------+
          |                     |                     |
          v                     v                     v
    Node Exporter       kube-state-metrics       Kyverno
          |                     |                     |
          |                     |               Metrics Service
          |                     |                     |
          |                     |              ServiceMonitor
          |                     |                     |
          +---------------------+---------------------+
                                |
                                v
                           Prometheus
                          /          \
                         /            \
                        v              v
                   Grafana        Alertmanager
                      |                 |
                      v                 v
                Dashboards        Alert Handling
```

The responsibilities are:

```text
Prometheus
    |
    +--> Collects metrics
    +--> Stores time-series data
    +--> Evaluates alert rules

Grafana
    |
    +--> Queries Prometheus
    +--> Visualizes metrics
    +--> Provides Kubernetes dashboards

Alertmanager
    |
    +--> Receives alerts from Prometheus
    +--> Groups alerts
    +--> Routes alerts
    +--> Handles notification processing
```

---

## 22. Current Status

### Completed

* [x] Grafana deployed through `kube-prometheus-stack`
* [x] Grafana deployment verified
* [x] Grafana service verified
* [x] Grafana accessed locally through port forwarding
* [x] Prometheus configured as Grafana data source
* [x] Alertmanager configured as Grafana data source
* [x] Grafana Prometheus data source health verified
* [x] Kubernetes dashboards available
* [x] CPU metrics visible
* [x] Memory metrics visible
* [x] Namespace metrics visible
* [x] Pod metrics visible
* [x] Workload metrics visible
* [x] Prometheus-to-Alertmanager integration verified
* [x] Alertmanager runtime verified
* [x] Kubernetes alert rules verified
* [x] CrashLoopBackOff alert test created
* [x] CrashLoopBackOff metric verified in Prometheus
* [x] `KubePodCrashLooping` alert entered pending state
* [x] Grafana successfully queried Prometheus
* [x] Grafana dashboard data validated against Prometheus metrics

### Not Implemented

* [ ] Custom project-specific Grafana dashboard
* [ ] Custom Grafana alert rules
* [ ] External notification integration such as Slack or email

The current Grafana implementation uses the Kubernetes dashboards provided by the monitoring stack and successfully visualizes metrics collected by Prometheus.
