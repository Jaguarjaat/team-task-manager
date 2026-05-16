# Team Task Manager

A minimal deployable team task manager with React frontend and Express backend.

## What this project includes

- Responsive React UI with a simple, clean layout
- Shared login/signup page for admin and member users
- Role-based admin and member behavior in the project dashboard
- Project creation, member invites, tasks, status updates, and dashboard metrics
- Single deployable Node service for production
- Railway-ready configuration included

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Edit `.env` and set values:

```text
DATABASE_URL=postgresql://user:password@localhost:5432/team_task_manager
JWT_SECRET=your-long-random-secret
PORT=8080
```

4. Start development mode:

```bash
npm run dev
```

5. Build and run production locally:

```bash
npm run build
npm start
```

Then open `http://localhost:8080`.

## Deployment

1. Push the repository to your host or deploy service.
2. Add a PostgreSQL database connection.
3. Set environment variables:

```text
DATABASE_URL=<postgres-connection-string>
JWT_SECRET=<long-random-secret>
NODE_ENV=production
```

4. Build and start the app with:

```bash
npm install && npm run build
npm start
```

## Key notes

- In production, Express serves the React app from `dist/` and handles all `/api` requests.
- If `DATABASE_URL` is not set locally, the app falls back to an in-memory database for development only.
- Admin and member users use the same login screen; project membership determines admin access.

## Scripts

- `npm run dev` — development mode with Vite and backend
- `npm run build` — build frontend for production
- `npm start` — run the production server
- `npm run check` — build verification

## Environment variables

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — secret key for JWT tokens
- `PORT` — optional server port, default `8080`
- `NODE_ENV` — set to `production` on deploy

## Demo Flow

Use this flow to verify the application manually:

1. Signup as a System Admin user:

   ```text
   Name: Jagveer Singh
   Email: admin@test.com
   Password: password123
   Account Type: System Admin
   Admin Key: Admin123
   ```

2. Create a project:

   ```text
   Project name: Website Launch
   Description: Launch planning and delivery tasks
   ```

3. Logout and signup as a member user:

   ```text
   Name: Jagveer Singh
   Email: member@test.com
   Password: password123
   Account Type: Member
   ```

4. Login again as the admin user.
5. Open the project and add `member@test.com` as a project member.
6. Create a task:

   ```text
   Title: Finalize homepage
   Description: Review responsive layout and update final homepage copy
   Due date: Tomorrow's date
   Priority: High
   Assigned to: Member User
   ```

7. Login as the member user and update the task status from `To Do` to `In Progress`, then `Done`.
8. Login again as admin and confirm the dashboard metrics update.

## Role-Based Access

Admin users can manage project members, create tasks, assign tasks, delete tasks, and update all project tasks.

Member users can view assigned projects and update the status of tasks assigned to them.

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects/:id/members`
- `DELETE /api/projects/:id/members/:userId`
- `GET /api/projects/:id/tasks`
- `POST /api/projects/:id/tasks`
- `PATCH /api/projects/:id/tasks/:taskId`
- `DELETE /api/projects/:id/tasks/:taskId`
- `GET /api/dashboard`
