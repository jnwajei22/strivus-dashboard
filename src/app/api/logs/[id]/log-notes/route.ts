import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

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
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function asInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export async function GET(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.LOGS_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(asInt(searchParams.get("limit"), 25), 100);
  const offset = asInt(searchParams.get("offset"), 0);

  const q = (searchParams.get("q") ?? "").trim();
  const linkedDeviceId = (searchParams.get("linkedDeviceId") ?? "").trim();
  const linkedPatientId = (searchParams.get("linkedPatientId") ?? "").trim();
  const relatedSessionId = (searchParams.get("relatedSessionId") ?? "").trim();
  const type = (searchParams.get("type") ?? "").trim();
  const severity = (searchParams.get("severity") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();

  if (linkedDeviceId && !isUuid(linkedDeviceId)) {
    return NextResponse.json({ error: "Invalid linkedDeviceId" }, { status: 400 });
  }

  if (linkedPatientId && !isUuid(linkedPatientId)) {
    return NextResponse.json({ error: "Invalid linkedPatientId" }, { status: 400 });
  }

  if (relatedSessionId && !isUuid(relatedSessionId)) {
    return NextResponse.json({ error: "Invalid relatedSessionId" }, { status: 400 });
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
      WHERE
        (${q} = '' OR (
          COALESCE(ln.title, '') ILIKE ${`%${q}%`}
          OR COALESCE(ln.body, '') ILIKE ${`%${q}%`}
          OR COALESCE(ln.category, '') ILIKE ${`%${q}%`}
          OR COALESCE(d.device_serial, '') ILIKE ${`%${q}%`}
          OR COALESCE(d.display_name, '') ILIKE ${`%${q}%`}
          OR COALESCE(p.full_name, '') ILIKE ${`%${q}%`}
        ))
        AND (${linkedDeviceId} = '' OR ln.linked_device_id = ${linkedDeviceId})
        AND (${linkedPatientId} = '' OR ln.linked_patient_id = ${linkedPatientId})
        AND (${relatedSessionId} = '' OR ln.related_session_id = ${relatedSessionId})
        AND (${type} = '' OR ln.type::text = ${type})
        AND (${severity} = '' OR ln.severity::text = ${severity})
        AND (${status} = '' OR ln.status::text = ${status})
      ORDER BY ln.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/log-notes failed:", error);
    return NextResponse.json(
      { error: "Failed to load log notes", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.LOGS_UPDATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const authorUserId =
      body.author_user_id === undefined || body.author_user_id === null
        ? auth.user.user_id
        : String(body.author_user_id).trim();

    const linkedPatientId =
      body.linked_patient_id === undefined || body.linked_patient_id === null
        ? null
        : String(body.linked_patient_id).trim();

    const linkedDeviceId =
      body.linked_device_id === undefined || body.linked_device_id === null
        ? null
        : String(body.linked_device_id).trim();

    const relatedSessionId =
      body.related_session_id === undefined || body.related_session_id === null
        ? null
        : String(body.related_session_id).trim();

    const relatedCommandId =
      body.related_command_id === undefined || body.related_command_id === null
        ? null
        : String(body.related_command_id).trim();

    const type = String(body.type ?? "general").trim();
    const category =
      body.category === undefined || body.category === null
        ? null
        : String(body.category).trim();
    const severity = String(body.severity ?? "info").trim();
    const status = String(body.status ?? "info").trim();
    const title = String(body.title ?? "").trim();
    const bodyText =
      body.body === undefined || body.body === null ? null : String(body.body);

    if (authorUserId && !isUuid(authorUserId)) {
      return NextResponse.json({ error: "Invalid author_user_id" }, { status: 400 });
    }

    if (linkedPatientId && !isUuid(linkedPatientId)) {
      return NextResponse.json({ error: "Invalid linked_patient_id" }, { status: 400 });
    }

    if (linkedDeviceId && !isUuid(linkedDeviceId)) {
      return NextResponse.json({ error: "Invalid linked_device_id" }, { status: 400 });
    }

    if (relatedSessionId && !isUuid(relatedSessionId)) {
      return NextResponse.json({ error: "Invalid related_session_id" }, { status: 400 });
    }

    if (relatedCommandId && !isUuid(relatedCommandId)) {
      return NextResponse.json({ error: "Invalid related_command_id" }, { status: 400 });
    }

    if (!LOG_NOTE_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!ALERT_SEVERITIES.has(severity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }

    if (!ALERT_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO logs_notes (
        author_user_id,
        linked_patient_id,
        linked_device_id,
        related_session_id,
        related_command_id,
        type,
        category,
        severity,
        status,
        title,
        body
      )
      VALUES (
        ${authorUserId},
        ${linkedPatientId},
        ${linkedDeviceId},
        ${relatedSessionId},
        ${relatedCommandId},
        ${type},
        ${category},
        ${severity},
        ${status},
        ${title},
        ${bodyText}
      )
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/log-notes failed:", error);
    return NextResponse.json(
      { error: "Failed to create log note", details: String(error) },
      { status: 500 }
    );
  }
}
