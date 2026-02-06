# Temp Ops — Backend API

Enterprise-grade REST API powering the Temp Ops project-management platform.  
Built with **Express.js**, **Prisma ORM**, and **PostgreSQL** (Neon Serverless).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Database & Prisma](#database--prisma)
6. [API Endpoints](#api-endpoints)
7. [Authentication & RBAC](#authentication--rbac)
8. [Architecture Patterns](#architecture-patterns)
9. [Error Handling](#error-handling)
10. [Seeding the Database](#seeding-the-database)
11. [Available Scripts](#available-scripts)

---

## Tech Stack

| Layer          | Technology                           |
| -------------- | ------------------------------------ |
| Runtime        | Node.js + TypeScript                 |
| Framework      | Express.js 4                         |
| ORM            | Prisma Client 7 with `@prisma/adapter-pg` |
| Database       | PostgreSQL (Neon Serverless)         |
| Auth           | JWT (`jsonwebtoken`) + bcrypt        |
| Validation     | Zod                                  |
| Documentation  | Swagger / OpenAPI 3.0 (`swagger-jsdoc`) |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema (models, enums, relations)
│   └── seed.ts             # Seed script (71 users, 50 projects, 2 500 tasks)
├── scripts/
│   └── count_data.ts       # Utility: count rows in each table
├── src/
│   ├── index.ts            # Express app entry point
│   ├── config/
│   │   ├── database.ts     # Singleton PrismaClient with PG adapter
│   │   ├── env.ts          # Zod-validated environment config
│   │   └── swagger.ts      # OpenAPI specification
│   ├── controllers/        # HTTP layer (thin — delegates to services)
│   │   ├── auth.controller.ts
│   │   ├── project.controller.ts
│   │   ├── task.controller.ts
│   │   └── user.controller.ts
│   ├── services/           # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── project.service.ts
│   │   ├── task.service.ts
│   │   └── analytics.service.ts
│   ├── repositories/       # Data access layer (Prisma queries)
│   │   ├── user.repository.ts
│   │   ├── project.repository.ts
│   │   ├── task.repository.ts
│   │   └── audit.repository.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT auth + RBAC guards
│   │   ├── task.middleware.ts      # Task-level access control
│   │   ├── validate.middleware.ts  # Zod body/query validation
│   │   └── errorMiddleware.ts      # Global error handler
│   ├── routes/             # Express routers with Swagger JSDoc
│   │   ├── auth.routes.ts
│   │   ├── project.routes.ts
│   │   ├── task.routes.ts
│   │   └── user.routes.ts
│   └── utils/
│       ├── AppError.ts     # Custom error class with factory methods
│       ├── catchAsync.ts   # Async error wrapper
│       └── errorCodes.ts   # Centralized error code constants
├── .env.example            # Template for environment variables
├── nodemon.json            # Dev server config (ts-node)
├── prisma.config.ts        # Prisma CLI config (datasource URL)
├── tsconfig.json           # TypeScript config
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **PostgreSQL** database (Neon, Supabase, local, or Docker)

### Installation

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Copy environment template and fill in your values
cp .env.example .env

# 3. Generate the Prisma Client
npm run prisma:generate

# 4. Push the schema to your database (creates tables)
npm run prisma:push

# 5. (Optional) Seed the database with sample data
npm run seed

# 6. Start the dev server
npm run dev
```

The API will be available at `http://localhost:3000/api`  
Swagger docs at `http://localhost:3000/api-docs`  
Health check at `http://localhost:3000/health`

---

## Environment Variables

| Variable       | Required | Default       | Description                                |
| -------------- | -------- | ------------- | ------------------------------------------ |
| `DATABASE_URL` | ✅        | —             | PostgreSQL connection string (pooled)       |
| `DIRECT_URL`   | ✅        | —             | Direct connection URL (for migrations)      |
| `JWT_SECRET`   | ✅        | —             | Secret key for signing JWT tokens (min 10 chars) |
| `JWT_EXPIRES_IN` | ❌     | `7d`          | Token expiration duration                  |
| `PORT`         | ❌        | `3000`        | Server port                                |
| `NODE_ENV`     | ❌        | `development` | `development` / `production` / `test`      |

See [`.env.example`](.env.example) for a ready-to-copy template.

---

## Database & Prisma

### Schema Overview

| Model            | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `User`           | Authentication, global role (ADMIN/MEMBER/VIEWER) |
| `Project`        | Container for tasks                       |
| `ProjectMember`  | Many-to-many join with per-project role   |
| `Task`           | Work items with status, priority, due date |
| `AuditLog`       | Immutable event log for all entity changes |

### Key Commands

```bash
npx prisma generate          # Generate client after schema changes
npx prisma db push           # Push schema to database (no migrations)
npx prisma studio            # Visual database browser
```

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Path              | Auth     | Description                  |
| ------ | ----------------- | -------- | ---------------------------- |
| POST   | `/auth/login`     | Public   | Login, returns JWT token     |
| POST   | `/auth/register`  | JWT      | Register new user            |
| GET    | `/auth/me`        | JWT      | Get current user profile     |

### Projects (`/api/projects`)

| Method | Path                                 | Auth       | Description                  |
| ------ | ------------------------------------ | ---------- | ---------------------------- |
| GET    | `/projects`                          | JWT        | List user's projects (paginated) |
| POST   | `/projects`                          | Admin only | Create project               |
| GET    | `/projects/:id`                      | Member     | Get project detail           |
| PUT    | `/projects/:id`                      | Admin only | Update project               |
| DELETE | `/projects/:id`                      | Admin only | Delete project               |
| POST   | `/projects/:id/members`              | Admin only | Add member to project        |
| PATCH  | `/projects/:id/members/:memberId`    | Admin only | Change member role           |
| DELETE | `/projects/:id/members/:memberId`    | Admin only | Remove member                |
| GET    | `/projects/:id/history`              | Member     | Audit log for project        |
| GET    | `/projects/:id/analytics`            | Member     | Project analytics dashboard  |

### Tasks (`/api/...`)

| Method | Path                                          | Auth           | Description            |
| ------ | --------------------------------------------- | -------------- | ---------------------- |
| GET    | `/projects/:projectId/tasks`                  | Project access | List tasks (filtered)  |
| POST   | `/projects/:projectId/tasks`                  | Write access   | Create task            |
| GET    | `/tasks/:id`                                  | Task access    | Get task detail        |
| PATCH  | `/tasks/:id`                                  | Write access   | Update task            |
| DELETE | `/tasks/:id`                                  | Write access   | Delete task            |
| GET    | `/tasks/:id/history`                          | Task access    | Audit log for task     |

### Users (`/api/users`)

| Method | Path          | Auth       | Description              |
| ------ | ------------- | ---------- | ------------------------ |
| GET    | `/users`      | Admin only | List all users (paginated, searchable) |
| GET    | `/users/:id`  | JWT        | Get user by ID           |
| PUT    | `/users/:id`  | Admin only | Update user name/role    |
| DELETE | `/users/:id`  | Admin only | Delete user              |

> Full interactive docs available at `/api-docs` (Swagger UI).

---

## Authentication & RBAC

### Global Roles

| Role     | Description                                                    |
| -------- | -------------------------------------------------------------- |
| `ADMIN`  | Full system access — manage users, projects, all tasks         |
| `MEMBER` | Can manage tasks in assigned projects only                     |
| `VIEWER` | Read-only access to assigned projects — **cannot be assigned tasks** |

### Project Roles

| Role     | Scope                                       |
| -------- | ------------------------------------------- |
| `MEMBER` | Read + write tasks within the project       |
| `VIEWER` | Read-only within the project                |

### Middleware Chain

```
Request → authenticate → requireRole/requireProjectAccess → validate → controller
```

- **`authenticate`** — Verifies JWT, attaches `req.user`
- **`requireRole(...roles)`** — Checks global role
- **`requireProjectAccess(roles?)`** — Checks project membership & role
- **`requireTaskReadAccess` / `requireTaskWriteAccess`** — Task-level guards
- **`validate(schema)`** — Zod body validation

---

## Architecture Patterns

The codebase follows a **layered architecture** inspired by Spring Boot:

```
Routes → Controllers → Services → Repositories → Prisma/DB
```

| Layer        | Responsibility                                                  |
| ------------ | --------------------------------------------------------------- |
| **Routes**   | HTTP method + path binding, middleware chain, Swagger JSDoc     |
| **Controllers** | Parse request, call service, format response                 |
| **Services** | Business rules, transactions, audit logging, validation         |
| **Repositories** | Raw data access queries via Prisma                          |

### Key Design Decisions

- **Transactional audit logging** — Every write operation logs an audit entry in the same database transaction
- **Diff-based UPDATE audits** — Only changed fields are recorded, not full snapshots
- **Singleton PrismaClient** — Prevents connection pool exhaustion during development hot-reloads
- **Zod-validated env** — Server refuses to start with missing/invalid configuration
- **Database-level analytics** — All aggregations run in PostgreSQL, not in JS memory

---

## Error Handling

All errors flow through a global error handler (`errorMiddleware.ts`):

- **`AppError`** — Operational errors with status code, error code, and optional metadata
- **`ZodError`** — Validation failures return structured field-level messages
- **Unknown errors** — Masked in production, full stack trace in development

Error codes follow the pattern `ERR_{DOMAIN}_{CODE}` (e.g., `ERR_AUTH_001`, `ERR_TASK_003`).

---

## Seeding the Database

The seed script creates a realistic dataset:

- **1 Admin** — `admin@tempops.com` / `password123`
- **50 Members** — Realistic names, e.g., `james.smith@tempops.com`
- **20 Viewers** — Read-only users
- **50 Projects** — Enterprise project names
- **2,500 Tasks** — 50 per project with varied statuses, priorities, and dates

```bash
npm run seed
```

---

## Available Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start dev server with hot-reload (nodemon + ts-node) |
| `npm run build`     | Compile TypeScript to `dist/`            |
| `npm start`         | Run compiled `dist/index.js`             |
| `npm run prisma:generate` | Generate Prisma Client            |
| `npm run prisma:push`     | Push schema to database             |
| `npm run seed`      | Seed database with sample data           |
