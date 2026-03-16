"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/ui/kinetica";
import {
  Search,
  Plus,
  Filter,
  Pencil,
  Trash2,
  X,
  User2,
  Cpu,
  ExternalLink,
  FileText,
  MessageSquareText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
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

type LogCategory =
  | "system"
  | "alert"
  | "command"
  | "note"
  | "firmware"
  | "auth"
  | "device"
  | "patient"
  | "general";

type LogSeverity = "info" | "warning" | "error" | "critical";
type LogStatus = "open" | "resolved" | "pending" | "info";

type DeviceLog = {
  id: string;
  device_id: string;
  request_id: string | null;
  log_type: string;
  status: string | null;
  line_count: number | null;
  log_text: string | null;
  created_at: string;
  updated_at: string;
  device_serial: string;
  device_name: string | null;
  patient_id: string | null;
  patient_name: string | null;
};

type LogNote = {
  id: string;
  author_user_id: string | null;
  linked_patient_id: string | null;
  linked_device_id: string | null;
  related_session_id: string | null;
  related_command_id: string | null;
  type: LogCategory;
  category: string | null;
  severity: LogSeverity;
  status: LogStatus;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  author_display_name?: string | null;
  author_email?: string | null;
  device_serial?: string | null;
  device_name?: string | null;
  patient_name?: string | null;
};

type NotesFormState = {
  title: string;
  type: LogCategory;
  status: LogStatus;
  severity: LogSeverity;
  category: string;
  body: string;
  linkedPatientId: string;
  linkedDeviceId: string;
};

const categoryIcons: Record<LogCategory, string> = {
  system: "⚙️",
  alert: "🔔",
  command: "⚡",
  note: "📝",
  firmware: "📦",
  auth: "🔐",
  device: "📡",
  patient: "🩺",
  general: "📋",
};

const ALL_CATEGORIES: LogCategory[] = [
  "system",
  "alert",
  "command",
  "note",
  "firmware",
  "auth",
  "device",
  "patient",
  "general",
];

const ALL_SEVERITIES: LogSeverity[] = ["info", "warning", "error", "critical"];
const ALL_STATUSES: LogStatus[] = ["open", "resolved", "pending", "info"];

const statusColors: Record<LogStatus, string> = {
  open: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  pending: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const emptyForm: NotesFormState = {
  title: "",
  type: "note",
  status: "info",
  severity: "info",
  category: "",
  body: "",
  linkedPatientId: "",
  linkedDeviceId: "",
};

type ActiveTab = "all" | "deviceLogs" | "notes";

export default function LogsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [deviceLogs, setDeviceLogs] = useState<DeviceLog[]>([]);
  const [notes, setNotes] = useState<LogNote[]>([]);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<LogSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LogStatus | "all">("all");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<NotesFormState>({ ...emptyForm });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        if (!res.ok) throw new Error("Failed to load permissions");

        setPermissions(data.permissions ?? []);
      } catch (error) {
        console.error("Failed to load /api/auth/me:", error);
        if (isMounted) setPermissions([]);
      } finally {
        if (isMounted) setLoadingPermissions(false);
      }
    }

    loadMe();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadingData(true);

        const [logsRes, notesRes] = await Promise.all([
          fetch("/api/logs", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/logs/log-notes", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const logsJson = await logsRes.json();
        const notesJson = await notesRes.json();

        if (!logsRes.ok) {
          throw new Error(logsJson?.error || "Failed to load device logs");
        }

        if (!notesRes.ok) {
          throw new Error(notesJson?.error || "Failed to load log notes");
        }

        if (!isMounted) return;

        setDeviceLogs(Array.isArray(logsJson) ? logsJson : []);
        setNotes(Array.isArray(notesJson) ? notesJson : []);
      } catch (error) {
        console.error("Failed to load logs data:", error);
        if (isMounted) {
          toast({
            title: "Load failed",
            description:
              error instanceof Error ? error.message : "Failed to load logs data.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const canReadLogs = hasPermission(permissions, PERMISSIONS.LOGS_READ);
  const canCreateLogs = hasPermission(permissions, PERMISSIONS.LOGS_UPDATE);
  const canUpdateLogs = hasPermission(permissions, PERMISSIONS.LOGS_UPDATE);
  const canDeleteLogs = hasPermission(permissions, PERMISSIONS.LOGS_DELETE);

  const linkablePatients = useMemo(() => {
    const map = new Map<string, string>();

    for (const log of deviceLogs) {
      if (log.patient_id) {
        map.set(log.patient_id, log.patient_name || log.patient_id);
      }
    }

    for (const note of notes) {
      if (note.linked_patient_id) {
        map.set(note.linked_patient_id, note.patient_name || note.linked_patient_id);
      }
    }

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [deviceLogs, notes]);

  const linkableDevices = useMemo(() => {
    const map = new Map<string, string>();

    for (const log of deviceLogs) {
      if (log.device_id) {
        map.set(log.device_id, log.device_serial || log.device_id);
      }
    }

    for (const note of notes) {
      if (note.linked_device_id) {
        map.set(note.linked_device_id, note.device_serial || note.linked_device_id);
      }
    }

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [deviceLogs, notes]);

  const filteredDeviceLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return deviceLogs
      .filter((log) => {
        const matchesSearch =
          !q ||
          [
            log.request_id,
            log.log_type,
            log.status,
            log.log_text,
            log.device_serial,
            log.device_name,
            log.patient_name,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q));

        const matchesStatus =
          statusFilter === "all" || (log.status ?? "").toLowerCase() === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [deviceLogs, search, statusFilter]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();

    return notes
      .filter((note) => {
        const matchesSearch =
          !q ||
          [
            note.title,
            note.body,
            note.type,
            note.category,
            note.status,
            note.severity,
            note.author_display_name,
            note.author_email,
            note.device_serial,
            note.device_name,
            note.patient_name,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q));

        const matchesCategory =
          categoryFilter === "all" || note.type === categoryFilter;

        const matchesSeverity =
          severityFilter === "all" || note.severity === severityFilter;

        const matchesStatus =
          statusFilter === "all" || note.status === statusFilter;

        return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [notes, search, categoryFilter, severityFilter, statusFilter]);

  const openCreate = () => {
    if (!canCreateLogs) return;
    setFormMode("create");
    setEditingNoteId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (note: LogNote) => {
    if (!canUpdateLogs) return;
    setFormMode("edit");
    setEditingNoteId(note.id);
    setForm({
      title: note.title,
      type: note.type,
      status: note.status,
      severity: note.severity,
      category: note.category ?? "",
      body: note.body ?? "",
      linkedPatientId: note.linked_patient_id ?? "",
      linkedDeviceId: note.linked_device_id ?? "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingNoteId(null);
    setForm({ ...emptyForm });
  };

  async function handleSubmit() {
    if (formMode === "create" && !canCreateLogs) return;
    if (formMode === "edit" && !canUpdateLogs) return;

    if (!form.title.trim()) {
      toast({
        title: "Missing title",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        linked_patient_id: form.linkedPatientId || null,
        linked_device_id: form.linkedDeviceId || null,
        type: form.type,
        category: form.category.trim() || null,
        severity: form.severity,
        status: form.status,
        title: form.title.trim(),
        body: form.body.trim() || null,
      };

      if (formMode === "create") {
        const res = await fetch("/api/logs/log-notes", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to create log note");
        }

        setNotes((prev) => [json, ...prev]);

        toast({
          title: "Note created",
          description: "Entry saved successfully.",
        });
      } else if (formMode === "edit" && editingNoteId) {
        const res = await fetch(`/api/logs/log-notes/${editingNoteId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to update log note");
        }

        setNotes((prev) =>
          prev.map((note) => (note.id === editingNoteId ? { ...note, ...json } : note))
        );

        toast({
          title: "Note updated",
          description: "Entry has been saved.",
        });
      }

      closeForm();
    } catch (error) {
      toast({
        title: formMode === "edit" ? "Update failed" : "Create failed",
        description:
          error instanceof Error ? error.message : "Request failed.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteNote(id: string) {
    if (!canDeleteLogs) return;

    try {
      const res = await fetch(`/api/logs/log-notes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to delete log note");
      }

      setNotes((prev) => prev.filter((note) => note.id !== id));

      toast({
        title: "Note deleted",
        description: "Entry removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Request failed.",
        variant: "destructive",
      });
    }
  }

  function renderPatientLink(patientId: string | null | undefined, patientName?: string | null) {
    if (!patientId) return null;

    return (
      <Link
        href={`/patients/${patientId}`}
        className="inline-flex items-center gap-1 text-[11px] text-primary transition-colors hover:text-primary/80"
      >
        <User2 className="h-3 w-3" />
        {patientName || patientId}
        <ExternalLink className="h-2.5 w-2.5" />
      </Link>
    );
  }

  function renderDeviceLink(deviceId: string | null | undefined, deviceLabel?: string | null) {
    if (!deviceId) return null;

    return (
      <Link
        href={`/devices/${deviceId}`}
        className="inline-flex items-center gap-1 text-[11px] text-primary transition-colors hover:text-primary/80"
      >
        <Cpu className="h-3 w-3" />
        {deviceLabel || deviceId}
        <ExternalLink className="h-2.5 w-2.5" />
      </Link>
    );
  }

  function renderDeviceLogCard(log: DeviceLog) {
    return (
      <div
        key={log.id}
        className="rounded-xl border border-border bg-card shadow-kinetica"
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-lg">📄</span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">
                  {log.log_type || "Device log"}
                </h3>
                {log.status ? (
                  <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                    {log.status}
                  </span>
                ) : null}
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  device log
                </span>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {log.log_text || "No log text provided."}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                {renderDeviceLink(log.device_id, log.device_serial)}
                {renderPatientLink(log.patient_id, log.patient_name)}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-data text-[11px] text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </span>
                {log.updated_at && log.updated_at !== log.created_at && (
                  <span className="font-data text-[10px] italic text-muted-foreground/60">
                    edited {new Date(log.updated_at).toLocaleString()}
                  </span>
                )}
                {log.request_id && (
                  <span className="text-[11px] text-muted-foreground">
                    req: <span className="font-medium text-foreground/80">{log.request_id}</span>
                  </span>
                )}
                {typeof log.line_count === "number" && (
                  <span className="text-[11px] text-muted-foreground">
                    {log.line_count} lines
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderNoteCard(note: LogNote) {
    return (
      <div
        key={note.id}
        className="rounded-xl border border-border bg-card shadow-kinetica"
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-lg">{categoryIcons[note.type]}</span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">{note.title}</h3>
                <StatusBadge status={note.severity} />
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColors[note.status]}`}
                >
                  {note.status}
                </span>
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                  {note.type}
                </span>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {note.body || "No body provided."}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                {renderDeviceLink(note.linked_device_id, note.device_serial || note.device_name)}
                {renderPatientLink(note.linked_patient_id, note.patient_name)}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-data text-[11px] text-muted-foreground">
                  {new Date(note.created_at).toLocaleString()}
                </span>
                {note.updated_at && note.updated_at !== note.created_at && (
                  <span className="font-data text-[10px] italic text-muted-foreground/60">
                    edited {new Date(note.updated_at).toLocaleString()}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  by{" "}
                  <span className="font-medium text-foreground/80">
                    {note.author_display_name || note.author_email || "Unknown user"}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {canUpdateLogs && (
                <button
                  onClick={() => openEdit(note)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  title="Edit note"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {canDeleteLogs && (
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-red-400"
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const combinedFeed = useMemo(() => {
    const combined = [
      ...filteredDeviceLogs.map((item) => ({
        kind: "deviceLog" as const,
        createdAt: item.created_at,
        item,
      })),
      ...filteredNotes.map((item) => ({
        kind: "note" as const,
        createdAt: item.created_at,
        item,
      })),
    ];

    return combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredDeviceLogs, filteredNotes]);

  if (loadingPermissions) {
    return (
      <div className="flex flex-col">
        <TopBar title="Logs & Notes" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!canReadLogs) {
    return (
      <div className="flex flex-col">
        <TopBar title="Logs & Notes" />
        <div className="p-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
            <h2 className="text-base font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have permission to view logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Logs & Notes" />

      <div className="space-y-5 p-6">
        {showForm && (canCreateLogs || (formMode === "edit" && canUpdateLogs)) && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {formMode === "edit" ? "Edit Log Note" : "Add New Log Note"}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as LogCategory }))
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, severity: e.target.value as LogSeverity }))
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ALL_SEVERITIES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as LogStatus }))
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Category <span className="text-muted-foreground/50">(optional free text)</span>
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. device-health"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Linked Patient</label>
                <select
                  value={form.linkedPatientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, linkedPatientId: e.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">None</option>
                  {linkablePatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Linked Device</label>
                <select
                  value={form.linkedDeviceId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, linkedDeviceId: e.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">None</option>
                  {linkableDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Log note title..."
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Note / Body</label>
              <textarea
                rows={4}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Describe the observation, note, or issue..."
                className="min-h-[96px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? "Saving..." : formMode === "edit" ? "Save Changes" : "Save Note"}
              </button>
              <button
                onClick={closeForm}
                className="rounded-lg border border-border bg-surface px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs, notes, devices, patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            {(["all", "deviceLogs", "notes"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "all" ? "All" : tab === "deviceLogs" ? "Device Logs" : "Notes"}
              </button>
            ))}
          </div>

          {canCreateLogs && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
            <span className="mr-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Type
            </span>
            {(["all", ...ALL_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  categoryFilter === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Severity
            </span>
            {(["all", ...ALL_SEVERITIES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  severityFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Status
            </span>
            {(["all", ...ALL_STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loadingData ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading logs...
          </div>
        ) : (
          <>
            {activeTab === "all" && (
              <div className="space-y-2">
                {combinedFeed.map((entry) =>
                  entry.kind === "deviceLog"
                    ? renderDeviceLogCard(entry.item)
                    : renderNoteCard(entry.item)
                )}

                {combinedFeed.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No logs matching filters.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "deviceLogs" && (
              <div className="space-y-2">
                {filteredDeviceLogs.map(renderDeviceLogCard)}

                {filteredDeviceLogs.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No device logs matching filters.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-2">
                {filteredNotes.map(renderNoteCard)}

                {filteredNotes.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No notes matching filters.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 mr-3">
                  <FileText className="h-3.5 w-3.5" />
                  {filteredDeviceLogs.length} device logs
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  {filteredNotes.length} notes
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  disabled
                >
                  Previous
                </button>
                <span className="font-data text-xs text-foreground">1</span>
                <button
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  disabled
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}