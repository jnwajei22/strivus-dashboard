import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid notification preference id" }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT *
      FROM notification_preferences
      WHERE id = ${id}
        AND user_id = ${auth.user.user_id}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Notification preference not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error("GET /api/settings/notifications/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load notification preference" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_UPDATE_PROFILE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid notification preference id" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const alertKey =
      body.alert_key !== undefined ? String(body.alert_key).trim() : undefined;

    const emailEnabled =
      body.email_enabled !== undefined ? Boolean(body.email_enabled) : undefined;

    const pushEnabled =
      body.push_enabled !== undefined ? Boolean(body.push_enabled) : undefined;

    const inAppEnabled =
      body.in_app_enabled !== undefined ? Boolean(body.in_app_enabled) : undefined;

    const rows = await sql`
      UPDATE notification_preferences
      SET
        alert_key = COALESCE(${alertKey ?? null}, alert_key),
        email_enabled = COALESCE(${emailEnabled ?? null}, email_enabled),
        push_enabled = COALESCE(${pushEnabled ?? null}, push_enabled),
        in_app_enabled = COALESCE(${inAppEnabled ?? null}, in_app_enabled),
        updated_at = now()
      WHERE id = ${id}
        AND user_id = ${auth.user.user_id}
      RETURNING *
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Notification preference not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error: any) {
    console.error("PATCH /api/settings/notifications/[id] failed:", error);

    if (String(error?.message ?? "").toLowerCase().includes("duplicate")) {
      return NextResponse.json(
        { error: "A notification preference with that alert_key already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update notification preference" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_UPDATE_PROFILE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid notification preference id" }, { status: 400 });
  }

  try {
    const rows = await sql`
      DELETE FROM notification_preferences
      WHERE id = ${id}
        AND user_id = ${auth.user.user_id}
      RETURNING *
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Notification preference not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: rows[0] }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/settings/notifications/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete notification preference" },
      { status: 500 }
    );
  }
}
