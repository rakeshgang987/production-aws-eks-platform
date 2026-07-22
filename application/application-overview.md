# Application Overview

## Purpose

The application is a full-stack product management application created as the workload for the Production AWS EKS Platform project.

The purpose is to create a realistic application that can later be:

- Containerized with Docker
- Managed with Docker Compose
- Deployed to Kubernetes
- Deployed to Amazon EKS
- Managed using Helm
- Delivered using CI/CD
- Managed using GitOps
- Monitored using observability tools
- Used for AI-assisted DevOps troubleshooting

---

## Application Architecture

```text
                    React Frontend
                    localhost:5173
                           |
                           | HTTP API Requests
                           v
                    Node.js Backend
                    localhost:3000
                           |
                           | SQL Queries
                           v
                    PostgreSQL Database
                    localhost:5432
```

---

## Backend Application

The backend is built using:

- Node.js
- Express
- PostgreSQL

The backend source code is located at:

```text
application/backend/
```

The main structure is:

```text
application/backend/
|
+-- src/
|   +-- server.js
|   +-- app.js
|   +-- db.js
|   +-- routes/
|       +-- productRoutes.js
|
+-- package.json
+-- package-lock.json
```

---

## Health Endpoint

The backend provides:

```text
GET /health
```

Example request:

```bash
curl http://localhost:3000/health
```

Example response:

```json
{
  "status": "healthy",
  "service": "backend-api",
  "timestamp": "2026-07-20T15:07:37.871Z"
}
```

The health endpoint will later be used for:

- Docker health checks
- Kubernetes liveness probes
- Kubernetes readiness probes
- Monitoring
- Troubleshooting

---

# Products API

## Get Products

Endpoint:

```text
GET /api/products
```

Example request:

```bash
curl http://localhost:3000/api/products
```

Example response:

```json
[
  {
    "id": 1,
    "name": "Monitor",
    "price": "15000.00"
  },
  {
    "id": 2,
    "name": "laptop",
    "price": "60000.00"
  },
  {
    "id": 3,
    "name": "keyboard",
    "price": "2000.00"
  }
]
```

---

## Create Product

Endpoint:

```text
POST /api/products
```

Example request:

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":60000}'
```

Example response:

```json
{
  "id": 2,
  "name": "Laptop",
  "price": "60000.00"
}
```

The product is stored in PostgreSQL.

---

# Database

The application uses PostgreSQL.

Database configuration:

```text
Database Engine: PostgreSQL 16
Database Name: products_db
Database User: app_user
Database Port: 5432
```

The main table is:

```text
products
```

Table structure:

```text
id      SERIAL PRIMARY KEY
name    VARCHAR(255) NOT NULL
price   NUMERIC(10,2) NOT NULL
```

The application successfully performs the following flow:

```text
React Frontend
        |
        v
Node.js API
        |
        v
PostgreSQL
        |
        v
Products Table
```

---

# Frontend Application

The frontend is built using:

- React
- Vite
- JavaScript

The frontend source code is located at:

```text
application/frontend/
```

The frontend provides:

- Product listing
- Product creation form
- API communication with the backend

The frontend runs on:

```text
http://localhost:5173
```

The backend runs on:

```text
http://localhost:3000
```

---

# Frontend-to-Backend Communication

The frontend communicates with the backend using HTTP requests.

## Get Products

```text
Frontend
    |
    | GET /api/products
    v
Backend
    |
    v
PostgreSQL
```

## Create Product

```text
Frontend
    |
    | POST /api/products
    v
Backend
    |
    | INSERT INTO products
    v
PostgreSQL
```

After the product is stored, the frontend fetches the updated product list.

---

# Complete Application Flow

```text
User
 |
 v
React Frontend
 |
 | HTTP Request
 v
Express Backend
 |
 | SQL Query
 v
PostgreSQL
 |
 | Database Response
 v
Express Backend
 |
 | JSON Response
 v
React Frontend
 |
 v
User
```

---

# Application Phase Status

The Application Phase is complete.

- [x] Backend API foundation
- [x] GET /health
- [x] GET /api/products
- [x] POST /api/products
- [x] PostgreSQL integration
- [x] Frontend application
- [x] Frontend connected to backend
- [x] CORS configured

---

# Application Phase Completion

The application is now ready for the next stage:

```text
Application
     |
     v
Containerization
     |
     v
Docker
     |
     v
Docker Compose
     |
     v
AWS Infrastructure
     |
     v
Kubernetes
     |
     v
Amazon EKS
```

The next phase is:

## Phase 2 — Containerization

Planned components:

- Backend Dockerfile
- Frontend Dockerfile
- PostgreSQL container
- Docker Compose
- Local multi-container testing
- Container security review