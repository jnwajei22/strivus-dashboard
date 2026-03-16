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

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Firmware deployment not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error(`GET /api/firmware/deployments/${id} failed:`, error);
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

    const deployment_group_id =
      body?.deployment_group_id === undefined
        ? undefined
        : body.deployment_group_id == null || body.deployment_group_id === ""
          ? null
          : String(body.deployment_group_id).trim();

    const device_id =
      body?.device_id === undefined
        ? undefined
        : body.device_id == null || body.device_id === ""
          ? null
          : String(body.device_id).trim();

    const status =
      body?.status === undefined
        ? undefined
        : body.status == null || body.status === ""
          ? null
          : String(body.status).trim();

    const started_at =
      body?.started_at === undefined
        ? undefined
        : body.started_at == null || body.started_at === ""
          ? null
          : String(body.started_at).trim();

    const completed_at =
      body?.completed_at === undefined
        ? undefined
        : body.completed_at == null || body.completed_at === ""
          ? null
          : String(body.completed_at).trim();

    const rolled_back_at =
      body?.rolled_back_at === undefined
        ? undefined
        : body.rolled_back_at == null || body.rolled_back_at === ""
          ? null
          : String(body.rolled_back_at).trim();

    const notes =
      body?.notes === undefined
        ? undefined
        : body.notes == null || body.notes === ""
          ? null
          : String(body.notes);

    if (deployment_group_id !== undefined && deployment_group_id !== null && !isValidUuid(deployment_group_id)) {
      return NextResponse.json(
        { error: "deployment_group_id must be a valid UUID" },
        { status: 400 }
      );
    }

    if (device_id !== undefined && device_id !== null && !isValidUuid(device_id)) {
      return NextResponse.json({ error: "device_id must be a valid UUID" }, { status: 400 });
    }

    if (status !== undefined && status !== null && !isValidDeploymentStatus(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${DEPLOYMENT_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    if (started_at !== undefined && started_at !== null && !isValidDateTime(started_at)) {
      return NextResponse.json({ error: "started_at must be a valid datetime" }, { status: 400 });
    }

    if (completed_at !== undefined && completed_at !== null && !isValidDateTime(completed_at)) {
      return NextResponse.json({ error: "completed_at must be a valid datetime" }, { status: 400 });
    }

    if (rolled_back_at !== undefined && rolled_back_at !== null && !isValidDateTime(rolled_back_at)) {
      return NextResponse.json({ error: "rolled_back_at must be a valid datetime" }, { status: 400 });
    }

    const rows = await sql`
      UPDATE firmware_deployments
      SET
        deployment_group_id = CASE
          WHEN ${deployment_group_id === undefined} THEN deployment_group_id
          ELSE ${deployment_group_id}
        END,
        device_id = CASE
          WHEN ${device_id === undefined} THEN device_id
          ELSE ${device_id}
        END,
        status = CASE
          WHEN ${status === undefined} THEN status
          ELSE ${status}::deployment_status
        END,
        started_at = CASE
          WHEN ${started_at === undefined} THEN started_at
          ELSE ${started_at}
        END,
        completed_at = CASE
          WHEN ${completed_at === undefined} THEN completed_at
          ELSE ${completed_at}
        END,
        rolled_back_at = CASE
          WHEN ${rolled_back_at === undefined} THEN rolled_back_at
          ELSE ${rolled_back_at}
        END,
        notes = CASE
          WHEN ${notes === undefined} THEN notes
          ELSE ${notes}
        END
      WHERE id = ${id}
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

    if (!rows.length) {
      return NextResponse.json({ error: "Firmware deployment not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/firmware/deployments/${id} failed:`, error);

    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Referenced deployment group or device does not exist" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update firmware deployment", details: String(error) },
      { status: 500 }
    );
  }
}
