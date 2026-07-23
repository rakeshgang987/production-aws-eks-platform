# Docker Containerization

## Objective

The application was containerized to create a reproducible local environment for the complete application stack.

The Docker setup includes:

* React frontend
* Node.js and Express backend API
* PostgreSQL database
* Docker Compose orchestration
* Multi-stage frontend image build
* Non-root container execution
* Container health checks
* Persistent PostgreSQL storage

The objective was not only to make the application run inside containers, but also to apply production-oriented containerization practices that can later be used as the foundation for Kubernetes and Amazon EKS deployment.

---

## Application Architecture

```text
                    User
                      │
                      ▼
              localhost:5173
                      │
                      ▼
        ┌─────────────────────────┐
        │   Frontend Container    │
        │   React + Vite + Nginx  │
        │       Port: 8080        │
        └────────────┬────────────┘
                     │
                     ▼
              localhost:3000
                     │
                     ▼
        ┌─────────────────────────┐
        │   Backend Container     │
        │   Node.js + Express     │
        │       Port: 3000        │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │  PostgreSQL Container   │
        │       Port: 5432        │
        └─────────────────────────┘
```

Docker Compose creates an internal network where containers communicate using service names.

For example:

```text
backend → postgres:5432
```

The backend does not connect to the database using `localhost`.

Inside a container:

```text
localhost = the current container
```

Therefore, the backend connects to PostgreSQL using:

```text
DB_HOST=postgres
```

The hostname `postgres` is automatically resolved by Docker Compose.

---

# 1. Backend Containerization

## Dockerfile

Location:

```text
application/backend/Dockerfile
```

Current Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --omit=dev

COPY backend/ .

EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
```

---

## Base Image

```dockerfile
FROM node:20-alpine
```

The application uses the official Node.js 20 Alpine image.

### Why Alpine?

Alpine Linux is a lightweight Linux distribution.

Advantages include:

* Smaller image size
* Reduced attack surface
* Faster image transfer
* Lower storage requirements

However, Alpine images can sometimes have compatibility issues with packages that depend on system libraries.

For this application, the lightweight Alpine image works correctly.

---

## Working Directory

```dockerfile
WORKDIR /app
```

This creates the working directory inside the container.

All subsequent commands execute from:

```text
/app
```

This provides a predictable application structure.

---

## Dependency Installation

```dockerfile
COPY backend/package*.json ./

RUN npm ci --omit=dev
```

The package files are copied before the application source code.

This improves Docker layer caching.

If only application source code changes:

```text
package.json unchanged
        ↓
Dependency layer can be reused
        ↓
Faster rebuild
```

The command:

```bash
npm ci --omit=dev
```

installs dependencies using the lock file and excludes development dependencies.

This is appropriate for a production-style runtime image.

---

## Copying Application Code

```dockerfile
COPY backend/ .
```

The backend source code is copied into the container.

The resulting structure is approximately:

```text
/app
├── package.json
├── package-lock.json
├── src/
│   ├── server.js
│   ├── app.js
│   ├── db.js
│   └── routes/
└── node_modules/
```

---

## Non-Root Execution

```dockerfile
USER node
```

The container does not run the application as root.

This is an important container security practice.

If the application process is compromised, running as a non-root user limits the permissions available inside the container.

The running user was verified using:

```bash
docker exec -it production-platform-backend whoami
```

Expected output:

```text
node
```

---

## Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

The health check verifies the backend health endpoint:

```text
GET /health
```

Example:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "backend-api"
}
```

Docker uses the health check to determine whether the container is healthy.

Example:

```text
Up (healthy)
```

This is more useful than checking only whether the process is running.

A process can be running while the application itself is not responding correctly.

---

# 2. Frontend Containerization

## Dockerfile

Location:

```text
application/frontend/Dockerfile
```

The frontend uses a multi-stage Docker build.

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/nginx.conf

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

---

## Multi-Stage Build

The frontend uses two stages.

### Stage 1: Build

```dockerfile
FROM node:20-alpine AS build
```

This stage:

1. Installs Node.js dependencies
2. Copies the React application
3. Builds the production frontend

```bash
npm run build
```

The output is generated in:

```text
/app/dist
```

---

### Stage 2: Runtime

```dockerfile
FROM nginx:alpine
```

The final image contains Nginx and the compiled frontend files.

```dockerfile
COPY --from=build /app/dist /usr/share/nginx/html
```

The Node.js build environment is not included in the final runtime image.

This provides:

* Smaller runtime image
* Reduced attack surface
* No unnecessary build dependencies
* Better separation between build and runtime

---

# 3. Nginx Configuration

The frontend uses a custom Nginx configuration.

The application listens on:

```text
8080
```

Example configuration:

```nginx
events {}

http {
    include /etc/nginx/mime.types;

    server {
        listen 8080;

        server_name _;

        root /usr/share/nginx/html;

        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

The following configuration is important for React applications:

```nginx
try_files $uri $uri/ /index.html;
```

This allows client-side routing to work correctly.

---

# 4. Frontend Port Configuration

The frontend container listens internally on:

```text
8080
```

Docker Compose maps the host port:

```text
5173 → 8080
```

Therefore:

```text
Host:
http://localhost:5173

Container:
http://localhost:8080
```

The port mapping is:

```yaml
ports:
  - "5173:8080"
```

This means:

```text
HOST_PORT:CONTAINER_PORT
```

---

# 5. Docker Compose

Location:

```text
application/docker-compose.yml
```

Docker Compose manages the complete local application stack.

Services:

```text
PostgreSQL
    ↓
Backend API
    ↓
Frontend
```

The main services are:

```yaml
services:
  postgres:
  backend:
  frontend:
```

---

## PostgreSQL Service

```yaml
postgres:
  image: postgres:16
  container_name: production-platform-postgres
  restart: unless-stopped
```

The PostgreSQL database uses the official PostgreSQL 16 image.

Environment variables configure:

```yaml
POSTGRES_DB: products_db
POSTGRES_USER: app_user
POSTGRES_PASSWORD: app_password
```

The database is exposed locally through:

```text
5432:5432
```

---

## Persistent Storage

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

The named volume:

```text
postgres_data
```

persists PostgreSQL data.

Without a volume, deleting the container could delete the database data.

The volume provides:

```text
Container recreation
        ↓
Database data remains available
```

---

## Backend Service

The backend is built using:

```yaml
build:
  context: .
  dockerfile: backend/Dockerfile
```

The Docker build context is:

```text
application/
```

This is important because the Dockerfile uses:

```dockerfile
COPY backend/package*.json ./
COPY backend/ .
```

The backend is exposed through:

```text
3000:3000
```

Environment variables:

```yaml
environment:
  PORT: 3000
  DB_HOST: postgres
  DB_PORT: 5432
  DB_NAME: products_db
  DB_USER: app_user
  DB_PASSWORD: app_password
```

The important point is:

```text
DB_HOST=postgres
```

not:

```text
DB_HOST=localhost
```

Docker Compose provides service discovery using the service name.

---

## Frontend Service

The frontend is built using:

```yaml
build:
  context: .
  dockerfile: frontend/Dockerfile
```

The port mapping is:

```yaml
ports:
  - "5173:8080"
```

This means:

```text
localhost:5173
        ↓
Frontend container port 8080
```

The frontend depends on the backend:

```yaml
depends_on:
  - backend
```

---

# 6. Docker Compose Startup

The complete stack can be started using:

```bash
cd application
docker compose up -d
```

Expected result:

```text
PostgreSQL started
Backend started
Frontend started
```

To verify running containers:

```bash
docker ps
```

Expected services:

```text
production-platform-postgres
production-platform-backend
production-platform-frontend
```

---

# 7. Validation

## Check Container Status

```bash
docker ps
```

Expected:

```text
production-platform-frontend   Up (healthy)
production-platform-backend   Up (healthy)
production-platform-postgres   Up
```

---

## Test Backend Health

```bash
curl http://localhost:3000/health
```

Expected:

```json
{
  "status": "healthy",
  "service": "backend-api"
}
```

---

## Test Frontend

Open:

```text
http://localhost:5173
```

The React application should load through Nginx.

---

## Test Frontend from Inside the Container

Because the Nginx configuration listens on port 8080:

```bash
docker exec production-platform-frontend \
  wget -S -O - http://127.0.0.1:8080
```

Expected:

```text
HTTP/1.1 200 OK
```

---

## Verify Backend User

```bash
docker exec -it production-platform-backend whoami
```

Expected:

```text
node
```

This confirms that the backend is not running as root.

---

# 8. Troubleshooting: Frontend Health Check

During implementation, the frontend health check initially failed.

The container was running, but Docker reported:

```text
(unhealthy)
```

The first problem was a port mismatch.

The health check was checking:

```text
localhost:80
```

while the custom Nginx configuration was configured to listen on:

```text
8080
```

The health check was updated to:

```dockerfile
CMD wget --no-verbose --tries=1 --spider http://localhost:8080 || exit 1
```

However, the health check initially still failed when using:

```text
localhost
```

because the container resolved:

```text
localhost → ::1
```

The Nginx server was reachable through IPv4:

```text
127.0.0.1
```

Testing confirmed:

```bash
wget http://localhost:8080
```

failed.

But:

```bash
wget http://127.0.0.1:8080
```

returned:

```text
HTTP/1.1 200 OK
```

Therefore, the final health check uses:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080 || exit 1
```

This resulted in:

```text
production-platform-frontend   Up (healthy)
```

### Lesson Learned

A container can be:

```text
Running
```

but still:

```text
Unhealthy
```

Health checks must verify the actual application endpoint.

Port configuration and IPv4/IPv6 resolution can also affect health check results.

---

# 9. Docker Security Practices Implemented

The following security practices were implemented:

### Non-root execution

Backend:

```dockerfile
USER node
```

Frontend:

```dockerfile
USER nginx
```

Running containers as non-root users reduces the impact of a potential container compromise.

---

### Minimal runtime images

The application uses:

```text
node:20-alpine
nginx:alpine
```

The frontend uses a multi-stage build so that Node.js build dependencies are not included in the final Nginx runtime image.

---

### Build Context Filtering

The `.dockerignore` file excludes unnecessary files:

```text
node_modules
npm-debug.log
.git
.gitignore
.env
Dockerfile
docker-compose.yml
README.md
```

This prevents unnecessary files from being sent to the Docker build context.

It also prevents local secrets such as:

```text
.env
```

from accidentally being included in the image build context.

---

# 10. AI-Assisted DevOps Analysis

AI was used as an engineering assistant during the Docker implementation and troubleshooting process.

The AI-assisted workflow included:

```text
Dockerfile Design
        ↓
Security Review
        ↓
Container Testing
        ↓
Health Check Analysis
        ↓
Troubleshooting
        ↓
Configuration Improvement
        ↓
Validation
```

Examples of AI-assisted DevOps work included:

* Reviewing Dockerfile structure
* Evaluating base image choices
* Explaining multi-stage builds
* Reviewing non-root container execution
* Identifying health check problems
* Analyzing port mismatches
* Troubleshooting Nginx configuration
* Explaining Docker Compose networking
* Reviewing container security practices
* Explaining why `localhost` behaves differently inside containers
* Analyzing container status and logs

AI was not used as a replacement for validation.

The workflow was:

```text
AI suggestion
      ↓
Engineer implementation
      ↓
Docker command execution
      ↓
Logs and output analysis
      ↓
Configuration correction
      ↓
Final validation
```

This is the practical model of AI-assisted DevOps used in this project.

---

# 11. Important Lessons Learned

### 1. Container running does not mean application healthy

A process can be running while the application endpoint is unavailable.

Therefore:

```text
Process status ≠ Application health
```

Health checks are important.

---

### 2. Container networking is different from host networking

Inside the backend container:

```text
localhost
```

means:

```text
backend container
```

It does not mean:

```text
PostgreSQL container
```

Therefore, Docker Compose service names must be used:

```text
postgres
```

---

### 3. Docker Compose provides service discovery

The backend can connect to PostgreSQL using:

```text
postgres:5432
```

because Docker Compose creates an internal network and resolves the service name.

---

### 4. Multi-stage builds reduce runtime image size

The frontend needs Node.js to build the application.

The final application only needs Nginx to serve the static files.

Therefore:

```text
Node.js build environment
        ↓
Compiled React files
        ↓
Nginx runtime image
```

---

### 5. Non-root containers improve security

Both application containers run as non-root users:

```text
Backend → node
Frontend → nginx
```

This follows the principle of least privilege.

---

### 6. Health checks require accurate port configuration

The frontend initially failed because the health check did not match the actual Nginx listening port and address behavior.

The final validation confirmed:

```text
127.0.0.1:8080 → HTTP 200 OK
```

---

# 12. Current Docker Status

The Docker containerization phase is complete.

The application currently runs as:

```text
PostgreSQL
    ↓
Backend API
    ↓
Frontend
```

All primary containers have been validated.

Current status:

```text
Frontend     → Healthy
Backend      → Healthy
PostgreSQL   → Running
```

The Docker layer now provides the foundation for the next stage of the project:

```text
Docker
   ↓
Terraform Infrastructure
   ↓
AWS VPC
   ↓
Amazon EKS
   ↓
Kubernetes
```

---

## Next Phase

The next major phase is:

```text
Terraform Infrastructure
```

The infrastructure will eventually support:

```text
AWS VPC
    ↓
Subnets
    ↓
Routing
    ↓
Security Groups
    ↓
IAM
    ↓
ECR
    ↓
EKS
```

The infrastructure will be built incrementally and validated step by step before moving to Kubernetes deployment.
