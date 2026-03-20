import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/server/auth/permissions";
import { mapUserSettings } from "@/lib/server/settings/mappers";
import {
  getUserSettingsByUserId,
  upsertUserSettings,
} from "@/lib/server/settings/queries";
import { validateUserSettingsPatchInput } from "@/lib/server/settings/validators";

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await getUserSettingsByUserId(auth.user.user_id);

    if (!settings) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(mapUserSettings(settings), { status: 200 });
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
    const body = await req.json();
    const patch = validateUserSettingsPatchInput(body);

    const settings = await upsertUserSettings(auth.user.user_id, patch);

    if (!settings) {
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json(mapUserSettings(settings), { status: 200 });
  } catch (error) {
    console.error("PATCH /api/settings/preferences failed:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}