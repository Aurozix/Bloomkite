import dotenv from "dotenv";
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

// Parse --env flag (local | test | prod). Default: local.
const args = process.argv.slice(2);
const envFlagIdx = args.indexOf("--env");
const envArg = envFlagIdx >= 0 ? args[envFlagIdx + 1] : "local";

const envFileMap: Record<string, string> = {
  local: ".env.local",
  test: ".env.test",
  prod: ".env.prod",
};

const envFile = envFileMap[envArg];
if (!envFile) {
  console.error(`❌ Unknown --env value '${envArg}'. Expected: local | test | prod`);
  process.exit(1);
}

const envPath = path.join(process.cwd(), envFile);
if (!fs.existsSync(envPath)) {
  console.error(`❌ Env file not found: ${envFile}`);
  process.exit(1);
}

dotenv.config({ path: envPath });
console.log(`🌱 Loaded env from ${envFile} (env=${envArg})`);

// Connection target resolution:
//   - If SUPABASE_DB_HOST is set, use it directly (this is the local docker path).
//   - Otherwise derive the host from NEXT_PUBLIC_SUPABASE_URL (hosted Supabase).
// SUPABASE_DB_PORT defaults to 5432.
// SUPABASE_DB_SSL defaults to "require" (set to "disable" for local docker).
const explicitHost = process.env.SUPABASE_DB_HOST;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const dbPortStr = process.env.SUPABASE_DB_PORT || "5432";
const dbPort = parseInt(dbPortStr, 10);
const dbSslMode = (process.env.SUPABASE_DB_SSL || "require").toLowerCase();
const dbUser = process.env.SUPABASE_DB_USER || "postgres";
const dbName = process.env.SUPABASE_DB_NAME || "postgres";

if (!dbPassword) {
  console.error("❌ Missing environment variable: SUPABASE_DB_PASSWORD");
  process.exit(1);
}

let host: string;
if (explicitHost) {
  host = explicitHost;
} else {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error(
      "❌ Either SUPABASE_DB_HOST or NEXT_PUBLIC_SUPABASE_URL must be set"
    );
    process.exit(1);
  }
  host = new URL(supabaseUrl).hostname;
}

const client = new Client({
  host,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  ssl: dbSslMode === "disable" ? false : "require",
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
    console.log(`🔌 Attempting to connect to ${host}:${dbPort} (ssl=${dbSslMode})...`);
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
