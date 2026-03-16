"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import DeviceForm from "@/components/devices/DeviceForm";
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

export default function EditDevicePage() {
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

  const canUpdateDevices = hasPermission(
    permissions,
    PERMISSIONS.DEVICES_UPDATE
  );

  if (loadingPermissions) {
    return (
      <div className="flex flex-col">
        <TopBar title="Edit Device" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canUpdateDevices) {
    return (
      <div className="flex flex-col">
        <TopBar title="Edit Device" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">
              Access denied
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to edit devices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Edit Device" />
      <DeviceForm />
    </div>
  );
}