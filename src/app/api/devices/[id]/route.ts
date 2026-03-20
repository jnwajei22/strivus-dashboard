import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/server/auth/permissions";
import { requirePermission } from "@/lib/server/auth/guards";
import { mapDeviceRow } from "@/lib/server/devices/mappers";
import {
  deleteDevice,
  getDeviceById,
  updateDevice,
} from "@/lib/server/devices/queries";
import type { UpdateDeviceBody } from "@/lib/server/devices/types";
import {
  isUuid,
  validateUpdateDeviceBody,
} from "@/lib/server/devices/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requirePermission(PERMISSIONS.DEVICES_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Invalid device id" },
        { status: 400 }
      );
    }

    const row = await getDeviceById(id);

    if (!row) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { device: mapDeviceRow(row) },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/devices/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load device" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requirePermission(PERMISSIONS.DEVICES_UPDATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Invalid device id" },
        { status: 400 }
      );
    }

    const existing = await getDeviceById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    const body = (await req.json()) as UpdateDeviceBody;
    const validated = validateUpdateDeviceBody(body, existing);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const row = await updateDevice(id, validated.data);

    return NextResponse.json(
      { device: mapDeviceRow(row!) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PATCH /api/devices/[id] failed:", error);

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "A device with that serial already exists" },
        { status: 409 }
      );
    }

    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "One or more related IDs do not exist" },
        { status: 400 }
      );
    }

    if (error?.code === "22P02") {
      return NextResponse.json(
        { error: "Invalid UUID, timestamp, or enum value" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requirePermission(PERMISSIONS.DEVICES_DELETE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Invalid device id" },
        { status: 400 }
      );
    }

    const existing = await getDeviceById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    await deleteDevice(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/devices/[id] failed:", error);

    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Cannot delete device because related records still reference it" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}