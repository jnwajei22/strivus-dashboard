import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const LOG_NOTE_TYPES = new Set([
  "system",
  "alert",
  "command",
  "note",
  "firmware",
  "auth",
  "device",
  "patient",
  "general",
]);

const ALERT_SEVERITIES = new Set(["info", "warning", "error", "critical"]);
const ALERT_STATUSES = new Set(["open", "resolved", "pending", "info"]);

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
    return NextResponse.json({ error: "Invalid log note id" }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT
        ln.*,
        d.device_serial,
        d.display_name AS device_name,
        p.full_name AS patient_name
      FROM logs_notes ln
      LEFT JOIN devices d
        ON d.id = ln.linked_device_id
      LEFT JOIN patients p
        ON p.id = ln.linked_patient_id
      WHERE ln.id = ${id}
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Log note not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error("GET /api/log-notes/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load log note", details: String(error) },
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
    return NextResponse.json({ error: "Invalid log note id" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const linkedPatientId =
      body.linked_patient_id === undefined
        ? undefined
        : body.linked_patient_id === null
          ? null
          : String(body.linked_patient_id).trim();

    const linkedDeviceId =
      body.linked_device_id === undefined
        ? undefined
        : body.linked_device_id === null
          ? null
          : String(body.linked_device_id).trim();

    const relatedSessionId =
      body.related_session_id === undefined
        ? undefined
        : body.related_session_id === null
          ? null
          : String(body.related_session_id).trim();

    const relatedCommandId =
      body.related_command_id === undefined
        ? undefined
        : body.related_command_id === null
          ? null
          : String(body.related_command_id).trim();

    const type =
      body.type === undefined ? undefined : String(body.type).trim();

    const category =
      body.category === undefined
        ? undefined
        : body.category === null
          ? null
          : String(body.category).trim();

    const severity =
      body.severity === undefined ? undefined : String(body.severity).trim();

    const status =
      body.status === undefined ? undefined : String(body.status).trim();

    const title =
      body.title === undefined ? undefined : String(body.title).trim();

    const bodyText =
      body.body === undefined
        ? undefined
        : body.body === null
          ? null
          : String(body.body);

    if (linkedPatientId !== undefined && linkedPatientId !== null && !isUuid(linkedPatientId)) {
      return NextResponse.json({ error: "Invalid linked_patient_id" }, { status: 400 });
    }

    if (linkedDeviceId !== undefined && linkedDeviceId !== null && !isUuid(linkedDeviceId)) {
      return NextResponse.json({ error: "Invalid linked_device_id" }, { status: 400 });
    }

    if (relatedSessionId !== undefined && relatedSessionId !== null && !isUuid(relatedSessionId)) {
      return NextResponse.json({ error: "Invalid related_session_id" }, { status: 400 });
    }

    if (relatedCommandId !== undefined && relatedCommandId !== null && !isUuid(relatedCommandId)) {
      return NextResponse.json({ error: "Invalid related_command_id" }, { status: 400 });
    }

    if (type !== undefined && !LOG_NOTE_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (severity !== undefined && !ALERT_SEVERITIES.has(severity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }

    if (status !== undefined && !ALERT_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (title !== undefined && !title) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    }

    const existing = await sql`
      SELECT id
      FROM logs_notes
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!existing[0]) {
      return NextResponse.json({ error: "Log note not found" }, { status: 404 });
    }

    const rows = await sql`
      UPDATE logs_notes
      SET
        linked_patient_id = CASE
          WHEN ${linkedPatientId === undefined} THEN linked_patient_id
          ELSE ${linkedPatientId}
        END,
        linked_device_id = CASE
          WHEN ${linkedDeviceId === undefined} THEN linked_device_id
          ELSE ${linkedDeviceId}
        END,
        related_session_id = CASE
          WHEN ${relatedSessionId === undefined} THEN related_session_id
          ELSE ${relatedSessionId}
        END,
        related_command_id = CASE
          WHEN ${relatedCommandId === undefined} THEN related_command_id
          ELSE ${relatedCommandId}
        END,
        type = CASE
          WHEN ${type === undefined} THEN type
          ELSE ${type}
        END,
        category = CASE
          WHEN ${category === undefined} THEN category
          ELSE ${category}
        END,
        severity = CASE
          WHEN ${severity === undefined} THEN severity
          ELSE ${severity}
        END,
        status = CASE
          WHEN ${status === undefined} THEN status
          ELSE ${status}
        END,
        title = CASE
          WHEN ${title === undefined} THEN title
          ELSE ${title}
        END,
        body = CASE
          WHEN ${bodyText === undefined} THEN body
          ELSE ${bodyText}
        END,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error("PATCH /api/log-notes/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update log note", details: String(error) },
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
    return NextResponse.json({ error: "Invalid log note id" }, { status: 400 });
  }

  try {
    const rows = await sql`
      DELETE FROM logs_notes
      WHERE id = ${id}
      RETURNING id
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Log note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/log-notes/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete log note", details: String(error) },
      { status: 500 }
    );
  }
}
