"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/ui/kinetica";
import { Search, Plus, ChevronRight, Battery, Wifi } from "lucide-react";
import Link from "next/link";
import type { DeviceStatus } from "@/types";
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

type DeviceApiItem = {
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

type DevicesResponse = {
  devices: DeviceApiItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

export default function Devices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [devices, setDevices] = useState<DeviceApiItem[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [devicesError, setDevicesError] = useState<string | null>(null);

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
  const canRegisterDevices = hasPermission(
    permissions,
    PERMISSIONS.DEVICES_REGISTER
  );

  useEffect(() => {
    if (loadingPermissions) return;
    if (!canReadDevices) {
      setLoadingDevices(false);
      setDevices([]);
      return;
    }

    let isMounted = true;

    async function loadDevices() {
      try {
        setLoadingDevices(true);
        setDevicesError(null);

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const res = await fetch(`/api/devices?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: DevicesResponse | { error?: string } = await res.json();

        if (!res.ok) {
          throw new Error(
            "error" in data && data.error ? data.error : "Failed to load devices"
          );
        }

        if (!isMounted) return;

        setDevices((data as DevicesResponse).devices ?? []);
      } catch (error) {
        console.error("Failed to load /api/devices:", error);

        if (isMounted) {
          setDevices([]);
          setDevicesError(
            error instanceof Error ? error.message : "Failed to load devices"
          );
        }
      } finally {
        if (isMounted) {
          setLoadingDevices(false);
        }
      }
    }

    loadDevices();

    return () => {
      isMounted = false;
    };
  }, [loadingPermissions, canReadDevices, search, statusFilter]);

  const filtered = useMemo(() => {
    return devices;
  }, [devices]);

  if (loadingPermissions) {
    return (
      <div className="flex flex-col">
        <TopBar title="Devices" />
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
            <h2 className="text-base font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to view devices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Devices" />
      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "online", "offline", "syncing", "warning", "idle"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {canRegisterDevices && (
            <Link
              href="/devices/new"
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Register Device
            </Link>
          )}
        </div>

        {loadingDevices ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-kinetica">
            Loading devices...
          </div>
        ) : devicesError ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-destructive shadow-kinetica">
            {devicesError}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-kinetica">
            No devices found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((device) => (
              <Link
                key={device.id}
                href={`/devices/${device.id}`}
                className="group rounded-xl border border-border bg-card p-4 shadow-kinetica transition-all hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-data text-sm font-medium text-foreground">
                      {device.deviceSerial}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {device.displayName || device.hardwareRevision || "Unnamed device"}
                    </p>
                  </div>
                  <StatusBadge status={device.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-label text-[10px]">Patient ID</span>
                    <p className="mt-0.5 truncate text-xs text-foreground">
                      {device.currentPatientId || "Unassigned"}
                    </p>
                  </div>

                  <div>
                    <span className="text-label text-[10px]">Firmware ID</span>
                    <p className="font-data mt-0.5 truncate text-xs text-foreground">
                      {device.firmwareVersionId || "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Battery className="h-3.5 w-3.5 text-muted-foreground" />
                    <span
                      className={`font-data text-xs ${
                        device.batteryPercent != null && device.batteryPercent < 30
                          ? "text-warning"
                          : "text-foreground"
                      }`}
                    >
                      {device.batteryPercent != null ? `${device.batteryPercent}%` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                    <span
                      className={`font-data text-xs ${
                        device.signalDbm != null && device.signalDbm < -70
                          ? "text-warning"
                          : "text-foreground"
                      }`}
                    >
                      {device.signalDbm != null ? `${device.signalDbm} dBm` : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-data text-[11px] text-muted-foreground">
                    Last contact:{" "}
                    {device.lastContactAt
                      ? new Date(device.lastContactAt).toLocaleString()
                      : "—"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}