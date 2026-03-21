import { NextResponse } from "next/server";
import { clearCurrentSession } from "@/lib/server/auth/session";

export async function POST() {
  try {
    await clearCurrentSession();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);

    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}