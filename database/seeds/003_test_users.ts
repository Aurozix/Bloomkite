import { SupabaseClient } from "@supabase/supabase-js";

const TEST_PASSWORD = "TestPassword123!";

export async function seedTestUsers(supabase: SupabaseClient) {
  try {
    // Create test investor
    console.log("Creating test investor user...");
    const investorEmail = "investor@bloomkite.local";

    let investorUser;
    const { data: existingInvestor } = await supabase.auth.admin.listUsers();
    const investorExists = existingInvestor.users.some((u) => u.email === investorEmail);

    if (!investorExists) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: investorEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Failed to create investor user: ${authError.message}`);
      }

      investorUser = authData.user;
    } else {
      const { data: userData } = await supabase.auth.admin.getUserById(
        existingInvestor.users.find((u) => u.email === investorEmail)!.id
      );
      investorUser = userData.user;
    }

    if (investorUser) {
      // Get investor role
      const { data: investorRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "investor")
        .single();

      if (investorRole) {
        // Assign role
        await supabase
          .from("user_roles")
          .upsert(
            {
              user_id: investorUser.id,
              role_id: investorRole.id,
            },
            { onConflict: "user_id,role_id" }
          );

        // Create investor profile
        await supabase
          .from("investor_profiles")
          .upsert(
            {
              user_id: investorUser.id,
              display_name: "Test Investor",
            },
            { onConflict: "user_id" }
          );

        console.log(`✅ Test investor created: ${investorEmail}`);
      }
    }

    // Create test advisor
    console.log("Creating test advisor user...");
    const advisorEmail = "advisor@bloomkite.local";

    let advisorUser;
    const { data: existingAdvisor } = await supabase.auth.admin.listUsers();
    const advisorExists = existingAdvisor.users.some((u) => u.email === advisorEmail);

    if (!advisorExists) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: advisorEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Failed to create advisor user: ${authError.message}`);
      }

      advisorUser = authData.user;
    } else {
      const { data: userData } = await supabase.auth.admin.getUserById(
        existingAdvisor.users.find((u) => u.email === advisorEmail)!.id
      );
      advisorUser = userData.user;
    }

    if (advisorUser) {
      // Get advisor role
      const { data: advisorRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "advisor")
        .single();

      if (advisorRole) {
        // Assign role
        await supabase
          .from("user_roles")
          .upsert(
            {
              user_id: advisorUser.id,
              role_id: advisorRole.id,
            },
            { onConflict: "user_id,role_id" }
          );

        // Create advisor profile
        await supabase
          .from("advisor_profiles")
          .upsert(
            {
              user_id: advisorUser.id,
              display_name: "Test Advisor",
              workflow_status: "pending",
            },
            { onConflict: "user_id" }
          );

        console.log(`✅ Test advisor created: ${advisorEmail}`);
      }
    }

    console.log("\n📝 Test User Credentials:");
    console.log(`   Investor: ${investorEmail} / ${TEST_PASSWORD}`);
    console.log(`   Advisor:  ${advisorEmail} / ${TEST_PASSWORD}`);
  } catch (error) {
    console.error("❌ Test users seed failed:", error);
    throw error;
  }
}
