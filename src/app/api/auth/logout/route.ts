// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { sql } from "@/lib/db";

const COOKIE_NAME = "strivus_session";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const rawToken = req.cookies.get(COOKIE_NAME)?.value;

    if (rawToken) {
      const tokenHash = hashValue(rawToken);

      await sql`
        UPDATE sessions
        SET revoked_at = now()
        WHERE token_hash = ${tokenHash}
          AND revoked_at IS NULL
      `;
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
