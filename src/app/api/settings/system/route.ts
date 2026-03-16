import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type SystemSettingRow = {
  id: string;
  category: string;
  key: string;
  value_json: unknown;
  updated_by_user_id: string | null;
  updated_at: string;
};

export async function GET(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim() || null;
    const key = searchParams.get("key")?.trim() || null;

    const rows = await sql`
      SELECT
        id,
        category,
        key,
        value_json,
        updated_by_user_id,
        updated_at
      FROM system_settings
      WHERE (${category}::text IS NULL OR category = ${category})
        AND (${key}::text IS NULL OR key = ${key})
      ORDER BY category ASC, key ASC
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/settings/system failed:", error);
    return NextResponse.json(
      { error: "Failed to load system settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_UPDATE_SYSTEM);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const category = String(body.category ?? "").trim();
    const key = String(body.key ?? "").trim();
    const valueJson = body.value_json;

    if (!category || !key) {
      return NextResponse.json(
        { error: "category and key are required" },
        { status: 400 }
      );
    }

    const valueJsonText = JSON.stringify(valueJson ?? {});

    const rows = await sql`
      INSERT INTO system_settings (
        category,
        key,
        value_json,
        updated_by_user_id,
        updated_at
      )
      VALUES (
        ${category},
        ${key},
        ${valueJsonText}::jsonb,
        ${auth.user.user_id},
        now()
      )
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error("POST /api/settings/system failed:", error);

    if (String(error?.message ?? "").toLowerCase().includes("duplicate")) {
      return NextResponse.json(
        { error: "A system setting with that category/key already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create system setting" },
      { status: 500 }
    );
  }
}
