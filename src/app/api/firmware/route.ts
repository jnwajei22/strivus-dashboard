import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

const FIRMWARE_STATUSES = ["active", "staged", "deprecated", "archived"] as const;

function isValidFirmwareStatus(value: unknown): value is (typeof FIRMWARE_STATUSES)[number] {
  return typeof value === "string" && FIRMWARE_STATUSES.includes(value as any);
}

function isValidUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function isValidDate(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

type FirmwareRow = {
  id: string;
  version: string;
  release_date: string | null;
  release_notes: string | null;
  update_type: string | null;
  status: "active" | "staged" | "deprecated" | "archived";
  binary_upload_id: string | null;
  checksum: string | null;
  file_name: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.FIRMWARE_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rows = await sql`
      SELECT
        id,
        version,
        release_date,
        release_notes,
        update_type,
        status,
        binary_upload_id,
        checksum,
        file_name,
        created_by_user_id,
        created_at,
        updated_at
      FROM firmware_versions
      ORDER BY created_at DESC, version DESC
    `;

    return NextResponse.json(rows, { status: 200 });
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

    const version = typeof body?.version === "string" ? body.version.trim() : "";
    const release_date =
      body?.release_date == null || body.release_date === ""
        ? null
        : String(body.release_date).trim();
    const release_notes =
      body?.release_notes == null ? null : String(body.release_notes);
    const update_type =
      body?.update_type == null || body.update_type === ""
        ? null
        : String(body.update_type).trim();
    const status =
      body?.status == null || body.status === ""
        ? null
        : String(body.status).trim();
    const binary_upload_id =
      body?.binary_upload_id == null || body.binary_upload_id === ""
        ? null
        : String(body.binary_upload_id).trim();
    const checksum =
      body?.checksum == null || body.checksum === ""
        ? null
        : String(body.checksum).trim();
    const file_name =
      body?.file_name == null || body.file_name === ""
        ? null
        : String(body.file_name).trim();

    if (!version) {
      return NextResponse.json({ error: "version is required" }, { status: 400 });
    }

    if (release_date && !isValidDate(release_date)) {
      return NextResponse.json({ error: "release_date must be a valid date" }, { status: 400 });
    }

    if (status && !isValidFirmwareStatus(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${FIRMWARE_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    if (binary_upload_id && !isValidUuid(binary_upload_id)) {
      return NextResponse.json({ error: "binary_upload_id must be a valid UUID" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO firmware_versions (
        version,
        release_date,
        release_notes,
        update_type,
        status,
        binary_upload_id,
        checksum,
        file_name,
        created_by_user_id
      )
      VALUES (
        ${version},
        ${release_date},
        ${release_notes},
        ${update_type},
        COALESCE(${status}::firmware_status, 'staged'::firmware_status),
        ${binary_upload_id},
        ${checksum},
        ${file_name},
        ${auth.user.user_id}
      )
      RETURNING
        id,
        version,
        release_date,
        release_notes,
        update_type,
        status,
        binary_upload_id,
        checksum,
        file_name,
        created_by_user_id,
        created_at,
        updated_at
    `;

    return NextResponse.json(rows[0], { status: 201 });
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
