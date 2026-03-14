"use client";

import { useParams } from "next/navigation";
import  Link  from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, MetricCard, SectionHeader } from '@/components/ui/kinetica';
import {
  mockPatients, mockDevices, mockSessions, mockCsvFiles, mockCommandLogs,
  mockAdherence, mockPatientProtocols, mockPatientSessionDays, mockClinicalFlags,
} from '@/data/mock-data';
import {
  ArrowLeft, Battery, Wifi, Clock, Cpu, RefreshCw, Terminal,
  Play, FileText, Download, Zap, Activity, Target, AlertTriangle,
  TrendingUp, Calendar, Dumbbell, ClipboardList, Shield,
} from 'lucide-react';
import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patient = mockPatients.find(p => p.id === id);
  const device = patient?.deviceId ? mockDevices.find(d => d.id === patient.deviceId) : null;
  const sessions = mockSessions.filter(s => s.patientId === id);
  const files = mockCsvFiles.filter(f => f.patientId === id);
  const commands = mockCommandLogs.filter(c => c.patientId === id);
  const adherence = mockAdherence.find(a => a.patientId === id);
  const protocol = mockPatientProtocols.find(p => p.patientId === id);
  const sessionDays = mockPatientSessionDays[id || ''] || [];
  const flags = mockClinicalFlags.filter(f => f.patientId === id);
  const [activeTab, setActiveTab] = useState<'sessions' | 'files' | 'commands'>('sessions');

  if (!patient) {
    return (
      <div className="flex flex-col">
        <TopBar title="Patient Not Found" />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Patient not found.</p>
        </div>
      </div>
    );
  }

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalReps = completedSessions.reduce((sum, s) => sum + (s.reps || 0), 0);
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
  const avgDuration = completedSessions.length > 0 ? Math.round(totalMinutes / completedSessions.length) : 0;

  const remoteActions = [
    { label: 'Sync Now', icon: RefreshCw, command: 'sync' },
    { label: 'Start Workout', icon: Play, command: 'start_workout' },
    { label: 'Request Logs', icon: FileText, command: 'request_logs' },
    { label: 'Send Command', icon: Terminal, command: 'send_command' },
  ];

  const chartTooltipStyle = {
    contentStyle: { background: 'hsl(222 47% 7%)', border: '1px solid hsl(222 30% 12%)', borderRadius: '8px', fontSize: '12px' },
    labelStyle: { color: 'hsl(210 40% 93%)' },
  };

  const flagSeverityIcon: Record<string, string> = {
    high: 'text-destructive',
    medium: 'text-warning',
    low: 'text-muted-foreground',
  };

  return (
    <div className="flex flex-col">
      <TopBar title={`${patient.firstName} ${patient.lastName}`} />
      <div className="p-6 space-y-6">
        {/* Back */}
        <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Patients
        </Link>

        {/* ─── Patient Identity Header ─── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {patient.firstName} {patient.lastName}
                </h2>
                <StatusBadge status={patient.status} />
              </div>
              <div className="mt-3 grid gap-x-8 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                <p>DOB: <span className="font-data text-foreground">{new Date(patient.dob).toLocaleDateString()}</span> · {patient.sex}</p>
                <p>{patient.email}</p>
                <p>{patient.phone}</p>
                {patient.providerFacility && <p>Provider: <span className="text-foreground">{patient.providerFacility}</span></p>}
                {patient.height && <p>Height: <span className="text-foreground">{patient.height}</span></p>}
                {patient.weight && <p>Weight: <span className="text-foreground">{patient.weight}</span></p>}
                {patient.deploymentGroup && (
                  <p>Software Group: <span className="font-data text-foreground uppercase">{patient.deploymentGroup}</span></p>
                )}
              </div>
              <p className="mt-3 text-sm text-foreground/70">{patient.notes}</p>
            </div>
            {device && (
              <div className="flex flex-wrap gap-2">
                {remoteActions.map(action => (
                  <button
                    key={action.command}
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

        {/* ─── Key Metrics Row ─── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <MetricCard label="Completed Sessions" value={completedSessions.length} icon={<Activity className="h-5 w-5" />} variant="success" />
          <MetricCard label="Total Reps" value={totalReps.toLocaleString()} icon={<Dumbbell className="h-5 w-5" />} variant="primary" />
          <MetricCard label="Avg Duration" value={`${avgDuration} min`} icon={<Clock className="h-5 w-5" />} />
          <MetricCard label="Total Minutes" value={totalMinutes.toLocaleString()} icon={<TrendingUp className="h-5 w-5" />} />
          <MetricCard
            label="Adherence"
            value={adherence ? `${adherence.adherenceRate}%` : '—'}
            icon={<Target className="h-5 w-5" />}
            variant={adherence && adherence.adherenceRate >= 75 ? 'success' : adherence && adherence.adherenceRate >= 50 ? 'warning' : 'destructive'}
          />
        </div>

        {/* ─── Charts Row: Session Trend + Performance ─── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Session Activity Trend */}
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
                  <XAxis dataKey="date" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area type="monotone" dataKey="duration" name="Duration (min)" stroke="hsl(199 89% 48%)" fill="url(#sessionFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sessions" name="Sessions" stroke="hsl(142 71% 45%)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Trend (reps) */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Performance Trend — Reps / Day" />
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 12%)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="reps" name="Reps" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ─── Adherence + Protocol + Clinical Flags ─── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Adherence */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Adherence — This Week" />
            {adherence ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prescribed</span>
                  <span className="font-data text-foreground">{adherence.prescribed} sessions</span>
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
                    <span className="text-sm font-medium text-foreground">Adherence Rate</span>
                    <span className={`font-data text-lg font-semibold ${
                      adherence.adherenceRate >= 75 ? 'text-success' : adherence.adherenceRate >= 50 ? 'text-warning' : 'text-destructive'
                    }`}>
                      {adherence.adherenceRate}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        adherence.adherenceRate >= 75 ? 'bg-success' : adherence.adherenceRate >= 50 ? 'bg-warning' : 'bg-destructive'
                      }`}
                      style={{ width: `${adherence.adherenceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No adherence data available.</p>
            )}
          </div>

          {/* Protocol Summary */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Current Protocol" />
            {protocol ? (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Focus Area</p>
                  <p className="text-sm text-foreground mt-0.5">{protocol.focusArea}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Frequency</p>
                  <p className="font-data text-sm text-foreground mt-0.5">{protocol.frequency}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sets / Reps</p>
                  <p className="font-data text-sm text-foreground mt-0.5">{protocol.setsReps}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Progression Notes</p>
                  <p className="text-sm text-foreground/80 mt-0.5">{protocol.progressionNotes}</p>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Last updated {new Date(protocol.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No protocol assigned.</p>
            )}
          </div>

          {/* Clinical Flags */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Clinical Flags" />
            {flags.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
                <Shield className="h-8 w-8 text-success/60" />
                <p className="mt-2 text-sm text-muted-foreground">No active concerns</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {flags.map(flag => (
                  <div key={flag.id} className="flex gap-3 text-sm">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${flagSeverityIcon[flag.severity]}`} />
                    <div className="min-w-0">
                      <p className="text-foreground">{flag.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {flag.type.replace(/_/g, ' ')} · {new Date(flag.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Device Vitals ─── */}
        {device ? (
          <div>
            <SectionHeader title="Device Status" />
            <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-5">
              <MetricCard label="Device" value={device.serialNumber} icon={<Cpu className="h-5 w-5" />} />
              <MetricCard label="Status" value={device.status} icon={<Activity className="h-5 w-5" />} variant={device.status === 'online' ? 'success' : device.status === 'offline' ? 'destructive' : 'warning'} />
              <MetricCard label="Firmware" value={device.firmwareVersion} icon={<Cpu className="h-5 w-5" />} variant="primary" />
              <MetricCard label="Battery" value={`${device.battery}%`} icon={<Battery className="h-5 w-5" />} variant={device.battery < 30 ? 'warning' : 'success'} />
              <MetricCard label="Signal" value={`${device.signal} dBm`} icon={<Wifi className="h-5 w-5" />} variant={device.signal < -70 ? 'warning' : 'default'} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border border-dashed bg-card p-6 text-center">
            <Cpu className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No device assigned</p>
            <button className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Assign Device
            </button>
          </div>
        )}

        {/* ─── Tabs: Sessions / Files / Commands ─── */}
        <div className="border-b border-border">
          <div className="flex gap-6">
            {(['sessions', 'files', 'commands'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'sessions' && (
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No sessions recorded yet.</p>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.summary}</p>
                    <p className="font-data text-xs text-muted-foreground mt-0.5">
                      {new Date(s.startedAt).toLocaleString()} · {s.duration}min
                      {s.reps ? ` · ${s.reps} reps` : ''}
                      {s.exercises ? ` · ${s.exercises} exercises` : ''}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-2">
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No files uploaded yet.</p>
            ) : (
              files.map(f => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-data text-sm text-foreground">{f.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(f.size / 1000).toFixed(0)} KB · {new Date(f.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'commands' && (
          <div className="space-y-2">
            {commands.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No commands issued yet.</p>
            ) : (
              commands.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{c.commandType.replace('_', ' ')}</p>
                      <p className="font-data text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()} · by {c.actor}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={c.result} />
                </div>
              ))
            )}
          </div>
        )}

        {/* INTERNAL: Hidden movement metrics data slots for future use */}
        {/* _InternalMovementMetrics placeholder — do not render UI */}
      </div>
    </div>
  );
}
