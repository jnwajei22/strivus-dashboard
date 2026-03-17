"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
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
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type NotificationDefinition = {
  key: string;
  label: string;
  description: string;
  category: "Monitoring" | "Firmware" | "Patients" | "System" | "Security";
  defaults: {
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
};

const NOTIFICATION_DEFINITIONS: NotificationDefinition[] = [
  {
    key: "device_offline",
    label: "Device offline",
    description: "Get alerted when a device stops checking in.",
    category: "Monitoring",
    defaults: { emailEnabled: true, pushEnabled: true },
  },
  {
    key: "device_low_battery",
    label: "Low battery",
    description: "Get alerted when a device battery drops below threshold.",
    category: "Monitoring",
    defaults: { emailEnabled: true, pushEnabled: false },
  },
  {
    key: "device_sync_failed",
    label: "Sync failed",
    description: "Get alerted when a device cannot sync data successfully.",
    category: "Monitoring",
    defaults: { emailEnabled: true, pushEnabled: false },
  },
  {
    key: "firmware_deployment_started",
    label: "Deployment started",
    description: "Get alerted when a firmware rollout begins.",
    category: "Firmware",
    defaults: { emailEnabled: false, pushEnabled: false },
  },
  {
    key: "firmware_deployment_failed",
    label: "Deployment failed",
    description: "Get alerted when a firmware deployment fails.",
    category: "Firmware",
    defaults: { emailEnabled: true, pushEnabled: true },
  },
  {
    key: "firmware_deployment_completed",
    label: "Deployment completed",
    description: "Get alerted when a firmware deployment finishes successfully.",
    category: "Firmware",
    defaults: { emailEnabled: false, pushEnabled: false },
  },
  {
    key: "patient_flag_created",
    label: "Patient flag created",
    description: "Get alerted when a patient receives a new clinical flag.",
    category: "Patients",
    defaults: { emailEnabled: true, pushEnabled: false },
  },
  {
    key: "patient_session_missed",
    label: "Missed session",
    description: "Get alerted when a patient misses a scheduled session.",
    category: "Patients",
    defaults: { emailEnabled: true, pushEnabled: false },
  },
  {
    key: "new_user_invite",
    label: "New user invite",
    description: "Get alerted when a new user is invited into the platform.",
    category: "Security",
    defaults: { emailEnabled: false, pushEnabled: false },
  },
  {
    key: "role_changed",
    label: "Role changed",
    description: "Get alerted when a user role or access level changes.",
    category: "Security",
    defaults: { emailEnabled: true, pushEnabled: false },
  },
  {
    key: "integration_failed",
    label: "Integration failed",
    description: "Get alerted when an external integration check fails.",
    category: "System",
    defaults: { emailEnabled: true, pushEnabled: true },
  },
  {
    key: "system_announcement",
    label: "System announcements",
    description: "Get platform-wide maintenance or operational announcements.",
    category: "System",
    defaults: { emailEnabled: true, pushEnabled: false },
  },
];

function normalizeRow(row: NotificationApiRow): NotificationPreference {
  return {
    id: String(row.id ?? ""),
    alertKey: String(row.alertKey ?? row.alert_key ?? ""),
    emailEnabled: Boolean(row.emailEnabled ?? row.email_enabled),
    pushEnabled: Boolean(row.pushEnabled ?? row.push_enabled),
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

export default function NotificationSettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [items, setItems] = useState<NotificationPreference[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
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

  const itemMap = useMemo(() => {
    return new Map(items.map((item) => [item.alertKey, item]));
  }, [items]);

  const definitionRows = useMemo(() => {
    return NOTIFICATION_DEFINITIONS.map((def) => {
      const existing = itemMap.get(def.key);

      return {
        definition: def,
        preference: existing ?? {
          id: "",
          alertKey: def.key,
          emailEnabled: def.defaults.emailEnabled,
          pushEnabled: def.defaults.pushEnabled,
        },
      };
    });
  }, [itemMap]);

  const groupedRows = useMemo(() => {
    const groups = new Map<string, typeof definitionRows>();

    for (const row of definitionRows) {
      const existing = groups.get(row.definition.category) ?? [];
      existing.push(row);
      groups.set(row.definition.category, existing);
    }

    return Array.from(groups.entries());
  }, [definitionRows]);

  async function savePreference(row: NotificationPreference) {
    try {
      setSavingKey(row.alertKey);

      const isExisting = Boolean(row.id);

      const res = await fetch(
        isExisting
          ? `/api/settings/notifications/${row.id}`
          : "/api/settings/notifications",
        {
          method: isExisting ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alert_key: row.alertKey,
            email_enabled: row.emailEnabled,
            push_enabled: row.pushEnabled,
          }),
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to save notification preference");
      }

      const saved = normalizeRow(json);

      setItems((prev) => {
        const others = prev.filter(
          (item) => item.id !== saved.id && item.alertKey !== saved.alertKey
        );
        return [...others, saved];
      });

      toast({
        title: "Notification updated",
        description: `Saved ${row.alertKey}.`,
      });
    } catch (error) {
      console.error("Failed to save notification preference:", error);
      toast({
        title: "Save failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  }

  function updateDraft(alertKey: string, patch: Partial<NotificationPreference>) {
    const existing = itemMap.get(alertKey);

    if (existing) {
      setItems((prev) =>
        prev.map((item) => (item.alertKey === alertKey ? { ...item, ...patch } : item))
      );
      return;
    }

    const definition = NOTIFICATION_DEFINITIONS.find((d) => d.key === alertKey);
    if (!definition) return;

    setItems((prev) => [
      ...prev,
      {
        id: "",
        alertKey,
        emailEnabled: definition.defaults.emailEnabled,
        pushEnabled: definition.defaults.pushEnabled,
        ...patch,
      },
    ]);
  }

  const backButton = (
    <Link
      href="/settings"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Settings
    </Link>
  );

  if (loading) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="Notification Settings" />
        <div className="p-6">
          <div className="mb-6">{backButton}</div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="Notification Settings" />
        <div className="p-6">
          <div className="mb-6">{backButton}</div>
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
        <div className="mb-6">{backButton}</div>

        <div className="flex w-full flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
            <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose how you want important events delivered.
            </p>
          </div>

          {groupedRows.map(([category, rows]) => (
            <section
              key={category}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-kinetica"
            >
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-base font-semibold text-foreground">{category}</h2>
              </div>

              <div className="hidden border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(0,1.8fr)_140px_140px_96px] md:items-center md:gap-4">
                <div>Notification</div>
                <div className="text-center">Email</div>
                <div className="text-center">Push</div>
                <div className="text-right">Action</div>
              </div>

              {rows.map(({ definition, preference }) => (
                <div
                  key={definition.key}
                  className="border-b border-border px-6 py-4 last:border-b-0"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.8fr)_140px_140px_96px] md:items-center md:gap-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">{definition.label}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {definition.description}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Key: <code>{definition.key}</code>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:hidden">
                        Email
                      </span>
                      <ToggleCell
                        checked={preference.emailEnabled}
                        disabled={!canEdit}
                        onChange={(checked) =>
                          updateDraft(definition.key, { emailEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:hidden">
                        Push
                      </span>
                      <ToggleCell
                        checked={preference.pushEnabled}
                        disabled={!canEdit}
                        onChange={(checked) =>
                          updateDraft(definition.key, { pushEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => savePreference(preference)}
                        disabled={!canEdit || savingKey === definition.key}
                        className="inline-flex h-11 items-center rounded-lg border border-border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingKey === definition.key ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}
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
    <label className="flex h-11 w-[140px] items-center justify-center rounded-lg border border-border bg-background">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}