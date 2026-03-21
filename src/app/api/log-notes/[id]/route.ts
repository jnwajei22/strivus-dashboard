import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/server/auth/guards"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  deleteLogNote,
  getLogNoteById,
  updateLogNote,
} from "@/lib/server/logs/queries"
import { mapLogNoteRowToApi } from "@/lib/server/logs/mappers"
import { validateUpdateLogNoteInput } from "@/lib/server/logs/validators"

type RouteContext = {
  params: Promise<{ id: string }>
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function GET(_: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.LOGS_READ)

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid log note id" }, { status: 400 })
  }

  try {
    const row = await getLogNoteById(id)

    if (!row) {
      return NextResponse.json({ error: "Log note not found" }, { status: 404 })
    }

    return NextResponse.json(
      { note: mapLogNoteRowToApi(row) },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET /api/log-notes/[id] failed:", error)
    return NextResponse.json(
      { error: "Failed to load log note", details: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.LOGS_UPDATE)

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid log note id" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const input = validateUpdateLogNoteInput(body)

    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      )
    }

    if (
      input.parentNoteId !== undefined &&
      input.parentNoteId !== null &&
      !isUuid(input.parentNoteId)
    ) {
      return NextResponse.json({ error: "Invalid parentNoteId" }, { status: 400 })
    }

    if (
      input.parentNoteId !== undefined &&
      input.parentNoteId !== null &&
      input.parentNoteId === id
    ) {
      return NextResponse.json(
        { error: "A log note cannot be its own parent" },
        { status: 400 }
      )
    }

    if (
      input.authorUserId !== undefined &&
      input.authorUserId !== null &&
      !isUuid(input.authorUserId)
    ) {
      return NextResponse.json({ error: "Invalid authorUserId" }, { status: 400 })
    }

    if (
      input.linkedPatientId !== undefined &&
      input.linkedPatientId !== null &&
      !isUuid(input.linkedPatientId)
    ) {
      return NextResponse.json({ error: "Invalid linkedPatientId" }, { status: 400 })
    }

    if (
      input.linkedDeviceId !== undefined &&
      input.linkedDeviceId !== null &&
      !isUuid(input.linkedDeviceId)
    ) {
      return NextResponse.json({ error: "Invalid linkedDeviceId" }, { status: 400 })
    }

    if (
      input.relatedSessionId !== undefined &&
      input.relatedSessionId !== null &&
      !isUuid(input.relatedSessionId)
    ) {
      return NextResponse.json({ error: "Invalid relatedSessionId" }, { status: 400 })
    }

    if (
      input.relatedCommandId !== undefined &&
      input.relatedCommandId !== null &&
      !isUuid(input.relatedCommandId)
    ) {
      return NextResponse.json({ error: "Invalid relatedCommandId" }, { status: 400 })
    }

    const existing = await getLogNoteById(id)
    if (!existing) {
      return NextResponse.json({ error: "Log note not found" }, { status: 404 })
    }

    if (
      input.parentNoteId !== undefined &&
      input.parentNoteId !== null
    ) {
      const parent = await getLogNoteById(input.parentNoteId)

      if (!parent) {
        return NextResponse.json(
          { error: "Parent log note not found" },
          { status: 400 }
        )
      }
    }

    const row = await updateLogNote(id, input)

    if (!row) {
      return NextResponse.json(
        { error: "No changes were applied" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { note: mapLogNoteRowToApi(row) },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: message || "Failed to update log note" },
      { status: 400 }
    )
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const auth = await requirePermission(PERMISSIONS.LOGS_DELETE)

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid log note id" }, { status: 400 })
  }

  try {
    const deleted = await deleteLogNote(id)

    if (!deleted) {
      return NextResponse.json({ error: "Log note not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, id }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/log-notes/[id] failed:", error)
    return NextResponse.json(
      { error: "Failed to delete log note", details: String(error) },
      { status: 500 }
    )
  }
}