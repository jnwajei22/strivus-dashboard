"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import {
  PERMISSIONS,
  hasAnyPermission,
  type Permission,
} from "@/lib/auth/permissions";

type MeResponse = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    status: string | null;
    emailVerifiedAt?: string | null;
    lastLoginAt?: string | null;
    authMethod?: string | null;
    roleId?: string | null;
    roleName?: string | null;
  } | null;
  permissions: Permission[];
};

function formatLabel(value?: string | null) {
  if (!value) return "—";

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SessionSettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!isMounted) return;

        if (res.status === 401) {
          setPermissions([]);
          setUser(null);
          return;
        }

        const json: MeResponse = await res.json();

        if (!res.ok) {
          throw new Error((json as any)?.error || "Failed to load auth state");
        }

        setPermissions(Array.isArray(json.permissions) ? json.permissions : []);
        setUser(json.user ?? null);
      } catch (error) {
        console.error("Failed to load session settings:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const canAccess = hasAnyPermission(permissions, [
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE_PROFILE,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="Session Settings" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="Session Settings" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to view session details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const name =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User";

  return (
    <div className="flex flex-col w-full">
      <TopBar title="Session Settings" />

      <div className="flex-1 w-full p-6">
        <div className="w-full grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <SessionCard label="Signed in as" value={name} />
          <SessionCard label="Email" value={user?.email ?? "—"} />
          <SessionCard label="Role" value={user?.roleName ?? "—"} />
          <SessionCard label="Account status" value={formatLabel(user?.status)} />
          {/* <SessionCard label="Auth method" value={formatLabel(user?.authMethod)} /> */}
          <SessionCard
            label="Email verified"
            value={
              user?.emailVerifiedAt
                ? new Date(user.emailVerifiedAt).toLocaleString()
                : "Not verified"
            }
          />
          <SessionCard
            label="Last login"
            value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
          />
        </div>
      </div>
    </div>
  );
}

function SessionCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-3 text-sm font-medium text-foreground break-words">{value}</p>
    </div>
  );
}