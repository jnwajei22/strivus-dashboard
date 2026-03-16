import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PatientCoreRow = {
  id: string;
  external_id?: string | null;
  first_name: string;
  last_name: string;
  full_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  height_value: string | number | null;
  height_unit: string | null;
  weight_value: string | number | null;
  weight_unit: string | null;
  email: string | null;
  phone: string | null;
  medicare_id: string | null;
  provider_name: string | null;
  status: string;
  enrolled_at: string | null;
  discharged_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DeviceRow = {
  id: string;
  device_serial: string;
  display_name: string | null;
  status: string;
  battery_percent: string | number | null;
  signal_dbm: string | number | null;
  last_sync_at: string | null;
  last_contact_at: string | null;
  deployment_group_name: string | null;
  firmware_version: string | null;
};

type WorkoutSessionRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: string;
  total_reps: number | null;
  exercise_count: number | null;
  summary_text: string | null;
};

type UploadRow = {
  id: string;
  filename: string;
  size_bytes: string | number | null;
  uploaded_at: string;
  status: string;
};

type ProtocolRow = {
  id: string;
  name: string;
  focus_area: string | null;
  frequency_per_week: number | null;
  sets_target: number | null;
  reps_target: number | null;
  load_target: string | number | null;
  notes: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  updated_at: string;
};

type FlagRow = {
  id: string;
  flag_type: string;
  severity: string;
  status: string;
  title: string;
  description: string | null;
  created_at: string;
  resolved_at: string | null;
};

type DailyMetricRow = {
  metric_date: string;
  completed_sessions: number | null;
  total_minutes: number | null;
  total_reps: number | null;
  missed_sessions: number | null;
  adherence_rate: string | number | null;
};

type CommandRow = {
  id: string;
  command_type: string;
  status: string;
  issued_at: string;
  result_code: string | null;
  result_message: string | null;
  result_created_at: string | null;
};

type PatchPatientBody = {
  firstName?: string;
  lastName?: string;
  dob?: string;
  sex?: string;
  height?: string;
  weight?: string;
  email?: string;
  phone?: string;
  medicareId?: string;
  providerName?: string;
  providerFacility?: string;
  notes?: string;
  status?: string;
};

function cleanText(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isValidDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseMeasurement(
  input?: string | null
): { value: number | null; unit: string | null; valid: boolean } {
  const cleaned = cleanText(input);

  if (!cleaned) {
    return { value: null, unit: null, valid: true };
  }

  const match = cleaned.match(/^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)$/);
  if (!match) {
    return { value: null, unit: null, valid: false };
  }

  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return { value: null, unit: null, valid: false };
  }

  return {
    value,
    unit: match[2].toLowerCase(),
    valid: true,
  };
}

function formatMeasurement(
  value: string | number | null,
  unit: string | null
): string | null {
  if (value == null || !unit) return null;
  return `${value} ${unit}`;
}

function mapPatient(row: PatientCoreRow) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    dob: row.date_of_birth,
    sex: row.sex,
    height: formatMeasurement(row.height_value, row.height_unit),
    weight: formatMeasurement(row.weight_value, row.weight_unit),
    email: row.email,
    phone: row.phone,
    medicareId: row.medicare_id,
    providerFacility: row.provider_name,
    status: row.status,
    enrolledAt: row.enrolled_at,
    dischargedAt: row.discharged_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDevice(row: DeviceRow | null) {
  if (!row) return null;

  return {
    id: row.id,
    serialNumber: row.device_serial,
    displayName: row.display_name,
    status: row.status,
    firmwareVersion: row.firmware_version,
    battery: row.battery_percent == null ? null : Number(row.battery_percent),
    signal: row.signal_dbm == null ? null : Number(row.signal_dbm),
    lastSync: row.last_sync_at,
    lastContact: row.last_contact_at,
    deploymentGroup: row.deployment_group_name,
  };
}

function mapSession(row: WorkoutSessionRow) {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    duration:
      row.duration_seconds == null ? 0 : Math.round(row.duration_seconds / 60),
    status: row.status,
    reps: row.total_reps,
    exercises: row.exercise_count,
    summary: row.summary_text,
  };
}

function mapFile(row: UploadRow) {
  return {
    id: row.id,
    fileName: row.filename,
    size: row.size_bytes == null ? null : Number(row.size_bytes),
    uploadedAt: row.uploaded_at,
    status: row.status,
  };
}

function mapProtocol(row: ProtocolRow | null) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    focusArea: row.focus_area,
    frequency:
      row.frequency_per_week == null ? null : `${row.frequency_per_week}x / week`,
    setsReps:
      row.sets_target != null && row.reps_target != null
        ? `${row.sets_target} × ${row.reps_target}`
        : null,
    loadTarget: row.load_target == null ? null : Number(row.load_target),
    progressionNotes: row.notes,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    lastUpdated: row.updated_at,
  };
}

function mapFlag(row: FlagRow) {
  return {
    id: row.id,
    type: row.flag_type,
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

function mapSessionDay(row: DailyMetricRow) {
  return {
    date: row.metric_date,
    sessions: row.completed_sessions ?? 0,
    completed: row.completed_sessions ?? 0,
    duration: row.total_minutes ?? 0,
    reps: row.total_reps ?? 0,
    missed: row.missed_sessions ?? 0,
    adherenceRate: row.adherence_rate == null ? null : Number(row.adherence_rate),
  };
}

function buildAdherence(metrics: DailyMetricRow[]) {
  if (metrics.length === 0) return null;

  const prescribed = metrics.reduce(
    (sum, row) => sum + (row.completed_sessions ?? 0) + (row.missed_sessions ?? 0),
    0
  );
  const completed = metrics.reduce(
    (sum, row) => sum + (row.completed_sessions ?? 0),
    0
  );
  const missed = metrics.reduce(
    (sum, row) => sum + (row.missed_sessions ?? 0),
    0
  );

  const latestRate = metrics.find((row) => row.adherence_rate != null)?.adherence_rate;
  const adherenceRate =
    latestRate != null
      ? Number(latestRate)
      : prescribed > 0
        ? Math.round((completed / prescribed) * 100)
        : 0;

  return {
    prescribed,
    completed,
    missed,
    cancelled: 0,
    adherenceRate,
  };
}

function mapCommand(row: CommandRow) {
  return {
    id: row.id,
    commandType: row.command_type,
    result: row.result_code ?? row.status,
    status: row.status,
    createdAt: row.issued_at,
    resultMessage: row.result_message,
    resultCreatedAt: row.result_created_at,
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const patientRows = (await sql`
      SELECT
        id,
        external_id,
        first_name,
        last_name,
        full_name,
        date_of_birth,
        sex,
        height_value,
        height_unit,
        weight_value,
        weight_unit,
        email,
        phone,
        medicare_id,
        provider_name,
        status,
        enrolled_at,
        discharged_at,
        notes,
        created_at,
        updated_at
      FROM patients
      WHERE id = ${id}
      LIMIT 1
    `) as PatientCoreRow[];

    const patientRow = patientRows[0];

    if (!patientRow) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const deviceRows = (await sql`
      SELECT
        d.id,
        d.device_serial,
        d.display_name,
        d.status,
        d.battery_percent,
        d.signal_dbm,
        d.last_sync_at,
        d.last_contact_at,
        dg.name AS deployment_group_name,
        fv.version AS firmware_version
      FROM devices d
      LEFT JOIN deployment_groups dg
        ON dg.id = d.deployment_group_id
      LEFT JOIN firmware_versions fv
        ON fv.id = d.firmware_version_id
      WHERE d.current_patient_id = ${id}
      ORDER BY d.updated_at DESC
      LIMIT 1
    `) as DeviceRow[];

    const sessionRows = (await sql`
      SELECT
        id,
        started_at,
        ended_at,
        duration_seconds,
        status,
        total_reps,
        exercise_count,
        summary_text
      FROM workout_sessions
      WHERE patient_id = ${id}
      ORDER BY started_at DESC
      LIMIT 50
    `) as WorkoutSessionRow[];

    const fileRows = (await sql`
      SELECT
        id,
        filename,
        size_bytes,
        uploaded_at,
        status
      FROM uploads
      WHERE patient_id = ${id}
      ORDER BY uploaded_at DESC
      LIMIT 50
    `) as UploadRow[];

    const protocolRows = (await sql`
      SELECT
        id,
        name,
        focus_area,
        frequency_per_week,
        sets_target,
        reps_target,
        load_target,
        notes,
        status,
        started_at,
        ended_at,
        updated_at
      FROM patient_protocols
      WHERE patient_id = ${id}
      ORDER BY updated_at DESC
      LIMIT 1
    `) as ProtocolRow[];

    const flagRows = (await sql`
      SELECT
        id,
        flag_type,
        severity,
        status,
        title,
        description,
        created_at,
        resolved_at
      FROM patient_flags
      WHERE patient_id = ${id}
      ORDER BY created_at DESC
      LIMIT 50
    `) as FlagRow[];

    const metricRowsDesc = (await sql`
      SELECT
        metric_date,
        completed_sessions,
        total_minutes,
        total_reps,
        missed_sessions,
        adherence_rate
      FROM patient_daily_metrics
      WHERE patient_id = ${id}
      ORDER BY metric_date DESC
      LIMIT 30
    `) as DailyMetricRow[];

    const commandRows = (await sql`
      SELECT
        id,
        command_type,
        status,
        issued_at,
        result_code,
        result_message,
        result_created_at
      FROM device_commands
      WHERE patient_id = ${id}
      ORDER BY issued_at DESC
      LIMIT 50
    `) as CommandRow[];

    const metricRowsAsc = [...metricRowsDesc].reverse();

    return NextResponse.json(
      {
        patient: mapPatient(patientRow),
        device: mapDevice(deviceRows[0] ?? null),
        protocol: mapProtocol(protocolRows[0] ?? null),
        flags: flagRows.map(mapFlag),
        adherence: buildAdherence(metricRowsDesc),
        sessionDays: metricRowsAsc.map(mapSessionDay),
        sessions: sessionRows.map(mapSession),
        files: fileRows.map(mapFile),
        commands: commandRows.map(mapCommand),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`GET /api/patients/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to load patient details" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_UPDATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const existingRows = (await sql`
      SELECT
        id,
        external_id,
        first_name,
        last_name,
        full_name,
        date_of_birth,
        sex,
        height_value,
        height_unit,
        weight_value,
        weight_unit,
        email,
        phone,
        medicare_id,
        provider_name,
        status,
        enrolled_at,
        discharged_at,
        notes,
        created_at,
        updated_at
      FROM patients
      WHERE id = ${id}
      LIMIT 1
    `) as PatientCoreRow[];

    const existing = existingRows[0];

    if (!existing) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = (await req.json()) as PatchPatientBody;

    const nextFirstName = hasOwn(body, "firstName")
      ? cleanText(body.firstName)
      : existing.first_name;

    const nextLastName = hasOwn(body, "lastName")
      ? cleanText(body.lastName)
      : existing.last_name;

    if (!nextFirstName || !nextLastName) {
      return NextResponse.json(
        { error: "First name and last name cannot be empty" },
        { status: 400 }
      );
    }

    const nextDob = hasOwn(body, "dob") ? cleanText(body.dob) : existing.date_of_birth;
    if (nextDob && !isValidDateOnly(nextDob)) {
      return NextResponse.json(
        { error: "dob must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const nextEmail = hasOwn(body, "email") ? cleanText(body.email) : existing.email;
    if (nextEmail && !isValidEmail(nextEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const nextSex = hasOwn(body, "sex") ? cleanText(body.sex) : existing.sex;
    const nextPhone = hasOwn(body, "phone") ? cleanText(body.phone) : existing.phone;
    const nextMedicareId = hasOwn(body, "medicareId")
      ? cleanText(body.medicareId)
      : existing.medicare_id;

    const providerInput = hasOwn(body, "providerName")
      ? body.providerName
      : hasOwn(body, "providerFacility")
        ? body.providerFacility
        : undefined;

    const nextProviderName =
      providerInput !== undefined ? cleanText(providerInput) : existing.provider_name;

    const nextNotes = hasOwn(body, "notes") ? cleanText(body.notes) : existing.notes;

    const nextStatus = hasOwn(body, "status")
      ? cleanText(body.status)?.toLowerCase()
      : existing.status;

    if (!nextStatus) {
      return NextResponse.json(
        { error: "status cannot be empty" },
        { status: 400 }
      );
    }

    let nextHeightValue: number | null = existing.height_value == null ? null : Number(existing.height_value);
    let nextHeightUnit: string | null = existing.height_unit;

    if (hasOwn(body, "height")) {
      const parsed = parseMeasurement(body.height);
      if (!parsed.valid) {
        return NextResponse.json(
          { error: "height must look like '180 cm' or '175 lb'" },
          { status: 400 }
        );
      }
      nextHeightValue = parsed.value;
      nextHeightUnit = parsed.unit;
    }

    let nextWeightValue: number | null = existing.weight_value == null ? null : Number(existing.weight_value);
    let nextWeightUnit: string | null = existing.weight_unit;

    if (hasOwn(body, "weight")) {
      const parsed = parseMeasurement(body.weight);
      if (!parsed.valid) {
        return NextResponse.json(
          { error: "weight must look like '180 lb' or '82 kg'" },
          { status: 400 }
        );
      }
      nextWeightValue = parsed.value;
      nextWeightUnit = parsed.unit;
    }

    const nextFullName = `${nextFirstName} ${nextLastName}`;

    const updatedRows = (await sql`
      UPDATE patients
      SET
        first_name = ${nextFirstName},
        last_name = ${nextLastName},
        full_name = ${nextFullName},
        date_of_birth = ${nextDob},
        sex = ${nextSex},
        height_value = ${nextHeightValue},
        height_unit = ${nextHeightUnit},
        weight_value = ${nextWeightValue},
        weight_unit = ${nextWeightUnit},
        email = ${nextEmail},
        phone = ${nextPhone},
        medicare_id = ${nextMedicareId},
        provider_name = ${nextProviderName},
        notes = ${nextNotes},
        status = ${nextStatus},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id,
        external_id,
        first_name,
        last_name,
        full_name,
        date_of_birth,
        sex,
        height_value,
        height_unit,
        weight_value,
        weight_unit,
        email,
        phone,
        medicare_id,
        provider_name,
        status,
        enrolled_at,
        discharged_at,
        notes,
        created_at,
        updated_at
    `) as PatientCoreRow[];

    return NextResponse.json(
      { patient: mapPatient(updatedRows[0]) },
      { status: 200 }
    );
  } catch (error) {
    console.error(`PATCH /api/patients/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_DELETE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const deleted = await sql`
      DELETE FROM patients
      WHERE id = ${id}
      RETURNING id
    `;

    if (!deleted[0]) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/patients/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
