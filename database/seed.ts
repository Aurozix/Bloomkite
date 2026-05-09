import dotenv from "dotenv";
import * as path from "path";
import ws from "ws";
import { createClient } from "@supabase/supabase-js";
import { seedMandatory } from "./seeds/001_mandatory";
import { seedOptional } from "./seeds/002_optional";
import { seedTestUsers } from "./seeds/003_test_users";

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});

async function seed() {
  try {
    console.log("🌱 Starting seed process...\n");

    // Get command line arguments
    const args = process.argv.slice(2);
    const expanded = args.includes("--expanded");

    // Always run mandatory seeds
    console.log("📋 Running mandatory seeds...");
    await seedMandatory(supabase);
    console.log("✅ Mandatory seeds completed\n");

    // Run optional seeds if --expanded flag is provided
    if (expanded) {
      console.log("📋 Running optional/expanded seeds...");
      await seedOptional(supabase);
      console.log("✅ Optional seeds completed\n");
    }

    // Run test users seed
    console.log("📋 Creating test users...");
    await seedTestUsers(supabase);
    console.log("✅ Test users created\n");

    console.log("🎉 Seed process completed successfully!");
    console.log(
      expanded ? "   (Ran mandatory + optional seeds)" : "   (Ran mandatory seeds only)"
    );
    console.log("\n💡 To run expanded seeds: npm run db:seed -- --expanded");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
