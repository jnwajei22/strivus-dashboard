// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth/session";
import { getUserPermissions } from "@/lib/server/auth/guards";
import { touchSession } from "@/lib/server/auth/session";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { user: null, permissions: [] },
        { status: 401 }
      );
    }

    await touchSession(sessionUser.session_id);

    const permissions = await getUserPermissions(sessionUser.role_id);

    return NextResponse.json({
      user: {
        id: sessionUser.user_id,
        email: sessionUser.email,
        firstName: sessionUser.first_name,
        lastName: sessionUser.last_name,
        displayName: sessionUser.display_name,
        roleId: sessionUser.role_id,
        roleName: sessionUser.role_name,
        status: sessionUser.status,
        emailVerifiedAt: sessionUser.email_verified_at,
        lastLoginAt: sessionUser.last_login_at,
        profile: {
          jobTitle: sessionUser.job_title,
          avatarUrl: sessionUser.avatar_url,
          phone: sessionUser.phone,
          department: sessionUser.department,
          timezone: sessionUser.profile_timezone,
        },
        settings: {
          theme: sessionUser.theme,
          sidebarCollapsed: sessionUser.sidebar_collapsed,
          defaultDashboardView: sessionUser.default_dashboard_view,
          timezone: sessionUser.settings_timezone,
        },
      },
      permissions,
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);

    return NextResponse.json(
      { error: "Failed to load session" },
      { status: 500 }
    );
  }
}
