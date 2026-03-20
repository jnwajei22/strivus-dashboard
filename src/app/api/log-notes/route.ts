import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/server/auth/guards"
import { PERMISSIONS } from "@/lib/server/auth/permissions"
import {
  createLogNote,
  listLogNotes,
} from "@/lib/server/logs/queries"
import { mapLogNoteRowToApi } from "@/lib/server/logs/mappers"
import {
  parseListLogNotesParams,
  validateCreateLogNoteInput,
} from "@/lib/server/logs/validators"

type PermissionAuth =
  | { ok: false; error: string; status: number }
  | { ok: true; user?: { user_id?: string; id?: string } }

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function getAuthUserId(auth: PermissionAuth): string | null {
  if (!auth.ok) return null
  return auth.user?.user_id ?? auth.user?.id ?? null
}

export async function GET(req: NextRequest) {
  const auth = (await requirePermission(PERMISSIONS.LOGS_READ)) as PermissionAuth

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const params = parseListLogNotesParams(searchParams)

    if (params.linkedPatientId && !isUuid(params.linkedPatientId)) {
      return NextResponse.json(
        { error: "Invalid linkedPatientId" },
        { status: 400 }
      )
    }

    if (params.linkedDeviceId && !isUuid(params.linkedDeviceId)) {
      return NextResponse.json(
        { error: "Invalid linkedDeviceId" },
        { status: 400 }
      )
    }

    if (params.authorUserId && !isUuid(params.authorUserId)) {
      return NextResponse.json(
        { error: "Invalid authorUserId" },
        { status: 400 }
      )
    }

    const rows = await listLogNotes(params)

    return NextResponse.json(
      { notes: rows.map(mapLogNoteRowToApi) },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET /api/log-notes failed:", error)
    return NextResponse.json(
      { error: "Failed to load log notes", details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = (await requirePermission(PERMISSIONS.LOGS_UPDATE)) as PermissionAuth

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const input = validateCreateLogNoteInput(body)

    if (input.authorUserId !== undefined && input.authorUserId !== null && !isUuid(input.authorUserId)) {
      return NextResponse.json({ error: "Invalid authorUserId" }, { status: 400 })
    }

    if (input.linkedPatientId !== undefined && input.linkedPatientId !== null && !isUuid(input.linkedPatientId)) {
      return NextResponse.json({ error: "Invalid linkedPatientId" }, { status: 400 })
    }

    if (input.linkedDeviceId !== undefined && input.linkedDeviceId !== null && !isUuid(input.linkedDeviceId)) {
      return NextResponse.json({ error: "Invalid linkedDeviceId" }, { status: 400 })
    }

    if (input.relatedSessionId !== undefined && input.relatedSessionId !== null && !isUuid(input.relatedSessionId)) {
      return NextResponse.json({ error: "Invalid relatedSessionId" }, { status: 400 })
    }

    if (input.relatedCommandId !== undefined && input.relatedCommandId !== null && !isUuid(input.relatedCommandId)) {
      return NextResponse.json({ error: "Invalid relatedCommandId" }, { status: 400 })
    }

    const authorUserId = input.authorUserId === undefined
      ? getAuthUserId(auth)
      : input.authorUserId

    const row = await createLogNote({
      ...input,
      authorUserId,
    })

    return NextResponse.json(
      { note: mapLogNoteRowToApi(row) },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: message || "Failed to create log note" },
      { status: 400 }
    )
  }
}