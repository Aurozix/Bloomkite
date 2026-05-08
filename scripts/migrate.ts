import dotenv from "dotenv";
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !dbPassword) {
  console.error(
    "❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD"
  );
  process.exit(1);
}

const url = new URL(supabaseUrl);
const host = url.hostname;

const client = new Client({
  host,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: dbPassword,
  ssl: "require",
} as any);

async function ensureMigrationsTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getMigratedFiles(): Promise<string[]> {
  const result = await client.query("SELECT name FROM public.migrations ORDER BY executed_at");
  return result.rows.map((row) => row.name);
}

async function recordMigration(name: string) {
  await client.query("INSERT INTO public.migrations (name) VALUES ($1)", [name]);
}

async function migrate() {
  try {
    console.log(`🔌 Attempting to connect to ${host}:5432...`);
    await client.connect();
    console.log("✅ Connected to database");

    await ensureMigrationsTable();
    const migratedFiles = await getMigratedFiles();

    const migrationDir = path.join(process.cwd(), "database", "migrations");
    if (!fs.existsSync(migrationDir)) {
      console.log("⚠️  No migrations directory found");
      await client.end();
      return;
    }

    const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith(".sql")).sort();

    if (files.length === 0) {
      console.log("⚠️  No migration files found");
      await client.end();
      return;
    }

    let executedCount = 0;

    for (const file of files) {
      if (migratedFiles.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      try {
        await client.query(sql);
        await recordMigration(file);
        console.log(`✅ Executed ${file}`);
        executedCount++;
      } catch (error) {
        console.error(`❌ Failed to execute ${file}:`, error);
        await client.end();
        process.exit(1);
      }
    }

    await client.end();
    if (executedCount === 0) {
      console.log("✅ All migrations already executed");
    } else {
      console.log(`✅ Successfully executed ${executedCount} migration(s)`);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await client.end();
    process.exit(1);
  }
}

migrate();
