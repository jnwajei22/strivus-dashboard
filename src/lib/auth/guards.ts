// src/lib/auth/guards.ts
import { getSessionUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { type Permission } from "@/lib/auth/permissions";

export async function getCurrentUserPermissions(): Promise<Permission[]> {
  const sessionUser = await getSessionUser();

  if (!sessionUser?.role_id) {
    return [];
  }

  const rows = await sql`
    SELECT p.key
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = ${sessionUser.role_id}
    ORDER BY p.key
  `;

  return [...new Set(rows.map((row) => row.key))] as Permission[];
}

export async function requirePermission(permission: Permission) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return {
      ok: false as const,
      status: 401,
      error: "Unauthorized",
      user: null,
      permissions: [] as Permission[],
    };
  }

  const permissions = await getCurrentUserPermissions();

  if (!permissions.includes(permission)) {
    return {
      ok: false as const,
      status: 403,
      error: "Forbidden",
      user: sessionUser,
      permissions,
    };
  }

  return {
    ok: true as const,
    status: 200,
    error: null,
    user: sessionUser,
    permissions,
  };
}

export async function requireAnyPermission(required: Permission[]) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return {
      ok: false as const,
      status: 401,
      error: "Unauthorized",
      user: null,
      permissions: [] as Permission[],
    };
  }

  const permissions = await getCurrentUserPermissions();

  const allowed = required.some((permission) =>
    permissions.includes(permission)
  );

  if (!allowed) {
    return {
      ok: false as const,
      status: 403,
      error: "Forbidden",
      user: sessionUser,
      permissions,
    };
  }

  return {
    ok: true as const,
    status: 200,
    error: null,
    user: sessionUser,
    permissions,
  };
}
