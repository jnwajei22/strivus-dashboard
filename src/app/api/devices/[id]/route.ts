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

type UpdateDeviceBody = {
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

type RouteContext = {
  params: Promise<{ id: string }>;
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

async function getDeviceById(id: string) {
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
    WHERE id = ${id}
    LIMIT 1
  `) as DeviceRow[];

  return rows[0] ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requirePermission(PERMISSIONS.DEVICES_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Invalid device id" },
        { status: 400 }
      );
    }

    const device = await getDeviceById(id);

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { device: mapDeviceRow(device) },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/devices/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load device" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requirePermission(PERMISSIONS.DEVICES_UPDATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Invalid device id" },
        { status: 400 }
      );
    }

    const existing = await getDeviceById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    const body = (await req.json()) as UpdateDeviceBody;

    const deviceSerial =
      body.deviceSerial !== undefined
        ? normalizeOptionalText(body.deviceSerial)
        : existing.device_serial;

    const deviceUid =
      body.deviceUid !== undefined
        ? normalizeOptionalText(body.deviceUid)
        : existing.device_uid;

    const displayName =
      body.displayName !== undefined
        ? normalizeOptionalText(body.displayName)
        : existing.display_name;

    const deviceModelId =
      body.deviceModelId !== undefined
        ? normalizeOptionalText(body.deviceModelId)
        : existing.device_model_id;

    const hardwareRevision =
      body.hardwareRevision !== undefined
        ? normalizeOptionalText(body.hardwareRevision)
        : existing.hardware_revision;

    const firmwareVersionId =
      body.firmwareVersionId !== undefined
        ? normalizeOptionalText(body.firmwareVersionId)
        : existing.firmware_version_id;

    const currentPatientId =
      body.currentPatientId !== undefined
        ? normalizeOptionalText(body.currentPatientId)
        : existing.current_patient_id;

    const deploymentGroupId =
      body.deploymentGroupId !== undefined
        ? normalizeOptionalText(body.deploymentGroupId)
        : existing.deployment_group_id;

    const status =
      body.status !== undefined
        ? normalizeOptionalText(body.status)
        : existing.status;

    const batteryPercent =
      body.batteryPercent !== undefined
        ? normalizeOptionalNumber(body.batteryPercent)
        : existing.battery_percent == null
          ? null
          : Number(existing.battery_percent);

    const signalDbm =
      body.signalDbm !== undefined
        ? normalizeOptionalNumber(body.signalDbm)
        : existing.signal_dbm == null
          ? null
          : Number(existing.signal_dbm);

    const lastSyncAt =
      body.lastSyncAt !== undefined
        ? normalizeOptionalDate(body.lastSyncAt)
        : existing.last_sync_at;

    const lastContactAt =
      body.lastContactAt !== undefined
        ? normalizeOptionalDate(body.lastContactAt)
        : existing.last_contact_at;

    const registeredAt =
      body.registeredAt !== undefined
        ? normalizeOptionalDate(body.registeredAt)
        : existing.registered_at;

    const retiredAt =
      body.retiredAt !== undefined
        ? normalizeOptionalDate(body.retiredAt)
        : existing.retired_at;

    const notes =
      body.notes !== undefined
        ? normalizeOptionalText(body.notes)
        : existing.notes;

    if (!deviceSerial) {
      return NextResponse.json(
        { error: "deviceSerial cannot be empty" },
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

    if (batteryPercent != null && Number.isNaN(batteryPercent)) {
      return NextResponse.json(
        { error: "batteryPercent must be a number" },
        { status: 400 }
      );
    }

    if (signalDbm != null && Number.isNaN(signalDbm)) {
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

    if (!status || !isAllowedStatus(status)) {
      return NextResponse.json(
        { error: "Invalid device status" },
        { status: 400 }
      );
    }

    const rows = (await sql`
      UPDATE devices
      SET
        device_serial = ${deviceSerial},
        device_uid = ${deviceUid},
        display_name = ${displayName},
        device_model_id = ${deviceModelId},
        hardware_revision = ${hardwareRevision},
        firmware_version_id = ${firmwareVersionId},
        current_patient_id = ${currentPatientId},
        deployment_group_id = ${deploymentGroupId},
        status = ${status},
        battery_percent = ${batteryPercent},
        signal_dbm = ${signalDbm},
        last_sync_at = ${lastSyncAt},
        last_contact_at = ${lastContactAt},
        registered_at = ${registeredAt},
        retired_at = ${retiredAt},
        notes = ${notes},
        updated_at = NOW()
      WHERE id = ${id}
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
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PATCH /api/devices/[id] failed:", error);

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
      { error: "Failed to update device" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requirePermission(PERMISSIONS.DEVICES_DELETE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Invalid device id" },
        { status: 400 }
      );
    }

    const existing = await getDeviceById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    await sql`
      DELETE FROM devices
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/devices/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete device" },
      { status: 500 }
    );
  }
}
