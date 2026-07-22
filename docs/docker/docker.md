# Docker Containerization

## 1. Overview

The Production AWS EKS Platform application is containerized using Docker.

The application consists of three primary services:

```text
┌────────────────────────────────────┐
│          Docker Compose            │
│                                    │
│  ┌──────────────┐                  │
│  │   Frontend   │                  │
│  │ React + Nginx│                  │
│  │   Port 5173  │                  │
│  └──────┬───────┘                  │
│         │                          │
│         ▼                          │
│  ┌──────────────┐                  │
│  │    Backend   │                  │
│  │ Node.js +    │                  │
│  │    Express   │                  │
│  │   Port 3000  │                  │
│  └──────┬───────┘                  │
│         │                          │
│         ▼                          │
│  ┌──────────────┐                  │
│  │  PostgreSQL  │                  │
│  │   Database   │                  │
│  │   Port 5432  │                  │
│  └──────────────┘                  │
│                                    │
└────────────────────────────────────┘
```

The containerized application flow is:

```text
User Browser
     │
     ▼
Frontend Container
     │
     ▼
Backend API Container
     │
     ▼
PostgreSQL Container
```

---

## 2. Docker Components

The application uses the following containerized components:

| Component | Technology        | Container Port | Host Port |
| --------- | ----------------- | -------------: | --------: |
| Frontend  | React + Nginx     |             80 |      5173 |
| Backend   | Node.js + Express |           3000 |      3000 |
| Database  | PostgreSQL 16     |           5432 |      5432 |

---

## 3. Project Docker Structure

```text
application/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│
├── docker-compose.yml
└── .dockerignore
```

---

## 4. Backend Dockerfile

The backend is containerized using the following Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --omit=dev

COPY backend/ .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

### 4.1 Base Image

```dockerfile
FROM node:20-alpine
```

The backend uses Node.js 20 running on Alpine Linux.

The Alpine image is lightweight and helps reduce:

* Image size
* Download time
* Deployment time
* Unnecessary packages

### 4.2 Working Directory

```dockerfile
WORKDIR /app
```

All subsequent commands run inside:

```text
/app
```

inside the container.

### 4.3 Dependency Installation

```dockerfile
COPY backend/package*.json ./

RUN npm ci --omit=dev
```

The package files are copied before the application source code.

This improves Docker layer caching.

Production dependencies are installed using:

```bash
npm ci --omit=dev
```

Development dependencies are excluded from the production container.

### 4.4 Application Code

```dockerfile
COPY backend/ .
```

The backend application source code is copied into the image.

### 4.5 Exposed Port

```dockerfile
EXPOSE 3000
```

The backend application listens on port `3000`.

### 4.6 Container Startup

```dockerfile
CMD ["node", "src/server.js"]
```

This starts the backend API when the container starts.

---

## 5. Frontend Dockerfile

The frontend uses a multi-stage Docker build:

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 6. Multi-Stage Docker Build

The frontend Dockerfile contains two stages.

### Stage 1: Build Stage

```dockerfile
FROM node:20-alpine AS build
```

This stage:

1. Installs Node.js
2. Installs frontend dependencies
3. Copies the source code
4. Builds the React application

The build command is:

```bash
npm run build
```

This generates the production-ready frontend files inside:

```text
dist/
```

### Stage 2: Production Stage

```dockerfile
FROM nginx:alpine
```

The final image uses Nginx.

The compiled frontend is copied:

```dockerfile
COPY --from=build /app/dist /usr/share/nginx/html
```

Nginx then serves the static frontend application.

### Why Multi-Stage Builds?

Without a multi-stage build, the final image may contain:

* Node.js
* npm
* Source code
* Build tools
* Development dependencies

With a multi-stage build:

```text
Build Stage
    │
    ├── Node.js
    ├── npm
    ├── Source Code
    └── Dependencies
            │
            ▼
       npm run build
            │
            ▼
          dist/
            │
            ▼
Production Stage
    │
    └── Nginx + Compiled Frontend
```

Benefits:

* Smaller production image
* Faster deployments
* Fewer unnecessary packages
* Reduced attack surface
* Better production architecture

---

## 7. PostgreSQL Container

PostgreSQL is defined in `docker-compose.yml`:

```yaml
postgres:
  image: postgres:16
  container_name: production-platform-postgres
  restart: unless-stopped

  environment:
    POSTGRES_DB: products_db
    POSTGRES_USER: app_user
    POSTGRES_PASSWORD: app_password

  ports:
    - "5432:5432"

  volumes:
    - postgres_data:/var/lib/postgresql/data
```

### Database Configuration

```text
Database: products_db
User: app_user
Password: app_password
Port: 5432
```

### Persistent Storage

The PostgreSQL data is stored in:

```text
postgres_data
```

and mounted inside the container at:

```text
/var/lib/postgresql/data
```

The volume ensures that database data survives container recreation.

Without a volume:

```text
Container Deleted
        │
        ▼
Database Data Lost
```

With a persistent volume:

```text
Container Deleted
        │
        ▼
Database Data Preserved
```

---

## 8. Docker Compose

Docker Compose is used to run the complete application stack.

The services are:

```text
Frontend
    │
    ▼
Backend
    │
    ▼
PostgreSQL
```

The Compose configuration provides:

* Service orchestration
* Container networking
* Environment variable configuration
* Port mapping
* Persistent storage
* Service dependencies

### Start the Application

From the `application` directory:

```bash
docker compose up --build
```

The `--build` option rebuilds images before starting the containers.

### Run in Detached Mode

```bash
docker compose up --build -d
```

### Check Running Containers

```bash
docker ps
```

### Stop the Application

```bash
docker compose down
```

### Stop Containers and Remove Volumes

```bash
docker compose down -v
```

⚠️ This removes the PostgreSQL volume and deletes the database data stored in it.

---

## 9. Container Networking

Docker Compose creates an internal network for the services.

The backend connects to PostgreSQL using:

```text
DB_HOST=postgres
```

The hostname `postgres` is the Compose service name.

The backend database configuration is:

```javascript
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "app_user",
  password: process.env.DB_PASSWORD || "app_password",
  database: process.env.DB_NAME || "products_db",
});
```

Inside Docker:

```text
Backend Container
       │
       │ DB_HOST=postgres
       ▼
PostgreSQL Container
```

The backend should not use `localhost` to reach PostgreSQL from inside its container.

Inside a container:

```text
localhost = The Current Container
```

Therefore:

```text
Backend → localhost:5432
```

would incorrectly point to the backend container itself.

Instead:

```text
Backend → postgres:5432
```

correctly reaches the PostgreSQL container through Docker's internal DNS.

---

## 10. Port Mapping

The application exposes the following ports:

```text
Frontend:
Host 5173 → Container 80

Backend:
Host 3000 → Container 3000

PostgreSQL:
Host 5432 → Container 5432
```

The architecture is:

```text
Browser
   │
   ▼
localhost:5173
   │
   ▼
Frontend Container
   │
   ▼
localhost:3000
   │
   ▼
Backend Container
   │
   ▼
postgres:5432
   │
   ▼
PostgreSQL Container
```

---

## 11. `.dockerignore`

The project uses:

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

The `.dockerignore` file prevents unnecessary files from being sent to the Docker build context.

This helps:

* Reduce build context size
* Improve build speed
* Avoid copying local dependencies
* Prevent accidental inclusion of sensitive files

---

## 12. Docker Troubleshooting: Port Conflict

During the Docker deployment, the backend initially failed to start because port `3000` was already in use.

The error was:

```text
failed to bind port 0.0.0.0:3000
address already in use
```

To identify the process using port `3000`:

```bash
sudo lsof -i :3000
```

The output showed a Node.js process listening on the port:

```text
node 80471 ... TCP *:3000 (LISTEN)
```

The process was stopped:

```bash
kill 80471
```

After the port was released, Docker Compose successfully started the backend container.

### General Troubleshooting Process

```text
Application Fails to Start
          │
          ▼
Check Error Message
          │
          ▼
Check Port Usage
          │
          ▼
sudo lsof -i :3000
          │
          ▼
Identify Conflicting Process
          │
          ▼
Stop or Reconfigure Process
          │
          ▼
Restart Docker Compose
```

---

## 13. Verification

After starting the application:

```bash
docker compose up --build
```

Verify running containers:

```bash
docker ps
```

Expected containers:

```text
production-platform-frontend
production-platform-backend
production-platform-postgres
```

### Verify Backend API

```bash
curl http://localhost:3000/api/products
```

### Verify Frontend

Open:

```text
http://localhost:5173
```

The complete application should be accessible through the frontend.

---

## 14. Docker Milestone Result

The application has successfully been containerized into independent services:

```text
┌──────────────────┐
│     Frontend     │
│   React + Nginx  │
│    Port 5173     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     Backend      │
│ Node.js + Express│
│    Port 3000     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    PostgreSQL    │
│     Database     │
│    Port 5432     │
└──────────────────┘
```

### Completed Docker Objectives

* Containerized the backend application
* Containerized the frontend application
* Used a multi-stage frontend Docker build
* Added PostgreSQL as a containerized database
* Configured Docker Compose orchestration
* Configured container-to-container networking
* Added persistent database storage
* Added `.dockerignore`
* Tested the complete application stack
* Troubleshot and resolved a host port conflict

The application is now ready for the next stage of the platform:

```text
Docker
   │
   ▼
Terraform Infrastructure
   │
   ▼
Amazon ECR
   │
   ▼
Amazon EKS
```
