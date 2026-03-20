import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/server/auth/permissions";
import { mapFirmwareDeployment } from "@/lib/server/firmware/mappers";
import {
  deleteFirmwareDeployment,
  getFirmwareDeploymentById,
  updateFirmwareDeployment,
} from "@/lib/server/firmware/queries";
import {
  isValidUuid,
  parseUpdateFirmwareDeploymentBody,
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
    return NextResponse.json({ error: "Invalid deployment id" }, { status: 400 });
  }

  try {
    const row = await getFirmwareDeploymentById(id);

    if (!row) {
      return NextResponse.json(
        { error: "Firmware deployment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(mapFirmwareDeployment(row), { status: 200 });
  } catch (error) {
    console.error(`GET /api/firmware-deployments/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to load firmware deployment", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_DEPLOY);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid deployment id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = parseUpdateFirmwareDeploymentBody(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const row = await updateFirmwareDeployment(id, parsed.data);

    if (!row) {
      return NextResponse.json(
        { error: "Firmware deployment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(mapFirmwareDeployment(row), { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/firmware-deployments/${id} failed:`, error);

    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Referenced deployment group or device does not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update firmware deployment",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_DEPLOY);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid deployment id" }, { status: 400 });
  }

  try {
    const deleted = await deleteFirmwareDeployment(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Firmware deployment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/firmware-deployments/${id} failed:`, error);
    return NextResponse.json(
      {
        error: "Failed to delete firmware deployment",
        details: String(error),
      },
      { status: 500 }
    );
  }
}