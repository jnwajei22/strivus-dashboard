import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { sql } from "@/lib/db";

type PatientListRow = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  enrolled_at: string | null;
  created_at: string;
  device_id: string | null;
  device_serial: string | null;
  device_status: string | null;
  last_sync_at: string | null;
};

type PatientRow = {
  id: string;
  external_id: string | null;
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

type CreatePatientBody = {
  externalId?: string;
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
  enrolledAt?: string;
};

function cleanText(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseMeasurement(
  input?: string | null
): { value: number | null; unit: string | null } {
  const cleaned = cleanText(input);
  if (!cleaned) {
    return { value: null, unit: null };
  }

  const match = cleaned.match(/^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)$/);
  if (!match) {
    return { value: null, unit: null };
  }

  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return { value: null, unit: null };
  }

  return {
    value,
    unit: match[2].toLowerCase(),
  };
}

function normalizePatientStatus(input?: string | null): string {
  const value = cleanText(input)?.toLowerCase();
  return value ?? "active";
}

function mapPatient(row: PatientRow) {
  return {
    id: row.id,
    externalId: row.external_id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    sex: row.sex,
    height:
      row.height_value !== null || row.height_unit !== null
        ? {
            value:
              row.height_value === null ? null : Number(row.height_value),
            unit: row.height_unit,
          }
        : null,
    weight:
      row.weight_value !== null || row.weight_unit !== null
        ? {
            value:
              row.weight_value === null ? null : Number(row.weight_value),
            unit: row.weight_unit,
          }
        : null,
    email: row.email,
    phone: row.phone,
    medicareId: row.medicare_id,
    providerName: row.provider_name,
    status: row.status,
    enrolledAt: row.enrolled_at,
    dischargedAt: row.discharged_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPatientListRow(row: PatientListRow) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    enrolledAt: row.enrolled_at,
    createdAt: row.created_at,
    device: row.device_id
      ? {
          id: row.device_id,
          serialNumber: row.device_serial,
          status: row.device_status,
          lastSync: row.last_sync_at,
        }
      : null,
  };
}

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rows = (await sql`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.full_name,
        p.email,
        p.phone,
        p.status,
        p.enrolled_at,
        p.created_at,
        d.id AS device_id,
        d.device_serial,
        d.status AS device_status,
        d.last_sync_at
      FROM patients p
      LEFT JOIN devices d
        ON d.current_patient_id = p.id
      ORDER BY p.created_at DESC
    `) as PatientListRow[];

    return NextResponse.json(rows.map(mapPatientListRow), { status: 200 });
  } catch (error) {
    console.error("GET /api/patients failed:", error);
    return NextResponse.json(
      { error: "Failed to load patients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_CREATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as CreatePatientBody;

    const firstName = cleanText(body.firstName);
    const lastName = cleanText(body.lastName);
    const externalId = cleanText(body.externalId);
    const dob = cleanText(body.dob);
    const sex = cleanText(body.sex);
    const email = cleanText(body.email);
    const phone = cleanText(body.phone);
    const medicareId = cleanText(body.medicareId);
    const providerName =
      cleanText(body.providerName) ?? cleanText(body.providerFacility);
    const notes = cleanText(body.notes);
    const status = normalizePatientStatus(body.status);
    const enrolledAt = cleanText(body.enrolledAt);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (dob && !isValidDateOnly(dob)) {
      return NextResponse.json(
        { error: "dob must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (enrolledAt && Number.isNaN(Date.parse(enrolledAt))) {
      return NextResponse.json(
        { error: "Invalid enrolledAt timestamp" },
        { status: 400 }
      );
    }

    const height = parseMeasurement(body.height);
    const weight = parseMeasurement(body.weight);
    const fullName = `${firstName} ${lastName}`;

    const inserted = (await sql`
      INSERT INTO patients (
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
        notes
      )
      VALUES (
        ${externalId},
        ${firstName},
        ${lastName},
        ${fullName},
        ${dob},
        ${sex},
        ${height.value},
        ${height.unit},
        ${weight.value},
        ${weight.unit},
        ${email},
        ${phone},
        ${medicareId},
        ${providerName},
        ${status},
        ${enrolledAt},
        ${notes}
      )
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
    `) as PatientRow[];

    return NextResponse.json(mapPatient(inserted[0]), { status: 201 });
  } catch (error) {
    console.error("POST /api/patients failed:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
