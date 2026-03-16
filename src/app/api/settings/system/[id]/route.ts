import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SystemSettingRow = {
  id: string;
  category: string;
  key: string;
  value_json: unknown;
  updated_by_user_id: string | null;
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
    return NextResponse.json({ error: "Invalid system setting id" }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT *
      FROM system_settings
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "System setting not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error("GET /api/settings/system/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load system setting" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_UPDATE_SYSTEM);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid system setting id" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const category =
      body.category !== undefined ? String(body.category).trim() : undefined;
    const key =
      body.key !== undefined ? String(body.key).trim() : undefined;
    const hasValueJson = Object.prototype.hasOwnProperty.call(body, "value_json");
    const valueJsonText = hasValueJson ? JSON.stringify(body.value_json ?? {}) : null;

    const rows = await sql`
      UPDATE system_settings
      SET
        category = COALESCE(${category ?? null}, category),
        key = COALESCE(${key ?? null}, key),
        value_json = COALESCE(${valueJsonText}::jsonb, value_json),
        updated_by_user_id = ${auth.user.user_id},
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "System setting not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error: any) {
    console.error("PATCH /api/settings/system/[id] failed:", error);

    if (String(error?.message ?? "").toLowerCase().includes("duplicate")) {
      return NextResponse.json(
        { error: "A system setting with that category/key already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update system setting" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_UPDATE_SYSTEM);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid system setting id" }, { status: 400 });
  }

  try {
    const rows = await sql`
      DELETE FROM system_settings
      WHERE id = ${id}
      RETURNING *
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "System setting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: rows[0] }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/settings/system/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete system setting" },
      { status: 500 }
    );
  }
}
