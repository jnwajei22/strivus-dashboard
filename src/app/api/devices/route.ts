import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

const ALLOWED_DEVICE_STATUSES = [
  "online",
  "offline",
  "syncing",
  "warning",
  "idle",
] as const;

type DeviceStatus = (typeof ALLOWED_DEVICE_STATUSES)[number];

type DeviceRow = {
  id: string;
  device_serial: string;
  device_uid: string | null;
  display_name: string | null;
  device_model_id: string | null;
  hardware_revision: string | null;
  firmware_version_id: string | null;
  current_patient_id: string | null;
  deployment_group_id: string | null;
  status: DeviceStatus;
  battery_percent: string | number | null;
  signal_dbm: string | number | null;
  last_sync_at: string | null;
  last_contact_at: string | null;
  registered_at: string | null;
  retired_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CreateDeviceBody = {
  deviceSerial?: string;
  deviceUid?: string | null;
  displayName?: string | null;
  deviceModelId?: string | null;
  hardwareRevision?: string | null;
  firmwareVersionId?: string | null;
  currentPatientId?: string | null;
  deploymentGroupId?: string | null;
  status?: string;
  batteryPercent?: number | null;
  signalDbm?: number | null;
  lastSyncAt?: string | null;
  lastContactAt?: string | null;
  registeredAt?: string | null;
  retiredAt?: string | null;
  notes?: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeOptionalText(value: unknown) {
  if (value == null) return null;
  const str = String(value).trim();
  return str.length ? str : null;
}

function normalizeOptionalNumber(value: unknown) {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

function normalizeOptionalDate(value: unknown) {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isAllowedStatus(value: string): value is DeviceStatus {
  return ALLOWED_DEVICE_STATUSES.includes(value as DeviceStatus);
}

function mapDeviceRow(row: DeviceRow) {
  return {
    id: row.id,
    deviceSerial: row.device_serial,
    deviceUid: row.device_uid,
    displayName: row.display_name,
    deviceModelId: row.device_model_id,
    hardwareRevision: row.hardware_revision,
    firmwareVersionId: row.firmware_version_id,
    currentPatientId: row.current_patient_id,
    deploymentGroupId: row.deployment_group_id,
    status: row.status,
    batteryPercent:
      row.battery_percent == null ? null : Number(row.battery_percent),
    signalDbm: row.signal_dbm == null ? null : Number(row.signal_dbm),
    lastSyncAt: row.last_sync_at,
    lastContactAt: row.last_contact_at,
    registeredAt: row.registered_at,
    retiredAt: row.retired_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.DEVICES_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const patientId = searchParams.get("patientId")?.trim() ?? "";
    const limitParam = Number(searchParams.get("limit") ?? "50");
    const offsetParam = Number(searchParams.get("offset") ?? "0");

    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 200)
      : 50;
    const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

    if (patientId && !isUuid(patientId)) {
      return NextResponse.json(
        { error: "Invalid patientId" },
        { status: 400 }
      );
    }

    if (status && !isAllowedStatus(status)) {
      return NextResponse.json(
        { error: "Invalid device status" },
        { status: 400 }
      );
    }

    const searchValue = search ? `%${search}%` : null;
    const statusValue = status || null;
    const patientIdValue = patientId || null;

    const rows = (await sql`
      SELECT
        id,
        device_serial,
        device_uid,
        display_name,
        device_model_id,
        hardware_revision,
        firmware_version_id,
        current_patient_id,
        deployment_group_id,
        status,
        battery_percent,
        signal_dbm,
        last_sync_at,
        last_contact_at,
        registered_at,
        retired_at,
        notes,
        created_at,
        updated_at
      FROM devices
      WHERE (${searchValue}::text IS NULL OR (
        device_serial ILIKE ${searchValue}
        OR COALESCE(display_name, '') ILIKE ${searchValue}
        OR COALESCE(device_uid, '') ILIKE ${searchValue}
      ))
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
        AND (${patientIdValue}::uuid IS NULL OR current_patient_id = ${patientIdValue})
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `) as DeviceRow[];

    const countRows = (await sql`
      SELECT COUNT(*)::text AS count
      FROM devices
      WHERE (${searchValue}::text IS NULL OR (
        device_serial ILIKE ${searchValue}
        OR COALESCE(display_name, '') ILIKE ${searchValue}
        OR COALESCE(device_uid, '') ILIKE ${searchValue}
      ))
        AND (${statusValue}::text IS NULL OR status = ${statusValue})
        AND (${patientIdValue}::uuid IS NULL OR current_patient_id = ${patientIdValue})
    `) as { count: string }[];

    return NextResponse.json(
      {
        devices: rows.map(mapDeviceRow),
        pagination: {
          total: Number(countRows[0]?.count ?? 0),
          limit,
          offset,
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

    const deviceSerial = normalizeOptionalText(body.deviceSerial);
    const deviceUid = normalizeOptionalText(body.deviceUid);
    const displayName = normalizeOptionalText(body.displayName);
    const deviceModelId = normalizeOptionalText(body.deviceModelId);
    const hardwareRevision = normalizeOptionalText(body.hardwareRevision);
    const firmwareVersionId = normalizeOptionalText(body.firmwareVersionId);
    const currentPatientId = normalizeOptionalText(body.currentPatientId);
    const deploymentGroupId = normalizeOptionalText(body.deploymentGroupId);
    const status = normalizeOptionalText(body.status) ?? "idle";
    const batteryPercent = normalizeOptionalNumber(body.batteryPercent);
    const signalDbm = normalizeOptionalNumber(body.signalDbm);
    const lastSyncAt = normalizeOptionalDate(body.lastSyncAt);
    const lastContactAt = normalizeOptionalDate(body.lastContactAt);
    const registeredAt = normalizeOptionalDate(body.registeredAt);
    const retiredAt = normalizeOptionalDate(body.retiredAt);
    const notes = normalizeOptionalText(body.notes);

    if (!deviceSerial) {
      return NextResponse.json(
        { error: "deviceSerial is required" },
        { status: 400 }
      );
    }

    if (deviceModelId && !isUuid(deviceModelId)) {
      return NextResponse.json(
        { error: "deviceModelId must be a valid UUID" },
        { status: 400 }
      );
    }

    if (firmwareVersionId && !isUuid(firmwareVersionId)) {
      return NextResponse.json(
        { error: "firmwareVersionId must be a valid UUID" },
        { status: 400 }
      );
    }

    if (currentPatientId && !isUuid(currentPatientId)) {
      return NextResponse.json(
        { error: "currentPatientId must be a valid UUID" },
        { status: 400 }
      );
    }

    if (deploymentGroupId && !isUuid(deploymentGroupId)) {
      return NextResponse.json(
        { error: "deploymentGroupId must be a valid UUID" },
        { status: 400 }
      );
    }

    if (Number.isNaN(batteryPercent)) {
      return NextResponse.json(
        { error: "batteryPercent must be a number" },
        { status: 400 }
      );
    }

    if (Number.isNaN(signalDbm)) {
      return NextResponse.json(
        { error: "signalDbm must be a number" },
        { status: 400 }
      );
    }

    if (
      batteryPercent != null &&
      (batteryPercent < 0 || batteryPercent > 100)
    ) {
      return NextResponse.json(
        { error: "batteryPercent must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (!isAllowedStatus(status)) {
      return NextResponse.json(
        { error: "Invalid device status" },
        { status: 400 }
      );
    }

    const rows = (await sql`
      INSERT INTO devices (
        device_serial,
        device_uid,
        display_name,
        device_model_id,
        hardware_revision,
        firmware_version_id,
        current_patient_id,
        deployment_group_id,
        status,
        battery_percent,
        signal_dbm,
        last_sync_at,
        last_contact_at,
        registered_at,
        retired_at,
        notes
      )
      VALUES (
        ${deviceSerial},
        ${deviceUid},
        ${displayName},
        ${deviceModelId},
        ${hardwareRevision},
        ${firmwareVersionId},
        ${currentPatientId},
        ${deploymentGroupId},
        ${status},
        ${batteryPercent},
        ${signalDbm},
        ${lastSyncAt},
        ${lastContactAt},
        ${registeredAt},
        ${retiredAt},
        ${notes}
      )
      RETURNING
        id,
        device_serial,
        device_uid,
        display_name,
        device_model_id,
        hardware_revision,
        firmware_version_id,
        current_patient_id,
        deployment_group_id,
        status,
        battery_percent,
        signal_dbm,
        last_sync_at,
        last_contact_at,
        registered_at,
        retired_at,
        notes,
        created_at,
        updated_at
    `) as DeviceRow[];

    return NextResponse.json(
      { device: mapDeviceRow(rows[0]) },
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
