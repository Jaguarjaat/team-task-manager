import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import { initDb, query } from "./server/db.js";
import { z } from "zod";

const app = express();
app.use(express.json());

const jwtSecret = "development-secret-change-me";

// Copy the relevant parts of server/index.js here to test
async function test() {
  await initDb();
  
  // Create a member
  await query("INSERT INTO users (name, email, password_hash, global_role) VALUES ('Member', 'm@m.com', 'hash', 'Member')");
  
  // Create a token
  const token = jwt.sign({ id: 1, email: 'm@m.com' }, jwtSecret, { expiresIn: "7d" });
  
  // mock req, res
  const req = {
    user: { id: 1, global_role: 'Member' }
  };
  
  try {
    const { rows } = await query(
      `SELECT p.*, pm.role,
        COUNT(DISTINCT t.id)::INT AS task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'Done' THEN t.id END)::INT AS done_count
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE pm.user_id = $1
       GROUP BY p.id, pm.role
       ORDER BY p.created_at DESC`,
      [req.user.id],
    );
    console.log("Projects:", rows);
  } catch (e) {
    console.error("Projects Error:", e);
  }
  
  try {
    const { rows } = await query(
      `SELECT
        COUNT(t.id)::INT AS total_tasks,
        COUNT(CASE WHEN t.status = 'To Do' THEN 1 END)::INT AS todo,
        COUNT(CASE WHEN t.status = 'In Progress' THEN 1 END)::INT AS in_progress,
        COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::INT AS done,
        COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status <> 'Done' THEN 1 END)::INT AS overdue
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id
       WHERE pm.user_id = $1 AND (pm.role = 'Admin' OR t.assigned_to = $1 OR t.created_by = $1)`,
      [req.user.id],
    );
    console.log("Dashboard Summary:", rows[0]);
  } catch (e) {
    console.error("Dashboard Summary Error:", e);
  }
}

test();
