import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/auth/guards";
import { PERMISSIONS } from "@/lib/server/auth/permissions";
import {
  deletePatient,
  getPatientDetail,
  updatePatient,
} from "@/lib/server/patients/queries";
import {
  isValidUuid,
  parsePatientInput,
  validateUpdatePatientInput,
} from "@/lib/server/patients/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_READ);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid patient id" }, { status: 400 });
  }

  try {
    const detail = await getPatientDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    console.error(`GET /api/patients/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to load patient details" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_UPDATE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid patient id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const input = parsePatientInput(body);
    validateUpdatePatientInput(input);

    const patient = await updatePatient(id, input);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update patient";

    const status =
      message.includes("required") ||
      message.includes("Invalid") ||
      message.includes("Expected") ||
      message.includes("format") ||
      message.includes("cannot be empty")
        ? 400
        : 500;

    console.error(`PATCH /api/patients/${id} failed:`, error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.PATIENTS_DELETE);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: "Invalid patient id" }, { status: 400 });
  }

  try {
    const deleted = await deletePatient(id);

    if (!deleted) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/patients/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 },
    );
  }
}