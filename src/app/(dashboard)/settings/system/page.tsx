"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/hooks/use-toast";
import {
  PERMISSIONS,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

type MeResponse = {
  user: { id: string; email: string } | null;
  permissions: Permission[];
};

type SystemSetting = {
  id: string;
  category: string;
  key: string;
  valueJson: string;
  updatedAt?: string;
};

type SystemApiRow = {
  id?: string;
  category?: string;
  key?: string;
  value_json?: unknown;
  valueJson?: unknown;
  updated_at?: string;
  updatedAt?: string;
};

function normalizeRow(row: SystemApiRow): SystemSetting {
  const rawValue = row.valueJson ?? row.value_json ?? null;

  return {
    id: String(row.id ?? ""),
    category: String(row.category ?? ""),
    key: String(row.key ?? ""),
    valueJson:
      typeof rawValue === "string"
        ? rawValue
        : JSON.stringify(rawValue ?? {}, null, 2),
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

export default function SystemSettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [items, setItems] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [newCategory, setNewCategory] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValueJson, setNewValueJson] = useState('{\n  "enabled": true\n}');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
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

        const res = await fetch("/api/settings/system", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load system settings");
        }

        if (!isMounted) return;

        const rows = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [];
        setItems(rows.map(normalizeRow));
      } catch (error) {
        console.error("Failed to load system settings:", error);
        if (!isMounted) return;
        toast({
          title: "Failed to load system settings",
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

  const canAccess = hasPermission(permissions, PERMISSIONS.SETTINGS_UPDATE_SYSTEM);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        `${a.category}.${a.key}`.localeCompare(`${b.category}.${b.key}`)
      ),
    [items]
  );

  function updateLocal(id: string, patch: Partial<SystemSetting>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function persistRow(row: SystemSetting) {
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(row.valueJson);
      } catch {
        throw new Error(`Invalid JSON for ${row.category}.${row.key}`);
      }

      setSavingId(row.id);

      const res = await fetch(`/api/settings/system/${row.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: row.category,
          key: row.key,
          valueJson: parsed,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to update system setting");
      }

      toast({
        title: "System setting updated",
        description: `${row.category}.${row.key} saved.`,
      });
    } catch (error) {
      console.error("Failed to update system setting:", error);
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
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(newValueJson);
      } catch {
        throw new Error("New system setting JSON is invalid");
      }

      if (!newCategory.trim() || !newKey.trim()) {
        throw new Error("Category and key are required");
      }

      setCreating(true);

      const res = await fetch("/api/settings/system", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory.trim(),
          key: newKey.trim(),
          valueJson: parsed,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to create system setting");
      }

      setItems((prev) => [...prev, normalizeRow(json)]);
      setNewCategory("");
      setNewKey("");
      setNewValueJson('{\n  "enabled": true\n}');

      toast({
        title: "System setting created",
      });
    } catch (error) {
      console.error("Failed to create system setting:", error);
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

      const res = await fetch(`/api/settings/system/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to delete system setting");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));

      toast({
        title: "System setting removed",
      });
    } catch (error) {
      console.error("Failed to delete system setting:", error);
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
        <TopBar title="System Settings" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="System Settings" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to manage system settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <TopBar title="System Settings" />

      <div className="flex-1 w-full p-6">
        <div className="w-full flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
            <h1 className="text-2xl font-semibold text-foreground">System</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Edit platform-level configuration values. Handle with care; this is where chaos gets promoted to policy.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <input
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <input
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="Key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
              <button
                onClick={createRow}
                disabled={creating}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Add setting"}
              </button>
            </div>

            <textarea
              className="mt-4 min-h-[160px] w-full rounded-lg border border-border bg-background p-3 font-mono text-sm"
              value={newValueJson}
              onChange={(e) => setNewValueJson(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-4">
            {sortedItems.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-kinetica text-sm text-muted-foreground">
                No system settings found.
              </div>
            ) : (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-kinetica"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {item.category}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-foreground">
                        {item.key}
                      </h2>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => persistRow(item)}
                        disabled={savingId === item.id}
                        className="inline-flex h-11 items-center rounded-lg border border-border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingId === item.id ? "Saving..." : "Save"}
                      </button>

                      <button
                        onClick={() => deleteRow(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex h-11 items-center rounded-lg border border-red-300 px-3 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  <textarea
                    className="mt-4 min-h-[180px] w-full rounded-lg border border-border bg-background p-3 font-mono text-sm"
                    value={item.valueJson}
                    onChange={(e) => updateLocal(item.id, { valueJson: e.target.value })}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}