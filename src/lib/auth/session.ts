import { cookies } from "next/headers";
import crypto from "crypto";
import { sql } from "@/lib/db";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "kinetica_session";

const DEFAULT_SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const DEFAULT_AUTH_METHOD = "email_code";

function getCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export type SessionUser = {
  session_id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;

  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  status: string;
  email_verified_at: string | null;
  last_login_at: string | null;

  role_id: string | null;
  role_name: string | null;
  role_description: string | null;

  job_title: string | null;
  avatar_url: string | null;
  phone: string | null;
  department: string | null;
  profile_timezone: string | null;

  theme: string | null;
  sidebar_collapsed: boolean | null;
  default_dashboard_view: string | null;
  settings_timezone: string | null;
};

type CreateSessionOptions = {
  authMethod?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  durationMs?: number;
};

export async function createSession(
  userId: string,
  options: CreateSessionOptions = {}
) {
  const {
    authMethod = DEFAULT_AUTH_METHOD,
    ipAddress = null,
    userAgent = null,
    durationMs = DEFAULT_SESSION_DURATION_MS,
  } = options;

  const rawToken = generateToken();
  const tokenHash = hashValue(rawToken);
  const expiresAt = new Date(Date.now() + durationMs);

  await sql`
    INSERT INTO sessions (
      user_id,
      token_hash,
      auth_method,
      ip_address,
      user_agent,
      last_seen_at,
      expires_at,
      revoked_at
    )
    VALUES (
      ${userId},
      ${tokenHash},
      ${authMethod},
      ${ipAddress},
      ${userAgent},
      now(),
      ${expiresAt.toISOString()},
      NULL
    )
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, getCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", getCookieOptions(new Date(0)));
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function revokeSessionByToken(rawToken: string) {
  const tokenHash = hashValue(rawToken);

  await sql`
    UPDATE sessions
    SET
      revoked_at = COALESCE(revoked_at, now()),
      updated_at = now()
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
  `;
}

export async function clearCurrentSession() {
  const rawToken = await getSessionToken();

  if (rawToken) {
    await revokeSessionByToken(rawToken);
  }

  await clearSessionCookie();
}

export async function touchSession(sessionId: string) {
  await sql`
    UPDATE sessions
    SET last_seen_at = now()
    WHERE id = ${sessionId}
      AND revoked_at IS NULL
      AND expires_at > now()
  `;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const rawToken = await getSessionToken();
  if (!rawToken) return null;

  const tokenHash = hashValue(rawToken);

  const rows = (await sql`
    SELECT
      s.id AS session_id,
      s.user_id,
      s.expires_at,
      s.revoked_at,

      u.email,
      u.first_name,
      u.last_name,
      u.display_name,
      u.status,
      u.email_verified_at,
      u.last_login_at,

      r.id AS role_id,
      r.name AS role_name,
      r.description AS role_description,

      up.job_title,
      up.avatar_url,
      up.phone,
      up.department,
      up.timezone AS profile_timezone,

      us.theme,
      us.sidebar_collapsed,
      us.default_dashboard_view,
      us.timezone AS settings_timezone

    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN user_settings us ON us.user_id = u.id
    WHERE s.token_hash = ${tokenHash}
    LIMIT 1
  `) as SessionUser[];

  const session = rows[0];
  if (!session) return null;

  const isRevoked = !!session.revoked_at;
  const isExpired = new Date(session.expires_at) < new Date();

  if (isRevoked || isExpired) {
    await clearSessionCookie();
    return null;
  }

  return session;
}
