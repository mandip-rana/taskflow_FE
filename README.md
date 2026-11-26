# TaskFlow

TaskFlow is a full-stack task management dashboard built for the MERN Stack Developer assessment. It provides a Kanban workflow for creating and managing tasks, with priorities, due dates, checklists, search, filters, sorting, and date-scoped dashboard statistics.

The frontend and backend are separate applications with their own dependencies and can be installed and run independently.

## Technology stack

| Area     | Technologies                                               |
| -------- | ---------------------------------------------------------- |
| Frontend | React, Vite, TypeScript, Tailwind CSS, Axios, Lucide React |
| Backend  | Node.js, Express 5, Mongoose, Zod                          |
| Database | MongoDB                                                    |

## Features

- Four-column board: To Do, In Progress, Completed, and Cancelled. Dragging a task to another column updates its status.
- Create, view, edit, and delete tasks; task deletion requires confirmation.
- Set task priority and due date, and manage task checklist items. Checklist progress is tracked separately from the task's Kanban status, and cards show completed versus total items.
- Search, filter by status or priority, and sort tasks.
- Dashboard KPI cards and date ranges for the overall, year-to-date, month-to-date, and custom periods.
- MongoDB-backed task identifiers displayed as `TK-000001`, `TK-000002`, and so on.
- Responsive layout with loading, empty, error, and form-validation states.

## Current Scope

TaskFlow currently provides a shared task workspace without authentication,
user accounts, or task assignment.

The application supports task CRUD operations, a four-column Kanban board,
priority and due-date management, checklists, search, filtering, sorting,
and dashboard statistics.

User-specific task views, administrator controls, real-time notifications,
multi-user activity tracking, and file attachments are planned enhancements
and are not part of the current implementation.

## Project structure

```text
TaskFlow/
├── README.md
├── ASSESSMENT_NOTES.md
├── task-flow-backend/
│   ├── scripts/                  # One-time task-number backfill
│   ├── src/
│   │   ├── config/               # Environment and MongoDB setup
│   │   ├── middleware/           # Validation, errors, rate limiting
│   │   ├── modules/tasks/         # Task model, validation, service, routes
│   │   ├── routes/                # API and health routes
│   │   └── shared/                # Constants and API helpers
│   └── tests/
└── task-flow-frontend/
    ├── src/
    │   ├── components/            # Shared modal and layout
    │   ├── features/tasks/        # Task UI, hook, API service, and types
    │   ├── services/              # Centralized Axios client
    │   ├── styles/
    │   └── App.tsx
    └── vite.config.ts
```

## Prerequisites

- Node.js `20.19+` or `22.12+`
- npm
- MongoDB running locally, or a MongoDB connection URI

## Backend setup

In PowerShell:

```powershell
Set-Location task-flow-backend
npm install
Copy-Item .env.example .env
```

Edit `task-flow-backend/.env` and set `MONGODB_URI` to your local MongoDB or Atlas URI. Then start the API:

```powershell
npm run dev
```

The API listens on `http://localhost:5000` by default. Check `http://localhost:5000/api/v1/health` for service and database status.

For an existing database whose tasks do not yet have task numbers, stop the API, run `npm run migrate:task-ids` from the backend folder, and restart the API. The migration requires the same `MONGODB_URI` used by the application.

## Frontend setup

In a separate terminal:

```powershell
Set-Location task-flow-frontend
npm install
Copy-Item  .env
npm run dev
```

Open the Vite URL shown in the terminal (by default `http://localhost:5173`). If the API uses a different address, set `VITE_API_BASE_URL` in `task-flow-frontend/.env` to its `/api/v1` base URL.

### Run scripts

| App      | Command                    | Purpose                                  |
| -------- | -------------------------- | ---------------------------------------- |
| Backend  | `npm run dev`              | Start the API with Nodemon               |
| Backend  | `npm start`                | Start the API with Node                  |
| Backend  | `npm test`                 | Run backend tests                        |
| Backend  | `npm run migrate:task-ids` | Backfill task numbers                    |
| Frontend | `npm run dev`              | Start the Vite development server        |
| Frontend | `npm run typecheck`        | Run TypeScript checks                    |
| Frontend | `npm run build`            | Type-check and create a production build |
| Frontend | `npm run preview`          | Preview the production build             |

There is no dedicated lint script configured in either application.

## Environment variables

Backend variables are read from `task-flow-backend/.env`:

| Variable               | Purpose                                     | Default                                                             |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `NODE_ENV`             | Runtime environment                         | `development`                                                       |
| `PORT`                 | API listening port                          | `5000`                                                              |
| `MONGODB_URI`          | MongoDB connection string                   | Local `taskflow` database in `.env.example`; required in production |
| `CORS_ORIGIN`          | Allowed frontend origin(s), comma-separated | `http://localhost:5173`                                             |
| `TRUST_PROXY`          | Trusted proxy hop count                     | `0`                                                                 |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window in milliseconds           | `900000`                                                            |
| `RATE_LIMIT_MAX`       | Maximum requests per window                 | `100`                                                               |
| `SHUTDOWN_TIMEOUT_MS`  | Graceful shutdown timeout in milliseconds   | `10000`                                                             |

Frontend variables are read from `task-flow-frontend/.env`:

| Variable            | Purpose                                   | Default                        |
| ------------------- | ----------------------------------------- | ------------------------------ |
| `VITE_API_BASE_URL` | Backend API base URL, including `/api/v1` | `http://localhost:5000/api/v1` |

Backend tests use `MONGODB_TEST_URI` when set; otherwise, they connect to `mongodb://127.0.0.1:27017/taskflow_test`. The test suite drops that test database after running. Use a dedicated test database only—never point `MONGODB_TEST_URI` at a development or production database.

## API overview

Base URL: `http://localhost:5000/api/v1`

| Method   | Endpoint                       | Purpose                                                              |
| -------- | ------------------------------ | -------------------------------------------------------------------- |
| `GET`    | `/health`                      | Report API and database health                                       |
| `GET`    | `/tasks`                       | List tasks with pagination, search, filters, sorting, and date range |
| `GET`    | `/tasks/stats`                 | Return dashboard statistics for an optional date range               |
| `POST`   | `/tasks`                       | Create a task, optionally including checklist items                  |
| `GET`    | `/tasks/:id`                   | Get a task                                                           |
| `PATCH`  | `/tasks/:id`                   | Edit task fields                                                     |
| `PATCH`  | `/tasks/:id/status`            | Change task status                                                   |
| `DELETE` | `/tasks/:id`                   | Delete a task                                                        |
| `POST`   | `/tasks/:id/checklist`         | Add a checklist item                                                 |
| `PATCH`  | `/tasks/:id/checklist/:itemId` | Edit or complete a checklist item                                    |
| `DELETE` | `/tasks/:id/checklist/:itemId` | Delete a checklist item                                              |

Task statuses are `todo`, `in_progress`, `completed`, and `cancelled`; priorities are `low`, `medium`, `high`, and `critical`. List and statistics date ranges filter by task creation date. API responses use a consistent success/data or success/errors JSON envelope.

## Validation and tests

Frontend:

```powershell
Set-Location task-flow-frontend
npm run typecheck
npm run build
```

Backend tests require MongoDB and use the isolated test database described above:

```powershell
Set-Location task-flow-backend
npm test
```

The backend tests include API integration coverage and validation tests. The test database is dropped by the suite after it finishes.
