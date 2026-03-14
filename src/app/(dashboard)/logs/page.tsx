"use client";

import { useState } from 'react';
import  Link  from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge } from '@/components/ui/kinetica';
import { mockSystemLogs, currentUser, getPatientName, getDeviceSerial } from '@/data/mock-data';
import { Search, Plus, Filter, MessageSquare, Pencil, X, ChevronDown, ChevronRight, User2, Cpu, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { LogCategory, LogSeverity, LogStatus, SystemLog } from '@/types';

const categoryIcons: Record<LogCategory, string> = {
  system: '⚙️',
  alert: '🔔',
  command: '⚡',
  note: '📝',
  firmware: '📦',
  auth: '🔐',
  device: '📡',
  patient: '🩺',
  general: '📋',
};

const ALL_CATEGORIES: LogCategory[] = ['system', 'alert', 'command', 'note', 'firmware', 'auth', 'device', 'patient', 'general'];
const ALL_SEVERITIES: LogSeverity[] = ['info', 'warning', 'error', 'critical'];
const ALL_STATUSES: LogStatus[] = ['open', 'resolved', 'info', 'pending'];

const statusColors: Record<LogStatus, string> = {
  open: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  pending: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

// Mock patients/devices for linking dropdowns
const linkablePatients = [
  { id: 'p-001', label: 'James Morrison' },
  { id: 'p-002', label: 'Linda Vasquez' },
  { id: 'p-003', label: 'Robert Kim' },
  { id: 'p-004', label: 'Maria Santos' },
  { id: 'p-005', label: 'David Okonkwo' },
  { id: 'p-007', label: 'Thomas Brennan' },
  { id: 'p-008', label: 'Aisha Rahman' },
];
const linkableDevices = [
  { id: 'd-001', label: 'SW-8821-A' },
  { id: 'd-002', label: 'SW-8822-A' },
  { id: 'd-003', label: 'SW-8823-B' },
  { id: 'd-004', label: 'SW-8824-A' },
  { id: 'd-005', label: 'SW-8825-B' },
  { id: 'd-007', label: 'SW-8827-A' },
  { id: 'd-008', label: 'SW-8828-B' },
  { id: 'd-010', label: 'SW-8830-B' },
];

interface LogFormState {
  author: string;
  title: string;
  category: LogCategory;
  status: LogStatus;
  body: string;
  patientId: string;
  deviceId: string;
}

const emptyForm: LogFormState = {
  author: currentUser.name,
  title: '',
  category: 'note',
  status: 'info',
  body: '',
  patientId: '',
  deviceId: '',
};

export default function Logs() {
  const [logs, setLogs] = useState<SystemLog[]>([...mockSystemLogs]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<LogSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<LogStatus | 'all'>('all');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'reply'>('create');
  const [form, setForm] = useState<LogFormState>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

  // Thread expansion
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // Get top-level logs (no parentId)
  const topLevelLogs = logs.filter(l => !l.parentId);
  const getReplies = (parentId: string) => logs.filter(l => l.parentId === parentId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const filtered = topLevelLogs.filter(log => {
    const matchSearch =
      log.title.toLowerCase().includes(search.toLowerCase()) ||
      log.body.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchSearch && matchCategory && matchSeverity && matchStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openCreate = () => {
    setFormMode('create');
    setForm({ ...emptyForm });
    setEditingId(null);
    setReplyParentId(null);
    setShowForm(true);
  };

  const openEdit = (log: SystemLog) => {
    setFormMode('edit');
    setEditingId(log.id);
    setForm({
      author: log.actor,
      title: log.title,
      category: log.category,
      status: log.status,
      body: log.body,
      patientId: log.patientId || '',
      deviceId: log.deviceId || '',
    });
    setReplyParentId(null);
    setShowForm(true);
  };

  const openReply = (parentLog: SystemLog) => {
    setFormMode('reply');
    setReplyParentId(parentLog.id);
    setForm({
      ...emptyForm,
      title: `Re: ${parentLog.title}`,
      category: 'note',
      patientId: parentLog.patientId || '',
      deviceId: parentLog.deviceId || '',
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: 'Missing fields', description: 'Title and body are required.', variant: 'destructive' });
      return;
    }

    if (formMode === 'edit' && editingId) {
      setLogs(prev => prev.map(l => l.id === editingId ? {
        ...l,
        title: form.title,
        body: form.body,
        category: form.category,
        status: form.status,
        actor: form.author,
        patientId: form.patientId || undefined,
        deviceId: form.deviceId || undefined,
        updatedAt: new Date().toISOString(),
      } : l));
      toast({ title: 'Log updated', description: 'Entry has been saved.' });
    } else {
      const newLog: SystemLog = {
        id: `log-${Date.now()}`,
        category: form.category,
        severity: 'info',
        status: form.status,
        title: form.title,
        body: form.body,
        createdAt: new Date().toISOString(),
        actor: form.author,
        patientId: form.patientId || undefined,
        deviceId: form.deviceId || undefined,
        parentId: formMode === 'reply' && replyParentId ? replyParentId : undefined,
      };
      setLogs(prev => [...prev, newLog]);
      if (replyParentId) {
        setExpandedThreads(prev => new Set([...prev, replyParentId]));
      }
      toast({ title: formMode === 'reply' ? 'Reply added' : 'Log created', description: 'Entry saved successfully.' });
    }

    setShowForm(false);
    setForm({ ...emptyForm });
    setEditingId(null);
    setReplyParentId(null);
  };

  const toggleThread = (logId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      next.has(logId) ? next.delete(logId) : next.add(logId);
      return next;
    });
  };

  const renderEntityLinks = (log: SystemLog) => {
    const links = [];
    if (log.patientId) {
      links.push(
        <Link key="p" href={`/patients/${log.patientId}`} className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors">
          <User2 className="h-3 w-3" />
          {getPatientName(log.patientId)}
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      );
    }
    if (log.deviceId) {
      links.push(
        <Link key="d" href={`/devices/${log.deviceId}`} className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors">
          <Cpu className="h-3 w-3" />
          {getDeviceSerial(log.deviceId)}
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      );
    }
    return links.length > 0 ? <div className="flex items-center gap-3 mt-1.5">{links}</div> : null;
  };

  const renderLogEntry = (log: SystemLog, isReply = false) => (
    <div
      key={log.id}
      className={`rounded-xl border border-border bg-card shadow-kinetica ${isReply ? 'ml-10 border-l-2 border-l-primary/30' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg shrink-0">{categoryIcons[log.category]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-medium text-foreground">{log.title}</h3>
              <StatusBadge status={log.severity} />
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColors[log.status]}`}>
                {log.status}
              </span>
              <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                {log.category}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{log.body}</p>
            {renderEntityLinks(log)}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <span className="font-data text-[11px] text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </span>
              {log.updatedAt && (
                <span className="font-data text-[10px] text-muted-foreground/60 italic">
                  edited {new Date(log.updatedAt).toLocaleString()}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">by <span className="text-foreground/80 font-medium">{log.actor}</span></span>
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => openReply(log)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              title="Reply"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => openEdit(log)}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col">
      <TopBar title="Logs & Notes" />
      <div className="p-6 space-y-5">

        {/* Add / Edit Form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card shadow-kinetica p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {formMode === 'edit' ? 'Edit Log Entry' : formMode === 'reply' ? 'Reply to Entry' : 'Add New Log / Note'}
              </h2>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Author */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Author</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as LogCategory }))}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ALL_CATEGORIES.map(c => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as LogStatus }))}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>
              {/* Linked Patient */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Linked Patient <span className="text-muted-foreground/50">(optional)</span></label>
                <select
                  value={form.patientId}
                  onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">None</option>
                  {linkablePatients.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Linked Device */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Linked Device <span className="text-muted-foreground/50">(optional)</span></label>
                <select
                  value={form.deviceId}
                  onChange={e => setForm(f => ({ ...f, deviceId: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">None</option>
                  {linkableDevices.map(d => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Log entry title..."
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Note / Body</label>
              <textarea
                rows={3}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Describe the observation, note, or issue..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[80px]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {formMode === 'edit' ? 'Save Changes' : formMode === 'reply' ? 'Post Reply' : 'Save Log'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border bg-surface px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <span className="ml-auto text-[11px] text-muted-foreground">
                Timestamp will be auto-generated
              </span>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs, notes, actors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Note
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mr-1">Type</span>
            {(['all', ...ALL_CATEGORIES] as const).map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  categoryFilter === c
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mr-1">Severity</span>
            {(['all', ...ALL_SEVERITIES] as const).map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  severityFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mr-1">Status</span>
            {(['all', ...ALL_STATUSES] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Log List */}
        <div className="space-y-2">
          {filtered.map(log => {
            const replies = getReplies(log.id);
            const hasReplies = replies.length > 0;
            const isExpanded = expandedThreads.has(log.id);

            return (
              <div key={log.id} className="space-y-1">
                {renderLogEntry(log)}
                {hasReplies && (
                  <button
                    onClick={() => toggleThread(log.id)}
                    className="ml-10 flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors py-1"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                )}
                {hasReplies && isExpanded && (
                  <div className="space-y-1">
                    {replies.map(reply => renderLogEntry(reply, true))}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No logs matching filters.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {topLevelLogs.length} entries · {logs.filter(l => l.parentId).length} replies
          </p>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" disabled>
              Previous
            </button>
            <span className="font-data text-xs text-foreground">1</span>
            <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
