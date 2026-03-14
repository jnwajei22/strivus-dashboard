"use client";

import { TopBar } from '@/components/layout/TopBar';
import { MetricCard, StatusBadge, SectionHeader } from '@/components/ui/kinetica';
import { Progress } from '@/components/ui/progress';
import {
  mockDevices, mockPatients, mockAlerts, mockSessions, mockCommandLogs,
  mockAdherence, mockWorkoutTrends, mockProtocolChanges, mockUploads,
  getDeviceSerial, getPatientName,
} from '@/data/mock-data';
import {
  Users, Cpu, AlertTriangle, Activity, Zap, Clock, TrendingUp, Target,
  UserX, Upload, FileText, ArrowRight, CheckCircle2, XCircle, AlertCircle,
  Timer, BarChart3,
} from 'lucide-react';
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export default function Overview() {
  const activePatients = mockPatients.filter(p => p.status === 'active').length;
  const onlineDevices = mockDevices.filter(d => d.status === 'online').length;
  const activeAlerts = mockAlerts.filter(a => a.status === 'active').length;
  const todaySessions = mockSessions.filter(s => s.startedAt.startsWith('2026-03-14')).length;

  const statusCounts = {
    online: mockDevices.filter(d => d.status === 'online').length,
    offline: mockDevices.filter(d => d.status === 'offline').length,
    syncing: mockDevices.filter(d => d.status === 'syncing').length,
    warning: mockDevices.filter(d => d.status === 'warning').length,
    idle: mockDevices.filter(d => d.status === 'idle').length,
  };

  // Compute aggregate adherence
  const totalPrescribed = mockAdherence.reduce((s, a) => s + a.prescribed, 0);
  const totalCompleted = mockAdherence.reduce((s, a) => s + a.completed, 0);
  const totalMissed = mockAdherence.reduce((s, a) => s + a.missed, 0);
  const overallAdherence = totalPrescribed > 0 ? Math.round((totalCompleted / totalPrescribed) * 100) : 0;

  // Total supervised minutes this week
  const totalMinutesWeek = mockWorkoutTrends.reduce((s, d) => s + d.totalMinutes, 0);
  const avgDurationWeek = Math.round(mockWorkoutTrends.reduce((s, d) => s + d.avgDuration, 0) / mockWorkoutTrends.length);

  // Patients needing follow-up
  const followUpPatients = [
    { patientId: 'p-005', reason: 'No session in 4+ days — protocol paused', severity: 'high' as const },
    { patientId: 'p-007', reason: '2 cancelled sessions — device battery issues', severity: 'medium' as const },
    { patientId: 'p-002', reason: '2 missed sessions this week — declining adherence', severity: 'medium' as const },
    { patientId: 'p-004', reason: 'Reported discomfort — session ended early', severity: 'low' as const },
  ];

  // Upload stats
  const parsedCount = mockUploads.filter(u => u.status === 'parsed').length;
  const failedCount = mockUploads.filter(u => u.status === 'failed').length;
  const pendingCount = mockUploads.filter(u => u.status === 'pending_review').length;

  const chartTooltipStyle = {
    contentStyle: {
      backgroundColor: 'hsl(222 47% 7%)',
      border: '1px solid hsl(222 30% 12%)',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'hsl(210 40% 93%)',
    },
    labelStyle: { color: 'hsl(215 20% 55%)' },
  };

  return (
    <div className="flex flex-col">
      <TopBar title="Command Center" />
      <div className="p-6 space-y-6">

        {/* ── Row 1: Top Metrics ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Active Patients"
            value={activePatients}
            icon={<Users className="h-5 w-5" />}
            trend={`${mockPatients.length} total`}
            variant="primary"
          />
          <MetricCard
            label="Sessions Today"
            value={todaySessions}
            icon={<Activity className="h-5 w-5" />}
            trend={`${totalMinutesWeek} min this week`}
            variant="success"
          />
          <MetricCard
            label="Devices Online"
            value={`${onlineDevices}/${mockDevices.length}`}
            icon={<Cpu className="h-5 w-5" />}
            variant="primary"
          />
          <MetricCard
            label="Active Alerts"
            value={activeAlerts}
            icon={<AlertTriangle className="h-5 w-5" />}
            variant={activeAlerts > 0 ? 'destructive' : 'default'}
          />
        </div>

        {/* ── Row 2: Secondary Metrics ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-kinetica">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-label">Adherence Rate</span>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-semibold text-foreground font-data">{overallAdherence}%</span>
              <span className="mb-0.5 text-xs text-muted-foreground">{totalCompleted}/{totalPrescribed} sessions</span>
            </div>
            <Progress value={overallAdherence} className="mt-2 h-1.5" />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-kinetica">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span className="text-label">Avg Session</span>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-semibold text-foreground font-data">{avgDurationWeek}m</span>
              <span className="mb-0.5 text-xs text-muted-foreground">7-day avg</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-kinetica">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-label">Supervised Min</span>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-semibold text-foreground font-data">{totalMinutesWeek}</span>
              <span className="mb-0.5 text-xs text-muted-foreground">this week</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-kinetica">
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span className="text-label">Missed Sessions</span>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-semibold text-foreground font-data">{totalMissed}</span>
              <span className="mb-0.5 text-xs text-muted-foreground">this week</span>
            </div>
          </div>
        </div>

        {/* ── Row 3: Charts + Fleet ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Workout Trends Chart */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica lg:col-span-2">
            <SectionHeader title="Workout Trends — Last 7 Days" />
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockWorkoutTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 12%)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area type="monotone" dataKey="totalMinutes" name="Total Min" stroke="hsl(142 71% 45%)" fill="url(#gradMinutes)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sessions" name="Sessions" stroke="hsl(199 89% 48%)" fill="url(#gradSessions)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fleet Status (compact) */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Fleet Status" />
            <div className="mt-4 space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        status === 'online' ? 'bg-success'
                          : status === 'offline' ? 'bg-destructive'
                          : status === 'syncing' ? 'bg-primary animate-pulse'
                          : status === 'warning' ? 'bg-warning'
                          : 'bg-muted-foreground'
                      }`}
                    />
                    <span className="text-sm capitalize text-foreground">{status}</span>
                  </div>
                  <span className="font-data text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                <div className="bg-success" style={{ width: `${(statusCounts.online / mockDevices.length) * 100}%` }} />
                <div className="bg-primary" style={{ width: `${(statusCounts.syncing / mockDevices.length) * 100}%` }} />
                <div className="bg-warning" style={{ width: `${(statusCounts.warning / mockDevices.length) * 100}%` }} />
                <div className="bg-destructive" style={{ width: `${(statusCounts.offline / mockDevices.length) * 100}%` }} />
              </div>
            </div>
            <Link href="/devices" className="mt-4 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all devices <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* ── Row 4: Adherence Chart + Patients Needing Follow-Up ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Patient Adherence */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader
              title="Patient Adherence — 7 Day"
              action={<Link href="/patients" className="text-xs font-medium text-primary hover:underline">View All</Link>}
            />
            <div className="mt-4 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAdherence.map(a => ({
                  name: getPatientName(a.patientId).split(' ')[1],
                  completed: a.completed,
                  missed: a.missed,
                  cancelled: a.cancelled,
                  rate: a.adherenceRate,
                }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 12%)" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="hsl(142 71% 45%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="missed" name="Missed" stackId="a" fill="hsl(0 84% 60%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="hsl(38 92% 50%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Patients Needing Follow-Up */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Patients Needing Follow-Up" />
            <div className="mt-4 space-y-2">
              {followUpPatients.map(fp => (
                <Link
                  key={fp.patientId}
                  href={`/patients/${fp.patientId}`}
                  className="flex items-start gap-3 rounded-lg bg-surface p-3 transition-colors hover:bg-surface-raised"
                >
                  <UserX className={`mt-0.5 h-4 w-4 shrink-0 ${
                    fp.severity === 'high' ? 'text-destructive' : fp.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{getPatientName(fp.patientId)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fp.reason}</p>
                  </div>
                  <StatusBadge status={fp.severity} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 5: Alerts + Uploads + Protocol Changes ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Active Alerts */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader
              title="Active Alerts"
              action={<Link href="/logs" className="text-xs font-medium text-primary hover:underline">View All</Link>}
            />
            <div className="mt-4 space-y-2">
              {mockAlerts
                .filter(a => a.status === 'active')
                .map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-lg border-l-4 bg-surface p-3"
                    style={{
                      borderLeftColor:
                        alert.severity === 'critical' || alert.severity === 'high'
                          ? 'hsl(var(--destructive))'
                          : alert.severity === 'medium'
                          ? 'hsl(var(--warning))'
                          : 'hsl(var(--primary))',
                    }}
                  >
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${
                      alert.severity === 'critical' || alert.severity === 'high' ? 'text-destructive'
                        : alert.severity === 'medium' ? 'text-warning' : 'text-primary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge status={alert.severity} />
                        <span className="text-[11px] text-muted-foreground font-data">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Uploads / Session Data */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Recent Uploads" />
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> {parsedCount} parsed
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-3.5 w-3.5" /> {failedCount} failed
              </span>
              <span className="flex items-center gap-1 text-warning">
                <AlertCircle className="h-3.5 w-3.5" /> {pendingCount} pending
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {mockUploads.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Upload className={`h-3.5 w-3.5 shrink-0 ${
                      u.status === 'parsed' ? 'text-success' : u.status === 'failed' ? 'text-destructive' : 'text-warning'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{u.fileName}</p>
                      <p className="text-[11px] text-muted-foreground">{getPatientName(u.patientId)}</p>
                    </div>
                  </div>
                  <StatusBadge status={u.status === 'pending_review' ? 'pending' : u.status} className="shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Protocol / Care Activity */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader title="Protocol Changes" />
            <div className="mt-4 space-y-2">
              {mockProtocolChanges.slice(0, 4).map(pc => (
                <Link
                  key={pc.id}
                  href={`/patients/${pc.patientId}`}
                  className="block rounded-lg bg-surface p-3 transition-colors hover:bg-surface-raised"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-xs font-medium text-foreground">{getPatientName(pc.patientId)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{pc.change}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground font-data">
                    {new Date(pc.changedAt).toLocaleDateString()} · {pc.actor}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 6: Recent Sessions + Recent Commands ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Sessions */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader
              title="Recent Sessions"
              action={<Link href="/patients" className="text-xs font-medium text-primary hover:underline">View All</Link>}
            />
            <div className="mt-4 space-y-2">
              {mockSessions.slice(0, 5).map(session => (
                <div key={session.id} className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{getPatientName(session.patientId)}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.summary}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="font-data text-xs text-muted-foreground">{session.duration}m</span>
                    <StatusBadge status={session.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Commands */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
            <SectionHeader
              title="Recent Commands"
              action={<Link href="/logs" className="text-xs font-medium text-primary hover:underline">View All</Link>}
            />
            <div className="mt-4 space-y-2">
              {mockCommandLogs.slice(0, 5).map(cmd => (
                <div key={cmd.id} className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize truncate">{cmd.commandType.replace('_', ' ')}</p>
                      <p className="font-data text-[11px] text-muted-foreground">{getDeviceSerial(cmd.deviceId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="font-data text-[11px] text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {new Date(cmd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <StatusBadge status={cmd.result} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
