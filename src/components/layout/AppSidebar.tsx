"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Cpu,
  Package,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  PERMISSIONS,
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
    role:
      | {
          id: string;
          name: string;
          description?: string | null;
        }
      | null;
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

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermissions?: Permission[];
};

const navItems: NavItem[] = [
  {
    label: "Overview",
    path: "/overview",
    icon: LayoutDashboard,
  },
  {
    label: "Patients",
    path: "/patients",
    icon: Users,
    requiredPermissions: [PERMISSIONS.PATIENTS_READ],
  },
  {
    label: "Devices",
    path: "/devices",
    icon: Cpu,
    requiredPermissions: [PERMISSIONS.DEVICES_READ],
  },
  {
    label: "Firmware",
    path: "/firmware",
    icon: Package,
    requiredPermissions: [PERMISSIONS.FIRMWARE_READ],
  },
  {
    label: "Logs",
    path: "/logs",
    icon: ScrollText,
    requiredPermissions: [PERMISSIONS.LOGS_READ],
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
    requiredPermissions: [
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.SETTINGS_UPDATE_PROFILE,
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<MeResponse["user"]>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        setLoadingUser(true);

        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          if (isMounted) {
            setCurrentUser(null);
            setPermissions([]);
          }
          return;
        }

        const data: MeResponse = await res.json();

        if (!res.ok) {
          throw new Error("Failed to load current user");
        }

        if (isMounted) {
          setCurrentUser(data.user);
          setPermissions(data.permissions ?? []);

          if (typeof data.user?.settings?.sidebarCollapsed === "boolean") {
            setCollapsed(data.user.settings.sidebarCollapsed);
          }
        }
      } catch (error) {
        console.error("Failed to fetch /api/auth/me:", error);

        if (isMounted) {
          setCurrentUser(null);
          setPermissions([]);
        }
      } finally {
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to sign out");
      }

      toast({
        title: "Signed out",
        description: "Your session has ended.",
      });

      setShowUserMenu(false);
      setCurrentUser(null);
      setPermissions([]);
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);

      toast({
        title: "Sign out failed",
        description: "Could not end your session cleanly.",
        variant: "destructive",
      });
    }
  };

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (!item.requiredPermissions?.length) return true;
      return hasAnyPermission(permissions, item.requiredPermissions);
    });
  }, [permissions]);

  const userName =
    currentUser?.displayName ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
    currentUser?.email ||
    "User";

  const userRole =
    currentUser?.role?.name ||
    currentUser?.roleName ||
    currentUser?.status ||
    "member";

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Activity className="h-4 w-4 text-primary-foreground" />
        </div>

        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
              STRIVUS 
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground">
              KINETICA DASHBOARD
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleNavItems.map((item) => {
          const isActive = pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div ref={userMenuRef} className="relative mb-3">
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/80"
              disabled={loadingUser}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-sidebar-accent-foreground">
                  {loadingUser ? "Loading..." : userName}
                </p>
                <p className="truncate text-[10px] capitalize text-sidebar-foreground">
                  {loadingUser ? "Fetching user" : userRole}
                </p>
              </div>
              <ChevronUp
                className={cn(
                  "h-4 w-4 shrink-0 text-sidebar-foreground transition-transform",
                  showUserMenu ? "rotate-0" : "rotate-180"
                )}
              />
            </button>

            {showUserMenu && !loadingUser && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-lg border border-sidebar-border bg-card shadow-kinetica">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors hover:bg-sidebar-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}