"use client";

import { useParams } from "next/navigation";
import  Link  from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, MetricCard } from '@/components/ui/kinetica';
import { mockDevices, mockCommandLogs, mockPatients } from '@/data/mock-data';
import {
  ArrowLeft, Battery, Wifi, Clock, Cpu, RefreshCw, Terminal,
  RotateCcw, Network, FileText, Play, Upload, Zap
} from 'lucide-react';
import { useState } from 'react';

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const device = mockDevices.find(d => d.id === id);
  const patient = device?.patientId ? mockPatients.find(p => p.id === device.patientId) : null;
  const commands = mockCommandLogs.filter(c => c.deviceId === id);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  if (!device) {
    return (
      <div className="flex flex-col">
        <TopBar title="Device Not Found" />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Device not found.</p>
        </div>
      </div>
    );
  }

  const actions = [
    { label: 'Sync Now', icon: RefreshCw, command: 'sync', risk: 'low' as const },
    { label: 'Network Check', icon: Network, command: 'network_check', risk: 'low' as const },
    { label: 'Start Workout', icon: Play, command: 'start_workout', risk: 'low' as const },
    { label: 'Request Logs', icon: FileText, command: 'request_logs', risk: 'low' as const },
    { label: 'Send Command', icon: Terminal, command: 'send_command', risk: 'low' as const },
    { label: 'Reboot Device', icon: RotateCcw, command: 'reboot', risk: 'high' as const },
    { label: 'Update Firmware', icon: Upload, command: 'update_firmware', risk: 'high' as const },
    { label: 'Rollback Firmware', icon: RotateCcw, command: 'rollback_firmware', risk: 'high' as const },
  ];

  const handleAction = (command: string, risk: string) => {
    if (risk === 'high' && confirmAction !== command) {
      setConfirmAction(command);
      return;
    }
    setConfirmAction(null);
    // Would send MQTT command here
  };

  return (
    <div className="flex flex-col">
      <TopBar title={device.serialNumber} />
      <div className="p-6 space-y-6">
        <Link href="/devices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Devices
        </Link>

        {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
          <div>

            <div className="flex items-center gap-3">
              <h2 className="font-data text-2xl font-semibold tracking-tight text-foreground">{device.serialNumber}</h2>
              <StatusBadge status={device.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{device.model}</p>
            {patient && (
              <p className="mt-1 text-sm">
                Assigned to{' '}
                <Link href={`/patients/${patient.id}`} className="text-primary hover:underline">
                  {patient.firstName} {patient.lastName}
                </Link>
              </p>
            )}
          </div>
          <Link
            href={`/devices/${device.id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <Cpu className="h-4 w-4" /> Edit Device
          </Link>
        </div>

        {/* Vitals */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Last Sync" value={new Date(device.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} icon={<Clock className="h-5 w-5" />} />
          <MetricCard label="Firmware" value={device.firmwareVersion} icon={<Cpu className="h-5 w-5" />} variant="primary" />
          <MetricCard label="Battery" value={`${device.battery}%`} icon={<Battery className="h-5 w-5" />} variant={device.battery < 30 ? 'warning' : 'success'} />
          <MetricCard label="Signal" value={`${device.signal} dBm`} icon={<Wifi className="h-5 w-5" />} variant={device.signal < -70 ? 'warning' : 'default'} />
        </div>

        {/* Remote Actions */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
          <h3 className="text-sm font-semibold text-foreground mb-4">Remote Actions</h3>
          <div className="flex flex-wrap gap-2">
            {actions.map(action => (
              <button
                key={action.command}
                onClick={() => handleAction(action.command, action.risk)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-95 ${
                  confirmAction === action.command
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : action.risk === 'high'
                    ? 'border-border bg-surface-raised text-foreground hover:border-warning/50'
                    : 'border-border bg-surface-raised text-foreground hover:border-primary/50'
                }`}
              >
                <action.icon className="h-4 w-4" />
                {confirmAction === action.command ? `Confirm ${action.label}?` : action.label}
              </button>
            ))}
          </div>
          {confirmAction && (
            <p className="mt-3 text-xs text-destructive">
              Click again to confirm this action. This may disrupt the device or patient session.
            </p>
          )}
        </div>

        {/* Command History */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-kinetica">
          <h3 className="text-sm font-semibold text-foreground mb-4">Command History</h3>
          <div className="space-y-2">
            {commands.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No commands recorded.</p>
            ) : (
              commands.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{c.commandType.replace('_', ' ')}</p>
                      <p className="font-data text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()} · {c.actor}</p>
                    </div>
                  </div>
                  <StatusBadge status={c.result} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
