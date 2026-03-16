import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type SettingsRow = {
  id: string;
  user_id: string;
  theme: string | null;
  sidebar_collapsed: boolean | null;
  default_dashboard_view: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
};

function isValidTheme(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ["dark", "light", "system"].includes(value)
  );
}

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.user_id;
    const rows = await sql`
      select id, user_id, theme, sidebar_collapsed,
             default_dashboard_view, timezone,
             created_at, updated_at
      from user_settings
      where user_id = ${userId}
      limit 1`;

    if (rows.length === 0) {
      // no settings record; return null so the client can assume defaults
      return NextResponse.json(null, { status: 200 });
    }

    const row = rows[0];
    return NextResponse.json(
      {
        id: row.id,
        user_id: row.user_id,
        theme: row.theme,
        sidebar_collapsed: row.sidebar_collapsed,
        default_dashboard_view: row.default_dashboard_view,
        timezone: row.timezone,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/settings/preferences failed:", error);
    return NextResponse.json(
      { error: "Failed to load preferences" },
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
      theme,
      sidebar_collapsed,
      default_dashboard_view,
      timezone,
    }: {
      theme?: string | null;
      sidebar_collapsed?: boolean;
      default_dashboard_view?: string | null;
      timezone?: string | null;
    } = body || {};

    if (
      theme === undefined &&
      sidebar_collapsed === undefined &&
      default_dashboard_view === undefined &&
      timezone === undefined
    ) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 },
      );
    }

    if (
      theme !== undefined &&
      theme !== null &&
      !isValidTheme(theme)
    ) {
      return NextResponse.json(
        { error: "Invalid theme. Allowed: dark, light, system" },
        { status: 400 },
      );
    }

    const settingsResult = await sql`
      INSERT INTO user_settings (
        user_id,
        theme,
        sidebar_collapsed,
        default_dashboard_view,
        timezone
      )
      VALUES (
        ${userId},
        ${theme ?? null},
        ${sidebar_collapsed ?? null},
        ${default_dashboard_view ?? null},
        ${timezone ?? null}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        theme = EXCLUDED.theme,
        sidebar_collapsed = EXCLUDED.sidebar_collapsed,
        default_dashboard_view = EXCLUDED.default_dashboard_view,
        timezone = EXCLUDED.timezone,
        updated_at = now()
      RETURNING id, user_id, theme, sidebar_collapsed, default_dashboard_view, timezone, created_at, updated_at
    `;

    return NextResponse.json(
      settingsResult[0] ?? null,
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH /api/settings/preferences failed:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
