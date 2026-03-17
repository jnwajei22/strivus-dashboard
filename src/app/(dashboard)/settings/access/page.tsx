"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { toast } from "@/hooks/use-toast";
import {
  PERMISSIONS,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

type MeResponse = {
  user: { id: string; email: string } | null;
  permissions: Permission[];
};

type RoleRow = {
  id?: string;
  name?: string;
  description?: string | null;
};

type InviteRow = {
  id: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  status: string;
  inviteUrl: string | null;
  token: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
};

type InviteApiRow = {
  id?: string;
  email?: string;
  role_id?: string | null;
  roleId?: string | null;
  role_name?: string | null;
  roleName?: string | null;
  status?: string | null;
  invite_url?: string | null;
  inviteUrl?: string | null;
  token?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  expires_at?: string | null;
  expiresAt?: string | null;
  accepted_at?: string | null;
  acceptedAt?: string | null;
};

function normalizeInvite(row: InviteApiRow): InviteRow {
  return {
    id: String(row.id ?? ""),
    email: String(row.email ?? ""),
    roleId: row.roleId ?? row.role_id ?? null,
    roleName: row.roleName ?? row.role_name ?? null,
    status: String(row.status ?? "pending"),
    inviteUrl: row.inviteUrl ?? row.invite_url ?? null,
    token: row.token ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    expiresAt: row.expiresAt ?? row.expires_at ?? null,
    acceptedAt: row.acceptedAt ?? row.accepted_at ?? null,
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

function getStatusTone(status: string) {
  switch (status) {
    case "accepted":
      return "border-green-500/30 bg-green-500/10 text-green-400";
    case "expired":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "revoked":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    default:
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }
}

export default function AccessSettingsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      try {
        setLoading(true);

        const meRes = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!isMounted) return;

        if (meRes.status === 401) {
          setPermissions([]);
          return;
        }

        const meJson: MeResponse = await meRes.json();

        if (!meRes.ok) {
          throw new Error((meJson as any)?.error || "Failed to load auth state");
        }

        const nextPermissions = Array.isArray(meJson.permissions) ? meJson.permissions : [];
        setPermissions(nextPermissions);

        const canAccessPage = hasPermission(
          nextPermissions,
          PERMISSIONS.SETTINGS_UPDATE_SYSTEM
        );

        if (!canAccessPage) return;

        setLoadingInvites(true);

        const [rolesRes, invitesRes] = await Promise.all([
          fetch("/api/auth/roles", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/auth/invites", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const rolesJson = await rolesRes.json().catch(() => []);
        const invitesJson = await invitesRes.json().catch(() => []);

        if (!rolesRes.ok) {
          throw new Error(rolesJson?.error || "Failed to load roles");
        }

        if (!invitesRes.ok) {
          throw new Error(invitesJson?.error || "Failed to load invites");
        }

        if (!isMounted) return;

        const roleRows = Array.isArray(rolesJson)
          ? rolesJson
          : Array.isArray(rolesJson?.roles)
            ? rolesJson.roles
            : [];
        setRoles(roleRows);

        const inviteRows = Array.isArray(invitesJson)
          ? invitesJson
          : Array.isArray(invitesJson?.invites)
            ? invitesJson.invites
            : [];
        setInvites(inviteRows.map(normalizeInvite));
      } catch (error) {
        console.error("Failed to load access settings:", error);
        if (!isMounted) return;
        toast({
          title: "Failed to load access control",
          description: String(error),
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingInvites(false);
        }
      }
    }

    loadPage();

    return () => {
      isMounted = false;
    };
  }, []);

  const canAccess = hasPermission(permissions, PERMISSIONS.SETTINGS_UPDATE_SYSTEM);

  const sortedInvites = useMemo(() => {
    return [...invites].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [invites]);

  async function reloadInvites() {
    try {
      setLoadingInvites(true);

      const res = await fetch("/api/auth/invites", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to reload invites");
      }

      const inviteRows = Array.isArray(json)
        ? json
        : Array.isArray(json?.invites)
          ? json.invites
          : [];

      setInvites(inviteRows.map(normalizeInvite));
    } catch (error) {
      console.error("Failed to reload invites:", error);
      toast({
        title: "Reload failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setLoadingInvites(false);
    }
  }

  async function sendInvite() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast({
        title: "Email required",
        description: "Enter an email address before sending an invite.",
        variant: "destructive",
      });
      return;
    }

    if (!roleId) {
      toast({
        title: "Role required",
        description: "Pick a role for the invite.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);

      const res = await fetch("/api/auth/invites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          role_id: roleId,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to send invite");
      }

      const created = normalizeInvite(
        json?.invite ?? json
      );

      setInvites((prev) => {
        const others = prev.filter((item) => item.id !== created.id);
        return [created, ...others];
      });

      setEmail("");
      setRoleId("");

      toast({
        title: "Invite sent",
        description: `Invitation created for ${created.email}.`,
      });
    } catch (error) {
      console.error("Failed to send invite:", error);
      toast({
        title: "Invite failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function copyInviteLink(invite: InviteRow) {
    const fallbackLink =
      invite.inviteUrl ||
      (invite.token ? `${window.location.origin}/auth/accept-invite?token=${invite.token}` : null);

    if (!fallbackLink) {
      toast({
        title: "No invite link available",
        description: "This invite did not return a usable link.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(fallbackLink);
      setCopiedId(invite.id);
      toast({
        title: "Invite link copied",
        description: "Link copied to clipboard.",
      });
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      console.error("Failed to copy invite link:", error);
      toast({
        title: "Copy failed",
        description: "Clipboard copy failed.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex w-full flex-col">
        <TopBar title="Access Control" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex w-full flex-col">
        <TopBar title="Access Control" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to manage access control.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <TopBar title="Access Control" />

      <div className="flex-1 w-full p-6">
        <div className="flex w-full flex-col gap-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
            <h1 className="text-2xl font-semibold text-foreground">Access Control</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Send invites and manage onboarding access without hiding it in some random corner.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-kinetica">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-foreground">Invite user</h2>
              <p className="text-sm text-muted-foreground">
                Create an invite link tied to a selected role.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.5fr)_260px_120px]">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Role
                </label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={sendInvite}
                  disabled={sending || !email.trim() || !roleId}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send invite"}
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-kinetica">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Invites</h2>
                <p className="text-sm text-muted-foreground">
                  Pending and completed invitation records.
                </p>
              </div>

              <button
                onClick={reloadInvites}
                disabled={loadingInvites}
                className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingInvites ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="hidden md:grid md:grid-cols-[minmax(0,1.4fr)_180px_120px_180px_180px_120px] md:gap-4 border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div>Created</div>
              <div>Expires</div>
              <div className="text-right">Action</div>
            </div>

            {sortedInvites.length === 0 ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">
                No invites yet.
              </div>
            ) : (
              sortedInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="border-b border-border px-6 py-4 last:border-b-0"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.4fr)_180px_120px_180px_180px_120px] md:items-center md:gap-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">{invite.email}</div>
                      {invite.acceptedAt && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Accepted: {formatDate(invite.acceptedAt)}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-foreground">
                      {invite.roleName ?? "—"}
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(
                          invite.status
                        )}`}
                      >
                        {invite.status}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {formatDate(invite.createdAt)}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {formatDate(invite.expiresAt)}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => copyInviteLink(invite)}
                        disabled={invite.status === "accepted"}
                        className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {copiedId === invite.id ? "Copied" : "Copy link"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}