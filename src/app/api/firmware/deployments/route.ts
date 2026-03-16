import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

const DEPLOYMENT_STATUSES = [
  "pending",
  "staged",
  "in_progress",
  "success",
  "failed",
  "rolled_back",
  "cancelled",
] as const;

function isValidDeploymentStatus(value: unknown): value is (typeof DEPLOYMENT_STATUSES)[number] {
  return typeof value === "string" && DEPLOYMENT_STATUSES.includes(value as any);
}

function isValidUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function isValidDateTime(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

type DeploymentRow = {
  id: string;
  firmware_version_id: string;
  deployment_group_id: string | null;
  device_id: string | null;
  initiated_by_user_id: string | null;
  status:
    | "pending"
    | "staged"
    | "in_progress"
    | "success"
    | "failed"
    | "rolled_back"
    | "cancelled";
  started_at: string | null;
  completed_at: string | null;
  rolled_back_at: string | null;
  notes: string | null;
  created_at: string;
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
        firmware_version_id,
        deployment_group_id,
        device_id,
        initiated_by_user_id,
        status,
        started_at,
        completed_at,
        rolled_back_at,
        notes,
        created_at
      FROM firmware_deployments
      ORDER BY created_at DESC
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/firmware/deployments failed:", error);
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

    const firmware_version_id =
      typeof body?.firmware_version_id === "string"
        ? body.firmware_version_id.trim()
        : "";

    const deployment_group_id =
      body?.deployment_group_id == null || body.deployment_group_id === ""
        ? null
        : String(body.deployment_group_id).trim();

    const device_id =
      body?.device_id == null || body.device_id === ""
        ? null
        : String(body.device_id).trim();

    const status =
      body?.status == null || body.status === ""
        ? null
        : String(body.status).trim();

    const started_at =
      body?.started_at == null || body.started_at === ""
        ? null
        : String(body.started_at).trim();

    const completed_at =
      body?.completed_at == null || body.completed_at === ""
        ? null
        : String(body.completed_at).trim();

    const rolled_back_at =
      body?.rolled_back_at == null || body.rolled_back_at === ""
        ? null
        : String(body.rolled_back_at).trim();

    const notes =
      body?.notes == null || body.notes === ""
        ? null
        : String(body.notes);

    if (!firmware_version_id || !isValidUuid(firmware_version_id)) {
      return NextResponse.json(
        { error: "firmware_version_id is required and must be a valid UUID" },
        { status: 400 }
      );
    }

    if (deployment_group_id && !isValidUuid(deployment_group_id)) {
      return NextResponse.json(
        { error: "deployment_group_id must be a valid UUID" },
        { status: 400 }
      );
    }

    if (device_id && !isValidUuid(device_id)) {
      return NextResponse.json({ error: "device_id must be a valid UUID" }, { status: 400 });
    }

    if (status && !isValidDeploymentStatus(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${DEPLOYMENT_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    if (started_at && !isValidDateTime(started_at)) {
      return NextResponse.json({ error: "started_at must be a valid datetime" }, { status: 400 });
    }

    if (completed_at && !isValidDateTime(completed_at)) {
      return NextResponse.json({ error: "completed_at must be a valid datetime" }, { status: 400 });
    }

    if (rolled_back_at && !isValidDateTime(rolled_back_at)) {
      return NextResponse.json({ error: "rolled_back_at must be a valid datetime" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO firmware_deployments (
        firmware_version_id,
        deployment_group_id,
        device_id,
        initiated_by_user_id,
        status,
        started_at,
        completed_at,
        rolled_back_at,
        notes
      )
      VALUES (
        ${firmware_version_id},
        ${deployment_group_id},
        ${device_id},
        ${auth.user.user_id},
        COALESCE(${status}::deployment_status, 'pending'::deployment_status),
        ${started_at},
        ${completed_at},
        ${rolled_back_at},
        ${notes}
      )
      RETURNING
        id,
        firmware_version_id,
        deployment_group_id,
        device_id,
        initiated_by_user_id,
        status,
        started_at,
        completed_at,
        rolled_back_at,
        notes,
        created_at
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error("POST /api/firmware/deployments failed:", error);

    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Referenced firmware version, device, deployment group, or user does not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create firmware deployment", details: String(error) },
      { status: 500 }
    );
  }
}
