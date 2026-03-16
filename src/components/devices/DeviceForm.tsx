"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  Cpu,
  Users,
  Settings2,
  Info,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/ui/kinetica";

type DeviceStatus = "online" | "offline" | "syncing" | "warning" | "idle";

type DeviceApi = {
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
  device: DeviceApi;
};

type DeviceFormState = {
  deviceSerial: string;
  deviceUid: string;
  displayName: string;
  deviceModelId: string;
  hardwareRevision: string;
  firmwareVersionId: string;
  currentPatientId: string;
  deploymentGroupId: string;
  status: DeviceStatus;
  batteryPercent: string;
  signalDbm: string;
  lastSyncAt: string;
  lastContactAt: string;
  registeredAt: string;
  retiredAt: string;
  notes: string;
};

const EMPTY_FORM: DeviceFormState = {
  deviceSerial: "",
  deviceUid: "",
  displayName: "",
  deviceModelId: "",
  hardwareRevision: "",
  firmwareVersionId: "",
  currentPatientId: "",
  deploymentGroupId: "",
  status: "idle",
  batteryPercent: "",
  signalDbm: "",
  lastSyncAt: "",
  lastContactAt: "",
  registeredAt: "",
  retiredAt: "",
  notes: "",
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function DeviceForm() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined;
  const router = useRouter();
  const isEdit = !!id;

  const [form, setForm] = useState<DeviceFormState>(EMPTY_FORM);
  const [existing, setExisting] = useState<DeviceApi | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;

    let isMounted = true;

    async function loadDevice() {
      try {
        setLoading(true);

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

        const device = (data as DeviceDetailResponse).device;
        setExisting(device);

        setForm({
          deviceSerial: device.deviceSerial ?? "",
          deviceUid: device.deviceUid ?? "",
          displayName: device.displayName ?? "",
          deviceModelId: device.deviceModelId ?? "",
          hardwareRevision: device.hardwareRevision ?? "",
          firmwareVersionId: device.firmwareVersionId ?? "",
          currentPatientId: device.currentPatientId ?? "",
          deploymentGroupId: device.deploymentGroupId ?? "",
          status: device.status ?? "idle",
          batteryPercent:
            device.batteryPercent == null ? "" : String(device.batteryPercent),
          signalDbm: device.signalDbm == null ? "" : String(device.signalDbm),
          lastSyncAt: toDateTimeLocal(device.lastSyncAt),
          lastContactAt: toDateTimeLocal(device.lastContactAt),
          registeredAt: toDateTimeLocal(device.registeredAt),
          retiredAt: toDateTimeLocal(device.retiredAt),
          notes: device.notes ?? "",
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to load device",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDevice();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  const set = <K extends keyof DeviceFormState>(key: K, value: DeviceFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.deviceSerial.trim()) {
      toast({
        title: "Missing required fields",
        description: "Device serial is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        deviceSerial: form.deviceSerial.trim(),
        deviceUid: form.deviceUid.trim() || null,
        displayName: form.displayName.trim() || null,
        deviceModelId: form.deviceModelId.trim() || null,
        hardwareRevision: form.hardwareRevision.trim() || null,
        firmwareVersionId: form.firmwareVersionId.trim() || null,
        currentPatientId: form.currentPatientId.trim() || null,
        deploymentGroupId: form.deploymentGroupId.trim() || null,
        status: form.status,
        batteryPercent:
          form.batteryPercent.trim() === "" ? null : Number(form.batteryPercent),
        signalDbm: form.signalDbm.trim() === "" ? null : Number(form.signalDbm),
        lastSyncAt: form.lastSyncAt || null,
        lastContactAt: form.lastContactAt || null,
        registeredAt: form.registeredAt || null,
        retiredAt: form.retiredAt || null,
        notes: form.notes.trim() || null,
      };

      const res = await fetch(isEdit ? `/api/devices/${id}` : "/api/devices", {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: { device?: DeviceApi; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save device");
      }

      const savedDevice = data.device;

      toast({
        title: isEdit ? "Device Updated" : "Device Registered",
        description: `${savedDevice?.deviceSerial ?? form.deviceSerial} has been ${
          isEdit ? "updated" : "registered"
        } successfully.`,
      });

      router.push(savedDevice ? `/devices/${savedDevice.id}` : "/devices");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Failed to save device",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !id) return;

    const confirmed = window.confirm(
      "Delete this device? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/devices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data: { success?: boolean; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete device");
      }

      toast({
        title: "Device Deleted",
        description: "The device has been deleted successfully.",
      });

      router.push("/devices");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Failed to delete device",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  const inputClasses =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  const labelClasses =
    "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
  const selectClasses =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none";
  const readonlyClasses =
    "h-10 flex items-center rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground font-data";

  if (loading) {
    return (
      <div className="w-full p-6 text-sm text-muted-foreground">
        Loading device...
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      <Link
        href={isEdit && id ? `/devices/${id}` : "/devices"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <form onSubmit={handleSubmit} className="w-full space-y-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Device Identity
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClasses}>Device Serial *</label>
              <input
                className={inputClasses}
                value={form.deviceSerial}
                onChange={(e) => set("deviceSerial", e.target.value)}
                placeholder="e.g. DPY-12"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Display Name</label>
              <input
                className={inputClasses}
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                placeholder="Friendly device name"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Device UID</label>
              <input
                className={inputClasses}
                value={form.deviceUid}
                onChange={(e) => set("deviceUid", e.target.value)}
                placeholder="Hardware/device UID"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Hardware Revision</label>
              <input
                className={inputClasses}
                value={form.hardwareRevision}
                onChange={(e) => set("hardwareRevision", e.target.value)}
                placeholder="e.g. Rev C"
              />
            </div>

            {isEdit && existing && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className={labelClasses}>Device ID</label>
                <div className={readonlyClasses}>{existing.id}</div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Assignment & Relationships
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClasses}>Current Patient ID</label>
              <input
                className={inputClasses}
                value={form.currentPatientId}
                onChange={(e) => set("currentPatientId", e.target.value)}
                placeholder="UUID or blank"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Device Model ID</label>
              <input
                className={inputClasses}
                value={form.deviceModelId}
                onChange={(e) => set("deviceModelId", e.target.value)}
                placeholder="UUID or blank"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Firmware Version ID</label>
              <input
                className={inputClasses}
                value={form.firmwareVersionId}
                onChange={(e) => set("firmwareVersionId", e.target.value)}
                placeholder="UUID or blank"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Deployment Group ID</label>
              <input
                className={inputClasses}
                value={form.deploymentGroupId}
                onChange={(e) => set("deploymentGroupId", e.target.value)}
                placeholder="UUID or blank"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Status & Telemetry
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className={labelClasses}>Status</label>
              <select
                className={selectClasses}
                value={form.status}
                onChange={(e) => set("status", e.target.value as DeviceStatus)}
              >
                <option value="online">online</option>
                <option value="offline">offline</option>
                <option value="syncing">syncing</option>
                <option value="warning">warning</option>
                <option value="idle">idle</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Battery Percent</label>
              <input
                type="number"
                min="0"
                max="100"
                className={inputClasses}
                value={form.batteryPercent}
                onChange={(e) => set("batteryPercent", e.target.value)}
                placeholder="0-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Signal dBm</label>
              <input
                type="number"
                className={inputClasses}
                value={form.signalDbm}
                onChange={(e) => set("signalDbm", e.target.value)}
                placeholder="-65"
              />
            </div>

            {isEdit && existing && (
              <div className="space-y-1.5">
                <label className={labelClasses}>Current API Status</label>
                <div className="h-10 flex items-center">
                  <StatusBadge status={existing.status} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Timestamps
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClasses}>Last Sync At</label>
              <input
                type="datetime-local"
                className={inputClasses}
                value={form.lastSyncAt}
                onChange={(e) => set("lastSyncAt", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Last Contact At</label>
              <input
                type="datetime-local"
                className={inputClasses}
                value={form.lastContactAt}
                onChange={(e) => set("lastContactAt", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Registered At</label>
              <input
                type="datetime-local"
                className={inputClasses}
                value={form.registeredAt}
                onChange={(e) => set("registeredAt", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClasses}>Retired At</label>
              <input
                type="datetime-local"
                className={inputClasses}
                value={form.retiredAt}
                onChange={(e) => set("retiredAt", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Notes
          </h3>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            rows={4}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Device notes, deployment notes, special configuration..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Register Device"}
          </button>

          <button
            type="button"
            onClick={() => router.push(isEdit && id ? `/devices/${id}` : "/devices")}
            className="flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="ml-auto flex items-center gap-2 rounded-lg border border-destructive/30 px-6 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete Device"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}