import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { sql } from "@/lib/db";
import { type Permission } from "@/lib/auth/permissions";

type GuardFailure = {
  ok: false;
  status: 401 | 403;
  error: "Unauthorized" | "Forbidden";
  user: SessionUser | null;
  permissions: Permission[];
};

type GuardSuccess = {
  ok: true;
  status: 200;
  error: null;
  user: SessionUser;
  permissions: Permission[];
};

export type GuardResult = GuardFailure | GuardSuccess;

function unauthorized(): GuardFailure {
  return {
    ok: false,
    status: 401,
    error: "Unauthorized",
    user: null,
    permissions: [],
  };
}

function forbidden(
  user: SessionUser,
  permissions: Permission[]
): GuardFailure {
  return {
    ok: false,
    status: 403,
    error: "Forbidden",
    user,
    permissions,
  };
}

export async function getUserPermissions(
  roleId: string | null | undefined
): Promise<Permission[]> {
  if (!roleId) return [];

  const rows = await sql`
    SELECT p.key
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = ${roleId}
    ORDER BY p.key
  `;

  return [...new Set(rows.map((row) => row.key))] as Permission[];
}

export async function requireAuth(): Promise<GuardResult> {
  const user = await getSessionUser();

  if (!user) {
    return unauthorized();
  }

  const permissions = await getUserPermissions(user.role_id);

  return {
    ok: true,
    status: 200,
    error: null,
    user,
    permissions,
  };
}

export async function requirePermission(
  permission: Permission
): Promise<GuardResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  return auth.permissions.includes(permission)
    ? auth
    : forbidden(auth.user, auth.permissions);
}

export async function requireAnyPermission(
  required: Permission[]
): Promise<GuardResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const allowed = required.some((permission) =>
    auth.permissions.includes(permission)
  );

  return allowed ? auth : forbidden(auth.user, auth.permissions);
}
