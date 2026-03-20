import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/server/auth/guards"
import { PERMISSIONS } from "@/lib/server/auth/permissions"
import {
  createDeviceLog,
  listDeviceLogs,
} from "@/lib/server/logs/queries"
import { mapDeviceLogRowToApi } from "@/lib/server/logs/mappers"
import {
  parseListDeviceLogsParams,
  validateCreateDeviceLogInput,
} from "@/lib/server/logs/validators"

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function GET(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.LOGS_READ)

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const params = parseListDeviceLogsParams(searchParams)

    if (params.deviceId && !isUuid(params.deviceId)) {
      return NextResponse.json({ error: "Invalid deviceId" }, { status: 400 })
    }

    if (params.patientId && !isUuid(params.patientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 })
    }

    const rows = await listDeviceLogs(params)

    return NextResponse.json(
      { logs: rows.map(mapDeviceLogRowToApi) },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET /api/logs failed:", error)
    return NextResponse.json(
      { error: "Failed to load logs", details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.LOGS_UPDATE)

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const input = validateCreateDeviceLogInput(body)

    if (!isUuid(input.deviceId)) {
      return NextResponse.json({ error: "Invalid deviceId" }, { status: 400 })
    }

    if (input.lineCount !== undefined && input.lineCount !== null) {
      if (!Number.isInteger(input.lineCount) || input.lineCount < 0) {
        return NextResponse.json(
          { error: "lineCount must be a non-negative integer" },
          { status: 400 }
        )
      }
    }

    const row = await createDeviceLog(input)

    return NextResponse.json(
      { log: mapDeviceLogRowToApi(row) },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: message || "Failed to create log" },
      { status: 400 }
    )
  }
}