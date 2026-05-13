import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    let userId: string;
    let userExists = false;

    // Try to get user from database
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError && userError.code === "PGRST116") {
      // User doesn't exist in database - create test user in auth
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
      userExists = true;
    }

    // Assign role to user
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role)
      .single();

    if (!roleData) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 500 }
      );
    }

    // Create or update user_roles
    await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role_id: roleData.id,
      }, { onConflict: "user_id,role_id" });

    // Create profile if needed
    if (role === "investor") {
      await supabase
        .from("investor_profiles")
        .upsert({
          user_id: userId,
          display_name: email.split("@")[0],
        }, { onConflict: "user_id" });
    } else if (role === "advisor") {
      await supabase
        .from("advisor_profiles")
        .upsert({
          user_id: userId,
          display_name: email.split("@")[0],
          workflow_status: "pending",
        }, { onConflict: "user_id" });
    }

    // Generate a magic link to establish session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email,
    });

    if (linkError) {
      console.error("Link generation error:", linkError);
      return NextResponse.json(
        { error: "Failed to generate session token", details: linkError.message },
        { status: 500 }
      );
    }

    const token = linkData?.properties?.hashed_token;
    if (!token) {
      console.error("Missing token in response:", linkData);
      return NextResponse.json(
        { error: "Missing token in response" },
        { status: 500 }
      );
    }

    // Exchange the token for a session using Supabase's verify endpoint
    const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      } as HeadersInit,
      body: JSON.stringify({
        token_hash: token,
        type: "magiclink",
      }),
    });

    const sessionData = await verifyResponse.json();
    console.log("Verify response:", { status: verifyResponse.status, sessionData });

    if (!verifyResponse.ok || !sessionData.access_token) {
      console.error("Failed to verify token:", sessionData);
      return NextResponse.json(
        { error: "Failed to establish session", details: sessionData },
        { status: 500 }
      );
    }

    // Set auth cookies and return session data
    const response = NextResponse.json({
      success: true,
      message: "Test login successful",
      session: {
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_in: sessionData.expires_in,
        expires_at: sessionData.expires_at,
        token_type: sessionData.token_type,
        user: sessionData.user,
      },
      redirect: "/auth/role-selection",
    });

    response.cookies.set("sb-access-token", sessionData.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    if (sessionData.refresh_token) {
      response.cookies.set("sb-refresh-token", sessionData.refresh_token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Test login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
