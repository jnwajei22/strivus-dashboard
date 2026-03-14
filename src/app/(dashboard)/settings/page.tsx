"use client";

import { TopBar } from '@/components/layout/TopBar';
import { currentUser } from '@/data/mock-data';
import { User, Bell, Shield, Sliders, Link2, Monitor, LogOut, Plus, Pencil, ChevronDown, Check, X, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import type { UserRole } from '@/types';

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'access', label: 'Access Control', icon: Shield },
  { id: 'system', label: 'System', icon: Sliders },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'session', label: 'Session', icon: Monitor },
] as const;

type SettingsSection = typeof settingsSections[number]['id'];

// Role definitions
const roleDefinitions: { role: UserRole; label: string; description: string; patients: string; devices: string; firmware: string; settings: string; logs: string }[] = [
  { role: 'super_admin', label: 'Super Admin', description: 'Full platform access. Can manage users, devices, firmware, and all settings.', patients: 'Full', devices: 'Full', firmware: 'Full', settings: 'Full', logs: 'Full' },
  { role: 'clinician', label: 'Clinician / Provider', description: 'Manages patients and exercises. Can view devices and trigger actions. Read-only firmware.', patients: 'Full', devices: 'Read + Actions', firmware: 'Read', settings: 'Profile Only', logs: 'Read + Create' },
  { role: 'operations', label: 'Operations / Support', description: 'Manages devices, firmware deployments, and system configuration. Read-only patients.', patients: 'Read', devices: 'Full', firmware: 'Full', settings: 'System', logs: 'Full' },
  { role: 'viewer', label: 'Viewer / Read-only', description: 'Can view all data but cannot make changes. Suitable for auditing or observation.', patients: 'Read', devices: 'Read', firmware: 'Read', settings: 'Profile Only', logs: 'Read' },
];

// Mock team users
interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastActive: string;
  status: 'active' | 'invited' | 'disabled';
}

const initialTeamUsers: TeamUser[] = [
  { id: 'u-001', name: 'Dr. Sarah Chen', email: 'sarah.chen@strivus.com', role: 'super_admin', lastActive: '2026-03-14T08:30:00Z', status: 'active' },
  { id: 'u-002', name: 'Marcus Rivera', email: 'marcus.r@strivus.com', role: 'operations', lastActive: '2026-03-14T07:15:00Z', status: 'active' },
  { id: 'u-003', name: 'Dr. Emily Thornton', email: 'emily.t@peakpt.com', role: 'clinician', lastActive: '2026-03-13T16:00:00Z', status: 'active' },
  { id: 'u-004', name: 'James Park', email: 'james.p@strivus.com', role: 'viewer', lastActive: '2026-03-12T10:00:00Z', status: 'active' },
  { id: 'u-005', name: 'Pending Invite', email: 'ops2@strivus.com', role: 'operations', lastActive: '', status: 'invited' },
];

// Integration data
interface Integration {
  name: string;
  description: string;
  status: 'connected' | 'configured' | 'disconnected' | 'error';
  lastCheck: string;
  endpoint?: string;
}

const initialIntegrations: Integration[] = [
  { name: 'MQTT Broker', description: 'Device communication layer — real-time telemetry and command dispatch', status: 'connected', lastCheck: '2026-03-14T08:28:00Z', endpoint: 'mqtts://broker.strivus.com:8883' },
  { name: 'Cloud Storage', description: 'Firmware binaries, CSV session data, and file uploads', status: 'connected', lastCheck: '2026-03-14T08:20:00Z', endpoint: 's3://strivus-data-prod' },
  { name: 'Email Service', description: 'Passwordless authentication codes and notification delivery', status: 'configured', lastCheck: '2026-03-14T06:00:00Z', endpoint: 'ses://us-east-1' },
  { name: 'EHR Integration', description: 'Electronic health records sync — HL7 / FHIR bridge', status: 'disconnected', lastCheck: '' },
  { name: 'Analytics Pipeline', description: 'Aggregated session and movement data for reporting', status: 'configured', lastCheck: '2026-03-14T04:00:00Z', endpoint: 'https://analytics.strivus.com/ingest' },
];

const statusDot: Record<string, string> = {
  connected: 'bg-emerald-400',
  configured: 'bg-primary',
  disconnected: 'bg-muted-foreground/40',
  error: 'bg-destructive',
  active: 'bg-emerald-400',
  invited: 'bg-amber-400',
  disabled: 'bg-muted-foreground/40',
};

// Notification config
interface NotifChannel {
  label: string;
  items: { label: string; email: boolean; push: boolean; inApp: boolean }[];
}

const initialNotifChannels: NotifChannel[] = [
  {
    label: 'Device Alerts',
    items: [
      { label: 'Device offline', email: true, push: true, inApp: true },
      { label: 'Low battery warning', email: false, push: true, inApp: true },
      { label: 'Command timeout', email: false, push: false, inApp: true },
    ],
  },
  {
    label: 'Firmware & Deployments',
    items: [
      { label: 'Firmware update available', email: true, push: false, inApp: true },
      { label: 'Deployment completed', email: false, push: false, inApp: true },
      { label: 'Deployment failed', email: true, push: true, inApp: true },
    ],
  },
  {
    label: 'Clinical & Sessions',
    items: [
      { label: 'Session completion', email: false, push: false, inApp: true },
      { label: 'Missed session alert', email: true, push: true, inApp: true },
      { label: 'Discomfort report', email: true, push: true, inApp: true },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'System errors', email: true, push: true, inApp: true },
      { label: 'Auth events', email: false, push: false, inApp: true },
    ],
  },
];



export default function SettingsPage() {
  const router = useRouter();
  const [active, setActive] = useState<SettingsSection>('profile');
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>(initialTeamUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [notifChannels, setNotifChannels] = useState(initialNotifChannels);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setTeamUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setEditingUserId(null);
    toast({ title: 'Role updated', description: `User role changed to ${newRole.replace('_', ' ')}.` });
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    const newUser: TeamUser = {
      id: `u-${Date.now()}`,
      name: 'Pending Invite',
      email: inviteEmail,
      role: inviteRole,
      lastActive: '',
      status: 'invited',
    };
    setTeamUsers(prev => [...prev, newUser]);
    setInviteEmail('');
    setShowInvite(false);
    toast({ title: 'Invitation sent', description: `Invite sent to ${inviteEmail}.` });
  };

  const toggleNotif = (channelIdx: number, itemIdx: number, field: 'email' | 'push' | 'inApp') => {
    setNotifChannels(prev => prev.map((ch, ci) => ci === channelIdx ? {
      ...ch,
      items: ch.items.map((it, ii) => ii === itemIdx ? { ...it, [field]: !it[field] } : it),
    } : ch));
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth');
    sessionStorage.removeItem('auth');

    toast({
      title: 'Signed out',
      description: 'Your session has ended.',
    });

    router.push('/auth/login');
  };

  const inputClass = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
  const labelClass = "text-label text-[11px] mb-1.5 block";

  return (
    <div className="flex flex-col">
      <TopBar title="Settings" />
      <div className="flex flex-1">
        {/* Settings Nav */}
        <div className="w-56 shrink-0 border-r border-border bg-card p-4 space-y-1">
          {settingsSections.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active === s.id
                ? 'bg-surface-raised text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">

          {/* ===== PROFILE ===== */}
          {active === 'profile' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Profile</h3>
                <p className="text-sm text-muted-foreground">Manage your account information.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Name</label>
                  <input type="text" defaultValue={currentUser.name} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" defaultValue={currentUser.email} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  <div className="h-10 flex items-center rounded-lg border border-border bg-surface px-3 text-sm text-muted-foreground capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {active === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">Configure alert delivery by channel and severity.</p>
              </div>

              {/* Channel headers */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-4 py-2.5 border-b border-border">
                  <span className="text-label text-[11px]">Alert</span>
                  <span className="text-label text-[11px] text-center">Email</span>
                  <span className="text-label text-[11px] text-center">Push</span>
                  <span className="text-label text-[11px] text-center">In-App</span>
                </div>
                {notifChannels.map((channel, ci) => (
                  <div key={channel.label}>
                    <div className="px-4 py-2 bg-surface/50 border-b border-border">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{channel.label}</span>
                    </div>
                    {channel.items.map((item, ii) => (
                      <div key={item.label} className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-4 py-2.5 border-b border-border last:border-0 items-center">
                        <span className="text-sm text-foreground">{item.label}</span>
                        {(['email', 'push', 'inApp'] as const).map(field => (
                          <div key={field} className="flex justify-center">
                            <button
                              onClick={() => toggleNotif(ci, ii, field)}
                              className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${item[field]
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-border bg-background text-transparent hover:border-muted-foreground'
                                }`}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <button
                onClick={() => toast({ title: 'Preferences saved', description: 'Notification settings updated.' })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* ===== ACCESS CONTROL ===== */}
          {active === 'access' && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Access Control</h3>
                <p className="text-sm text-muted-foreground">Manage team members, roles, and permissions.</p>
              </div>

              {/* Team Users */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Team Members</h4>
                  <button
                    onClick={() => setShowInvite(!showInvite)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Invite User
                  </button>
                </div>

                {/* Invite form */}
                {showInvite && (
                  <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
                    <p className="text-xs font-semibold text-foreground">Send Invitation</p>
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-1.5">
                        <label className={labelClass}>Email Address</label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="user@example.com"
                          className={inputClass}
                        />
                      </div>
                      <div className="w-44 space-y-1.5">
                        <label className={labelClass}>Role</label>
                        <select
                          value={inviteRole}
                          onChange={e => setInviteRole(e.target.value as UserRole)}
                          className={inputClass}
                        >
                          {roleDefinitions.map(r => (
                            <option key={r.role} value={r.role}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={handleInvite} className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                        Send
                      </button>
                      <button onClick={() => setShowInvite(false)} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Users list */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="grid grid-cols-[1fr_1fr_140px_120px_80px] gap-2 px-4 py-2.5 border-b border-border">
                    <span className="text-label text-[11px]">Name</span>
                    <span className="text-label text-[11px]">Email</span>
                    <span className="text-label text-[11px]">Role</span>
                    <span className="text-label text-[11px]">Last Active</span>
                    <span className="text-label text-[11px]">Status</span>
                  </div>
                  {teamUsers.map(user => (
                    <div key={user.id} className="grid grid-cols-[1fr_1fr_140px_120px_80px] gap-2 px-4 py-3 border-b border-border last:border-0 items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-surface flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                      <div className="relative">
                        {editingUserId === user.id ? (
                          <select
                            value={user.role}
                            onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                            onBlur={() => setEditingUserId(null)}
                            autoFocus
                            className="h-8 w-full rounded-md border border-primary bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {roleDefinitions.map(r => (
                              <option key={r.role} value={r.role}>{r.label}</option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingUserId(user.id)}
                            className="flex items-center gap-1 text-xs text-foreground hover:text-primary transition-colors capitalize"
                          >
                            {user.role.replace('_', ' ')}
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <span className="font-data text-[11px] text-muted-foreground">
                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : '—'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusDot[user.status]}`} />
                        <span className="text-[11px] capitalize text-muted-foreground">{user.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permission Matrix */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Role Permissions Matrix</h4>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-label px-4 py-3 text-left w-48">Role</th>
                        <th className="text-label px-4 py-3 text-left">Patients</th>
                        <th className="text-label px-4 py-3 text-left">Devices</th>
                        <th className="text-label px-4 py-3 text-left">Firmware</th>
                        <th className="text-label px-4 py-3 text-left">Settings</th>
                        <th className="text-label px-4 py-3 text-left">Logs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleDefinitions.map(r => (
                        <tr key={r.role} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{r.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{r.description}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{r.patients}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.devices}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.firmware}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.settings}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.logs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== SYSTEM ===== */}
          {active === 'system' && (
            <div className="max-w-2xl space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground">System Settings</h3>
                <p className="text-sm text-muted-foreground">Platform configuration and operational defaults.</p>
              </div>

              {/* Communication */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Communication</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>MQTT Broker URL</label>
                    <input type="text" defaultValue="mqtts://broker.strivus.com:8883" className={`${inputClass} font-data`} />
                  </div>
                  <div>
                    <label className={labelClass}>Command Timeout (seconds)</label>
                    <input type="text" defaultValue="30" className={`${inputClass} font-data`} />
                    <p className="mt-1 text-xs text-muted-foreground">Time to wait for device ACK</p>
                  </div>
                  <div>
                    <label className={labelClass}>Default Sync Interval (seconds)</label>
                    <input type="text" defaultValue="300" className={`${inputClass} font-data`} />
                  </div>
                  <div>
                    <label className={labelClass}>Telemetry Publish Rate (seconds)</label>
                    <input type="text" defaultValue="60" className={`${inputClass} font-data`} />
                  </div>
                </div>
              </div>

              {/* Deployment Defaults */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deployment Defaults</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Default Deployment Group</label>
                    <select defaultValue="production" className={inputClass}>
                      <option value="production">Production</option>
                      <option value="qa">QA</option>
                      <option value="test">Test</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Rollout Strategy</label>
                    <select defaultValue="staged" className={inputClass}>
                      <option value="immediate">Immediate — all devices at once</option>
                      <option value="staged">Staged — phased rollout</option>
                      <option value="manual">Manual — device-by-device</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Auto-retry Failed Deployments</label>
                    <select defaultValue="1" className={inputClass}>
                      <option value="0">Disabled</option>
                      <option value="1">1 retry</option>
                      <option value="3">3 retries</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data & Logging */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data & Logging</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Log Retention Period</label>
                    <select defaultValue="90" className={inputClass}>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>CSV Upload Max Size (MB)</label>
                    <input type="text" defaultValue="50" className={`${inputClass} font-data`} />
                  </div>
                  <div>
                    <label className={labelClass}>Session Data Export Format</label>
                    <select defaultValue="csv" className={inputClass}>
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                      <option value="both">CSV + JSON</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toast({ title: 'Configuration saved', description: 'System settings updated.' })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          )}

          {/* ===== INTEGRATIONS ===== */}
          {active === 'integrations' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Integrations</h3>
                <p className="text-sm text-muted-foreground">Manage service connections and external system bridges.</p>
              </div>
              <div className="space-y-3">
                {initialIntegrations.map(integration => (
                  <div key={integration.name} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${statusDot[integration.status]}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{integration.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                          {integration.endpoint && (
                            <p className="font-data text-[11px] text-muted-foreground/60 mt-1">{integration.endpoint}</p>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${integration.status === 'connected'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : integration.status === 'configured'
                          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                          : integration.status === 'error'
                            ? 'bg-destructive/15 text-destructive border-destructive/30'
                            : 'bg-surface text-muted-foreground border-border'
                        }`}>
                        {integration.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2.5">
                      <span className="font-data text-[11px] text-muted-foreground">
                        {integration.lastCheck ? `Last checked ${new Date(integration.lastCheck).toLocaleString()}` : 'Never checked'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toast({ title: 'Connection test', description: `Testing ${integration.name}...` })}
                          className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" /> Test
                        </button>
                        <button
                          onClick={() => toast({ title: 'Configure', description: `Opening ${integration.name} settings...` })}
                          className="flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Sliders className="h-3 w-3" /> Configure
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SESSION ===== */}
          {active === 'session' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Session</h3>
                <p className="text-sm text-muted-foreground">Current session information.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Logged in as</span>
                  <span className="text-sm font-medium text-foreground">{currentUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last login</span>
                  <span className="font-data text-sm text-foreground">{new Date(currentUser.lastLogin).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Session expires</span>
                  <span className="font-data text-sm text-foreground">2 weeks from login</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Auth method</span>
                  <span className="text-sm text-foreground">Passwordless email</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
