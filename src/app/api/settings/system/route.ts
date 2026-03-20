import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/server/auth/permissions";
import { mapSystemSetting } from "@/lib/server/settings/mappers";
import {
  createSystemSetting,
  isDuplicateError,
  listSystemSettings,
} from "@/lib/server/settings/queries";
import { validateSystemSettingCreateInput } from "@/lib/server/settings/validators";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    const rows = await listSystemSettings({ category, key });

    return NextResponse.json(
      { settings: rows.map(mapSystemSetting) },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/settings/system failed:", error);
    return NextResponse.json(
      { error: "Failed to load system settings" },
      { status: 500 },
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
    const input = validateSystemSettingCreateInput(body);

    const row = await createSystemSetting(input, auth.user.user_id);

    if (!row) {
      return NextResponse.json(
        { error: "Failed to create system setting" },
        { status: 500 },
      );
    }

    return NextResponse.json(mapSystemSetting(row), { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/system failed:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (isDuplicateError(error)) {
      return NextResponse.json(
        { error: "A system setting with that category/key already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create system setting" },
      { status: 500 },
    );
  }
}