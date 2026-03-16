"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import {
  User,
  Bell,
  Shield,
  Sliders,
  Link2,
  Monitor,
  ChevronRight,
} from "lucide-react";
import {
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
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
    roleName?: string | null;
    status: string | null;
    emailVerifiedAt?: string | null;
    lastLoginAt?: string | null;
    authMethod?: string | null;
    profile?: {
      jobTitle: string | null;
      avatarUrl: string | null;
      phone: string | null;
      department: string | null;
      timezone: string | null;
    };
    settings?: {
      theme: string;
      sidebarCollapsed: boolean;
      defaultDashboardView: string | null;
      timezone: string | null;
    };
  } | null;
  permissions: Permission[];
};

type SettingsCard = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
};

export default function SettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [currentUser, setCurrentUser] = useState<MeResponse["user"]>(null);
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
          setCurrentUser(null);
          return;
        }

        const data: MeResponse = await res.json();

        if (!res.ok) {
          setPermissions([]);
          setCurrentUser(null);
          return;
        }

        setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
        setCurrentUser(data.user ?? null);
      } catch (error) {
        console.error("Failed to load /api/auth/me:", error);
        if (!isMounted) return;
        setPermissions([]);
        setCurrentUser(null);
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

  const canAccessSettings = hasAnyPermission(permissions, [
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE_PROFILE,
    PERMISSIONS.SETTINGS_UPDATE_SYSTEM,
  ]);

  const canReadSettings = hasPermission(permissions, PERMISSIONS.SETTINGS_READ);
  const canUpdateProfile = hasPermission(
    permissions,
    PERMISSIONS.SETTINGS_UPDATE_PROFILE
  );
  const canUpdateSystem = hasPermission(
    permissions,
    PERMISSIONS.SETTINGS_UPDATE_SYSTEM
  );

  const displayName = useMemo(() => {
    return (
      currentUser?.displayName ||
      [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
      currentUser?.email ||
      "User"
    );
  }, [currentUser]);

  const displayRole = currentUser?.roleName || "Unknown role";

  const cards: SettingsCard[] = [
    {
      href: "/settings/profile",
      title: "Profile",
      description: "Update your account details, personal profile, and preferences.",
      icon: User,
      visible: canReadSettings || canUpdateProfile,
    },
    {
      href: "/settings/notifications",
      title: "Notifications",
      description: "Manage alert channels and notification delivery preferences.",
      icon: Bell,
      visible: canReadSettings || canUpdateProfile,
    },
    {
      href: "/settings/session",
      title: "Session",
      description: "Review account session details and sign-in information.",
      icon: Monitor,
      visible: canReadSettings || canUpdateProfile,
    },
    {
      href: "/settings/access",
      title: "Access Control",
      description: "Manage roles, team access, and account permissions.",
      icon: Shield,
      visible: canUpdateSystem,
    },
    {
      href: "/settings/system",
      title: "System",
      description: "Configure operational defaults and platform-level settings.",
      icon: Sliders,
      visible: canUpdateSystem,
    },
    {
      href: "/settings/integrations",
      title: "Integrations",
      description: "Configure external services and connection status.",
      icon: Link2,
      visible: canUpdateSystem,
    },
  ];

  const visibleCards = cards.filter((card) => card.visible);

  if (loadingPermissions) {
    return (
      <div className="flex flex-col">
        <TopBar title="Settings" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canAccessSettings) {
    return (
      <div className="flex flex-col">
        <TopBar title="Settings" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">
              Access denied
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to view settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Settings" />

      <div className="flex-1 p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Settings
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">
              Account & platform configuration
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Settings are now split into focused sections so this page stops
              behaving like a garage drawer full of loose screws.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Signed in as
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentUser?.email ?? "No email"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Role
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {displayRole}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentUser?.status ?? "Unknown status"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Available sections
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {visibleCards.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Based on your current permissions
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-kinetica transition-all hover:border-primary/30 hover:bg-surface"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>

                  <div className="mt-4">
                    <h2 className="text-base font-semibold text-foreground">
                      {card.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}