import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/server/auth/guards"
import { PERMISSIONS } from "@/lib/auth/permissions"
import {
  deleteDeviceLog,
  getDeviceLogById,
  updateDeviceLog,
} from "@/lib/server/logs/queries"
import { mapDeviceLogRowToApi } from "@/lib/server/logs/mappers"
import { validateUpdateDeviceLogInput } from "@/lib/server/logs/validators"

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
    return NextResponse.json({ error: "Invalid log id" }, { status: 400 })
  }

  try {
    const row = await getDeviceLogById(id)

    if (!row) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 })
    }

    return NextResponse.json(
      { log: mapDeviceLogRowToApi(row) },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET /api/logs/[id] failed:", error)
    return NextResponse.json(
      { error: "Failed to load log", details: String(error) },
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
    return NextResponse.json({ error: "Invalid log id" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const input = validateUpdateDeviceLogInput(body)

    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      )
    }

    if (input.lineCount !== undefined && input.lineCount !== null) {
      if (!Number.isInteger(input.lineCount) || input.lineCount < 0) {
        return NextResponse.json(
          { error: "lineCount must be a non-negative integer" },
          { status: 400 }
        )
      }
    }

    const existing = await getDeviceLogById(id)
    if (!existing) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 })
    }

    const row = await updateDeviceLog(id, input)

    if (!row) {
      return NextResponse.json(
        { error: "No changes were applied" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { log: mapDeviceLogRowToApi(row) },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: message || "Failed to update log" },
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
    return NextResponse.json({ error: "Invalid log id" }, { status: 400 })
  }

  try {
    const deleted = await deleteDeviceLog(id)

    if (!deleted) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, id }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/logs/[id] failed:", error)
    return NextResponse.json(
      { error: "Failed to delete log", details: String(error) },
      { status: 500 }
    )
  }
}