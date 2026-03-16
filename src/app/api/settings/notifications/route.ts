import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type NotificationPreferenceRow = {
  id: string;
  user_id: string;
  alert_key: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rows = await sql`
      SELECT
        id,
        user_id,
        alert_key,
        email_enabled,
        push_enabled,
        in_app_enabled,
        created_at,
        updated_at
      FROM notification_preferences
      WHERE user_id = ${auth.user.user_id}
      ORDER BY alert_key ASC
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/settings/notifications failed:", error);
    return NextResponse.json(
      { error: "Failed to load notification preferences" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_UPDATE_PROFILE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const alertKey = String(body.alert_key ?? "").trim();
    const emailEnabled = Boolean(body.email_enabled ?? false);
    const pushEnabled = Boolean(body.push_enabled ?? false);
    const inAppEnabled =
      body.in_app_enabled === undefined ? true : Boolean(body.in_app_enabled);

    if (!alertKey) {
      return NextResponse.json(
        { error: "alert_key is required" },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO notification_preferences (
        user_id,
        alert_key,
        email_enabled,
        push_enabled,
        in_app_enabled,
        updated_at
      )
      VALUES (
        ${auth.user.user_id},
        ${alertKey},
        ${emailEnabled},
        ${pushEnabled},
        ${inAppEnabled},
        now()
      )
      ON CONFLICT (user_id, alert_key)
      DO UPDATE SET
        email_enabled = EXCLUDED.email_enabled,
        push_enabled = EXCLUDED.push_enabled,
        in_app_enabled = EXCLUDED.in_app_enabled,
        updated_at = now()
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/notifications failed:", error);
    return NextResponse.json(
      { error: "Failed to save notification preference" },
      { status: 500 }
    );
  }
}
