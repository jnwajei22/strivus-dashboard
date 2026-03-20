import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/server/auth/permissions";
import { mapNotificationPreference } from "@/lib/server/settings/mappers";
import {
  isDuplicateError,
  listNotificationPreferencesByUserId,
  upsertNotificationPreference,
} from "@/lib/server/settings/queries";
import { validateNotificationPreferenceCreateInput } from "@/lib/server/settings/validators";

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rows = await listNotificationPreferencesByUserId(auth.user.user_id);

    return NextResponse.json(
      { preferences: rows.map(mapNotificationPreference) },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/settings/notifications failed:", error);
    return NextResponse.json(
      { error: "Failed to load notification preferences" },
      { status: 500 },
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
    const input = validateNotificationPreferenceCreateInput(body);

    const row = await upsertNotificationPreference(auth.user.user_id, input);

    if (!row) {
      return NextResponse.json(
        { error: "Failed to save notification preference" },
        { status: 500 },
      );
    }

    return NextResponse.json(mapNotificationPreference(row), { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/notifications failed:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (isDuplicateError(error)) {
      return NextResponse.json(
        { error: "A notification preference with that alertKey already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to save notification preference" },
      { status: 500 },
    );
  }
}