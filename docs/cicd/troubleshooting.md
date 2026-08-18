# CI/CD Troubleshooting

## Overview

This document records the main issues encountered while implementing and validating the CI/CD pipeline.

The purpose is not only to document the final working configuration, but also to capture the failures, investigation process, commands used, and solutions applied during implementation.

The issues documented here were encountered during GitHub Actions, Docker Hub, Helm, and Minikube validation.

---

# 1. Empty Helm Image Tag

## Problem

During a Helm deployment test, the `IMAGE_TAG` variable was empty.

The Helm release contained an empty image tag for the backend and frontend.

This generated invalid image references such as:

```text
docker.io/rakeshgang163/production-aws-eks-platform-backend:

docker.io/rakeshgang163/production-aws-eks-platform-frontend:
```

Kubernetes subsequently reported:

```text
InvalidImageName
```

---

## Investigation

The Helm values were inspected using:

```bash
helm get values production-aws-eks-platform \
  -n production-eks-platform-helm
```

The rendered Helm manifest was then checked:

```bash
helm get manifest production-aws-eks-platform \
  -n production-eks-platform-helm | grep -n "image:"
```

The empty image tag was confirmed.

---

## Resolution

The deployment was repeated with a valid image tag.

The resulting image references became:

```text
docker.io/rakeshgang163/production-aws-eks-platform-backend:latest

docker.io/rakeshgang163/production-aws-eks-platform-frontend:latest
```

The pods subsequently started successfully.

---

# 2. ImagePullBackOff / ErrImagePull

## Problem

After correcting the image reference, newly created pods initially reported:

```text
ImagePullBackOff
```

and:

```text
ErrImagePull
```

---

## Investigation

The running pod image references were checked using:

```bash
kubectl get pods -n production-eks-platform-helm \
  -o jsonpath='{range .items[*]}{.metadata.name}{" -> "}{.spec.containers[0].image}{"\n"}{end}'
```

The pods were correctly referencing the intended Docker Hub repositories.

The issue was that the Docker Hub repositories existed, but the required application images had not yet been published.

---

## Resolution

The CI/CD workflow was configured to:

```text
Build Docker Images
        ↓
Tag Docker Images
        ↓
Push Images to Docker Hub
        ↓
Deploy Using Helm
```

Once the images were published, Kubernetes successfully pulled them and the pods reached the `Running` state.

---

# 3. Docker Hub Repository vs Published Image

## Problem

Docker Hub repositories had been created for the backend and frontend applications, but Kubernetes could not pull the application images.

---

## Root Cause

A Docker Hub repository existing does not mean that an image has been pushed to that repository.

For example:

```text
Repository:
rakeshgang163/production-aws-eks-platform-backend
```

does not automatically mean:

```text
Image:
rakeshgang163/production-aws-eks-platform-backend:latest
```

---

## Resolution

The CI/CD pipeline was configured to build and push the images.

The correct flow is:

```text
Dockerfile
    ↓
Docker Build
    ↓
Docker Tag
    ↓
Docker Push
    ↓
Docker Hub Repository
    ↓
Kubernetes Image Pull
```

After the images were published, Kubernetes was able to pull the application images successfully.

---

# 4. Helm Image Repository Configuration

## Problem

The initial Helm values referenced default/local image repositories:

```text
docker.io/library/application-backend

docker.io/library/application-frontend
```

These were not the intended Docker Hub repositories used by the CI/CD pipeline.

---

## Resolution

The Helm values were updated to use the project's Docker Hub repositories.

### Backend

```bash
sed -i 's|docker.io/library/application-backend|docker.io/rakeshgang163/production-aws-eks-platform-backend|' helm/values.yaml
```

### Frontend

```bash
sed -i 's|docker.io/library/application-frontend|docker.io/rakeshgang163/production-aws-eks-platform-frontend|' helm/values.yaml
```

The final repositories are:

```text
docker.io/rakeshgang163/production-aws-eks-platform-backend

docker.io/rakeshgang163/production-aws-eks-platform-frontend
```

---

## Verification

The Helm values can be checked using:

```bash
grep -nE 'repository:|tag:' helm/values.yaml
```

The rendered Helm configuration can also be validated using:

```bash
helm template production-aws-eks-platform helm \
  --namespace production-eks-platform-helm
```

Image references can then be inspected with:

```bash
grep -n "image:" /tmp/rendered.yaml
```

---

# 5. Kubernetes Recreated Pods After Helm Changes

## Problem

During Helm testing, changing image configuration resulted in new backend and frontend pods being created.

Initially, both old and new pods could be observed simultaneously.

---

## Root Cause

The image repository and tag are part of the Kubernetes Deployment pod template.

When the pod template changes, Kubernetes creates a new ReplicaSet and performs a rolling update.

This is expected Kubernetes behavior.

---

## Investigation

The deployed pod images were inspected using:

```bash
kubectl get pods -n production-eks-platform-helm \
  -o jsonpath='{range .items[*]}{.metadata.name}{" -> "}{.spec.containers[0].image}{"\n"}{end}'
```

This showed that the newly created pods used the updated Docker Hub images while older pods still referenced the previous image configuration.

---

## Resolution

The rollout was allowed to complete.

After the new pods became ready, Kubernetes removed the old ReplicaSet pods.

The final application pods used:

```text
docker.io/rakeshgang163/production-aws-eks-platform-backend:latest

docker.io/rakeshgang163/production-aws-eks-platform-frontend:latest
```

---

# 6. GitHub Actions Node.js Runtime Warnings

## Problem

GitHub Actions initially displayed warnings indicating that some actions were targeting Node.js 20 while GitHub-hosted runners were moving toward Node.js 24.

The warnings appeared for actions including:

```text
actions/checkout
actions/setup-node
docker/login-action
azure/setup-helm
```

The pipeline jobs still passed successfully, but the warnings indicated that the action versions should be updated.

---

## Resolution

The workflow action versions were updated.

### Checkout

```bash
sed -i 's/actions\/checkout@v4/actions\/checkout@v5/g' .github/workflows/ci.yml
```

### Node.js Setup

```bash
sed -i 's/actions\/setup-node@v4/actions\/setup-node@v5/g' .github/workflows/ci.yml
```

### Docker Login

```bash
sed -i 's/docker\/login-action@v3/docker\/login-action@v4/g' .github/workflows/ci.yml
```

### Helm Setup

```bash
sed -i 's/azure\/setup-helm@v4/azure\/setup-helm@v5/g' .github/workflows/ci.yml
```

---

## Final Action Versions

After the updates, the workflow uses:

```text
actions/checkout@v5
actions/setup-node@v5
docker/login-action@v4
azure/setup-helm@v5
```

The workflow was executed again after these changes.

All CI/CD jobs passed successfully, and the previous Node.js 20 deprecation warnings were no longer present.

---

# 7. Verification of GitHub Actions Versions

The final action versions can be checked using:

```bash
grep -nE 'uses: (actions/checkout|actions/setup-node|docker/login-action|azure/setup-helm)' .github/workflows/ci.yml
```

Expected configuration:

```text
actions/checkout@v5
actions/setup-node@v5
docker/login-action@v4
azure/setup-helm@v5
```

This provides a quick way to verify that the workflow is using the updated action versions.

---

# 8. Helm Upgrade vs Fresh Installation

## Observation

The CI/CD deployment uses:

```bash
helm upgrade --install
```

During testing, the same Helm release was upgraded multiple times.

The release revision increased with each successful upgrade.

---

## Why This Matters

Using `helm upgrade --install` provides both installation and upgrade behavior.

```text
Release does not exist
        ↓
Helm installs it

Release already exists
        ↓
Helm upgrades it
```

This allows the same CI/CD workflow to be used for both initial deployment and subsequent application updates.

---

# 9. Helm Release Validation

The Helm release was checked using:

```bash
helm list -n production-eks-platform-helm
```

The final release was:

```text
NAME
production-aws-eks-platform
```

with:

```text
STATUS
deployed
```

The release reached revision `9` during the final local validation.

This confirmed that the Helm deployment and upgrade process was working correctly.

---

# 10. Kubernetes Image Validation

The images actually used by the running pods were verified using:

```bash
kubectl get pods -n production-eks-platform-helm \
  -o jsonpath='{range .items[*]}{.metadata.name}{" -> "}{.spec.containers[0].image}{"\n"}{end}'
```

The validated application images were:

```text
docker.io/rakeshgang163/production-aws-eks-platform-backend:latest

docker.io/rakeshgang163/production-aws-eks-platform-frontend:latest
```

PostgreSQL was running with:

```text
docker.io/library/postgres:16-alpine
```

This confirmed that the Helm deployment was using the intended Docker Hub repositories.

---

# 11. Helm Chart Validation

The Helm chart was validated using:

```bash
helm lint helm
```

The result was:

```text
==> Linting helm
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, 0 chart(s) failed
```

The icon message is informational and does not represent a lint failure.

The chart successfully passed validation.

---

# 12. Helm Template Validation

The chart was rendered with the CI/CD image configuration:

```bash
helm template production-aws-eks-platform helm \
  --namespace production-eks-platform-helm \
  --set backend.image.repository=docker.io/rakeshgang163/production-aws-eks-platform-backend \
  --set backend.image.tag=test \
  --set frontend.image.repository=docker.io/rakeshgang163/production-aws-eks-platform-frontend \
  --set frontend.image.tag=test \
  > /tmp/ci-rendered.yaml
```

The generated image references were checked using:

```bash
grep -n "image:" /tmp/ci-rendered.yaml
```

The resulting configuration included:

```text
docker.io/rakeshgang163/production-aws-eks-platform-backend:test

docker.io/rakeshgang163/production-aws-eks-platform-frontend:test

docker.io/library/postgres:16-alpine
```

The approved registry policy also remained configured as:

```text
docker.io/*
```

---

# 13. CI/CD Job Validation

After the workflow changes were completed, the complete GitHub Actions workflow was executed.

The following jobs passed:

```text
Backend Tests                 ✅
Frontend Lint and Build       ✅
Build and Push Docker Images  ✅
Helm Deployment               ✅
```

The workflow therefore successfully completed the full CI/CD path.

---

# 14. Minikube Deployment Validation

The Kubernetes deployment generated through Helm was tested locally using Minikube.

The final namespace was:

```text
production-eks-platform-helm
```

The deployed workloads included:

```text
Backend
2 replicas

Frontend
2 replicas

PostgreSQL
1 StatefulSet pod
```

Pod status was checked using:

```bash
kubectl get pods -n production-eks-platform-helm
```

The application pods reached the `Running` state and the Helm release remained in the `deployed` state.

---

# 15. Important CI/CD Testing Boundary

The GitHub Actions workflow successfully completed its Helm deployment job, but this should not be interpreted as AWS EKS deployment testing.

The current architecture is:

```text
GitHub Actions
      ↓
Docker Hub
      ↓
Helm
      ↓
Minikube
      ↓
Kubernetes
```

Minikube is used as the current Kubernetes validation environment.

AWS EKS integration is intentionally deferred until the final stage of the project.

This allows the remaining components to be completed and tested locally before incurring the cost and complexity of final AWS EKS integration testing.

---

# 16. Lessons Learned

The CI/CD troubleshooting process reinforced several important DevOps concepts.

### CI/CD variables must be validated

An empty image tag can generate an invalid Kubernetes image reference and cause deployment failures.

### Image repositories are not enough

A container registry repository must contain the required image before Kubernetes can pull it.

### Helm changes can trigger Kubernetes rollouts

Changing a Deployment's pod template causes Kubernetes to create new pods.

### CI/CD should fail early

Application tests and frontend validation should complete before spending resources on Docker builds and image publishing.

### Action versions should be maintained

Keeping GitHub Actions dependencies updated prevents avoidable runtime deprecation warnings.

### Helm should remain configurable

Image repositories and tags should be configurable through Helm values rather than hard-coded into individual Kubernetes manifests.

### Local validation reduces cloud risk

Testing the CI/CD deployment against Minikube provides a lower-cost environment for troubleshooting before performing the final AWS EKS integration.

---

# 17. Final CI/CD Troubleshooting Status

The major CI/CD issues encountered during implementation have been resolved:

```text
Empty Helm image tag             ✅ Resolved
InvalidImageName                 ✅ Resolved
ImagePullBackOff                 ✅ Resolved
Docker Hub image availability    ✅ Resolved
Helm image repository mismatch   ✅ Resolved
Helm pod recreation              ✅ Understood / Expected
Node.js runtime warnings         ✅ Resolved
Helm upgrade behavior            ✅ Validated
Helm lint validation             ✅ Passed
Helm template validation         ✅ Passed
GitHub Actions pipeline          ✅ Passed
Minikube deployment              ✅ Passed
```

The CI/CD implementation is currently complete and successfully validated locally.

Final AWS EKS integration, production-focused security validation, and observability testing will be performed after the remaining platform components are completed.
