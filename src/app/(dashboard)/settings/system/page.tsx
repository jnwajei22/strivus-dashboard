"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
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

type SystemApiRow = {
  id?: string;
  category?: string;
  key?: string;
  value_json?: unknown;
  valueJson?: unknown;
  updated_at?: string;
  updatedAt?: string;
};

type SystemSetting = {
  id: string;
  category: string;
  key: string;
  valueJson: unknown;
  updatedAt?: string;
};

type FormState = {
  mqttBrokerUrl: string;
  mqttBrokerPort: string;
  mqttUsername: string;
  mqttPassword: string;
  commandTimeoutSeconds: string;
  defaultSyncIntervalSeconds: string;
  telemetryPublishRateSeconds: string;
  defaultDeploymentGroup: string;
  rolloutStrategy: string;
  autoRetryFailedDeployments: string;
  logRetentionDays: string;
  csvUploadMaxMb: string;
  sessionDataExportFormat: string;
  automationEnabled: boolean;
  requireHumanApproval: boolean;
  maxActionsPerHour: string;

  openAiApiKey: string;
  internalServiceToken: string;
  emailProviderApiKey: string;
  storageSecretKey: string;
};

function normalizeRow(row: SystemApiRow): SystemSetting {
  return {
    id: String(row.id ?? ""),
    category: String(row.category ?? ""),
    key: String(row.key ?? ""),
    valueJson: row.valueJson ?? row.value_json ?? {},
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

function getSettingMap(items: SystemSetting[]) {
  const map = new Map<string, SystemSetting>();
  for (const item of items) {
    map.set(`${item.category}.${item.key}`, item);
  }
  return map;
}

function getObjectValue<T = Record<string, unknown>>(value: unknown): T {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : ({} as T);
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNumberString(value: unknown, fallback = "") {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value;
  return fallback;
}

function getBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

const STRUCTURED_KEYS = new Set([
  "mqtt.broker",
  "devices.communication",
  "devices.deployment_defaults",
  "system.data_logging",
  "automation.autonomous_functions",
  "api.openai",
  "api.internal_service",
  "integrations.email_service",
  "integrations.storage",
]);

export default function SystemSettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [items, setItems] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [creatingCustom, setCreatingCustom] = useState(false);
  const [savingCustomId, setSavingCustomId] = useState<string | null>(null);
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null);

  const [newCustomCategory, setNewCustomCategory] = useState("");
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newCustomValueJson, setNewCustomValueJson] = useState('{\n  "enabled": true\n}');

  const [form, setForm] = useState<FormState>({
    mqttBrokerUrl: "",
    mqttBrokerPort: "8883",
    mqttUsername: "",
    mqttPassword: "",
    commandTimeoutSeconds: "30",
    defaultSyncIntervalSeconds: "300",
    telemetryPublishRateSeconds: "60",
    defaultDeploymentGroup: "production",
    rolloutStrategy: "staged",
    autoRetryFailedDeployments: "1",
    logRetentionDays: "90",
    csvUploadMaxMb: "50",
    sessionDataExportFormat: "csv",
    automationEnabled: false,
    requireHumanApproval: true,
    maxActionsPerHour: "20",

    openAiApiKey: "",
    internalServiceToken: "",
    emailProviderApiKey: "",
    storageSecretKey: "",
  });

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

        const nextPermissions = Array.isArray(meJson.permissions) ? meJson.permissions : [];
        setPermissions(nextPermissions);

        if (!hasPermission(nextPermissions, PERMISSIONS.SETTINGS_UPDATE_SYSTEM)) {
          return;
        }

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
        const normalized = rows.map(normalizeRow);
        setItems(normalized);

        const map = getSettingMap(normalized);

        const mqttBroker = getObjectValue(map.get("mqtt.broker")?.valueJson);
        const commsTiming = getObjectValue(map.get("devices.communication")?.valueJson);
        const deployDefaults = getObjectValue(map.get("devices.deployment_defaults")?.valueJson);
        const dataLogging = getObjectValue(map.get("system.data_logging")?.valueJson);
        const automation = getObjectValue(map.get("automation.autonomous_functions")?.valueJson);

        setForm({
          mqttBrokerUrl: getString(mqttBroker.host, ""),
          mqttBrokerPort: getNumberString(mqttBroker.port, "8883"),
          mqttUsername: getString(mqttBroker.username, ""),
          mqttPassword: getString(mqttBroker.password, ""),
          commandTimeoutSeconds: getNumberString(commsTiming.commandTimeoutSeconds, "30"),
          defaultSyncIntervalSeconds: getNumberString(commsTiming.defaultSyncIntervalSeconds, "300"),
          telemetryPublishRateSeconds: getNumberString(commsTiming.telemetryPublishRateSeconds, "60"),
          defaultDeploymentGroup: getString(deployDefaults.defaultDeploymentGroup, "production"),
          rolloutStrategy: getString(deployDefaults.rolloutStrategy, "staged"),
          autoRetryFailedDeployments: getNumberString(deployDefaults.autoRetryFailedDeployments, "1"),
          logRetentionDays: getNumberString(dataLogging.logRetentionDays, "90"),
          csvUploadMaxMb: getNumberString(dataLogging.csvUploadMaxMb, "50"),
          sessionDataExportFormat: getString(dataLogging.sessionDataExportFormat, "csv"),
          automationEnabled: getBoolean(automation.enabled, false),
          requireHumanApproval: getBoolean(automation.requireHumanApproval, true),
          maxActionsPerHour: getNumberString(automation.maxActionsPerHour, "20"),

          openAiApiKey: "",
          internalServiceToken: "",
          emailProviderApiKey: "",
          storageSecretKey: "",
        });
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
  const settingMap = useMemo(() => getSettingMap(items), [items]);

  const customItems = useMemo(() => {
    return items
      .filter((item) => !STRUCTURED_KEYS.has(`${item.category}.${item.key}`))
      .sort((a, b) =>
        `${a.category}.${a.key}`.localeCompare(`${b.category}.${b.key}`)
      );
  }, [items]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateCustomLocal(id: string, valueJson: unknown) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, valueJson } : item))
    );
  }

  async function upsertSetting(
    category: string,
    key: string,
    valueJson: Record<string, unknown>
  ) {
    const existing = settingMap.get(`${category}.${key}`);

    if (existing?.id) {
      const res = await fetch(`/api/settings/system/${existing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          key,
          valueJson,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || `Failed to update ${category}.${key}`);
      }

      return normalizeRow(json);
    }

    const res = await fetch("/api/settings/system", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        key,
        valueJson,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(json?.error || `Failed to create ${category}.${key}`);
    }

    return normalizeRow(json);
  }

  async function saveConfiguration() {
    try {
      setSaving(true);

      const existingOpenAi = getObjectValue(settingMap.get("api.openai")?.valueJson);
      const existingInternalService = getObjectValue(settingMap.get("api.internal_service")?.valueJson);
      const existingEmailService = getObjectValue(settingMap.get("integrations.email_service")?.valueJson);
      const existingStorage = getObjectValue(settingMap.get("integrations.storage")?.valueJson);

      const payloads = [
        {
          category: "mqtt",
          key: "broker",
          valueJson: {
            host: form.mqttBrokerUrl.trim(),
            port: Number(form.mqttBrokerPort || 0),
            username: form.mqttUsername.trim(),
            password:
              form.mqttPassword.trim() !== ""
                ? form.mqttPassword
                : getString(getObjectValue(settingMap.get("mqtt.broker")?.valueJson).password, ""),
            protocol: "mqtts",
            tls: true,
          },
        },
        {
          category: "devices",
          key: "communication",
          valueJson: {
            commandTimeoutSeconds: Number(form.commandTimeoutSeconds || 0),
            defaultSyncIntervalSeconds: Number(form.defaultSyncIntervalSeconds || 0),
            telemetryPublishRateSeconds: Number(form.telemetryPublishRateSeconds || 0),
          },
        },
        {
          category: "devices",
          key: "deployment_defaults",
          valueJson: {
            defaultDeploymentGroup: form.defaultDeploymentGroup,
            rolloutStrategy: form.rolloutStrategy,
            autoRetryFailedDeployments: Number(form.autoRetryFailedDeployments || 0),
          },
        },
        {
          category: "system",
          key: "data_logging",
          valueJson: {
            logRetentionDays: Number(form.logRetentionDays || 0),
            csvUploadMaxMb: Number(form.csvUploadMaxMb || 0),
            sessionDataExportFormat: form.sessionDataExportFormat,
          },
        },
        {
          category: "automation",
          key: "autonomous_functions",
          valueJson: {
            enabled: form.automationEnabled,
            requireHumanApproval: form.requireHumanApproval,
            maxActionsPerHour: Number(form.maxActionsPerHour || 0),
          },
        },
        {
          category: "api",
          key: "openai",
          valueJson: {
            ...existingOpenAi,
            apiKey:
              form.openAiApiKey.trim() !== ""
                ? form.openAiApiKey
                : existingOpenAi.apiKey ?? "",
          },
        },
        {
          category: "api",
          key: "internal_service",
          valueJson: {
            ...existingInternalService,
            token:
              form.internalServiceToken.trim() !== ""
                ? form.internalServiceToken
                : existingInternalService.token ?? "",
          },
        },
        {
          category: "integrations",
          key: "email_service",
          valueJson: {
            ...existingEmailService,
            apiKey:
              form.emailProviderApiKey.trim() !== ""
                ? form.emailProviderApiKey
                : existingEmailService.apiKey ?? "",
          },
        },
        {
          category: "integrations",
          key: "storage",
          valueJson: {
            ...existingStorage,
            secretKey:
              form.storageSecretKey.trim() !== ""
                ? form.storageSecretKey
                : existingStorage.secretKey ?? "",
          },
        },
      ];

      const savedRows = await Promise.all(
        payloads.map((entry) => upsertSetting(entry.category, entry.key, entry.valueJson))
      );

      setItems((prev) => {
        const next = [...prev];
        for (const saved of savedRows) {
          const idx = next.findIndex((item) => item.id === saved.id);
          if (idx >= 0) {
            next[idx] = saved;
            continue;
          }

          const byComposite = next.findIndex(
            (item) => item.category === saved.category && item.key === saved.key
          );

          if (byComposite >= 0) next[byComposite] = saved;
          else next.push(saved);
        }
        return next;
      });

      setForm((prev) => ({
        ...prev,
        openAiApiKey: "",
        internalServiceToken: "",
        emailProviderApiKey: "",
        storageSecretKey: "",
        mqttPassword: "",
      }));

      toast({
        title: "Configuration saved",
        description: "System settings updated.",
      });
    } catch (error) {
      console.error("Failed to save system settings:", error);
      toast({
        title: "Save failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function createCustomSetting() {
    try {
      if (!newCustomCategory.trim() || !newCustomKey.trim()) {
        throw new Error("Category and key are required.");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(newCustomValueJson);
      } catch {
        throw new Error("Custom setting JSON is invalid.");
      }

      setCreatingCustom(true);

      const res = await fetch("/api/settings/system", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCustomCategory.trim(),
          key: newCustomKey.trim(),
          valueJson: parsed,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to create custom setting");
      }

      const created = normalizeRow(json);

      setItems((prev) => {
        const others = prev.filter(
          (item) =>
            !(
              item.category === created.category &&
              item.key === created.key
            )
        );
        return [...others, created];
      });

      setNewCustomCategory("");
      setNewCustomKey("");
      setNewCustomValueJson('{\n  "enabled": true\n}');

      toast({
        title: "Custom setting created",
        description: `${created.category}.${created.key} added.`,
      });
    } catch (error) {
      console.error("Failed to create custom setting:", error);
      toast({
        title: "Create failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setCreatingCustom(false);
    }
  }

  async function saveCustomSetting(item: SystemSetting) {
    try {
      let parsed: unknown;
      try {
        parsed =
          typeof item.valueJson === "string" ? JSON.parse(item.valueJson) : item.valueJson;
      } catch {
        throw new Error(`Invalid JSON for ${item.category}.${item.key}`);
      }

      setSavingCustomId(item.id);

      const res = await fetch(`/api/settings/system/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: item.category,
          key: item.key,
          valueJson: parsed,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to update custom setting");
      }

      const saved = normalizeRow(json);

      setItems((prev) =>
        prev.map((row) => (row.id === saved.id ? saved : row))
      );

      toast({
        title: "Custom setting saved",
        description: `${saved.category}.${saved.key} updated.`,
      });
    } catch (error) {
      console.error("Failed to save custom setting:", error);
      toast({
        title: "Save failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setSavingCustomId(null);
    }
  }

  async function deleteCustomSetting(id: string) {
    try {
      setDeletingCustomId(id);

      const res = await fetch(`/api/settings/system/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to delete custom setting");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));

      toast({
        title: "Custom setting deleted",
      });
    } catch (error) {
      console.error("Failed to delete custom setting:", error);
      toast({
        title: "Delete failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setDeletingCustomId(null);
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  const labelClass =
    "mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

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
        <TopBar title="System Settings" />
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
        <TopBar title="System Settings" />
        <div className="p-6">
          <div className="mb-6">{backButton}</div>
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

  const mqttConfigured = Boolean(settingMap.get("mqtt.broker")?.id);
  const openAiConfigured = Boolean(settingMap.get("api.openai")?.id);
  const internalServiceConfigured = Boolean(settingMap.get("api.internal_service")?.id);
  const emailServiceConfigured = Boolean(settingMap.get("integrations.email_service")?.id);
  const storageConfigured = Boolean(settingMap.get("integrations.storage")?.id);

  return (
    <div className="flex flex-col w-full">
      <TopBar title="System Settings" />

      <div className="flex-1 w-full p-6">
        <div className="w-full max-w-none space-y-8">
          <div>{backButton}</div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">System Settings</h3>
            <p className="text-sm text-muted-foreground">
              Platform configuration and operational defaults.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Communication
            </h4>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div>
                <label className={labelClass}>MQTT Broker URL</label>
                <input
                  type="text"
                  value={form.mqttBrokerUrl}
                  onChange={(e) => updateField("mqttBrokerUrl", e.target.value)}
                  className={`${inputClass} font-mono`}
                  placeholder="broker.strivus.com"
                />
              </div>

              <div>
                <label className={labelClass}>MQTT Broker Port</label>
                <input
                  type="text"
                  value={form.mqttBrokerPort}
                  onChange={(e) => updateField("mqttBrokerPort", e.target.value)}
                  className={`${inputClass} font-mono`}
                  placeholder="8883"
                />
              </div>

              <div>
                <label className={labelClass}>MQTT Username</label>
                <input
                  type="text"
                  value={form.mqttUsername}
                  onChange={(e) => updateField("mqttUsername", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>MQTT Password</label>
                <input
                  type="password"
                  value={form.mqttPassword}
                  onChange={(e) => updateField("mqttPassword", e.target.value)}
                  className={inputClass}
                  placeholder={mqttConfigured ? "Configured — enter to replace" : "Set password"}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Stored as a secret. Leave blank to keep the current value.
                </p>
              </div>

              <div>
                <label className={labelClass}>Command Timeout (seconds)</label>
                <input
                  type="text"
                  value={form.commandTimeoutSeconds}
                  onChange={(e) => updateField("commandTimeoutSeconds", e.target.value)}
                  className={`${inputClass} font-mono`}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Time to wait for device ACK.
                </p>
              </div>

              <div>
                <label className={labelClass}>Default Sync Interval (seconds)</label>
                <input
                  type="text"
                  value={form.defaultSyncIntervalSeconds}
                  onChange={(e) => updateField("defaultSyncIntervalSeconds", e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className={labelClass}>Telemetry Publish Rate (seconds)</label>
                <input
                  type="text"
                  value={form.telemetryPublishRateSeconds}
                  onChange={(e) => updateField("telemetryPublishRateSeconds", e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              API Keys & Secrets
            </h4>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div>
                <label className={labelClass}>OpenAI API Key</label>
                <input
                  type="password"
                  value={form.openAiApiKey}
                  onChange={(e) => updateField("openAiApiKey", e.target.value)}
                  className={inputClass}
                  placeholder={openAiConfigured ? "Configured — enter to replace" : "Enter API key"}
                />
              </div>

              <div>
                <label className={labelClass}>Internal Service Token</label>
                <input
                  type="password"
                  value={form.internalServiceToken}
                  onChange={(e) => updateField("internalServiceToken", e.target.value)}
                  className={inputClass}
                  placeholder={
                    internalServiceConfigured ? "Configured — enter to replace" : "Enter token"
                  }
                />
              </div>

              <div>
                <label className={labelClass}>Email Provider API Key</label>
                <input
                  type="password"
                  value={form.emailProviderApiKey}
                  onChange={(e) => updateField("emailProviderApiKey", e.target.value)}
                  className={inputClass}
                  placeholder={
                    emailServiceConfigured ? "Configured — enter to replace" : "Enter provider key"
                  }
                />
              </div>

              <div>
                <label className={labelClass}>Storage Secret Key</label>
                <input
                  type="password"
                  value={form.storageSecretKey}
                  onChange={(e) => updateField("storageSecretKey", e.target.value)}
                  className={inputClass}
                  placeholder={
                    storageConfigured ? "Configured — enter to replace" : "Enter secret key"
                  }
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Secret fields are replace-only. Leave them blank to preserve the current stored value.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Deployment Defaults
            </h4>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div>
                <label className={labelClass}>Default Deployment Group</label>
                <select
                  value={form.defaultDeploymentGroup}
                  onChange={(e) => updateField("defaultDeploymentGroup", e.target.value)}
                  className={inputClass}
                >
                  <option value="production">Production</option>
                  <option value="qa">QA</option>
                  <option value="test">Test</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Rollout Strategy</label>
                <select
                  value={form.rolloutStrategy}
                  onChange={(e) => updateField("rolloutStrategy", e.target.value)}
                  className={inputClass}
                >
                  <option value="immediate">Immediate — all devices at once</option>
                  <option value="staged">Staged — phased rollout</option>
                  <option value="manual">Manual — device-by-device</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Auto-retry Failed Deployments</label>
                <select
                  value={form.autoRetryFailedDeployments}
                  onChange={(e) => updateField("autoRetryFailedDeployments", e.target.value)}
                  className={inputClass}
                >
                  <option value="0">Disabled</option>
                  <option value="1">1 retry</option>
                  <option value="3">3 retries</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data & Logging
            </h4>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div>
                <label className={labelClass}>Log Retention Period</label>
                <select
                  value={form.logRetentionDays}
                  onChange={(e) => updateField("logRetentionDays", e.target.value)}
                  className={inputClass}
                >
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>CSV Upload Max Size (MB)</label>
                <input
                  type="text"
                  value={form.csvUploadMaxMb}
                  onChange={(e) => updateField("csvUploadMaxMb", e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className={labelClass}>Session Data Export Format</label>
                <select
                  value={form.sessionDataExportFormat}
                  onChange={(e) => updateField("sessionDataExportFormat", e.target.value)}
                  className={inputClass}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="both">CSV + JSON</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Autonomous Functions
            </h4>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4 xl:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Enable autonomous functions
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Allow automated workflows and system-driven actions.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.automationEnabled}
                    onChange={(e) => updateField("automationEnabled", e.target.checked)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 xl:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Require human approval
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Keep a human in the loop before automated execution.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.requireHumanApproval}
                    onChange={(e) => updateField("requireHumanApproval", e.target.checked)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Max Automated Actions / Hour</label>
                <input
                  type="text"
                  value={form.maxActionsPerHour}
                  onChange={(e) => updateField("maxActionsPerHour", e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveConfiguration}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Custom System Settings
            </h4>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <input
                    type="text"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    className={inputClass}
                    placeholder="integrations"
                  />
                </div>

                <div>
                  <label className={labelClass}>Key</label>
                  <input
                    type="text"
                    value={newCustomKey}
                    onChange={(e) => setNewCustomKey(e.target.value)}
                    className={inputClass}
                    placeholder="ehr_bridge"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={createCustomSetting}
                    disabled={creatingCustom}
                    className="h-10 w-full rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingCustom ? "Creating..." : "Add Custom Setting"}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className={labelClass}>Value JSON</label>
                <textarea
                  value={newCustomValueJson}
                  onChange={(e) => setNewCustomValueJson(e.target.value)}
                  className="min-h-[160px] w-full rounded-lg border border-border bg-background p-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {customItems.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                No custom settings yet.
              </div>
            ) : (
              <div className="space-y-4">
                {customItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {item.category}
                        </p>
                        <h5 className="mt-1 text-sm font-semibold text-foreground">
                          {item.key}
                        </h5>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => saveCustomSetting(item)}
                          disabled={savingCustomId === item.id}
                          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingCustomId === item.id ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={() => deleteCustomSetting(item.id)}
                          disabled={deletingCustomId === item.id}
                          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingCustomId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={stringifyJson(item.valueJson)}
                      onChange={(e) => {
                        const nextText = e.target.value;
                        try {
                          updateCustomLocal(item.id, JSON.parse(nextText));
                        } catch {
                          updateCustomLocal(item.id, nextText);
                        }
                      }}
                      className="mt-4 min-h-[180px] w-full rounded-lg border border-border bg-background p-3 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}