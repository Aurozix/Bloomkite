import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Check if user exists, if not create one
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    let userId: string;

    if (userError && userError.code === "PGRST116") {
      // User doesn't exist - create test user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: "test-password-" + Math.random().toString(36),
        email_confirm: true,
      });

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      userId = authData.user.id;
    } else if (userError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    } else {
      userId = user!.id;
    }

    // Get the user's session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.getUserById(userId);

    if (sessionError || !sessionData.user) {
      return NextResponse.json(
        { error: "Failed to get session" },
        { status: 500 }
      );
    }

    // Generate a session
    const { data: sessionToken, error: tokenError } =
      await supabase.auth.admin.createSession(userId);

    if (tokenError || !sessionToken) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Create response with auth cookies
    const response = NextResponse.json({
      success: true,
      message: "Test login successful",
    });

    // Set auth cookies
    response.cookies.set("sb-access-token", sessionToken.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set(
      "sb-refresh-token",
      sessionToken.session.refresh_token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      }
    );

    return response;
  } catch (error) {
    console.error("Test login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
