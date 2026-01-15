# NestJS Passkey Authentication — Password + JWT + WebAuthn (Production-Ready)

This repository demonstrates how to build a **production-ready authentication system** using:

- NestJS
- PostgreSQL
- Docker Compose
- Passport.js (Local + JWT strategies)
- WebAuthn (Passkeys) as second-factor authentication

The project is built as a **two-step authentication model**:

1. Users sign in with **username and password**
2. Users verify with **passkeys (WebAuthn)** to upgrade their JWT and access sensitive routes

This mirrors how passkeys are realistically introduced in real-world systems — **without breaking existing login flows
**.

---

## Medium Article Series

This repository accompanies the following articles:

### Part 1 — Local Authentication with JWT

> Building a production-ready authentication system with NestJS, PostgreSQL, JWT, and Passport.js

Covers:

- Project setup with NestJS and Docker Compose
- PostgreSQL integration with TypeORM
- User entity design
- Password hashing
- Passport Local Strategy
- JWT authentication and route guards

### Part 2 — Adding Passkeys with WebAuthn

> Integrating passkeys (WebAuthn) into an existing NestJS authentication system

Covers:

- Passkey architecture in production systems
- WebAuthn data modeling
- Passkey registration
- Passkey authentication
- JWT upgrade (step-up authentication)
- Cache-based challenge handling

---

## Architecture Overview

```
[ Browser ]
│
├─ Username + Password ──▶ /auth/login
│ └─ JWT (authLevel=password)
│
├─ Passkey Register ─────▶ /passkeys/register/*
│
└─ Passkey Verify ───────▶ /passkeys/authenticate/*
└─ JWT (authLevel=full)
```

## Authorization is enforced using JWT claims and NestJS guards:

- `JwtAuthGuard` → requires login
- `FullAuthGuard` → requires passkey verification

No sessions are used. The system is fully stateless and horizontally scalable.

---

## Tech Stack

Backend:

- NestJS
- TypeORM
- PostgreSQL
- Passport.js
- JWT
- @simplewebauthn/server
- cache-manager (Redis-ready)

Frontend (demo only):

- Plain HTML
- Vanilla JavaScript
- Native WebAuthn APIs

Infrastructure:

- Docker Compose
- PostgreSQL container

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/codetheworld-io/nestjs-auth-passkey.git
cd nestjs-auth-passkey
```

### 2. Install Dependencies

```
npm ci
```

### 3. Environment Variables

Create `.env`:

```
DB_HOST=db
DB_PORT=5432
DB_USER=auth_user
DB_PASSWORD=auth_password
DB_NAME=auth_db
JWT_SECRET=thel@stFlyD0g
RP_NAME="NestJS Passkey Demo"
RP_ID=localhost
RP_ORIGIN=http://localhost:3000
```

> In production, RP_ID must match your domain exactly and HTTPS is required.

### 4. Start Services with Docker

```
docker compose up -d
```

PostgreSQL will be available inside the Docker network as `db`.

### 5. Run Database Migrations

```
docker compose exec api npm run migration:generate
docker compose exec api npm run migration:run
```

### 6. Start the API Server

API will be available at: http://localhost:3000

## Frontend Demo

A very simple frontend is included for demonstration: `public/index.html`

It supports:

- Signup
- Signin
- Passkey registration
- Passkey authentication
- Calling protected routes

To use it: http://localhost:3000

This frontend is intentionally framework-free to clearly show how WebAuthn works with raw browser APIs.

## API Endpoints Overview

### Authentication

| Method | Endpoint     | Description          |
|--------|--------------|----------------------|
| POST   | /auth/signup | Create user account  |
| POST   | /auth/login  | Password login → JWT |

### Passkeys

| Method | Endpoint                       | Description                     |
|--------|--------------------------------|---------------------------------|
| GET    | /passkeys/register/options     | Generate registration challenge |
| POST   | /passkeys/register/verify      | Verify & store credential       |
| GET    | /passkeys/authenticate/options | Generate auth challenge         |
| POST   | /passkeys/authenticate/verify  | Verify & upgrade JWT            |

### Protected Routes

| Guard         | Access Level     |
|---------------|------------------|
| JwtAuthGuard  | Logged-in users  |
| FullAuthGuard | Passkey verified |

---

## Security Design Notes

This project demonstrates:

- Password hashing with bcrypt
- Challenge-based WebAuthn verification
- Signature counter enforcement
- Origin and RP ID validation
- Stateless JWT-based authorization

It does not include:

- Refresh token rotation
- Account recovery flows
- Device management UI
- Brute-force protection

These are intentionally excluded to keep the example focused.

---

## Extending This Project

Recommended next steps:

- Add Redis for distributed cache
- Implement refresh token rotation
- Add passkey device management APIs
- Enforce passkey on sensitive routes only
- Support multiple origins behind proxies

This codebase is structured to support all of the above without architectural changes.

---

## WebAuthn Requirements

Passkeys require:

- HTTPS (except for localhost)
- RP ID matching the domain
- Stable origins (no IP addresses in prod)

If deploying behind Nginx or cloud load balancers, ensure:

- `X-Forwarded-Proto` headers are set
- TLS terminates before NestJS
