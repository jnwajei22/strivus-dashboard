"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import {
  PERMISSIONS,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

type MeResponse = {
  user: { id: string; email: string } | null;
  permissions: Permission[];
};

export default function IntegrationsSettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!isMounted) return;

        if (res.status === 401) {
          setPermissions([]);
          return;
        }

        const json: MeResponse = await res.json();

        if (!res.ok) {
          throw new Error((json as any)?.error || "Failed to load auth state");
        }

        setPermissions(Array.isArray(json.permissions) ? json.permissions : []);
      } catch (error) {
        console.error("Failed to load integrations settings:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMe();

    return () => {
      isMounted = false;
    };
  }, []);

  const canAccess = hasPermission(permissions, PERMISSIONS.SETTINGS_UPDATE_SYSTEM);

  if (loading) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="Integrations" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="Integrations" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to manage integrations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <TopBar title="Integrations" />

      <div className="flex-1 w-full p-6">
        <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-kinetica">
          <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page should later connect to your integrations and secrets tables.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-border bg-background p-6">
            <p className="text-sm text-muted-foreground">
              Placeholder for real integrations UI and health checks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}