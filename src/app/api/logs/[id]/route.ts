import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(_: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.LOGS_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid log id" }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT
        dl.*,
        d.device_serial,
        d.display_name AS device_name,
        d.current_patient_id AS patient_id,
        p.full_name AS patient_name
      FROM device_logs dl
      INNER JOIN devices d
        ON d.id = dl.device_id
      LEFT JOIN patients p
        ON p.id = d.current_patient_id
      WHERE dl.id = ${id}
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error("GET /api/logs/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load log", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.LOGS_UPDATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid log id" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const requestId =
      body.request_id === undefined ? undefined :
      body.request_id === null ? null : String(body.request_id).trim();

    const logType =
      body.log_type === undefined ? undefined :
      String(body.log_type ?? "").trim();

    const status =
      body.status === undefined ? undefined :
      body.status === null ? null : String(body.status).trim();

    const lineCount =
      body.line_count === undefined ? undefined :
      body.line_count === null ? null : Number(body.line_count);

    const logText =
      body.log_text === undefined ? undefined :
      body.log_text === null ? null : String(body.log_text);

    if (logType !== undefined && !logType) {
      return NextResponse.json({ error: "log_type cannot be empty" }, { status: 400 });
    }

    if (
      lineCount !== undefined &&
      lineCount !== null &&
      (!Number.isInteger(lineCount) || lineCount < 0)
    ) {
      return NextResponse.json({ error: "line_count must be a non-negative integer" }, { status: 400 });
    }

    const existing = await sql`
      SELECT id
      FROM device_logs
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!existing[0]) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    const rows = await sql`
      UPDATE device_logs
      SET
        request_id = CASE
          WHEN ${requestId === undefined} THEN request_id
          ELSE ${requestId}
        END,
        log_type = CASE
          WHEN ${logType === undefined} THEN log_type
          ELSE ${logType}
        END,
        status = CASE
          WHEN ${status === undefined} THEN status
          ELSE ${status}
        END,
        line_count = CASE
          WHEN ${lineCount === undefined} THEN line_count
          ELSE ${lineCount}
        END,
        log_text = CASE
          WHEN ${logText === undefined} THEN log_text
          ELSE ${logText}
        END,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error("PATCH /api/logs/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update log", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.LOGS_DELETE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid log id" }, { status: 400 });
  }

  try {
    const rows = await sql`
      DELETE FROM device_logs
      WHERE id = ${id}
      RETURNING id
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/logs/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete log", details: String(error) },
      { status: 500 }
    );
  }
}
