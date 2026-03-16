import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type ProfileRow = {
  user_id: string;
  job_title: string | null;
  avatar_url: string | null;
  phone: string | null;
  department: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.user_id;
    const rows = await sql`
      select user_id, job_title, avatar_url, phone,
             department, timezone, created_at, updated_at
      from user_profiles
      where user_id = ${userId}
      limit 1`;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    const row = rows[0];
    return NextResponse.json(
      {
        user_id: row.user_id,
        job_title: row.job_title,
        avatar_url: row.avatar_url,
        phone: row.phone,
        department: row.department,
        timezone: row.timezone,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/settings/profile failed:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_UPDATE_PROFILE);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.user_id;
    const body = (await req.json()) ?? {};

    const {
      job_title,
      avatar_url,
      phone,
      department,
      timezone,
    }: {
      job_title?: string | null;
      avatar_url?: string | null;
      phone?: string | null;
      department?: string | null;
      timezone?: string | null;
    } = body || {};

    if (
      job_title === undefined &&
      avatar_url === undefined &&
      phone === undefined &&
      department === undefined &&
      timezone === undefined
    ) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 },
      );
    }

    const profileResult = await sql`
      INSERT INTO user_profiles (
        user_id,
        job_title,
        avatar_url,
        phone,
        department,
        timezone
      )
      VALUES (
        ${userId},
        ${job_title ?? null},
        ${avatar_url ?? null},
        ${phone ?? null},
        ${department ?? null},
        ${timezone ?? null}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        job_title = EXCLUDED.job_title,
        avatar_url = EXCLUDED.avatar_url,
        phone = EXCLUDED.phone,
        department = EXCLUDED.department,
        timezone = EXCLUDED.timezone,
        updated_at = now()
      RETURNING user_id, job_title, avatar_url, phone, department, timezone, created_at, updated_at
    `;

    return NextResponse.json(
      profileResult[0] ?? null,
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH /api/settings/profile failed:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
