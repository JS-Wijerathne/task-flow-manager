# Temp Ops — Frontend

Single-page application for the Temp Ops project-management platform.  
Built with **React 18**, **TypeScript**, **TailwindCSS**, and **Vite**.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Feature Modules](#feature-modules)
5. [Routing](#routing)
6. [State Management](#state-management)
7. [API Layer](#api-layer)
8. [Permission System](#permission-system)
9. [Shared Components](#shared-components)
10. [Available Scripts](#available-scripts)

---

## Tech Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Framework        | React 18 + TypeScript                            |
| Build Tool       | Vite 5                                           |
| Styling          | TailwindCSS 3                                    |
| Routing          | React Router DOM 6                               |
| Server State     | TanStack React Query 5                           |
| Forms            | React Hook Form + Zod (`@hookform/resolvers`)    |
| Client State     | Zustand (persisted auth store)                   |
| Charts           | Recharts 3                                       |
| Icons            | Lucide React                                     |
| Shared Types     | `@temp-ops/shared` (local package)               |

---

## Project Structure

```
frontend/src/
├── api/                        # Axios API client & endpoint functions
│   ├── client.ts               # Axios instance with auth interceptor
│   ├── authApi.ts              # Login / register / me
│   ├── projectsApi.ts          # Project CRUD + members
│   ├── tasksApi.ts             # Task CRUD
│   ├── usersApi.ts             # User management (admin)
│   ├── analyticsApi.ts         # Project analytics
│   └── auditApi.ts             # Audit log history
│
├── features/                   # Feature-based modules
│   ├── analytics/
│   │   └── hooks/useAnalytics.ts
│   ├── audit/
│   │   ├── components/HistoryPanel.tsx
│   │   └── hooks/useAudit.ts
│   ├── auth/
│   │   ├── components/LoginForm.tsx, ProtectedRoute.tsx
│   │   └── pages/LoginPage.tsx
│   ├── projects/
│   │   ├── ProjectsList.tsx              # Projects listing page
│   │   ├── ProjectDashboard.tsx          # Single project dashboard
│   │   ├── components/
│   │   │   ├── CreateProjectModal.tsx
│   │   │   ├── EditProjectModal.tsx
│   │   │   ├── AddMemberModal.tsx
│   │   │   └── AnalyticsPanel.tsx
│   │   │   └── analytics/               # Chart components
│   │   └── hooks/useProjects.ts
│   ├── tasks/
│   │   ├── TaskBoard.tsx                 # Kanban-style task board
│   │   ├── TaskDetailPage.tsx            # Full task detail view
│   │   ├── components/
│   │   │   ├── CreateTaskModal.tsx
│   │   │   ├── EditTaskModal.tsx
│   │   │   ├── TaskDetailPanel.tsx
│   │   │   └── TaskHistory.tsx
│   │   └── hooks/useTasks.ts
│   └── users/
│       ├── pages/MembersListPage.tsx     # Admin user management
│       ├── components/
│       │   ├── CreateUserModal.tsx
│       │   └── EditUserModal.tsx
│       └── hooks/useUsers.ts
│
├── layouts/
│   └── DashboardLayout.tsx     # Sidebar + content wrapper (Outlet)
│
├── shared/
│   ├── components/             # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── DataTable.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ToastContainer.tsx
│   └── hooks/
│       └── usePermissions.ts   # Global + project-level RBAC hooks
│
├── stores/
│   ├── authStore.ts            # Zustand auth state (persisted)
│   └── toastStore.ts           # Toast notification state
│
├── types/
│   └── index.ts                # Local type definitions
│
├── lib/
│   └── utils.ts                # cn() — TailwindCSS class merge utility
│
├── App.tsx                     # Root component with router
├── main.tsx                    # React entry point + QueryClient setup
└── index.css                   # Tailwind directives
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Backend API** running at `http://localhost:3000` (see [backend README](../backend/README.md))
- The **shared** package must be built first (see [shared README](../shared/README.md))

### Installation

```bash
# 1. Build the shared package first (if not already built)
cd ../shared && npm install && npm run build

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.  
The Vite dev server proxies `/api` requests to the backend at `http://localhost:3000`.

---

## Feature Modules

Each feature follows a consistent internal structure:

```
features/<name>/
├── pages/              # Route-level page components
├── components/         # Feature-specific UI components
└── hooks/              # React Query hooks for data fetching
```

### Auth
- **LoginForm** — Email/password login with validation
- **ProtectedRoute** — Redirect to `/login` if unauthenticated
- JWT token stored in Zustand (persisted to `localStorage`)

### Projects
- **ProjectsList** — Paginated project cards, create button (admin only)
- **ProjectDashboard** — Task board + analytics + member management + history
- **Modals** — Create, edit project, add/manage members

### Tasks
- **TaskBoard** — Kanban columns (TODO / IN_PROGRESS / DONE) with filtering
- **TaskDetailPage** — Full detail view with edit, history, and status changes
- **Modals** — Create/edit task with assignee selection (respects RBAC)

### Users (Admin only)
- **MembersListPage** — Searchable/sortable user table with pagination
- **Modals** — Create user (with role selection), edit user name/role

### Analytics
- **TaskStatusChart** — Pie/bar chart of task distribution
- **CompletionTimeChart** — Time-to-complete histogram
- **OverdueTasksList** — Top overdue tasks with assignee info

### Audit
- **HistoryPanel** — Paginated audit log with diff rendering
- **TaskHistory** — Task-specific change history

---

## Routing

| Path                                      | Component          | Access        |
| ----------------------------------------- | ------------------ | ------------- |
| `/login`                                  | LoginPage          | Public        |
| `/projects`                               | ProjectsList       | Authenticated |
| `/projects/:projectId`                    | ProjectDashboard   | Project member |
| `/projects/:projectId/tasks/:taskId`      | TaskDetailPage     | Project member |
| `/members`                                | MembersListPage    | Admin only    |

All authenticated routes are wrapped in `<ProtectedRoute>` and use `<DashboardLayout>` with a sidebar.

---

## State Management

### Server State — TanStack React Query

All API data is managed through React Query hooks:

- `useProjects()` — CRUD operations for projects
- `useTasks(projectId)` — CRUD operations for tasks
- `useUsers()` — User management operations
- `useAnalytics(projectId)` — Analytics data fetching
- `useAudit(entityType, entityId)` — Audit log fetching

Query keys are structured to enable automatic cache invalidation on mutations.

### Client State — Zustand

- **`authStore`** — User, token, login/logout actions (persisted to `localStorage`)
- **`toastStore`** — Toast queue with auto-dismiss

---

## API Layer

All API calls go through a central Axios instance ([`src/api/client.ts`](src/api/client.ts)):

- **Request interceptor** — Automatically attaches `Bearer {token}` header
- **Response interceptor** — Handles 401 (auto-logout), 500 (error toast), and API error messages
- **Base URL** — `/api` (proxied to backend by Vite in development)

---

## Permission System

The [`usePermissions`](src/shared/hooks/usePermissions.ts) and `useProjectPermissions` hooks mirror the backend RBAC:

### Global Permissions (`usePermissions`)
- `isAdmin` / `isMember` / `isViewer` — Role checks
- `canAccessAdminFeatures` — Controls sidebar items and admin pages
- `canViewMembersList` — Admin-only members page

### Project Permissions (`useProjectPermissions`)
- `canWrite` / `isReadOnly` — Based on project membership role
- `canCreateTask` / `canUpdateTask` / `canDeleteTask` — Write-access checks
- `canAddMembers` / `canRemoveMembers` — Admin-only member management
- `canEditProject` / `canDeleteProject` — Admin-only project settings

### Assignment Guard
- `canBeAssignedTask(userId, members)` — Prevents assigning tasks to VIEWERs

---

## Shared Components

| Component       | Description                                     |
| --------------- | ----------------------------------------------- |
| `Button`        | Styled button with variants (primary, secondary, danger, ghost) and sizes |
| `Input`         | Form input with label, error message, and icon support |
| `Modal`         | Overlay dialog with title, content, and close handler |
| `DataTable`     | Sortable table with column definitions and row rendering |
| `ToastContainer`| Fixed-position toast notification stack          |

---

## Available Scripts

| Script           | Description                                  |
| ---------------- | -------------------------------------------- |
| `npm run dev`    | Start Vite dev server at `http://localhost:5173` |
| `npm run build`  | Type-check + production build to `dist/`     |
| `npm run preview`| Preview production build locally             |
| `npm run lint`   | ESLint check                                 |
