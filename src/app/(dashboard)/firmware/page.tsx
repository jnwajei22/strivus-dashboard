"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge, MetricCard, SectionHeader } from "@/components/ui/kinetica";
import { mockDevices, getDeviceSerial } from "@/data/mock-data";
import {
  Package,
  Upload,
  Cpu,
  RotateCcw,
  Send,
  Server,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  FileUp,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { DeploymentGroup } from "@/types";
import {
  PERMISSIONS,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

type DeploymentGroupOption = DeploymentGroup | "all";

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

type FirmwareRow = {
  id: string;
  version: string;
  release_date: string | null;
  release_notes: string | null;
  update_type: string | null;
  status: "active" | "staged" | "deprecated" | "archived";
  binary_upload_id: string | null;
  checksum: string | null;
  file_name: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type DeploymentRow = {
  id: string;
  firmware_version_id: string;
  deployment_group_id: string | null;
  device_id: string | null;
  initiated_by_user_id: string | null;
  status:
    | "pending"
    | "staged"
    | "in_progress"
    | "success"
    | "failed"
    | "rolled_back"
    | "cancelled";
  started_at: string | null;
  completed_at: string | null;
  rolled_back_at: string | null;
  notes: string | null;
  created_at: string;
};

export default function Firmware() {
  const { toast } = useToast();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [loadingFirmware, setLoadingFirmware] = useState(true);
  const [loadingDeployments, setLoadingDeployments] = useState(true);

  const [firmwareVersions, setFirmwareVersions] = useState<FirmwareRow[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRow[]>([]);

  const [selectedGroup, setSelectedGroup] =
    useState<DeploymentGroupOption>("production");
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [submittingUpload, setSubmittingUpload] = useState(false);
  const [submittingDeployId, setSubmittingDeployId] = useState<string | null>(null);

  const [uploadForm, setUploadForm] = useState({
    version: "",
    updateType: "minor" as "major" | "minor" | "patch" | "hotfix",
    targetGroup: "test" as DeploymentGroup,
    notes: "",
    fileName: "",
  });

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

  useEffect(() => {
    let isMounted = true;

    async function loadFirmware() {
      try {
        setLoadingFirmware(true);

        const res = await fetch("/api/firmware", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: FirmwareRow[] = await res.json();

        if (!res.ok) {
          throw new Error("Failed to load firmware versions");
        }

        if (!isMounted) return;
        setFirmwareVersions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load /api/firmware:", error);
        if (!isMounted) return;

        setFirmwareVersions([]);
        toast({
          title: "Failed to load firmware",
          description: "Could not load firmware versions.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoadingFirmware(false);
        }
      }
    }

    loadFirmware();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    async function loadDeployments() {
      try {
        setLoadingDeployments(true);

        const res = await fetch("/api/firmware/deployments", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: DeploymentRow[] = await res.json();

        if (!res.ok) {
          throw new Error("Failed to load firmware deployments");
        }

        if (!isMounted) return;
        setDeployments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load /api/firmware/deployments:", error);
        if (!isMounted) return;

        setDeployments([]);
        toast({
          title: "Failed to load deployments",
          description: "Could not load firmware deployments.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoadingDeployments(false);
        }
      }
    }

    loadDeployments();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const canReadFirmware = hasPermission(permissions, PERMISSIONS.FIRMWARE_READ);
  const canCreateFirmware = hasPermission(
    permissions,
    PERMISSIONS.FIRMWARE_CREATE
  );
  const canDeployFirmware = hasPermission(
    permissions,
    PERMISSIONS.FIRMWARE_DEPLOY
  );

  async function reloadFirmwareData() {
    try {
      const [firmwareRes, deploymentsRes] = await Promise.all([
        fetch("/api/firmware", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/firmware/deployments", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const firmwareData: FirmwareRow[] = await firmwareRes.json();
      const deploymentsData: DeploymentRow[] = await deploymentsRes.json();

      if (firmwareRes.ok) {
        setFirmwareVersions(Array.isArray(firmwareData) ? firmwareData : []);
      }

      if (deploymentsRes.ok) {
        setDeployments(Array.isArray(deploymentsData) ? deploymentsData : []);
      }
    } catch (error) {
      console.error("Failed to reload firmware page data:", error);
    }
  }

  const firmwareByGroup = useMemo(() => {
    if (selectedGroup === "all") return firmwareVersions;

    return firmwareVersions.filter((fw) => {
      if (selectedGroup === "production") {
        return fw.status === "active" || fw.status === "deprecated";
      }
      if (selectedGroup === "qa") {
        return fw.status === "active" || fw.status === "staged";
      }
      if (selectedGroup === "test") {
        return true;
      }
      return true;
    });
  }, [selectedGroup, firmwareVersions]);

  const activeVersion = firmwareByGroup.find((v) => v.status === "active");
  const stagedVersion = firmwareVersions.find((v) => v.status === "staged");

  const totalDeployments = deployments.length;
  const successfulDeployments = deployments.filter(
    (d) => d.status === "success"
  ).length;
  const failedDeployments = deployments.filter(
    (d) => d.status === "failed"
  ).length;
  const pendingDeployments = deployments.filter(
    (d) =>
      d.status === "pending" ||
      d.status === "staged" ||
      d.status === "in_progress"
  ).length;

  const devicesOnLatest = mockDevices.filter(
    (d) => d.firmwareVersion === activeVersion?.version
  ).length;
  const devicesTotal = mockDevices.length;

  const groups: {
    value: DeploymentGroupOption;
    label: string;
    desc: string;
  }[] = [
    { value: "production", label: "Production", desc: "Live fleet" },
    { value: "qa", label: "QA", desc: "Validation" },
    { value: "test", label: "Test", desc: "Development" },
    { value: "all", label: "All", desc: "All tracks" },
  ];

  async function handleUploadSubmit() {
    if (!canCreateFirmware || submittingUpload) return;

    try {
      setSubmittingUpload(true);

      const payload = {
        version: uploadForm.version.trim(),
        release_date: new Date().toISOString(),
        release_notes: uploadForm.notes.trim() || null,
        update_type: uploadForm.updateType,
        status: "staged",
        binary_upload_id: null,
        checksum: null,
        file_name: uploadForm.fileName.trim() || null,
      };

      const res = await fetch("/api/firmware", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create firmware version");
      }

      toast({
        title: "Firmware Uploaded",
        description: `${payload.version} staged successfully.`,
      });

      setShowUpload(false);
      setUploadForm({
        version: "",
        updateType: "minor",
        targetGroup: "test",
        notes: "",
        fileName: "",
      });

      await reloadFirmwareData();
    } catch (error) {
      console.error("POST /api/firmware failed:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not create firmware version.",
        variant: "destructive",
      });
    } finally {
      setSubmittingUpload(false);
    }
  }

  async function handleDeployFirmware(firmware: FirmwareRow) {
    if (!canDeployFirmware || submittingDeployId) return;

    try {
      setSubmittingDeployId(firmware.id);

      const payload = {
        firmware_version_id: firmware.id,
        deployment_group_id: null,
        device_id: null,
        status: "pending",
        started_at: new Date().toISOString(),
        completed_at: null,
        rolled_back_at: null,
        notes: `Deployment initiated from firmware page (${selectedGroup})`,
      };

      const res = await fetch("/api/firmware/deployments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create deployment");
      }

      toast({
        title: "Deployment Started",
        description: `${firmware.version} deployment was queued.`,
      });

      await reloadFirmwareData();
    } catch (error) {
      console.error("POST /api/firmware/deployments failed:", error);
      toast({
        title: "Deployment failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not create deployment.",
        variant: "destructive",
      });
    } finally {
      setSubmittingDeployId(null);
    }
  }

  if (loadingPermissions) {
    return (
      <div className="flex flex-col">
        <TopBar title="Firmware Management" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canReadFirmware) {
    return (
      <div className="flex flex-col">
        <TopBar title="Firmware Management" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to view firmware management.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingFirmware || loadingDeployments) {
    return (
      <div className="flex flex-col">
        <TopBar title="Firmware Management" />
        <div className="p-6 text-sm text-muted-foreground">Loading firmware...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Firmware Management" />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label mr-1 text-[11px]">Environment</span>
          {groups.map((g) => (
            <button
              key={g.value}
              onClick={() => setSelectedGroup(g.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                selectedGroup === g.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <span>{g.label}</span>
              <span className="ml-1.5 text-[10px] opacity-60">{g.desc}</span>
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            {canCreateFirmware && (
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" /> Upload New Version
              </button>
            )}

            {canDeployFirmware && stagedVersion && (
              <button
                onClick={() => handleDeployFirmware(stagedVersion)}
                disabled={submittingDeployId === stagedVersion.id}
                className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submittingDeployId === stagedVersion.id
                  ? "Deploying..."
                  : `Deploy ${stagedVersion.version}`}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            label="Active Version"
            value={activeVersion?.version || "—"}
            icon={<Package className="h-5 w-5" />}
            variant="success"
            trend={`${devicesOnLatest}/${devicesTotal} devices`}
          />
          <MetricCard
            label="Total Deployments"
            value={totalDeployments}
            icon={<Send className="h-5 w-5" />}
            variant="primary"
            trend={`${successfulDeployments} successful`}
          />
          <MetricCard
            label="Staged Release"
            value={stagedVersion?.version || "None"}
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
            trend={stagedVersion ? "Pending rollout" : ""}
          />
          <MetricCard
            label="Fleet Coverage"
            value={
              devicesTotal > 0
                ? `${Math.round((devicesOnLatest / devicesTotal) * 100)}%`
                : "—"
            }
            icon={<Server className="h-5 w-5" />}
            variant="default"
            trend={`${devicesTotal - devicesOnLatest} behind`}
          />
        </div>

        {activeVersion && (
          <div className="rounded-xl border border-success/30 bg-success/5 p-5 shadow-kinetica">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-data text-xl font-semibold text-foreground">
                      {activeVersion.version}
                    </span>
                    <StatusBadge status="active" />
                    <span className="text-xs text-muted-foreground">
                      {selectedGroup !== "all"
                        ? selectedGroup.toUpperCase()
                        : "ALL ENVIRONMENTS"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Released{" "}
                    {activeVersion.release_date
                      ? new Date(activeVersion.release_date).toLocaleDateString()
                      : "—"}{" "}
                    · {devicesOnLatest} devices running this version
                  </p>
                  <p className="mt-2 text-sm text-foreground/70">
                    {activeVersion.release_notes || "No release notes provided."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-label text-[10px]">Fleet Coverage</p>
                  <div className="mt-1 w-32">
                    <Progress
                      value={
                        devicesTotal > 0
                          ? (devicesOnLatest / devicesTotal) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                  <p className="font-data mt-0.5 text-[11px] text-muted-foreground">
                    {devicesOnLatest} of {devicesTotal} devices
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <SectionHeader
              title="Version History"
              action={
                <span className="font-data text-xs text-muted-foreground">
                  {firmwareByGroup.length} versions ·{" "}
                  {selectedGroup !== "all" ? selectedGroup : "all groups"}
                </span>
              }
            />

            <div className="relative space-y-3 pl-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-border">
              {firmwareByGroup.map((fw) => {
                const deployCount = deployments.filter(
                  (d) => d.firmware_version_id === fw.id
                ).length;
                const isExpanded = selectedVersion === fw.id;

                return (
                  <div key={fw.id} className="relative">
                    <div
                      className={`absolute -left-6 top-4 h-3 w-3 rounded-full border-2 ${
                        fw.status === "active"
                          ? "border-success bg-success/30"
                          : fw.status === "staged"
                          ? "border-accent bg-accent/30"
                          : "border-muted-foreground bg-muted"
                      }`}
                    />
                    <div
                      className={`cursor-pointer rounded-xl border bg-card p-4 shadow-kinetica transition-all ${
                        isExpanded
                          ? "border-primary/50"
                          : "border-border hover:border-border/80"
                      }`}
                      onClick={() => setSelectedVersion(isExpanded ? null : fw.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-data text-base font-semibold text-foreground">
                              {fw.version}
                            </span>
                            <StatusBadge status={fw.status} />
                            {deployCount > 0 && (
                              <span className="text-[10px] font-data text-muted-foreground">
                                {deployCount} deploys
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {fw.release_date
                              ? new Date(fw.release_date).toLocaleDateString()
                              : "—"}{" "}
                            ·{" "}
                            {
                              mockDevices.filter(
                                (d) => d.firmwareVersion === fw.version
                              ).length
                            }{" "}
                            devices
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {canDeployFirmware && fw.status !== "deprecated" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeployFirmware(fw);
                              }}
                              disabled={submittingDeployId === fw.id}
                              className="flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Cpu className="h-3 w-3" />
                              {submittingDeployId === fw.id ? "Deploying..." : "Deploy"}
                            </button>
                          )}

                          {canDeployFirmware && fw.status === "active" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                  title: "Rollback not wired",
                                  description:
                                    "Rollback logic is not implemented yet.",
                                });
                              }}
                              className="flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-warning/50 hover:text-warning"
                            >
                              <RotateCcw className="h-3 w-3" /> Rollback
                            </button>
                          )}

                          {canDeployFirmware && fw.status === "deprecated" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                  title: "Reinstall not wired",
                                  description:
                                    "Reinstall logic is not implemented yet.",
                                });
                              }}
                              className="flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
                            >
                              <RotateCcw className="h-3 w-3" /> Reinstall
                            </button>
                          )}

                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 border-t border-border pt-3">
                          <p className="text-sm text-foreground/80">
                            {fw.release_notes || "No release notes provided."}
                          </p>

                          <div>
                            <p className="text-label mb-1.5 text-[10px]">
                              Devices on This Version
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {mockDevices
                                .filter((d) => d.firmwareVersion === fw.version)
                                .map((d) => (
                                  <span
                                    key={d.id}
                                    className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 font-data text-xs text-foreground"
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        d.status === "online"
                                          ? "bg-success"
                                          : d.status === "offline"
                                          ? "bg-destructive"
                                          : "bg-warning"
                                      }`}
                                    />
                                    {d.serialNumber}
                                  </span>
                                ))}
                              {mockDevices.filter((d) => d.firmwareVersion === fw.version).length === 0 && (
                                <span className="text-xs text-muted-foreground">
                                  No devices
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-label mb-1.5 text-[10px]">
                              Deployment History
                            </p>
                            {deployments.filter((d) => d.firmware_version_id === fw.id).length > 0 ? (
                              <div className="space-y-1.5">
                                {deployments
                                  .filter((d) => d.firmware_version_id === fw.id)
                                  .map((dep) => (
                                    <div
                                      key={dep.id}
                                      className="flex items-center justify-between rounded-lg bg-surface px-3 py-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-data text-xs text-foreground">
                                          {dep.device_id
                                            ? getDeviceSerial(dep.device_id)
                                            : "Group deployment"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {dep.initiated_by_user_id
                                            ? `by ${dep.initiated_by_user_id}`
                                            : "system"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-data text-[11px] text-muted-foreground">
                                          {new Date(dep.created_at).toLocaleDateString()}
                                        </span>
                                        <StatusBadge status={dep.status} />
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No deployments yet.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {firmwareByGroup.length === 0 && (
                <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-kinetica">
                  No firmware versions found.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <SectionHeader title="Recent Deployments" />
            <div className="space-y-2">
              {[...deployments]
                .sort(
                  (a, b) =>
                    new Date(
                      b.completed_at ?? b.started_at ?? b.created_at
                    ).getTime() -
                    new Date(
                      a.completed_at ?? a.started_at ?? a.created_at
                    ).getTime()
                )
                .map((dep) => {
                  const fw = firmwareVersions.find(
                    (f) => f.id === dep.firmware_version_id
                  );
                  const displayDate =
                    dep.completed_at ?? dep.started_at ?? dep.created_at;

                  return (
                    <div
                      key={dep.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-kinetica"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-data text-sm font-semibold text-foreground">
                              {dep.device_id
                                ? getDeviceSerial(dep.device_id)
                                : "Group deployment"}
                            </span>
                            <StatusBadge status={dep.status} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {fw?.version || "—"} ·{" "}
                            {dep.initiated_by_user_id || "system"}
                          </p>
                        </div>
                        <span className="font-data text-xs text-muted-foreground">
                          {new Date(displayDate).toLocaleDateString()}
                        </span>
                      </div>

                      {dep.status === "success" && (
                        <div className="mt-2">
                          <Progress value={100} className="h-1.5" />
                        </div>
                      )}
                      {dep.status === "in_progress" && (
                        <div className="mt-2">
                          <Progress value={65} className="h-1.5" />
                          <p className="font-data mt-0.5 text-[10px] text-muted-foreground">
                            65% — transferring…
                          </p>
                        </div>
                      )}
                      {dep.status === "pending" && (
                        <div className="mt-2">
                          <Progress value={0} className="h-1.5" />
                          <p className="font-data mt-0.5 text-[10px] text-muted-foreground">
                            Queued
                          </p>
                        </div>
                      )}
                      {dep.status === "staged" && (
                        <div className="mt-2">
                          <Progress value={10} className="h-1.5" />
                          <p className="font-data mt-0.5 text-[10px] text-muted-foreground">
                            Staged
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-kinetica">
              <p className="text-label mb-3 text-[10px]">Rollout Summary</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm text-foreground">Successful</span>
                  </div>
                  <span className="font-data text-sm font-semibold text-success">
                    {successfulDeployments}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-foreground">Failed</span>
                  </div>
                  <span className="font-data text-sm font-semibold text-destructive">
                    {failedDeployments}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-sm text-foreground">Pending</span>
                  </div>
                  <span className="font-data text-sm font-semibold text-warning">
                    {pendingDeployments}
                  </span>
                </div>
                <div className="border-t border-border pt-2">
                  <p className="text-label mb-1 text-[10px]">Success Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={
                        totalDeployments > 0
                          ? (successfulDeployments / totalDeployments) * 100
                          : 0
                      }
                      className="h-2 flex-1"
                    />
                    <span className="font-data text-xs text-foreground">
                      {totalDeployments > 0
                        ? Math.round((successfulDeployments / totalDeployments) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showUpload && canCreateFirmware && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-lg space-y-5 rounded-2xl border border-border bg-card p-6 shadow-kinetica-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Upload Firmware Update
                </h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-label mb-1.5 block text-[11px]">
                    Firmware Binary
                  </label>
                  <div
                    className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-surface p-8 transition-colors hover:border-primary/50"
                    onClick={() => {
                      setUploadForm((prev) => ({
                        ...prev,
                        fileName: "kinetica-fw-v2.4.1.bin",
                      }));
                    }}
                  >
                    <div className="flex flex-col items-center justify-center">
                      {uploadForm.fileName ? (
                        <div className="flex items-center gap-2 text-primary">
                          <FileUp className="h-5 w-5" />
                          <span className="font-data text-sm">
                            {uploadForm.fileName}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to select firmware binary
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground/60">
                            .bin, .hex, .uf2 supported
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label mb-1.5 block text-[11px]">
                      Version Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. v2.4.1"
                      value={uploadForm.version}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          version: e.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm font-data text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-label mb-1.5 block text-[11px]">
                      Update Type
                    </label>
                    <select
                      value={uploadForm.updateType}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          updateType: e.target.value as
                            | "major"
                            | "minor"
                            | "patch"
                            | "hotfix",
                        }))
                      }
                      className="flex h-10 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                      <option value="patch">Patch</option>
                      <option value="hotfix">Hotfix</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-label mb-1.5 block text-[11px]">
                    Deploy Target Group
                  </label>
                  <div className="flex gap-2">
                    {(["test", "qa", "production"] as DeploymentGroup[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          setUploadForm((prev) => ({ ...prev, targetGroup: g }))
                        }
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                          uploadForm.targetGroup === g
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-surface text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-label mb-1.5 block text-[11px]">
                    Release Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe changes in this release..."
                    value={uploadForm.notes}
                    onChange={(e) =>
                      setUploadForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="flex min-h-[80px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowUpload(false)}
                  className="rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={!uploadForm.version || !uploadForm.fileName || submittingUpload}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {submittingUpload ? "Uploading..." : "Upload & Stage"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}