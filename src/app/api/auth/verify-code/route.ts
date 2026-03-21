import { NextRequest, NextResponse } from "next/server";
import { getUserPermissions } from "@/lib/server/auth/guards";
import {
  getAuthUserSummary,
  getLatestActiveVerificationCode,
  incrementVerificationAttempt,
  markUserVerifiedAndTouchLogin,
  mapAuthUserSummaryToResponse,
  markVerificationCodeUsed,
} from "@/lib/server/auth/queries";
import { createSession } from "@/lib/server/auth/session";
import { hashValue } from "@/lib/server/auth/tokens";
import { AUTH_METHODS } from "@/lib/server/auth/types";
import {
  AuthValidationError,
  getClientIpFromHeaders,
  parseVerifyCodeInput,
} from "@/lib/server/auth/validators";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;
const MAX_VERIFICATION_ATTEMPTS = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = parseVerifyCodeInput(body);

    const record = await getLatestActiveVerificationCode(email);

    if (!record) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    if (record.attempt_count >= MAX_VERIFICATION_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts" },
        { status: 400 }
      );
    }

    const codeHash = hashValue(code);

    if (record.code_hash !== codeHash) {
      await incrementVerificationAttempt(record.id);

      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (!record.user_id) {
      return NextResponse.json(
        { error: "Verification record is missing a user" },
        { status: 500 }
      );
    }

    await markVerificationCodeUsed(record.id);
    await markUserVerifiedAndTouchLogin(record.user_id);

    await createSession(record.user_id, {
      authMethod: AUTH_METHODS.EMAIL_CODE,
      ipAddress: getClientIpFromHeaders(req.headers),
      userAgent: req.headers.get("user-agent"),
      durationMs: SESSION_DURATION_MS,
    });

    const user = await getAuthUserSummary(record.user_id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found after verification" },
        { status: 500 }
      );
    }

    const permissions = await getUserPermissions(user.role_id);

    return NextResponse.json({
      ok: true,
      user: mapAuthUserSummaryToResponse(user),
      permissions,
    });
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("POST /api/auth/verify-code error:", error);

    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}