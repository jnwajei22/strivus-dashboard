import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  createPatient,
  listPatients,
} from "@/lib/server/patients/queries";
import {
  parsePatientInput,
  validateCreatePatientInput,
} from "@/lib/server/patients/validators";

export async function GET() {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const patients = await listPatients();
    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    console.error("GET /api/patients failed:", error);
    return NextResponse.json(
      { error: "Failed to load patients" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_CREATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const input = parsePatientInput(body);
    validateCreatePatientInput(input);

    const patient = await createPatient(input);
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create patient";

    const status =
      message.includes("required") ||
      message.includes("Invalid") ||
      message.includes("Expected") ||
      message.includes("format")
        ? 400
        : 500;

    console.error("POST /api/patients failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}