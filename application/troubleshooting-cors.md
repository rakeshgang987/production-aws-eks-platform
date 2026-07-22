# Troubleshooting: CORS Issue

## Problem

The backend API was working correctly when tested from the terminal using `curl`.

For example:

```bash
curl http://localhost:3000/api/products
```

The API returned the expected product data.

However, when the React frontend tried to communicate with the backend through the browser, the request did not work correctly.

---

## Application Setup

The frontend was running on:

```text
http://localhost:5173
```

The backend was running on:

```text
http://localhost:3000
```

The frontend was trying to communicate with:

```text
http://localhost:3000/api/products
```

The basic communication flow was:

```text
React Frontend
localhost:5173
        |
        | HTTP Request
        v
Node.js Backend
localhost:3000
```

---

## Initial Symptoms

The backend API worked correctly from the terminal:

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
  }
]
```

However, the frontend browser application could not successfully perform the same API request.

This created a confusing situation:

```text
curl request      → Works
Browser request   → Fails
```

---

# Why Did `curl` Work?

The terminal request looked like this:

```text
Terminal
    |
    | HTTP Request
    v
Backend API
```

`curl` directly sends the request to the backend.

It does not enforce the browser's same-origin security policy in the same way that a web browser does.

Therefore, the API itself was working correctly.

This helped confirm that:

```text
Backend API       → Working
PostgreSQL        → Working
API Route         → Working
```

The problem was specifically related to communication from the browser frontend.

---

# What Is CORS?

CORS stands for:

```text
Cross-Origin Resource Sharing
```

Browsers use security rules to control requests between different origins.

In this application, the frontend and backend were running on different ports:

```text
Frontend:
http://localhost:5173
```

```text
Backend:
http://localhost:3000
```

Although both use `localhost`, the ports are different:

```text
5173 != 3000
```

Therefore, the browser treats them as different origins.

The request was:

```text
Frontend
http://localhost:5173
        |
        | Request to another origin
        v
Backend
http://localhost:3000
```

The browser required the backend to explicitly allow the frontend origin.

---

# Root Cause

The root cause was:

```text
Frontend and backend were running on different origins
                    |
                    v
Browser detected a cross-origin request
                    |
                    v
CORS permission was not configured
                    |
                    v
Browser blocked the request
```

The following components were working correctly:

```text
Backend API       ✓
PostgreSQL        ✓
Database Queries  ✓
API Routes        ✓
```

The problem was:

```text
Browser Cross-Origin Security
```

---

# Troubleshooting Process

## Step 1: Test the API Directly

The backend was tested using:

```bash
curl http://localhost:3000/api/products
```

The API returned data successfully.

This confirmed that the backend was running.

---

## Step 2: Test the API from the Browser Application

The React frontend attempted to request:

```text
http://localhost:3000/api/products
```

The request did not work correctly from the browser.

This indicated that the issue was not necessarily with the API itself.

---

## Step 3: Compare the Request Sources

The two request sources were:

```text
curl
  |
  v
Backend API
```

and:

```text
Browser Frontend
  |
  v
Backend API
```

Since the terminal request worked but the browser request failed, the browser's cross-origin security policy became a likely cause.

---

# Solution

The Express CORS middleware was installed in the backend application.

From the backend directory:

```bash
npm install cors
```

The CORS package was then imported:

```javascript
const cors = require("cors");
```

The middleware was added to the Express application:

```javascript
app.use(cors());
```

The relevant backend configuration became:

```javascript
const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/products", productRoutes);
```

---

# Result After the Fix

After enabling CORS:

```text
React Frontend
localhost:5173
        |
        | Allowed Cross-Origin Request
        v
Node.js Backend
localhost:3000
        |
        | SQL Query
        v
PostgreSQL
```

The frontend was then able to:

- Load products
- Create products
- Communicate with the backend API
- Receive API responses
- Refresh the product list

The final application flow worked successfully:

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
```

---

# Development CORS Configuration

The following configuration allows cross-origin requests:

```javascript
app.use(cors());
```

This is convenient for local development where the frontend and backend run on different ports:

```text
Frontend:
localhost:5173

Backend:
localhost:3000
```

---

# More Restricted CORS Configuration

Instead of allowing all origins, the backend can allow only the known frontend:

```javascript
app.use(cors({
  origin: "http://localhost:5173"
}));
```

This means:

```text
http://localhost:5173  → Allowed
Other origins          → Not allowed
```

This provides more control over which applications can communicate with the backend.

---

# Production Considerations

In a production environment, the frontend and backend can be placed behind a reverse proxy or Kubernetes Ingress.

Example:

```text
                         User
                           |
                           v
                    Nginx / Ingress
                           |
              +------------+------------+
              |                         |
              v                         v
        Frontend Service          Backend Service
              |                         |
              |                         v
              |                    PostgreSQL
              |
              v
           React App
```

The application could use:

```text
https://myapp.com/
```

for the frontend and:

```text
https://myapp.com/api/products
```

for the backend API.

This architecture can reduce cross-origin complexity because requests are routed through a common domain.

In the future, this approach will become relevant when the application is deployed to:

- Kubernetes
- Amazon EKS
- Kubernetes Ingress
- A production reverse proxy

---

# Troubleshooting Summary

## Symptom

```text
curl API request       → Working
Browser API request    → Not working
```

## Investigation

```text
Backend API            → Working
PostgreSQL             → Working
API Route              → Working
Browser Request        → Blocked
```

## Root Cause

```text
CORS configuration was missing.
```

## Solution

```javascript
const cors = require("cors");

app.use(cors());
```

## Result

```text
Frontend successfully communicates with backend.
```

---

# Lessons Learned

This issue demonstrated several important DevOps and application troubleshooting concepts:

1. Always test an API independently using tools such as `curl`.
2. A browser failure does not necessarily mean the backend API is broken.
3. Frontend and backend ports can create different origins.
4. Browsers enforce cross-origin security policies.
5. CORS must be configured when frontend and backend communicate across origins.
6. Backend middleware can control cross-origin access.
7. Restricting allowed origins is more controlled than allowing every origin.
8. Reverse proxies and Kubernetes Ingress can simplify production traffic routing.
9. Troubleshooting should isolate each component independently.

---

# Final Status

The CORS issue was successfully resolved.

```text
Frontend
   |
   | CORS-enabled API communication
   v
Backend
   |
   v
PostgreSQL
```

The application is now ready to move to the next phase:

```text
Application
     |
     v
Containerization
     |
     v
Docker
```