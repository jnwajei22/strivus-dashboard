"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/hooks/use-toast";
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
    status: string | null;
    emailVerifiedAt?: string | null;
    lastLoginAt?: string | null;
    authMethod?: string | null;
    roleId?: string | null;
    roleName?: string | null;
    profile?: {
      jobTitle: string | null;
      avatarUrl: string | null;
      phone: string | null;
      department: string | null;
      timezone: string | null;
    } | null;
    settings?: {
      theme: string | null;
      sidebarCollapsed: boolean;
      defaultDashboardView: string | null;
      timezone: string | null;
    } | null;
  } | null;
  permissions: Permission[];
};

type ProfileApiResponse = {
  user_id?: string;
  job_title?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  department?: string | null;
  timezone?: string | null;
  created_at?: string;
  updated_at?: string;
} | null;

type PreferencesApiResponse = {
  id?: string;
  user_id?: string;
  theme?: string | null;
  sidebarCollapsed: boolean | null;
  default_dashboard_view?: string | null;
  timezone?: string | null;
  created_at?: string;
  updated_at?: string;
} | null;

type ProfileForm = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  avatarUrl: string;
  timezone: string;
  theme: string;
  defaultDashboardView: string;
  sidebarCollapsed: boolean;
};

function normalizeProfileData(
  me: MeResponse["user"],
  profileData: ProfileApiResponse,
  preferencesData: PreferencesApiResponse
): ProfileForm {
  return {
    firstName: me?.firstName ?? "",
    lastName: me?.lastName ?? "",
    displayName: me?.displayName ?? "",
    email: me?.email ?? "",
    phone: profileData?.phone ?? me?.profile?.phone ?? "",
    jobTitle: profileData?.job_title ?? me?.profile?.jobTitle ?? "",
    department: profileData?.department ?? me?.profile?.department ?? "",
    avatarUrl: profileData?.avatar_url ?? me?.profile?.avatarUrl ?? "",
    timezone:
      preferencesData?.timezone ??
      profileData?.timezone ??
      me?.settings?.timezone ??
      me?.profile?.timezone ??
      "",
    theme: preferencesData?.theme ?? me?.settings?.theme ?? "system",
    defaultDashboardView:
      preferencesData?.default_dashboard_view ??
      me?.settings?.defaultDashboardView ??
      "",
    sidebarCollapsed:
      preferencesData?.sidebarCollapsed ??
      me?.settings?.sidebarCollapsed ??
      false,
  };
}

function formatLabel(value?: string | null) {
  if (!value) return "—";

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ProfileSettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [me, setMe] = useState<MeResponse["user"]>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const meRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!isMounted) return;

        if (meRes.status === 401) {
          setPermissions([]);
          setMe(null);
          setForm(null);
          return;
        }

        const meJson: MeResponse = await meRes.json();

        if (!meRes.ok) {
          throw new Error((meJson as any)?.error || "Failed to load auth state");
        }

        const perms = Array.isArray(meJson.permissions) ? meJson.permissions : [];
        const user = meJson.user ?? null;

        setPermissions(perms);
        setMe(user);

        const [profileRes, preferencesRes] = await Promise.all([
          fetch("/api/settings/profile", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/settings/preferences", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        let profileJson: ProfileApiResponse = null;
        let preferencesJson: PreferencesApiResponse = null;

        if (profileRes.ok) {
          profileJson = await profileRes.json();
        } else if (profileRes.status !== 404) {
          const err = await profileRes.json().catch(() => null);
          throw new Error(err?.error || "Failed to load profile");
        }

        if (preferencesRes.ok) {
          preferencesJson = await preferencesRes.json();
        } else {
          const err = await preferencesRes.json().catch(() => null);
          throw new Error(err?.error || "Failed to load preferences");
        }

        if (!isMounted) return;

        setForm(normalizeProfileData(user, profileJson, preferencesJson));
      } catch (error) {
        console.error("Failed to load profile settings:", error);
        if (!isMounted) return;
        toast({
          title: "Failed to load profile settings",
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

  const canAccess = hasAnyPermission(permissions, [
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE_PROFILE,
  ]);

  const canEdit = hasPermission(permissions, PERMISSIONS.SETTINGS_UPDATE_PROFILE);

  const displayRole = me?.roleName || "Unknown role";

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!form) return;

    try {
      setSaving(true);

      const [profileRes, preferencesRes] = await Promise.all([
        fetch("/api/settings/profile", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: form.phone || null,
            job_title: form.jobTitle || null,
            department: form.department || null,
            avatar_url: form.avatarUrl || null,
            timezone: form.timezone || null,
          }),
        }),
        fetch("/api/settings/preferences", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme: form.theme || null,
            default_dashboard_view: form.defaultDashboardView || null,
            sidebar_collapsed: form.sidebarCollapsed,
            timezone: form.timezone || null,
          }),
        }),
      ]);

      const profileJson = await profileRes.json().catch(() => null);
      const preferencesJson = await preferencesRes.json().catch(() => null);

      if (!profileRes.ok) {
        throw new Error(profileJson?.error || "Failed to save profile");
      }

      if (!preferencesRes.ok) {
        throw new Error(preferencesJson?.error || "Failed to save preferences");
      }

      toast({
        title: "Profile updated",
        description: "Your settings were saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save profile settings:", error);
      toast({
        title: "Save failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
        <TopBar title="Profile Settings" />
        <div className="p-6">
          <div className="mb-6">{backButton}</div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!canAccess || !form) {
    return (
      <div className="flex flex-col w-full">
        <TopBar title="Profile Settings" />
        <div className="p-6">
          <div className="mb-6">{backButton}</div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to view profile settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <TopBar title="Profile Settings" />

      <div className="flex-1 w-full p-6">
        <div className="mb-6">{backButton}</div>

        <div className="w-full flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
            <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your personal account details and dashboard preferences.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-2 text-sm font-medium text-foreground">{form.email || "—"}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                <p className="mt-2 text-sm font-medium text-foreground">{displayRole}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-2 text-sm font-medium text-foreground">{formatLabel(me?.status)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
              <h2 className="text-lg font-semibold text-foreground">Identity</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="First name">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    disabled
                  />
                </Field>

                <Field label="Last name">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    disabled
                  />
                </Field>

                <Field label="Display name">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.displayName}
                    onChange={(e) => updateField("displayName", e.target.value)}
                    disabled
                  />
                </Field>

                <Field label="Email">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
                    value={form.email}
                    disabled
                  />
                </Field>

                <Field label="Phone">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    disabled={!canEdit}
                  />
                </Field>

                <Field label="Job title">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.jobTitle}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    disabled={!canEdit}
                  />
                </Field>

                <Field label="Department">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.department}
                    onChange={(e) => updateField("department", e.target.value)}
                    disabled={!canEdit}
                  />
                </Field>

                <Field label="Avatar URL">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.avatarUrl}
                    onChange={(e) => updateField("avatarUrl", e.target.value)}
                    disabled={!canEdit}
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
              <h2 className="text-lg font-semibold text-foreground">Preferences</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Timezone">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.timezone}
                    onChange={(e) => updateField("timezone", e.target.value)}
                    disabled={!canEdit}
                    placeholder="America/Chicago"
                  />
                </Field>

                <Field label="Theme">
                  <select
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.theme}
                    onChange={(e) => updateField("theme", e.target.value)}
                    disabled={!canEdit}
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </Field>

                <Field label="Default dashboard view">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={form.defaultDashboardView}
                    onChange={(e) => updateField("defaultDashboardView", e.target.value)}
                    disabled={!canEdit}
                    placeholder="overview"
                  />
                </Field>

                <Field label="Sidebar collapsed">
                  <label className="flex h-11 items-center gap-3 rounded-lg border border-border bg-background px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.sidebarCollapsed}
                      onChange={(e) => updateField("sidebarCollapsed", e.target.checked)}
                      disabled={!canEdit}
                    />
                    Collapse sidebar by default
                  </label>
                </Field>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={!canEdit || saving}
                  className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}