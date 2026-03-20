import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/server/auth/permissions";
import { mapSystemSetting } from "@/lib/server/settings/mappers";
import {
  deleteSystemSetting,
  getSystemSettingById,
  isDuplicateError,
  updateSystemSetting,
} from "@/lib/server/settings/queries";
import { validateSystemSettingPatchInput } from "@/lib/server/settings/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.SETTINGS_READ);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json(
      { error: "Invalid system setting id" },
      { status: 400 },
    );
  }

  try {
    const row = await getSystemSettingById(id);

    if (!row) {
      return NextResponse.json(
        { error: "System setting not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(mapSystemSetting(row), { status: 200 });
  } catch (error) {
    console.error("GET /api/settings/system/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load system setting" },
      { status: 500 },
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
    return NextResponse.json(
      { error: "Invalid system setting id" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const patch = validateSystemSettingPatchInput(body);

    const row = await updateSystemSetting(id, patch, auth.user.user_id);

    if (!row) {
      return NextResponse.json(
        { error: "System setting not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(mapSystemSetting(row), { status: 200 });
  } catch (error) {
    console.error("PATCH /api/settings/system/[id] failed:", error);

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
      { error: "Failed to update system setting" },
      { status: 500 },
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
    return NextResponse.json(
      { error: "Invalid system setting id" },
      { status: 400 },
    );
  }

  try {
    const row = await deleteSystemSetting(id);

    if (!row) {
      return NextResponse.json(
        { error: "System setting not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, deleted: mapSystemSetting(row) },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/settings/system/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete system setting" },
      { status: 500 },
    );
  }
}