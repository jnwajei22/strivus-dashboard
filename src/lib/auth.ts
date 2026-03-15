import { cookies } from "next/headers";
import crypto from "crypto";
import { sql } from "@/lib/db";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "kinetica_session";

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const rawToken = generateToken();
  const tokenHash = hashValue(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await sql`
    INSERT INTO sessions (user_id, token_hash, auth_method, expires_at)
    VALUES (${userId}, ${tokenHash}, 'email_code', ${expiresAt.toISOString()})
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const tokenHash = hashValue(rawToken);

  const rows = await sql`
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
  `;

  const session = rows[0];
  if (!session) return null;
  if (session.revoked_at) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  return session;
}
