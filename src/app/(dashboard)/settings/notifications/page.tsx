"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/hooks/use-toast";
import {
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  type Permission,
} from "@/lib/auth/permissions";

type MeResponse = {
  user: { id: string; email: string } | null;
  permissions: Permission[];
};

type NotificationPreference = {
  id: string;
  alertKey: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type NotificationApiRow = {
  id?: string;
  alert_key?: string;
  alertKey?: string;
  email_enabled?: boolean;
  emailEnabled?: boolean;
  push_enabled?: boolean;
  pushEnabled?: boolean;
  in_app_enabled?: boolean;
  inAppEnabled?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

function normalizeRow(row: NotificationApiRow): NotificationPreference {
  return {
    id: String(row.id ?? ""),
    alertKey: String(row.alertKey ?? row.alert_key ?? ""),
    emailEnabled: Boolean(row.emailEnabled ?? row.email_enabled),
    pushEnabled: Boolean(row.pushEnabled ?? row.push_enabled),
    inAppEnabled: Boolean(row.inAppEnabled ?? row.in_app_enabled),
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

export default function NotificationSettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [items, setItems] = useState<NotificationPreference[]>([]);
  const [newAlertKey, setNewAlertKey] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const meRes = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!isMounted) return;

        if (meRes.status === 401) {
          setPermissions([]);
          setItems([]);
          return;
        }

        const meJson: MeResponse = await meRes.json();

        if (!meRes.ok) {
          throw new Error((meJson as any)?.error || "Failed to load auth state");
        }

        setPermissions(Array.isArray(meJson.permissions) ? meJson.permissions : []);

        const res = await fetch("/api/settings/notifications", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load notifications");
        }

        if (!isMounted) return;

        const rows = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [];
        setItems(rows.map(normalizeRow));
      } catch (error) {
        console.error("Failed to load notification settings:", error);
        if (!isMounted) return;
        toast({
          title: "Failed to load notifications",
          description: String(error),
          variant: "destructive",
        });
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

  const canEdit = hasPermission(permissions, PERMISSIONS.SETTINGS_UPDATE_PROFILE);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.alertKey.localeCompare(b.alertKey)),
    [items]
  );

  function updateLocal(id: string, patch: Partial<NotificationPreference>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function persistRow(row: NotificationPreference) {
    try {
      setSavingId(row.id);

      const res = await fetch(`/api/settings/notifications/${row.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_key: row.alertKey,
          email_enabled: row.emailEnabled,
          push_enabled: row.pushEnabled,
          in_app_enabled: row.inAppEnabled,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to update notification preference");
      }

      if (json) {
        updateLocal(row.id, normalizeRow(json));
      }

      toast({
        title: "Notification updated",
        description: `Saved ${row.alertKey}.`,
      });
    } catch (error) {
      console.error("Failed to update notification preference:", error);
      toast({
        title: "Update failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  }

  async function createRow() {
    const alertKey = newAlertKey.trim();
    if (!alertKey) return;

    try {
      setCreating(true);

      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_key: alertKey,
          email_enabled: true,
          push_enabled: false,
          in_app_enabled: true,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to create notification preference");
      }

      const created = normalizeRow(json);
      setItems((prev) => {
        const withoutDuplicate = prev.filter(
          (item) => item.id !== created.id && item.alertKey !== created.alertKey
        );
        return [...withoutDuplicate, created];
      });
      setNewAlertKey("");

      toast({
        title: "Notification created",
        description: `Added ${created.alertKey}.`,
      });
    } catch (error) {
      console.error("Failed to create notification preference:", error);
      toast({
        title: "Create failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function deleteRow(id: string) {
    try {
      setDeletingId(id);

      const res = await fetch(`/api/settings/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to delete notification preference");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));

      toast({
        title: "Notification removed",
      });
    } catch (error) {
      console.error("Failed to delete notification preference:", error);
      toast({
        title: "Delete failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="Notification Settings" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="Notification Settings" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to view notification settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <TopBar title="Notification Settings" />

      <div className="flex-1 w-full p-6">
        <div className="w-full flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
            <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Control how alerts reach you. Less chaos, more signal.
            </p>

            {canEdit && (
              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <input
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm md:max-w-md"
                  placeholder="New alert key (example: device_offline)"
                  value={newAlertKey}
                  onChange={(e) => setNewAlertKey(e.target.value)}
                />
                <button
                  onClick={createRow}
                  disabled={creating || !newAlertKey.trim()}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Add preference"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-kinetica overflow-hidden">
            <div className="grid grid-cols-12 gap-4 border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-4">Alert key</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-2">Push</div>
              <div className="col-span-2">In-app</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {sortedItems.length === 0 ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">
                No notification preferences found.
              </div>
            ) : (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 border-b border-border px-6 py-4 last:border-b-0"
                >
                  <div className="col-span-12 md:col-span-4">
                    <input
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      value={item.alertKey}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <ToggleCell
                      checked={item.emailEnabled}
                      disabled={!canEdit}
                      onChange={(checked) => updateLocal(item.id, { emailEnabled: checked })}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <ToggleCell
                      checked={item.pushEnabled}
                      disabled={!canEdit}
                      onChange={(checked) => updateLocal(item.id, { pushEnabled: checked })}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <ToggleCell
                      checked={item.inAppEnabled}
                      disabled={!canEdit}
                      onChange={(checked) => updateLocal(item.id, { inAppEnabled: checked })}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => persistRow(item)}
                      disabled={!canEdit || savingId === item.id}
                      className="inline-flex h-11 items-center rounded-lg border border-border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === item.id ? "Saving..." : "Save"}
                    </button>

                    <button
                      onClick={() => deleteRow(item.id)}
                      disabled={!canEdit || deletingId === item.id}
                      className="inline-flex h-11 items-center rounded-lg border border-red-300 px-3 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleCell({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-11 items-center justify-center rounded-lg border border-border bg-background">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}