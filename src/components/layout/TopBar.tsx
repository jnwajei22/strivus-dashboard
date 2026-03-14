"use client";

import { Bell, Search } from "lucide-react";

const mockAlerts = [
  { id: 1, status: "active" },
  { id: 2, status: "resolved" },
  { id: 3, status: "active" },
];

export function TopBar({ title }: { title: string }) {
  const activeAlerts = mockAlerts.filter((a) => a.status === "active").length;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          {activeAlerts > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {activeAlerts}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}