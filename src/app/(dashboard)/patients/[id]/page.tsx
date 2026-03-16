"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import {
  StatusBadge,
  MetricCard,
  SectionHeader,
} from "@/components/ui/kinetica";
import {
  ArrowLeft,
  Battery,
  Wifi,
  Clock,
  Cpu,
  RefreshCw,
  Terminal,
  Play,
  FileText,
  Download,
  Zap,
  Activity,
  Target,
  AlertTriangle,
  TrendingUp,
  Dumbbell,
  Shield,
  Pencil,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type PatientDetailResponse = {
  patient: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    dob: string | null;
    sex: string | null;
    height: string | null;
    weight: string | null;
    email: string | null;
    phone: string | null;
    medicareId: string | null;
    providerFacility: string | null;
    status: string;
    enrolledAt: string | null;
    dischargedAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
  device: {
    id: string;
    serialNumber: string;
    displayName: string | null;
    status: string;
    firmwareVersion: string | null;
    battery: number | null;
    signal: number | null;
    lastSync: string | null;
    lastContact: string | null;
    deploymentGroup: string | null;
  } | null;
  protocol: {
    id: string;
    name: string;
    focusArea: string | null;
    frequency: string | null;
    setsReps: string | null;
    loadTarget: number | null;
    progressionNotes: string | null;
    status: string;
    startedAt: string | null;
    endedAt: string | null;
    lastUpdated: string;
  } | null;
  flags: Array<{
    id: string;
    type: string;
    severity: string;
    status: string;
    title: string;
    description: string | null;
    createdAt: string;
    resolvedAt: string | null;
  }>;
  adherence: {
    prescribed: number;
    completed: number;
    missed: number;
    cancelled: number;
    adherenceRate: number;
  } | null;
  sessionDays: Array<{
    date: string;
    sessions: number;
    completed: number;
    duration: number;
    reps: number;
    missed: number;
    adherenceRate: number | null;
  }>;
  sessions: Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    duration: number;
    status: string;
    reps: number | null;
    exercises: number | null;
    summary: string | null;
  }>;
  files: Array<{
    id: string;
    fileName: string;
    size: number | null;
    uploadedAt: string;
    status: string;
  }>;
  commands: Array<{
    id: string;
    commandType: string;
    result: string;
    status: string;
    createdAt: string;
    resultMessage: string | null;
    resultCreatedAt: string | null;
  }>;
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PatientDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "files" | "commands">(
    "sessions"
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPatient() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/patients/${id}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json();

        if (!isMounted) return;

        if (res.status === 404) {
          setError("Patient not found.");
          setData(null);
          return;
        }

        if (res.status === 401 || res.status === 403) {
          setError("You do not have permission to view this patient.");
          setData(null);
          return;
        }

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load patient details");
        }

        setData(json as PatientDetailResponse);
      } catch (err) {
        console.error("Failed to load patient detail:", err);
        if (isMounted) {
          setError("Failed to load patient details.");
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadPatient();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const patient = data?.patient ?? null;
  const device = data?.device ?? null;
  const sessions = data?.sessions ?? [];
  const files = data?.files ?? [];
  const commands = data?.commands ?? [];
  const adherence = data?.adherence ?? null;
  const protocol = data?.protocol ?? null;
  const sessionDays = data?.sessionDays ?? [];
  const flags = data?.flags ?? [];

  const displayName = useMemo(() => {
    if (!patient) return "Patient";
    return (
      patient.fullName?.trim() ||
      `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() ||
      "Unnamed Patient"
    );
  }, [patient]);

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalReps = completedSessions.reduce((sum, s) => sum + (s.reps || 0), 0);
  const totalMinutes = completedSessions.reduce(
    (sum, s) => sum + (s.duration || 0),
    0
  );
  const avgDuration =
    completedSessions.length > 0
      ? Math.round(totalMinutes / completedSessions.length)
      : 0;

  const remoteActions = [
    { label: "Sync Now", icon: RefreshCw, command: "sync" },
    { label: "Start Workout", icon: Play, command: "start_workout" },
    { label: "Request Logs", icon: FileText, command: "request_logs" },
    { label: "Send Command", icon: Terminal, command: "send_command" },
  ];

  const chartTooltipStyle = {
    contentStyle: {
      background: "hsl(222 47% 7%)",
      border: "1px solid hsl(222 30% 12%)",
      borderRadius: "8px",
      fontSize: "12px",
    },
    labelStyle: { color: "hsl(210 40% 93%)" },
  };

  const flagSeverityIcon: Record<string, string> = {
    high: "text-destructive",
    medium: "text-warning",
    low: "text-muted-foreground",
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <TopBar title="Patient Details" />
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col">
        <TopBar title="Patient Not Found" />
        <div className="p-6 space-y-6">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Patients
          </Link>

          <div className="flex items-center justify-center h-64 rounded-xl border border-border bg-card">
            <p className="text-muted-foreground">{error ?? "Patient not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TopBar title={displayName} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Patients
          </Link>

          <Link
            href={`/patients/${patient.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit Patient
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {displayName}
                </h2>
                <StatusBadge status={patient.status as never} />
              </div>

              <div className="mt-3 grid gap-x-8 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                <p>
                  DOB:{" "}
                  <span className="font-data text-foreground">
                    {patient.dob ? new Date(patient.dob).toLocaleDateString() : "—"}
                  </span>{" "}
                  · {patient.sex || "—"}
                </p>
                <p>{patient.email || "—"}</p>
                <p>{patient.phone || "—"}</p>
                {patient.providerFacility && (
                  <p>
                    Provider:{" "}
                    <span className="text-foreground">
                      {patient.providerFacility}
                    </span>
                  </p>
                )}
                {patient.height && (
                  <p>
                    Height: <span className="text-foreground">{patient.height}</span>
                  </p>
                )}
                {patient.weight && (
                  <p>
                    Weight: <span className="text-foreground">{patient.weight}</span>
                  </p>
                )}
                {device?.deploymentGroup && (
                  <p>
                    Software Group:{" "}
                    <span className="font-data text-foreground uppercase">
                      {device.deploymentGroup}
                    </span>
                  </p>
                )}
                {patient.medicareId && (
                  <p>
                    Medicare ID:{" "}
                    <span className="text-foreground">{patient.medicareId}</span>
                  </p>
                )}
              </div>

              <p className="mt-3 text-sm text-foreground/70">
                {patient.notes || "No notes recorded."}
              </p>
            </div>

            {device && (
              <div className="flex flex-wrap gap-2">
                {remoteActions.map((action) => (
                  <button
                    key={action.command}
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-foreground hover:border-primary/50 transition-all active:scale-95"
                  >
                    <action.icon className="h-4 w-4 text-primary" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MetricCard
            label="Completed Sessions"
            value={completedSessions.length}
            icon={<Activity className="h-5 w-5" />}
            variant="success"
          />
          <MetricCard
            label="Total Reps"
            value={totalReps.toLocaleString()}
            icon={<Dumbbell className="h-5 w-5" />}
            variant="primary"
          />
          <MetricCard
            label="Avg Duration"
            value={`${avgDuration} min`}
            icon={<Clock className="h-5 w-5" />}
          />
          <MetricCard
            label="Total Minutes"
            value={totalMinutes.toLocaleString()}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <MetricCard
            label="Adherence"
            value={adherence ? `${adherence.adherenceRate}%` : "—"}
            icon={<Target className="h-5 w-5" />}
            variant={
              adherence && adherence.adherenceRate >= 75
                ? "success"
                : adherence && adherence.adherenceRate >= 50
                ? "warning"
                : "destructive"
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Session Activity — Last 7 Days" />
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionDays}>
                  <defs>
                    <linearGradient id="sessionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 12%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="duration"
                    name="Duration (min)"
                    stroke="hsl(199 89% 48%)"
                    fill="url(#sessionFill)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke="hsl(142 71% 45%)"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Performance Trend — Reps / Day" />
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 12%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar
                    dataKey="reps"
                    name="Reps"
                    fill="hsl(199 89% 48%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="hsl(142 71% 45%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Adherence — This Week" />
            {adherence ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prescribed</span>
                  <span className="font-data text-foreground">
                    {adherence.prescribed} sessions
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-data text-success">{adherence.completed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missed</span>
                  <span className="font-data text-destructive">{adherence.missed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cancelled</span>
                  <span className="font-data text-warning">{adherence.cancelled}</span>
                </div>
                <div className="mt-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Adherence Rate
                    </span>
                    <span
                      className={`font-data text-lg font-semibold ${
                        adherence.adherenceRate >= 75
                          ? "text-success"
                          : adherence.adherenceRate >= 50
                          ? "text-warning"
                          : "text-destructive"
                      }`}
                    >
                      {adherence.adherenceRate}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        adherence.adherenceRate >= 75
                          ? "bg-success"
                          : adherence.adherenceRate >= 50
                          ? "bg-warning"
                          : "bg-destructive"
                      }`}
                      style={{ width: `${adherence.adherenceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No adherence data available.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Current Protocol" />
            {protocol ? (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Focus Area
                  </p>
                  <p className="text-sm text-foreground mt-0.5">
                    {protocol.focusArea || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Frequency
                  </p>
                  <p className="font-data text-sm text-foreground mt-0.5">
                    {protocol.frequency || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Sets / Reps
                  </p>
                  <p className="font-data text-sm text-foreground mt-0.5">
                    {protocol.setsReps || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Progression Notes
                  </p>
                  <p className="text-sm text-foreground/80 mt-0.5">
                    {protocol.progressionNotes || "—"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Last updated {new Date(protocol.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No protocol assigned.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Clinical Flags" />
            {flags.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
                <Shield className="h-8 w-8 text-success/60" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No active concerns
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {flags.map((flag) => (
                  <div key={flag.id} className="flex gap-3 text-sm">
                    <AlertTriangle
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        flagSeverityIcon[flag.severity] ?? "text-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-foreground">
                        {flag.description || flag.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {flag.type.replace(/_/g, " ")} ·{" "}
                        {new Date(flag.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {device ? (
          <div>
            <SectionHeader title="Device Status" />
            <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-5">
              <MetricCard
                label="Device"
                value={device.serialNumber}
                icon={<Cpu className="h-5 w-5" />}
              />
              <MetricCard
                label="Status"
                value={device.status}
                icon={<Activity className="h-5 w-5" />}
                variant={
                  device.status === "online"
                    ? "success"
                    : device.status === "offline"
                    ? "destructive"
                    : "warning"
                }
              />
              <MetricCard
                label="Firmware"
                value={device.firmwareVersion || "—"}
                icon={<Cpu className="h-5 w-5" />}
                variant="primary"
              />
              <MetricCard
                label="Battery"
                value={device.battery != null ? `${device.battery}%` : "—"}
                icon={<Battery className="h-5 w-5" />}
                variant={
                  device.battery != null && device.battery < 30 ? "warning" : "success"
                }
              />
              <MetricCard
                label="Signal"
                value={device.signal != null ? `${device.signal} dBm` : "—"}
                icon={<Wifi className="h-5 w-5" />}
                variant={
                  device.signal != null && device.signal < -70 ? "warning" : "default"
                }
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border border-dashed bg-card p-6 text-center">
            <Cpu className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No device assigned</p>
            <button
              type="button"
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Assign Device
            </button>
          </div>
        )}

        <div className="border-b border-border">
          <div className="flex gap-6">
            {(["sessions", "files", "commands"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "sessions" && (
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No sessions recorded yet.
              </p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {s.summary || "Workout session"}
                    </p>
                    <p className="font-data text-xs text-muted-foreground mt-0.5">
                      {new Date(s.startedAt).toLocaleString()} · {s.duration}min
                      {s.reps ? ` · ${s.reps} reps` : ""}
                      {s.exercises ? ` · ${s.exercises} exercises` : ""}
                    </p>
                  </div>
                  <StatusBadge status={s.status as never} />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "files" && (
          <div className="space-y-2">
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No files uploaded yet.
              </p>
            ) : (
              files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-data text-sm text-foreground">{f.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.size != null ? `${(f.size / 1000).toFixed(0)} KB` : "—"} ·{" "}
                        {new Date(f.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "commands" && (
          <div className="space-y-2">
            {commands.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No commands issued yet.
              </p>
            ) : (
              commands.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {c.commandType.replace(/_/g, " ")}
                      </p>
                      <p className="font-data text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                        {c.resultMessage ? ` · ${c.resultMessage}` : ""}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={c.result as never} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}