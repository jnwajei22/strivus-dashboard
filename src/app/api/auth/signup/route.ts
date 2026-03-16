// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const USER_STATUS = "active";
const AUTH_METHOD = "email_code";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function splitName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ");

  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
    displayName: normalized || null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required" },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM users
      WHERE lower(email) = ${email}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }

    const { firstName, lastName, displayName } = splitName(fullName);

    const inserted = await sql`
      INSERT INTO users (
        email,
        first_name,
        last_name,
        display_name,
        status,
        auth_method
      )
      VALUES (
        ${email},
        ${firstName},
        ${lastName},
        ${displayName},
        ${USER_STATUS},
        ${AUTH_METHOD}
      )
      RETURNING id, email, display_name, created_at
    `;

    return NextResponse.json({
      ok: true,
      user: inserted[0],
    });
  } catch (error) {
    console.error("POST /api/auth/signup error:", error);

    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
