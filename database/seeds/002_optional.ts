import { SupabaseClient } from "@supabase/supabase-js";

async function seedOptional(supabase: SupabaseClient) {
  try {
    // Optional/expanded seed data goes here
    // This is for test users, demo data, etc. when running with --expanded flag

    console.log("  → Checking for optional test data...");

    // Example: Check if test data already exists
    const { data: existingTestData } = await supabase
      .from("users")
      .select("email")
      .eq("email", "test-investor@bloomkite.local");

    if (!existingTestData || existingTestData.length === 0) {
      console.log("     ℹ️  Optional seed data is for development/testing purposes");
      console.log("     To add test users, implement them in this file");
    } else {
      console.log("     ✓ Optional test data already seeded");
    }

    return { success: true };
  } catch (error) {
    console.error("    ❌ Error seeding optional data:", error);
    throw error;
  }
}

export { seedOptional };
