import { NextRequest, NextResponse } from "next/server";
import { generateCode, hashValue } from "@/lib/server/auth/tokens";
import {
  findUserByEmail,
  insertVerificationCode,
  invalidateActiveVerificationCodes,
} from "@/lib/server/auth/queries";
import {
  AuthValidationError,
  parseRequestCodeInput,
} from "@/lib/server/auth/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = parseRequestCodeInput(body);

    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "No account found for that email" },
        { status: 404 }
      );
    }

    const code = generateCode();
    const codeHash = hashValue(code);

    await invalidateActiveVerificationCodes(email);

    await insertVerificationCode({
      userId: user.id,
      email,
      codeHash,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`Login code for ${email} is ${code}`);
    }

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("POST /api/auth/request-code error:", error);

    return NextResponse.json(
      { error: "Failed to send login code" },
      { status: 500 }
    );
  }
}