import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { mapProfile } from "@/lib/server/settings/mappers";
import {
  getProfileByUserId,
  upsertProfile,
} from "@/lib/server/settings/queries";
import { validateProfilePatchInput } from "@/lib/server/settings/validators";

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const profile = await getProfileByUserId(auth.user.user_id);

    if (!profile) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(mapProfile(profile), { status: 200 });
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
    const body = await req.json();
    const patch = validateProfilePatchInput(body);

    const profile = await upsertProfile(auth.user.user_id, patch);

    if (!profile) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    return NextResponse.json(mapProfile(profile), { status: 200 });
  } catch (error) {
    console.error("PATCH /api/settings/profile failed:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}