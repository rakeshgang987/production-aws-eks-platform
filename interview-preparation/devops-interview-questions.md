# Docker Interview Preparation

This document contains Docker interview questions, answers, explanations, project-specific examples, and troubleshooting scenarios based on the `production-aws-eks-platform` project.

---

# 1. What is Docker?

## Short Interview Answer

Docker is a containerization platform that packages an application together with its dependencies and runtime environment into a portable unit called a container. This allows applications to run consistently across different environments.

## Explanation

Without Docker, an application may behave differently across environments because of differences in:

* Operating system
* Runtime versions
* Dependencies
* Libraries
* Configuration

Docker packages the application and its runtime requirements into a consistent environment.

```text
Application
     +
Dependencies
     +
Runtime
     ↓
Docker Image
     ↓
Container
```

## Project Example

In this project, the application is divided into separate services:

```text
React Frontend
      ↓
Frontend Container

Node.js Backend
      ↓
Backend Container

PostgreSQL
      ↓
Database Container
```

Docker Compose manages these services together.

---

# 2. What is a Docker Image?

## Short Interview Answer

A Docker image is a read-only, immutable template containing the application code, dependencies, libraries, and configuration required to create a container.

## Explanation

An image is like a blueprint.

```text
Docker Image
      │
      ├── Application Code
      ├── Dependencies
      ├── Runtime
      └── Configuration
             │
             ▼
        Container
```

One Docker image can be used to create multiple containers.

```text
         Docker Image
        /      |      \
       ▼       ▼       ▼
 Container  Container  Container
```

## Project Example

The backend Dockerfile is used to build a backend image:

```text
Backend Dockerfile
        ↓
Docker Build
        ↓
Backend Image
        ↓
Backend Container
```

The same process is used for the frontend.

---

# 3. What is a Docker Container?

## Short Interview Answer

A container is a running instance of a Docker image. It is an isolated process that runs the application and its dependencies in a consistent environment.

## Docker Lifecycle

```text
Dockerfile
     ↓
Docker Image
     ↓
Docker Container
```

Example:

```bash
docker build -t my-backend .
```

This creates an image.

```bash
docker run my-backend
```

This creates and starts a container from that image.

## Image vs Container

| Image                          | Container                  |
| ------------------------------ | -------------------------- |
| Blueprint                      | Running instance           |
| Read-only                      | Has a writable layer       |
| Used to create containers      | Runs the application       |
| Can create multiple containers | Can be started and stopped |

## Important Point

If a container is deleted, data stored only inside the container's writable layer can be lost.

For persistent data, Docker volumes should be used.

---

# 4. What is a Dockerfile?

## Short Interview Answer

A Dockerfile is a text file containing instructions used to build a Docker image.

Example:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]
```

## Dockerfile Execution Flow

Docker processes instructions from top to bottom:

```text
FROM
 ↓
WORKDIR
 ↓
COPY Dependencies
 ↓
RUN Installation
 ↓
COPY Source Code
 ↓
EXPOSE
 ↓
CMD
```

Each instruction can create an image layer.

---

# 5. Why Does Dockerfile Instruction Order Matter?

Docker uses layer caching.

A good Dockerfile structure is:

```dockerfile
COPY package*.json ./

RUN npm ci

COPY src ./src
```

If only the source code changes, Docker can reuse the dependency installation layer.

This improves build speed.

## Example

If this changes:

```text
src/app.js
```

Docker does not need to reinstall all dependencies if the `package.json` and `package-lock.json` files remain unchanged.

---

# 6. What is Docker Compose?

## Short Interview Answer

Docker Compose is a tool used to define and run multi-container applications using a YAML configuration file.

It manages:

* Multiple services
* Container networking
* Environment variables
* Port mappings
* Volumes
* Service configuration

## Project Example

The application contains:

```text
Frontend
    ↓
Backend
    ↓
PostgreSQL
```

Docker Compose allows the entire application stack to be started with:

```bash
docker compose up --build
```

Instead of manually running:

```bash
docker run postgres
docker run backend
docker run frontend
```

---

# 7. Explain the Docker Architecture of This Project

## Interview Answer

My application consists of three main services: a React frontend, a Node.js and Express backend, and a PostgreSQL database.

I containerized each service separately. The frontend is built using a Node.js build stage and served using Nginx. The backend runs in a Node.js container and communicates with PostgreSQL through the Docker Compose internal network.

PostgreSQL uses a named Docker volume for persistent data. Docker Compose orchestrates all services and manages networking, environment configuration, port mapping, and service lifecycle.

## Architecture

```text
┌────────────────────┐
│      Frontend      │
│    React + Vite    │
│      Nginx         │
│     Port 5173      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│      Backend       │
│   Node.js +        │
│     Express        │
│     Port 3000      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│     PostgreSQL     │
│     Port 5432      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│   postgres_data    │
│   Named Volume     │
└────────────────────┘
```

---

# 8. How Do Docker Containers Communicate?

## Short Interview Answer

Containers connected to the same Docker network communicate using service names as hostnames.

For example:

```text
Backend
   │
   │ DB_HOST=postgres
   ▼
PostgreSQL
```

The backend connects to:

```text
postgres:5432
```

## Why Not localhost?

Inside a container:

```text
localhost
```

means the current container itself.

Therefore, from the backend container:

```text
localhost:5432
```

looks for PostgreSQL inside the backend container.

The correct address is:

```text
postgres:5432
```

because `postgres` is the Docker Compose service name.

---

# 9. Difference Between localhost and a Docker Service Name

## From the Host Machine

```text
localhost:3000
```

means the backend exposed on the host machine.

```text
localhost:5432
```

means PostgreSQL exposed on the host machine.

## From the Backend Container

```text
postgres:5432
```

means the PostgreSQL service on the Docker network.

## Important Rule

```text
From Host:
localhost

From Container:
Docker Service Name
```

This is one of the most common Docker networking interview questions.

---

# 10. Why Use a Docker Volume for PostgreSQL?

## Short Interview Answer

I used a named Docker volume to persist PostgreSQL data independently of the container lifecycle.

Docker Compose configuration:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

## Without a Volume

```text
PostgreSQL Container
        ↓
     Database
        ↓
Container Deleted
        ↓
   Data May Be Lost
```

## With a Volume

```text
PostgreSQL Container
        │
        ▼
┌──────────────────┐
│  postgres_data   │
│                  │
│  Database Data   │
└──────────────────┘
```

The container can be removed while the named volume remains.

## Important Commands

```bash
docker compose down
```

Normally removes containers but preserves named volumes.

```bash
docker compose down -v
```

Removes containers and named volumes.

Therefore, `docker compose down -v` should not be used casually when database data must be preserved.

---

# 11. What is a Multi-Stage Docker Build?

## Short Interview Answer

A multi-stage Docker build uses multiple stages in a Dockerfile. Build tools and dependencies are used in an intermediate stage, while only the required production files are copied into the final runtime image.

This creates smaller and cleaner production images.

## Frontend Flow

```text
React Source Code
        ↓
Node.js Build Stage
        ↓
npm run build
        ↓
Static Files
        ↓
Nginx Runtime Image
        ↓
Production Container
```

## Why Use It?

The final image does not need:

* Node.js development tools
* Source code
* Build dependencies
* Development packages

This provides:

* Smaller images
* Faster deployment
* Reduced attack surface
* Cleaner production containers

---

# 12. Why Use Nginx for the React Frontend?

## Short Interview Answer

A React production build generates static files. Nginx is used as a lightweight web server to serve those static files efficiently.

The frontend does not need a Node.js runtime in the production container after the build is complete.

## Architecture

```text
Node.js Build Stage
        ↓
React Production Build
        ↓
Static HTML/CSS/JS
        ↓
Nginx
        ↓
Users
```

This is more efficient than running the development server in production.

---

# 13. Why Use Alpine Images?

## Short Interview Answer

Alpine-based images are lightweight and can reduce Docker image size and download time.

Example:

```dockerfile
FROM node:20-alpine
```

## Advantages

* Smaller image size
* Faster image transfer
* Reduced storage requirements

## Important Consideration

Alpine uses musl libc instead of glibc, so some native dependencies may have compatibility issues.

Therefore, the smallest image is not always automatically the best image. Compatibility and stability must also be considered.

---

# 14. What is `.dockerignore`?

## Short Interview Answer

`.dockerignore` prevents unnecessary files from being sent to the Docker build context.

Example:

```text
node_modules
.git
.env
dist
coverage
```

## Why Is It Important?

It helps:

* Reduce build context size
* Improve build speed
* Prevent sensitive files from entering the build context
* Avoid copying unnecessary files

## Project Example

The project excludes:

```text
node_modules/
.env
```

This is important because:

* `node_modules` can be very large
* Environment files may contain secrets

---

# 15. What is the Difference Between RUN, CMD, and ENTRYPOINT?

## RUN

Executed during image build.

```dockerfile
RUN npm ci
```

This installs dependencies while building the image.

## CMD

Provides the default command when a container starts.

```dockerfile
CMD ["npm", "start"]
```

The CMD can be overridden when running the container.

## ENTRYPOINT

Defines the main executable of the container.

```dockerfile
ENTRYPOINT ["node"]
```

It is generally more difficult to override than CMD.

## Simple Comparison

| Instruction | When It Runs      | Purpose           |
| ----------- | ----------------- | ----------------- |
| RUN         | During build      | Install/configure |
| CMD         | Container startup | Default command   |
| ENTRYPOINT  | Container startup | Main executable   |

---

# 16. What is the Difference Between COPY and ADD?

## COPY

Copies files from the build context into the image.

```dockerfile
COPY package*.json ./
```

It is simple and predictable.

## ADD

Can also:

* Extract local tar archives
* Support certain remote sources

For most application Dockerfiles, `COPY` is preferred because it is more explicit and predictable.

---

# 17. What Is Docker Port Mapping?

Example:

```yaml
ports:
  - "3000:3000"
```

The format is:

```text
HOST_PORT:CONTAINER_PORT
```

Therefore:

```text
3000:3000
```

means:

```text
Host Port 3000
       ↓
Container Port 3000
```

For the frontend:

```text
5173:80
```

means:

```text
Host Port 5173
       ↓
Container Port 80
```

The frontend container runs Nginx on port 80, but users access it through port 5173 on the host.

---

# 18. What Port Conflict Did You Encounter?

## Problem

Docker Compose failed with:

```text
bind: address already in use
```

The backend needed:

```text
Host Port 3000
```

But another Node.js process was already listening on that port.

## Investigation

I used:

```bash
sudo lsof -i :3000
```

The output showed a Node.js process listening on port 3000.

## Explanation

Docker tried to create:

```text
Host Port 3000
        ↓
Container Port 3000
```

But the host port was already occupied.

Therefore Docker could not bind the port.

## Interview Answer

During Docker Compose startup, the backend container failed because host port 3000 was already being used by another Node.js process. I used `sudo lsof -i :3000` to identify the process occupying the port. After stopping the conflicting process, Docker was able to bind port 3000 and the complete Compose stack started successfully.

## General Troubleshooting Commands

```bash
sudo lsof -i :3000
```

```bash
sudo ss -tulpn | grep :3000
```

```bash
docker ps
```

```bash
docker logs <container-name>
```

---

# 19. How Do You Troubleshoot a Container That Is Not Starting?

I follow a systematic process.

## Step 1: Check Container Status

```bash
docker ps -a
```

## Step 2: Check Logs

```bash
docker logs <container-name>
```

## Step 3: Inspect the Container

```bash
docker inspect <container-name>
```

## Step 4: Check Port Conflicts

```bash
sudo lsof -i :<port>
```

## Step 5: Check Environment Variables

```bash
docker exec -it <container-name> env
```

## Step 6: Check Network Connectivity

```bash
docker network ls
```

```bash
docker network inspect <network-name>
```

## Step 7: Check the Image

```bash
docker images
```

## Step 8: Run a Shell Inside the Container

```bash
docker exec -it <container-name> sh
```

or:

```bash
docker exec -it <container-name> bash
```

depending on the image.

---

# 20. What Happens When a Container Is Restarted?

A container can be:

```text
Stopped
   ↓
Started
```

The container itself remains.

If the container is removed and recreated, data stored only inside the container can be lost.

For databases and persistent data, use volumes.

---

# 21. What Is the Difference Between docker stop, docker rm, and docker compose down?

## docker stop

Stops a running container.

```bash
docker stop <container>
```

## docker rm

Removes a stopped container.

```bash
docker rm <container>
```

## docker compose down

Stops and removes containers and the Compose network.

```bash
docker compose down
```

Named volumes are normally preserved unless:

```bash
docker compose down -v
```

is used.

---

# 22. Important Docker Commands

## List Running Containers

```bash
docker ps
```

## List All Containers

```bash
docker ps -a
```

## Build an Image

```bash
docker build -t image-name .
```

## Run a Container

```bash
docker run image-name
```

## View Logs

```bash
docker logs <container-name>
```

## Follow Logs

```bash
docker logs -f <container-name>
```

## Execute a Command in a Container

```bash
docker exec -it <container-name> sh
```

## List Images

```bash
docker images
```

## List Volumes

```bash
docker volume ls
```

## List Networks

```bash
docker network ls
```

## Start Docker Compose

```bash
docker compose up
```

## Build and Start

```bash
docker compose up --build
```

## Run in Background

```bash
docker compose up -d
```

## Stop and Remove Services

```bash
docker compose down
```

---

# 23. How Can Docker Images Be Optimized?

Common techniques include:

## Use Small Base Images

```dockerfile
FROM node:20-alpine
```

when compatible with the application.

## Use Multi-Stage Builds

Keep build dependencies out of the final runtime image.

## Use `.dockerignore`

Avoid copying:

```text
node_modules
.git
.env
dist
```

## Optimize Layer Caching

Copy dependency files before application source code.

```dockerfile
COPY package*.json ./
RUN npm ci
COPY src ./src
```

## Avoid Unnecessary Packages

Only install dependencies required by the application.

## Use Production Dependencies

For production applications:

```bash
npm ci --omit=dev
```

when appropriate.

---

# 24. Docker Security Best Practices

Important Docker security practices include:

* Do not store secrets inside Dockerfiles
* Do not commit `.env` files
* Use `.dockerignore`
* Use trusted base images
* Scan images for vulnerabilities
* Keep base images updated
* Run containers as non-root users where possible
* Use minimal images
* Avoid unnecessary packages
* Apply least privilege
* Use read-only filesystems where appropriate
* Do not expose unnecessary ports

## Project Security Considerations

The project uses:

```text
.env
```

for local environment configuration and excludes it from Git using:

```text
.env
```

in `.gitignore`.

Secrets should not be hardcoded into production images.

---

# 25. How Would You Scan a Docker Image?

A production CI/CD pipeline can scan images for vulnerabilities before deployment.

Typical tools include:

* Trivy
* Docker Scout
* Grype

Example:

```bash
trivy image my-backend:latest
```

The goal is to identify:

* Critical vulnerabilities
* High-severity vulnerabilities
* Vulnerable operating system packages
* Vulnerable application dependencies

Image scanning should be integrated into CI/CD before images are pushed to a production registry.

---

# 26. What Is the Difference Between Docker and a Virtual Machine?

| Docker Container        | Virtual Machine              |
| ----------------------- | ---------------------------- |
| Shares host kernel      | Has a complete guest OS      |
| Lightweight             | Heavier                      |
| Starts quickly          | Slower startup               |
| Lower resource usage    | Higher resource usage        |
| Process-level isolation | Full OS-level virtualization |

## Simple Architecture

### Virtual Machine

```text
Application
     ↓
Guest OS
     ↓
Hypervisor
     ↓
Host OS
```

### Docker

```text
Application
     ↓
Container
     ↓
Docker Engine
     ↓
Host OS Kernel
```

---

# 27. What Happens When Docker Compose Starts?

When running:

```bash
docker compose up --build
```

Docker Compose:

1. Reads the Compose YAML file.
2. Builds images if required.
3. Creates the required network.
4. Creates or starts containers.
5. Creates or attaches volumes.
6. Starts the services.
7. Connects services to the Docker network.

In this project:

```text
Docker Compose
      │
      ├── Frontend Container
      ├── Backend Container
      └── PostgreSQL Container
```

---

# 28. Two-Minute Project Explanation

## Interview Answer

I developed a containerized application consisting of a React frontend, a Node.js and Express backend, and a PostgreSQL database.

I created separate Docker images for the frontend and backend. The backend runs on Node.js, while the frontend uses a multi-stage Docker build where the React application is built using Node.js and the resulting static files are served using Nginx.

PostgreSQL runs as a separate container and uses a named Docker volume for persistent database storage.

I used Docker Compose to orchestrate the complete application stack. Docker Compose manages the services, networking, environment configuration, port mappings, and database volume.

The backend communicates with PostgreSQL through the Docker Compose network using the PostgreSQL service name rather than `localhost`.

During testing, I encountered a port conflict on port 3000. I used `lsof` to identify an existing Node.js process using the port, resolved the conflict, and successfully started the complete multi-container application.

---

# 29. Key Lessons Learned

From this Docker phase, I learned:

* Docker packages applications into portable containers.
* Images are templates, while containers are running instances.
* Dockerfiles define how images are built.
* Docker Compose manages multi-container applications.
* Containers communicate through Docker networks.
* Docker Compose service names can be used for internal service discovery.
* `localhost` inside a container refers to that container itself.
* Volumes are required for persistent data.
* Multi-stage builds produce cleaner production images.
* Nginx is suitable for serving production React static files.
* Port conflicts must be diagnosed at the host level.
* `.dockerignore` improves build efficiency and prevents unnecessary files from entering the build context.
* Docker security must be considered during image creation and deployment.

---

# 30. Final Docker Interview Checklist

Before an interview, I should be able to explain:

* [ ] What Docker is
* [ ] Image vs container
* [ ] Dockerfile
* [ ] Docker Compose
* [ ] Docker networks
* [ ] Container service discovery
* [ ] `localhost` vs service names
* [ ] Port mapping
* [ ] Docker volumes
* [ ] Multi-stage builds
* [ ] Nginx for React applications
* [ ] Alpine images
* [ ] `.dockerignore`
* [ ] `RUN`, `CMD`, and `ENTRYPOINT`
* [ ] `COPY` vs `ADD`
* [ ] Docker layer caching
* [ ] Image optimization
* [ ] Docker security
* [ ] Image scanning
* [ ] Container troubleshooting
* [ ] Port conflict troubleshooting
* [ ] The Docker architecture of this project
* [ ] The two-minute project explanation
