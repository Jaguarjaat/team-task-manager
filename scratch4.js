import "dotenv/config";
import { initDb, query } from "./server/db.js";
import bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(100),
  globalRole: z.enum(["System Admin", "Member"]).optional().default("Member"),
  adminKey: z.string().optional(),
});

async function testSignup() {
  await initDb();
  
  const payload = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    globalRole: "Member",
    adminKey: ""
  };
  
  const parsed = signupSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("Zod Validation Failed:", parsed.error);
    return;
  }
  
  console.log("Parsed payload:", parsed.data);
  
  try {
    const hash = await bcrypt.hash(parsed.data.password, 12);
    const { rows } = await query(
      "INSERT INTO users (name, email, password_hash, global_role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, global_role",
      [parsed.data.name, parsed.data.email, hash, parsed.data.globalRole]
    );
    console.log("Inserted user successfully:", rows[0]);
  } catch (error) {
    console.error("SQL Error:", error);
  }
}

testSignup();
