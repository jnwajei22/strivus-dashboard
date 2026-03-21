import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { mapFirmwareVersion } from "@/lib/server/firmware/mappers";
import {
  deleteFirmwareVersion,
  getFirmwareVersionById,
  updateFirmwareVersion,
} from "@/lib/server/firmware/queries";
import {
  isValidUuid,
  parseUpdateFirmwareVersionBody,
} from "@/lib/server/firmware/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid firmware id" }, { status: 400 });
  }

  try {
    const row = await getFirmwareVersionById(id);

    if (!row) {
      return NextResponse.json(
        { error: "Firmware version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(mapFirmwareVersion(row), { status: 200 });
  } catch (error) {
    console.error(`GET /api/firmware/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to load firmware version", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_UPDATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid firmware id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = parseUpdateFirmwareVersionBody(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const row = await updateFirmwareVersion(id, parsed.data);

    if (!row) {
      return NextResponse.json(
        { error: "Firmware version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(mapFirmwareVersion(row), { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/firmware/${id} failed:`, error);

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Firmware version already exists" },
        { status: 409 }
      );
    }

    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Referenced upload does not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update firmware version", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_DELETE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid firmware id" }, { status: 400 });
  }

  try {
    const deleted = await deleteFirmwareVersion(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Firmware version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/firmware/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete firmware version", details: String(error) },
      { status: 500 }
    );
  }
}