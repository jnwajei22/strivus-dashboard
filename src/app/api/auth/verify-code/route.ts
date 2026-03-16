import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createSession, hashValue } from "@/lib/auth/session";

const PURPOSE = "login";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const code = String(body.code ?? "").trim();

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Email and 6-digit code are required" },
        { status: 400 }
      );
    }

    const codeHash = hashValue(code);

    const matches = await sql`
      SELECT id, user_id, email, code_hash, expires_at, used_at, attempt_count
      FROM verification_codes
      WHERE lower(email) = ${email}
        AND purpose = ${PURPOSE}
        AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (matches.length === 0) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const record = matches[0];

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    if (record.attempt_count >= 10) {
      return NextResponse.json(
        { error: "Too many attempts" },
        { status: 400 }
      );
    }

    if (record.code_hash !== codeHash) {
      await sql`
        UPDATE verification_codes
        SET attempt_count = attempt_count + 1
        WHERE id = ${record.id}
      `;

      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    await sql`
      UPDATE verification_codes
      SET used_at = now()
      WHERE id = ${record.id}
    `;

    await sql`
      UPDATE users
      SET
        email_verified_at = COALESCE(email_verified_at, now()),
        last_login_at = now(),
        updated_at = now()
      WHERE id = ${record.user_id}
    `;

    await createSession(record.user_id, {
      authMethod: "email_code",
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent"),
      durationMs: 1000 * 60 * 60 * 24 * 14,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/verify-code error:", error);

    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
