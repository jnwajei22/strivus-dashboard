import { NextRequest, NextResponse } from "next/server";
import { AUTH_METHODS, USER_STATUSES } from "@/lib/server/auth/types";
import { createUserWithBootstrap, findUserByEmail } from "@/lib/server/auth/queries";
import {
  AuthValidationError,
  parseSignupInput,
} from "@/lib/server/auth/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = parseSignupInput(body);

    const existing = await findUserByEmail(input.email);

    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }

    const user = await createUserWithBootstrap({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName,
      status: USER_STATUSES.ACTIVE,
      authMethod: AUTH_METHODS.EMAIL_CODE,
      roleId: null,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name,
        roleId: user.role_id,
        status: user.status,
        emailVerifiedAt: user.email_verified_at,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("POST /api/auth/signup error:", error);

    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}