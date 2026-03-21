import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { mapFirmwareVersion } from "@/lib/server/firmware/mappers";
import {
  createFirmwareVersion,
  listFirmwareVersions,
} from "@/lib/server/firmware/queries";
import { parseCreateFirmwareVersionBody } from "@/lib/server/firmware/validators";

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rows = await listFirmwareVersions();
    return NextResponse.json(rows.map(mapFirmwareVersion), { status: 200 });
  } catch (error) {
    console.error("GET /api/firmware failed:", error);
    return NextResponse.json(
      { error: "Failed to load firmware versions", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_CREATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = parseCreateFirmwareVersionBody(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const row = await createFirmwareVersion({
      ...parsed.data,
      createdByUserId: auth.user.user_id,
    });

    return NextResponse.json(mapFirmwareVersion(row), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/firmware failed:", error);

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Firmware version already exists" },
        { status: 409 }
      );
    }

    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Referenced upload or user does not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create firmware version", details: String(error) },
      { status: 500 }
    );
  }
}