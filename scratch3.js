import { newDb } from "pg-mem";

async function test() {
  const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
  const memoryPg = memoryDb.adapters.createPg();
  const pool = new memoryPg.Pool();

  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      global_role TEXT NOT NULL DEFAULT 'Member' CHECK (global_role IN ('System Admin', 'Member')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE project_members (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'Member')),
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (project_id, user_id)
    );
    CREATE TABLE tasks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_date DATE,
      priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
      status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Done')),
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query("INSERT INTO users (name, email, password_hash, global_role) VALUES ('Member', 'm@m.com', 'hash', 'Member')");
  
  const req = { user: { id: 1, global_role: 'Member' } };

  try {
    const { rows } = await pool.query(
      `SELECT p.*, pm.role,
        COUNT(DISTINCT t.id)::INT AS task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'Done' THEN t.id END)::INT AS done_count
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE pm.user_id = $1
       GROUP BY p.id, pm.role
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    console.log("Projects:", rows);
  } catch (e) {
    console.error("Projects Error:", e.message);
  }

  try {
    const { rows } = await pool.query(
      `SELECT
        COUNT(t.id)::INT AS total_tasks,
        COUNT(CASE WHEN t.status = 'To Do' THEN 1 END)::INT AS todo,
        COUNT(CASE WHEN t.status = 'In Progress' THEN 1 END)::INT AS in_progress,
        COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::INT AS done,
        COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status <> 'Done' THEN 1 END)::INT AS overdue
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id
       WHERE pm.user_id = $1 AND (pm.role = 'Admin' OR t.assigned_to = $1 OR t.created_by = $1)`,
      [req.user.id]
    );
    console.log("Dashboard Summary:", rows);
  } catch (e) {
    console.error("Dashboard Summary Error:", e.message);
  }

  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(u.name, 'Unassigned') AS name, COUNT(t.id)::INT AS count
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE pm.user_id = $1 AND (pm.role = 'Admin' OR t.assigned_to = $1 OR t.created_by = $1)
       GROUP BY u.name ORDER BY count DESC, name LIMIT 8`,
      [req.user.id]
    );
    console.log("Dashboard perUser:", rows);
  } catch (e) {
    console.error("Dashboard perUser Error:", e.message);
  }
}

test();
