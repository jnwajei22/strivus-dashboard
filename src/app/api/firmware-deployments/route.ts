import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { mapFirmwareDeployment } from "@/lib/server/firmware/mappers";
import {
  createFirmwareDeployment,
  listFirmwareDeployments,
} from "@/lib/server/firmware/queries";
import { parseCreateFirmwareDeploymentBody } from "@/lib/server/firmware/validators";

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rows = await listFirmwareDeployments();
    return NextResponse.json(rows.map(mapFirmwareDeployment), { status: 200 });
  } catch (error) {
    console.error("GET /api/firmware-deployments failed:", error);
    return NextResponse.json(
      { error: "Failed to load firmware deployments", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_DEPLOY);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = parseCreateFirmwareDeploymentBody(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const row = await createFirmwareDeployment({
      ...parsed.data,
      initiatedByUserId: auth.user.user_id,
    });

    return NextResponse.json(mapFirmwareDeployment(row), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/firmware-deployments failed:", error);

    if (error?.code === "23503") {
      return NextResponse.json(
        {
          error:
            "Referenced firmware version, deployment group, device, or user does not exist",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create firmware deployment",
        details: String(error),
      },
      { status: 500 }
    );
  }
}