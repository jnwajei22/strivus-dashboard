"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import PatientForm from "@/components/patients/PatientForm";
import {
  PERMISSIONS,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

type MeResponse = {
  user: {
    id: string;
    email: string;
  } | null;
  permissions: Permission[];
};

export default function NewPatientPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

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

  const canCreatePatients = hasPermission(
    permissions,
    PERMISSIONS.PATIENTS_CREATE
  );

  return (
    <div className="flex flex-col">
      <TopBar title="New Patient" />

      {loadingPermissions ? (
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      ) : !canCreatePatients ? (
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">
              Access denied
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to create patients.
            </p>
          </div>
        </div>
      ) : (
        <PatientForm />
      )}
    </div>
  );
}