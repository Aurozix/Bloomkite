import { SupabaseClient } from "@supabase/supabase-js";

// Define role-permission mappings
const ROLE_DEFINITIONS = {
  investor: {
    description: "Individual investor managing financial portfolios",
    permissions: ["read_calculators", "save_plans", "contact_advisors", "view_articles"],
  },
  advisor: {
    description: "Financial advisor providing guidance and services",
    permissions: ["read_calculators", "publish_articles", "view_investor_profiles", "receive_inquiries"],
  },
  admin: {
    description: "Platform administrator with full access",
    permissions: [
      "read_calculators",
      "publish_articles",
      "moderate_content",
      "manage_users",
      "view_analytics",
      "manage_advisors",
      "view_investor_profiles",
      "receive_inquiries",
      "save_plans",
      "contact_advisors",
    ],
  },
  moderator: {
    description: "Content moderator",
    permissions: ["moderate_content", "read_calculators", "view_articles", "view_investor_profiles"],
  },
};

const PERMISSION_DEFINITIONS = {
  read_calculators: "Access financial calculators",
  save_plans: "Save and manage financial plans",
  contact_advisors: "Contact and interact with advisors",
  view_articles: "View published articles",
  publish_articles: "Publish and manage articles",
  view_investor_profiles: "View investor profiles (for advisors)",
  receive_inquiries: "Receive inquiries from investors",
  moderate_content: "Moderate user-generated content",
  manage_users: "Manage user accounts and roles",
  view_analytics: "Access platform analytics",
  manage_advisors: "Approve/manage advisor profiles",
};

async function seedMandatory(supabase: SupabaseClient) {
  try {
    // Step 1: Seed permissions (if not already present)
    console.log("  → Seeding permissions...");
    const { data: existingPermissions } = await supabase
      .from("permissions")
      .select("name");
    const existingPermissionNames = new Set(
      (existingPermissions || []).map((p: { name: string }) => p.name)
    );

    for (const [permissionName, description] of Object.entries(PERMISSION_DEFINITIONS)) {
      if (!existingPermissionNames.has(permissionName)) {
        await supabase.from("permissions").insert({
          name: permissionName,
          description,
        });
      }
    }
    console.log("     ✓ Permissions ready");

    // Step 2: Seed roles (if not already present)
    console.log("  → Seeding roles...");
    const { data: existingRoles } = await supabase.from("roles").select("name");
    const existingRoleNames = new Set(
      (existingRoles || []).map((r: { name: string }) => r.name)
    );

    const roleIds: Record<string, string> = {};
    for (const [roleName, { description }] of Object.entries(ROLE_DEFINITIONS)) {
      if (!existingRoleNames.has(roleName)) {
        const { data: insertedRole } = await supabase
          .from("roles")
          .insert({ name: roleName, description })
          .select()
          .single();
        roleIds[roleName] = insertedRole?.id;
      } else {
        const { data: existingRole } = await supabase
          .from("roles")
          .select("id")
          .eq("name", roleName)
          .single();
        roleIds[roleName] = existingRole?.id;
      }
    }
    console.log("     ✓ Roles ready");

    // Step 3: Seed role_permissions mappings
    console.log("  → Seeding role permissions...");
    const { data: existingRolePermissions } = await supabase
      .from("role_permissions")
      .select("role_id, permission_id");
    const existingMappings = new Set(
      (existingRolePermissions || []).map(
        (rp: { role_id: string; permission_id: string }) => `${rp.role_id}:${rp.permission_id}`
      )
    );

    for (const [roleName, { permissions: permissionNames }] of Object.entries(
      ROLE_DEFINITIONS
    )) {
      const roleId = roleIds[roleName];
      for (const permissionName of permissionNames) {
        const { data: permission } = await supabase
          .from("permissions")
          .select("id")
          .eq("name", permissionName)
          .single();

        if (permission && !existingMappings.has(`${roleId}:${permission.id}`)) {
          await supabase
            .from("role_permissions")
            .insert({ role_id: roleId, permission_id: permission.id });
        }
      }
    }
    console.log("     ✓ Role permissions ready");

    return { success: true };
  } catch (error) {
    console.error("    ❌ Error seeding mandatory data:", error);
    throw error;
  }
}

export { seedMandatory };
