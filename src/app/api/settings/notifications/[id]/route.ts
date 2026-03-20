import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/server/auth/permissions";
import { mapNotificationPreference } from "@/lib/server/settings/mappers";
import {
  deleteNotificationPreference,
  getNotificationPreferenceById,
  isDuplicateError,
  updateNotificationPreference,
} from "@/lib/server/settings/queries";
import { validateNotificationPreferencePatchInput } from "@/lib/server/settings/validators";

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
      { error: "Invalid notification preference id" },
      { status: 400 },
    );
  }

  try {
    const row = await getNotificationPreferenceById(id, auth.user.user_id);

    if (!row) {
      return NextResponse.json(
        { error: "Notification preference not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(mapNotificationPreference(row), { status: 200 });
  } catch (error) {
    console.error("GET /api/settings/notifications/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load notification preference" },
      { status: 500 },
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
    return NextResponse.json(
      { error: "Invalid notification preference id" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const patch = validateNotificationPreferencePatchInput(body);

    const row = await updateNotificationPreference(
      id,
      auth.user.user_id,
      patch,
    );

    if (!row) {
      return NextResponse.json(
        { error: "Notification preference not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(mapNotificationPreference(row), { status: 200 });
  } catch (error) {
    console.error("PATCH /api/settings/notifications/[id] failed:", error);

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
      { error: "Failed to update notification preference" },
      { status: 500 },
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
    return NextResponse.json(
      { error: "Invalid notification preference id" },
      { status: 400 },
    );
  }

  try {
    const row = await deleteNotificationPreference(id, auth.user.user_id);

    if (!row) {
      return NextResponse.json(
        { error: "Notification preference not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, deleted: mapNotificationPreference(row) },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/settings/notifications/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete notification preference" },
      { status: 500 },
    );
  }
}