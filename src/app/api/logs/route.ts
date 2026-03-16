import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type DeviceLogRow = {
  id: string;
  device_id: string;
  request_id: string | null;
  log_type: string;
  status: string | null;
  line_count: number | null;
  log_text: string | null;
  created_at: string;
  updated_at: string;
  device_serial: string;
  device_name: string | null;
  patient_id: string | null;
  patient_name: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
  const deviceId = (searchParams.get("deviceId") ?? "").trim();
  const patientId = (searchParams.get("patientId") ?? "").trim();
  const logType = (searchParams.get("logType") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();

  if (deviceId && !isUuid(deviceId)) {
    return NextResponse.json({ error: "Invalid deviceId" }, { status: 400 });
  }

  if (patientId && !isUuid(patientId)) {
    return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT
        dl.id,
        dl.device_id,
        dl.request_id,
        dl.log_type,
        dl.status,
        dl.line_count,
        dl.log_text,
        dl.created_at,
        dl.updated_at,
        d.device_serial,
        d.display_name AS device_name,
        d.current_patient_id AS patient_id,
        p.full_name AS patient_name
      FROM device_logs dl
      INNER JOIN devices d
        ON d.id = dl.device_id
      LEFT JOIN patients p
        ON p.id = d.current_patient_id
      WHERE
        (${q} = '' OR (
          COALESCE(dl.request_id, '') ILIKE ${`%${q}%`}
          OR COALESCE(dl.log_type, '') ILIKE ${`%${q}%`}
          OR COALESCE(dl.status, '') ILIKE ${`%${q}%`}
          OR COALESCE(dl.log_text, '') ILIKE ${`%${q}%`}
          OR COALESCE(d.device_serial, '') ILIKE ${`%${q}%`}
          OR COALESCE(d.display_name, '') ILIKE ${`%${q}%`}
          OR COALESCE(p.full_name, '') ILIKE ${`%${q}%`}
        ))
        AND (${deviceId} = '' OR dl.device_id = ${deviceId})
        AND (${patientId} = '' OR d.current_patient_id = ${patientId})
        AND (${logType} = '' OR dl.log_type = ${logType})
        AND (${status} = '' OR COALESCE(dl.status, '') = ${status})
      ORDER BY dl.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/logs failed:", error);
    return NextResponse.json(
      { error: "Failed to load logs", details: String(error) },
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

    const deviceId = String(body.device_id ?? "").trim();
    const requestId =
      body.request_id === undefined || body.request_id === null
        ? null
        : String(body.request_id).trim();
    const logType = String(body.log_type ?? "").trim();
    const status =
      body.status === undefined || body.status === null
        ? null
        : String(body.status).trim();
    const lineCount =
      body.line_count === undefined || body.line_count === null
        ? null
        : Number(body.line_count);
    const logText =
      body.log_text === undefined || body.log_text === null
        ? null
        : String(body.log_text);

    if (!deviceId || !isUuid(deviceId)) {
      return NextResponse.json({ error: "Valid device_id is required" }, { status: 400 });
    }

    if (!logType) {
      return NextResponse.json({ error: "log_type is required" }, { status: 400 });
    }

    if (lineCount !== null && (!Number.isInteger(lineCount) || lineCount < 0)) {
      return NextResponse.json({ error: "line_count must be a non-negative integer" }, { status: 400 });
    }

    const deviceExists = await sql`
      SELECT id
      FROM devices
      WHERE id = ${deviceId}
      LIMIT 1
    `;

    if (!deviceExists[0]) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const rows = await sql`
      INSERT INTO device_logs (
        device_id,
        request_id,
        log_type,
        status,
        line_count,
        log_text
      )
      VALUES (
        ${deviceId},
        ${requestId},
        ${logType},
        ${status},
        ${lineCount},
        ${logText}
      )
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/logs failed:", error);
    return NextResponse.json(
      { error: "Failed to create log", details: String(error) },
      { status: 500 }
    );
  }
}
