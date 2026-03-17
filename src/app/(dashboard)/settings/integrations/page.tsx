"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/hooks/use-toast";
import {
  PERMISSIONS,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { ArrowLeft, RefreshCw, Sliders, ExternalLink } from "lucide-react";

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

type IntegrationStatus = "connected" | "configured" | "disconnected" | "error";

type IntegrationCard = {
  id: string;
  name: string;
  description: string;
  category: string;
  key: string;
  endpointLabel?: string;
  endpointValue?: string;
  status: IntegrationStatus;
  lastUpdated?: string;
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

function getObjectValue<T = Record<string, unknown>>(value: unknown): T {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : ({} as T);
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatDateTime(value?: string) {
  if (!value) return "Never checked";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Never checked";
  return parsed.toLocaleString();
}

function getStatusClasses(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "configured":
      return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    case "error":
      return "bg-destructive/15 text-destructive border-destructive/30";
    default:
      return "bg-surface text-muted-foreground border-border";
  }
}

function getStatusDot(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return "bg-emerald-400";
    case "configured":
      return "bg-sky-400";
    case "error":
      return "bg-destructive";
    default:
      return "bg-muted-foreground/40";
  }
}

export default function IntegrationsSettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [items, setItems] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

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
          throw new Error(json?.error || "Failed to load integration settings");
        }

        if (!isMounted) return;

        const rows = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [];
        setItems(rows.map(normalizeRow));
      } catch (error) {
        console.error("Failed to load integrations settings:", error);
        if (!isMounted) return;
        toast({
          title: "Failed to load integrations",
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

  const settingMap = useMemo(() => {
    const map = new Map<string, SystemSetting>();
    for (const item of items) {
      map.set(`${item.category}.${item.key}`, item);
    }
    return map;
  }, [items]);

  const integrations = useMemo<IntegrationCard[]>(() => {
    const mqttBroker = settingMap.get("mqtt.broker");
    const mqttObj = getObjectValue(mqttBroker?.valueJson);

    const openAi = settingMap.get("api.openai");
    const openAiObj = getObjectValue(openAi?.valueJson);

    const internalService = settingMap.get("api.internal_service");
    const internalObj = getObjectValue(internalService?.valueJson);

    const emailService = settingMap.get("integrations.email_service");
    const emailObj = getObjectValue(emailService?.valueJson);

    const storage = settingMap.get("integrations.storage");
    const storageObj = getObjectValue(storage?.valueJson);

    const analytics = settingMap.get("integrations.analytics");
    const analyticsObj = getObjectValue(analytics?.valueJson);

    const ehr = settingMap.get("integrations.ehr_bridge");
    const ehrObj = getObjectValue(ehr?.valueJson);

    const mqttHost = getString(mqttObj.host, "");
    const mqttPort = getNumber(mqttObj.port, 8883);
    const mqttStatus: IntegrationStatus = mqttBroker?.id
      ? mqttHost
        ? "connected"
        : "configured"
      : "disconnected";

    const openAiStatus: IntegrationStatus = openAi?.id
      ? openAiObj && (openAiObj.apiKey || openAiObj.baseUrl || openAiObj.model)
        ? "configured"
        : "disconnected"
      : "disconnected";

    const internalStatus: IntegrationStatus = internalService?.id
      ? internalObj && (internalObj.token || internalObj.baseUrl)
        ? "configured"
        : "disconnected"
      : "disconnected";

    const emailStatus: IntegrationStatus = emailService?.id
      ? emailObj && (emailObj.apiKey || emailObj.provider || emailObj.region)
        ? "configured"
        : "disconnected"
      : "disconnected";

    const storageStatus: IntegrationStatus = storage?.id
      ? storageObj && (storageObj.bucket || storageObj.region || storageObj.secretKey)
        ? "configured"
        : "disconnected"
      : "disconnected";

    const analyticsStatus: IntegrationStatus = analytics?.id
      ? analyticsObj && (analyticsObj.endpoint || analyticsObj.baseUrl)
        ? "configured"
        : "disconnected"
      : "disconnected";

    const ehrStatus: IntegrationStatus = ehr?.id
      ? ehrObj && (ehrObj.endpoint || ehrObj.baseUrl)
        ? "configured"
        : "disconnected"
      : "disconnected";

    return [
      {
        id: "mqtt-broker",
        name: "MQTT Broker",
        description: "Device communication layer for telemetry, commands, and status traffic.",
        category: "mqtt",
        key: "broker",
        endpointLabel: "Endpoint",
        endpointValue: mqttHost ? `mqtts://${mqttHost}:${mqttPort}` : "",
        status: mqttStatus,
        lastUpdated: mqttBroker?.updatedAt,
      },
      {
        id: "openai-api",
        name: "OpenAI API",
        description: "AI-backed features, automation, and agent-driven workflows.",
        category: "api",
        key: "openai",
        endpointLabel: "Model",
        endpointValue: getString(openAiObj.model, ""),
        status: openAiStatus,
        lastUpdated: openAi?.updatedAt,
      },
      {
        id: "internal-service",
        name: "Internal Service",
        description: "Shared service token or base URL for internal platform calls.",
        category: "api",
        key: "internal_service",
        endpointLabel: "Base URL",
        endpointValue: getString(internalObj.baseUrl, ""),
        status: internalStatus,
        lastUpdated: internalService?.updatedAt,
      },
      {
        id: "email-service",
        name: "Email Service",
        description: "Authentication codes, invitations, and outbound notification delivery.",
        category: "integrations",
        key: "email_service",
        endpointLabel: "Provider",
        endpointValue: getString(emailObj.provider, "") || getString(emailObj.region, ""),
        status: emailStatus,
        lastUpdated: emailService?.updatedAt,
      },
      {
        id: "cloud-storage",
        name: "Cloud Storage",
        description: "Firmware binaries, CSV session data, and uploaded files.",
        category: "integrations",
        key: "storage",
        endpointLabel: "Bucket",
        endpointValue: getString(storageObj.bucket, ""),
        status: storageStatus,
        lastUpdated: storage?.updatedAt,
      },
      {
        id: "analytics-pipeline",
        name: "Analytics Pipeline",
        description: "Aggregated session and movement data for dashboards and reporting.",
        category: "integrations",
        key: "analytics",
        endpointLabel: "Endpoint",
        endpointValue: getString(analyticsObj.endpoint, "") || getString(analyticsObj.baseUrl, ""),
        status: analyticsStatus,
        lastUpdated: analytics?.updatedAt,
      },
      {
        id: "ehr-bridge",
        name: "EHR Integration",
        description: "Clinical system bridge for HL7, FHIR, or external patient record sync.",
        category: "integrations",
        key: "ehr_bridge",
        endpointLabel: "Endpoint",
        endpointValue: getString(ehrObj.endpoint, "") || getString(ehrObj.baseUrl, ""),
        status: ehrStatus,
        lastUpdated: ehr?.updatedAt,
      },
    ];
  }, [settingMap]);

  async function testIntegration(card: IntegrationCard) {
    try {
      setTestingId(card.id);

      // stub for now; later this can call /api/integrations/test or /api/integrations/check
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: "Connection test started",
        description: `Checked ${card.name}. Wire this to a real health endpoint later.`,
      });
    } catch (error) {
      console.error("Failed to test integration:", error);
      toast({
        title: "Test failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setTestingId(null);
    }
  }

  function configureIntegration(card: IntegrationCard) {
    toast({
      title: "Open configuration",
      description: `Configure ${card.name} from System Settings (${card.category}.${card.key}).`,
    });
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
        <TopBar title="Integrations" />
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
        <TopBar title="Integrations" />
        <div className="p-6">
          <div className="mb-6">{backButton}</div>
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
        <div className="w-full max-w-none space-y-6">
          <div>{backButton}</div>

          <div>
            <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage external services and platform bridges. This is the part where your system politely shakes hands with other systems.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-kinetica"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${getStatusDot(
                        integration.status
                      )}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {integration.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {integration.description}
                      </p>

                      {integration.endpointValue ? (
                        <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground/70">
                          {integration.endpointLabel}: {integration.endpointValue}
                        </p>
                      ) : (
                        <p className="mt-2 text-[11px] text-muted-foreground/60">
                          No endpoint configured
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${getStatusClasses(
                      integration.status
                    )}`}
                  >
                    {integration.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    {integration.lastUpdated
                      ? `Last updated ${formatDateTime(integration.lastUpdated)}`
                      : "Never configured"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testIntegration(integration)}
                      disabled={testingId === integration.id}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      {testingId === integration.id ? "Testing..." : "Test"}
                    </button>

                    <button
                      onClick={() => configureIntegration(integration)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Sliders className="h-3 w-3" />
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-kinetica">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">What this page is using right now</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Status is currently inferred from stored system settings, not live connector pings.
                </p>
              </div>

              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                `mqtt.broker`, `api.openai`, `api.internal_service`, `integrations.email_service`, and `integrations.storage` are read directly from system settings.
              </div>
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                `integrations.analytics` and `integrations.ehr_bridge` will light up automatically once you create those system rows.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}