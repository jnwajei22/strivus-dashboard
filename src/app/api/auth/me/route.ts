// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { sql } from "@/lib/db";

const COOKIE_NAME = "strivus_session";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function GET(req: NextRequest) {
  try {
    const rawToken = req.cookies.get(COOKIE_NAME)?.value;

    if (!rawToken) {
      return NextResponse.json({ user: null, permissions: [] }, { status: 401 });
    }

    const tokenHash = hashValue(rawToken);

    const sessions = await sql`
      SELECT
        s.id,
        s.user_id,
        s.expires_at,
        s.revoked_at,
        u.email,
        u.first_name,
        u.last_name,
        u.display_name,
        u.role_id,
        u.status,
        u.email_verified_at,
        u.last_login_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ${tokenHash}
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ user: null, permissions: [] }, { status: 401 });
    }

    const session = sessions[0];

    if (
      session.revoked_at ||
      new Date(session.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json({ user: null, permissions: [] }, { status: 401 });
    }

    await sql`
      UPDATE sessions
      SET last_seen_at = now()
      WHERE id = ${session.id}
    `;

    let role = null;
    let permissions: string[] = [];

    if (session.role_id) {
      const roleRows = await sql`
        SELECT id, name, description
        FROM roles
        WHERE id = ${session.role_id}
        LIMIT 1
      `;

      if (roleRows.length > 0) {
        role = roleRows[0];
      }

      const permissionRows = await sql`
        SELECT p.key
        FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = ${session.role_id}
        ORDER BY p.key
      `;

      permissions = [...new Set(permissionRows.map((row) => row.key))];
    }

    return NextResponse.json({
      user: {
        id: session.user_id,
        email: session.email,
        firstName: session.first_name,
        lastName: session.last_name,
        displayName: session.display_name,
        roleId: session.role_id,
        status: session.status,
        emailVerifiedAt: session.email_verified_at,
        lastLoginAt: session.last_login_at,
        role,
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
