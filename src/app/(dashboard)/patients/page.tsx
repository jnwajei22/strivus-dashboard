"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/ui/kinetica";
import { Search, Plus, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import type { PatientStatus } from "@/types";
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

type PatientListItem = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName?: string | null;
  email: string | null;
  phone?: string | null;
  status: PatientStatus;
  enrolledAt: string | null;
  createdAt?: string;
  device: {
    id: string;
    serialNumber: string | null;
    status: string | null;
    lastSync: string | null;
  } | null;
};

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus | "all">("all");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState<string | null>(null);

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

        setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
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

  const canReadPatients = hasPermission(permissions, PERMISSIONS.PATIENTS_READ);
  const canCreatePatients = hasPermission(
    permissions,
    PERMISSIONS.PATIENTS_CREATE
  );
  const canUpdatePatients = hasPermission(
    permissions,
    PERMISSIONS.PATIENTS_UPDATE
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPatients() {
      if (loadingPermissions) return;

      if (!canReadPatients) {
        if (isMounted) {
          setPatients([]);
          setLoadingPatients(false);
          setPatientsError(null);
        }
        return;
      }

      try {
        setLoadingPatients(true);
        setPatientsError(null);

        const res = await fetch("/api/patients", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!isMounted) return;

        if (res.status === 401 || res.status === 403) {
          setPatients([]);
          setPatientsError("You do not have permission to view patients.");
          return;
        }

        const data: unknown = await res.json();

        if (!res.ok) {
          throw new Error("Failed to load patients");
        }

        setPatients(Array.isArray(data) ? (data as PatientListItem[]) : []);
      } catch (error) {
        console.error("Failed to load /api/patients:", error);
        if (isMounted) {
          setPatients([]);
          setPatientsError("Failed to load patients.");
        }
      } finally {
        if (isMounted) {
          setLoadingPatients(false);
        }
      }
    }

    loadPatients();

    return () => {
      isMounted = false;
    };
  }, [loadingPermissions, canReadPatients]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients.filter((p) => {
      const displayName =
        p.fullName?.trim() ||
        `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() ||
        "Unnamed Patient";

      const matchSearch =
        query.length === 0 ||
        displayName.toLowerCase().includes(query) ||
        (p.email ?? "").toLowerCase().includes(query) ||
        (p.device?.serialNumber ?? "").toLowerCase().includes(query);

      const matchStatus = statusFilter === "all" || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [patients, search, statusFilter]);

  if (loadingPermissions) {
    return (
      <div className="flex flex-col">
        <TopBar title="Patients" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canReadPatients) {
    return (
      <div className="flex flex-col">
        <TopBar title="Patients" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">
              Access denied
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to view patients.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Patients" />
      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(["all", "active", "inactive", "discharged"] as const).map((s) => (
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

          {canCreatePatients && (
            <Link
              href="/patients/new"
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add Patient
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-kinetica">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-label px-4 py-3 text-left">Patient</th>
                <th className="text-label px-4 py-3 text-left">Status</th>
                <th className="text-label hidden px-4 py-3 text-left md:table-cell">
                  Device
                </th>
                <th className="text-label hidden px-4 py-3 text-left lg:table-cell">
                  Last Activity
                </th>
                <th className="text-label hidden px-4 py-3 text-left lg:table-cell">
                  Enrolled
                </th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loadingPatients ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-sm text-muted-foreground">
                    Loading patients...
                  </td>
                </tr>
              ) : patientsError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-sm text-destructive">
                    {patientsError}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-sm text-muted-foreground">
                    No patients found.
                  </td>
                </tr>
              ) : (
                filtered.map((patient) => {
                  const device = patient.device;
                  const displayName =
                    patient.fullName?.trim() ||
                    `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() ||
                    "Unnamed Patient";

                  return (
                    <tr
                      key={patient.id}
                      className="border-b border-border transition-colors hover:bg-surface last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/patients/${patient.id}`} className="group">
                          <p className="font-medium text-foreground transition-colors group-hover:text-primary">
                            {displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {patient.email || "No email"}
                          </p>
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={patient.status} />
                      </td>

                      <td className="hidden px-4 py-3 md:table-cell">
                        {device ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                device.status === "online"
                                  ? "bg-success"
                                  : device.status === "offline"
                                  ? "bg-destructive"
                                  : "bg-warning"
                              }`}
                            />
                            <span className="font-data text-xs text-muted-foreground">
                              {device.serialNumber || "Unknown device"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="font-data text-xs text-muted-foreground">
                          {device?.lastSync
                            ? new Date(device.lastSync).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>

                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="font-data text-xs text-muted-foreground">
                          {patient.enrolledAt
                            ? new Date(patient.enrolledAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canUpdatePatients && (
                            <Link
                              href={`/patients/${patient.id}/edit`}
                              className="text-muted-foreground hover:text-foreground"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          )}

                          <Link href={`/patients/${patient.id}`}>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}