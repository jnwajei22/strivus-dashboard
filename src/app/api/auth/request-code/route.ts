// src/app/api/auth/request-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { generateCode, hashValue } from "@/lib/auth/session";

const PURPOSE = "login";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body.email ?? ""));

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const users = await sql`
      SELECT id, email
      FROM users
      WHERE lower(email) = ${email}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No account found for that email" },
        { status: 404 }
      );
    }

    const user = users[0];
    const code = generateCode();
    const codeHash = hashValue(code);

    await sql`
      UPDATE verification_codes
      SET used_at = now()
      WHERE lower(email) = ${email}
        AND purpose = ${PURPOSE}
        AND used_at IS NULL
    `;

    await sql`
      INSERT INTO verification_codes (
        user_id,
        email,
        code_hash,
        purpose,
        expires_at,
        used_at,
        attempt_count
      )
      VALUES (
        ${user.id},
        ${email},
        ${codeHash},
        ${PURPOSE},
        now() + interval '10 minutes',
        NULL,
        0
      )
    `;

    if (process.env.NODE_ENV !== "production") {
      console.log(`Login code for ${email} is ${code}`);
    }

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
  } catch (error) {
    console.error("POST /api/auth/request-code error:", error);

    return NextResponse.json(
      { error: "Failed to send login code" },
      { status: 500 }
    );
  }
}
