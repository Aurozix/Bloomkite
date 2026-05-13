import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { role, userId } = await request.json();

    if (!role || !userId) {
      return NextResponse.json(
        { error: "Role and userId are required" },
        { status: 400 }
      );
    }

    // Get the role ID
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role)
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 500 }
      );
    }

    // Assign or update user_roles entry
    const { error: assignError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role_id: roleData.id,
      }, { onConflict: "user_id,role_id" });

    if (assignError) {
      console.error("Error assigning role:", assignError);
      return NextResponse.json(
        { error: "Failed to assign role" },
        { status: 500 }
      );
    }

    // Update user metadata to set current_role
    try {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (!error && data?.user) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...(data.user.user_metadata || {}),
            current_role: role,
          },
        });
      }
    } catch (err) {
      console.error("Error setting current_role:", err);
    }

    // Create or update profile based on role
    if (role === "investor") {
      const { error: profileError } = await supabase
        .from("investor_profiles")
        .upsert({
          user_id: userId,
          display_name: "",
        }, { onConflict: "user_id" });

      if (profileError) {
        console.error("Error creating investor profile:", profileError);
        return NextResponse.json(
          { error: "Failed to create investor profile" },
          { status: 500 }
        );
      }
    } else if (role === "advisor") {
      const { error: profileError } = await supabase
        .from("advisor_profiles")
        .upsert({
          user_id: userId,
          display_name: "",
          workflow_status: "pending",
        }, { onConflict: "user_id" });

      if (profileError) {
        console.error("Error creating advisor profile:", profileError);
        return NextResponse.json(
          { error: "Failed to create advisor profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Role assigned successfully",
    });
  } catch (error) {
    console.error("Select role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
