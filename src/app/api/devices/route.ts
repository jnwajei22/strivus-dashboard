import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/server/auth/permissions";
import { requirePermission } from "@/lib/server/auth/guards";
import {
  createDevice,
  listDevices,
} from "@/lib/server/devices/queries";
import { mapDeviceRow } from "@/lib/server/devices/mappers";
import type { CreateDeviceBody } from "@/lib/server/devices/types";
import {
  validateCreateDeviceBody,
  validateListParams,
} from "@/lib/server/devices/validators";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.DEVICES_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const searchParams = req.nextUrl.searchParams;

    const validated = validateListParams({
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      patientId: searchParams.get("patientId"),
      limit: Number(searchParams.get("limit") ?? "50"),
      offset: Number(searchParams.get("offset") ?? "0"),
    });

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { rows, total } = await listDevices(validated.data);

    return NextResponse.json(
      {
        devices: rows.map(mapDeviceRow),
        pagination: {
          total,
          limit: validated.data.limit,
          offset: validated.data.offset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/devices failed:", error);
    return NextResponse.json(
      { error: "Failed to load devices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.DEVICES_REGISTER);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as CreateDeviceBody;
    const validated = validateCreateDeviceBody(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const row = await createDevice(validated.data);

    return NextResponse.json(
      { device: mapDeviceRow(row!) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/devices failed:", error);

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
      { error: "Failed to create device" },
      { status: 500 }
    );
  }
}