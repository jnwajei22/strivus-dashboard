"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge, MetricCard } from "@/components/ui/kinetica";
import {
  ArrowLeft,
  Battery,
  Wifi,
  Clock,
  Cpu,
  RefreshCw,
  Terminal,
  RotateCcw,
  Network,
  FileText,
  Play,
  Upload,
  Zap,
} from "lucide-react";
import {
  PERMISSIONS,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

type MeResponse = {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    roleId?: string | null;
    status: string | null;
    emailVerifiedAt?: string | null;
    lastLoginAt?: string | null;
    role: {
      id: string;
      name: string;
      description?: string | null;
    } | null;
  } | null;
  permissions: Permission[];
};

type DeviceStatus = "online" | "offline" | "syncing" | "warning" | "idle";

type Device = {
  id: string;
  deviceSerial: string;
  deviceUid: string | null;
  displayName: string | null;
  deviceModelId: string | null;
  hardwareRevision: string | null;
  firmwareVersionId: string | null;
  currentPatientId: string | null;
  deploymentGroupId: string | null;
  status: DeviceStatus;
  batteryPercent: number | null;
  signalDbm: number | null;
  lastSyncAt: string | null;
  lastContactAt: string | null;
  registeredAt: string | null;
  retiredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type DeviceDetailResponse = {
  device: Device;
};

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [device, setDevice] = useState<Device | null>(null);
  const [loadingDevice, setLoadingDevice] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMe() {
      try {
        setLoadingPermissions(true);

        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!isMounted) return;

        if (res.status === 401) {
          setPermissions([]);
          return;
        }

        const data: MeResponse = await res.json();

        if (!res.ok) {
          throw new Error("Failed to load permissions");
        }

        setPermissions(data.permissions ?? []);
      } catch (error) {
        console.error("Failed to load /api/auth/me:", error);
        if (isMounted) {
          setPermissions([]);
        }
      } finally {
        if (isMounted) {
          setLoadingPermissions(false);
        }
      }
    }

    loadMe();

    return () => {
      isMounted = false;
    };
  }, []);

  const canReadDevices = hasPermission(permissions, PERMISSIONS.DEVICES_READ);
  const canUpdateDevices = hasPermission(permissions, PERMISSIONS.DEVICES_UPDATE);
  const canRunDeviceActions = hasPermission(
    permissions,
    PERMISSIONS.DEVICES_ACTIONS
  );

  useEffect(() => {
    if (loadingPermissions) return;
    if (!canReadDevices) {
      setLoadingDevice(false);
      setDevice(null);
      return;
    }

    let isMounted = true;

    async function loadDevice() {
      try {
        setLoadingDevice(true);
        setDeviceError(null);

        const res = await fetch(`/api/devices/${id}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: DeviceDetailResponse | { error?: string } = await res.json();

        if (!res.ok) {
          throw new Error(
            "error" in data && data.error ? data.error : "Failed to load device"
          );
        }

        if (!isMounted) return;

        setDevice((data as DeviceDetailResponse).device);
      } catch (error) {
        console.error("Failed to load /api/devices/[id]:", error);
        if (isMounted) {
          setDevice(null);
          setDeviceError(
            error instanceof Error ? error.message : "Failed to load device"
          );
        }
      } finally {
        if (isMounted) {
          setLoadingDevice(false);
        }
      }
    }

    if (id) {
      loadDevice();
    }

    return () => {
      isMounted = false;
    };
  }, [id, loadingPermissions, canReadDevices]);

  if (loadingPermissions) {
    return (
      <div className="flex flex-col">
        <TopBar title="Device" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canReadDevices) {
    return (
      <div className="flex flex-col">
        <TopBar title="Devices" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">
              Access denied
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to view devices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingDevice) {
    return (
      <div className="flex flex-col">
        <TopBar title="Device" />
        <div className="p-6 text-sm text-muted-foreground">Loading device...</div>
      </div>
    );
  }

  if (deviceError || !device) {
    return (
      <div className="flex flex-col">
        <TopBar title="Device Not Found" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <p className="text-sm text-muted-foreground">
              {deviceError || "Device not found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const actions = [
    { label: "Sync Now", icon: RefreshCw, command: "sync", risk: "low" as const },
    {
      label: "Network Check",
      icon: Network,
      command: "network_check",
      risk: "low" as const,
    },
    {
      label: "Start Workout",
      icon: Play,
      command: "start_workout",
      risk: "low" as const,
    },
    {
      label: "Request Logs",
      icon: FileText,
      command: "request_logs",
      risk: "low" as const,
    },
    {
      label: "Send Command",
      icon: Terminal,
      command: "send_command",
      risk: "low" as const,
    },
    {
      label: "Reboot Device",
      icon: RotateCcw,
      command: "reboot",
      risk: "high" as const,
    },
    {
      label: "Update Firmware",
      icon: Upload,
      command: "update_firmware",
      risk: "high" as const,
    },
    {
      label: "Rollback Firmware",
      icon: RotateCcw,
      command: "rollback_firmware",
      risk: "high" as const,
    },
  ];

  const handleAction = (command: string, risk: string) => {
    if (!canRunDeviceActions) return;

    if (risk === "high" && confirmAction !== command) {
      setConfirmAction(command);
      return;
    }

    setConfirmAction(null);
    // TODO: wire real device action API
  };

  return (
    <div className="flex flex-col">
      <TopBar title={device.deviceSerial} />
      <div className="space-y-6 p-6">
        <Link
          href="/devices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Devices
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-data text-2xl font-semibold tracking-tight text-foreground">
                {device.deviceSerial}
              </h2>
              <StatusBadge status={device.status} />
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {device.displayName || device.hardwareRevision || "Unnamed device"}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Patient ID: {device.currentPatientId || "Unassigned"}
            </p>
          </div>

          {canUpdateDevices && (
            <Link
              href={`/devices/${device.id}/edit`}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <Cpu className="h-4 w-4" /> Edit Device
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Last Sync"
            value={
              device.lastSyncAt
                ? new Date(device.lastSyncAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"
            }
            icon={<Clock className="h-5 w-5" />}
          />
          <MetricCard
            label="Firmware"
            value={device.firmwareVersionId || "—"}
            icon={<Cpu className="h-5 w-5" />}
            variant="primary"
          />
          <MetricCard
            label="Battery"
            value={
              device.batteryPercent != null ? `${device.batteryPercent}%` : "—"
            }
            icon={<Battery className="h-5 w-5" />}
            variant={
              device.batteryPercent != null && device.batteryPercent < 30
                ? "warning"
                : "success"
            }
          />
          <MetricCard
            label="Signal"
            value={device.signalDbm != null ? `${device.signalDbm} dBm` : "—"}
            icon={<Wifi className="h-5 w-5" />}
            variant={
              device.signalDbm != null && device.signalDbm < -70
                ? "warning"
                : "default"
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Device Details
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-label text-[10px]">Device UID</span>
                <p className="font-data mt-0.5 text-foreground">
                  {device.deviceUid || "—"}
                </p>
              </div>

              <div>
                <span className="text-label text-[10px]">Model ID</span>
                <p className="font-data mt-0.5 text-foreground">
                  {device.deviceModelId || "—"}
                </p>
              </div>

              <div>
                <span className="text-label text-[10px]">Hardware Revision</span>
                <p className="font-data mt-0.5 text-foreground">
                  {device.hardwareRevision || "—"}
                </p>
              </div>

              <div>
                <span className="text-label text-[10px]">Deployment Group ID</span>
                <p className="font-data mt-0.5 text-foreground">
                  {device.deploymentGroupId || "—"}
                </p>
              </div>

              <div>
                <span className="text-label text-[10px]">Registered At</span>
                <p className="font-data mt-0.5 text-foreground">
                  {device.registeredAt
                    ? new Date(device.registeredAt).toLocaleString()
                    : "—"}
                </p>
              </div>

              <div>
                <span className="text-label text-[10px]">Last Contact</span>
                <p className="font-data mt-0.5 text-foreground">
                  {device.lastContactAt
                    ? new Date(device.lastContactAt).toLocaleString()
                    : "—"}
                </p>
              </div>

              <div>
                <span className="text-label text-[10px]">Retired At</span>
                <p className="font-data mt-0.5 text-foreground">
                  {device.retiredAt
                    ? new Date(device.retiredAt).toLocaleString()
                    : "—"}
                </p>
              </div>

              <div>
                <span className="text-label text-[10px]">Notes</span>
                <p className="mt-0.5 whitespace-pre-wrap text-foreground">
                  {device.notes || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Remote Actions
            </h3>

            {canRunDeviceActions ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.command}
                      onClick={() => handleAction(action.command, action.risk)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-95 ${
                        confirmAction === action.command
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : action.risk === "high"
                          ? "border-border bg-surface-raised text-foreground hover:border-warning/50"
                          : "border-border bg-surface-raised text-foreground hover:border-primary/50"
                      }`}
                    >
                      <action.icon className="h-4 w-4" />
                      {confirmAction === action.command
                        ? `Confirm ${action.label}?`
                        : action.label}
                    </button>
                  ))}
                </div>

                {confirmAction && (
                  <p className="mt-3 text-xs text-destructive">
                    Click again to confirm this action. This may disrupt the
                    device or patient session.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You do not have permission to run remote device actions.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Command History
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-center rounded-lg bg-surface px-4 py-8">
              <div className="text-center">
                <Zap className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Command history is not wired to a real API yet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}