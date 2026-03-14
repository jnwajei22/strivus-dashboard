import { useState, useEffect } from 'react';
import { useParams, useRouter } from "next/navigation";
import  Link  from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { mockDevices, mockPatients, mockFirmwareVersions } from '@/data/mock-data';
import { ArrowLeft, Save, X, Cpu, Users, Settings2, Info } from 'lucide-react';
import type { DeploymentGroup, DeviceStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/kinetica';

const EMPTY_FORM = {
  id: '',
  serialNumber: '',
  model: 'SmartWeight Pro',
  hardwareRevision: '',
  displayName: '',
  patientId: '',
  firmwareVersion: '',
  deploymentGroup: 'production' as DeploymentGroup,
  notes: '',
};

export default function DeviceForm() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined
  const router = useRouter();
  const isEdit = !!id;
  const existing = isEdit ? mockDevices.find(d => d.id === id) : null;

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (existing) {
      setForm({
        id: existing.id,
        serialNumber: existing.serialNumber,
        model: existing.model,
        hardwareRevision: '',
        displayName: '',
        patientId: existing.patientId || '',
        firmwareVersion: existing.firmwareVersion,
        deploymentGroup: 'production',
        notes: '',
      });
    }
  }, [existing]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serialNumber.trim() || !form.model.trim()) {
      toast({ title: 'Missing required fields', description: 'Serial number and model are required.', variant: 'destructive' });
      return;
    }
    toast({
      title: isEdit ? 'Device Updated' : 'Device Registered',
      description: `${form.serialNumber} has been ${isEdit ? 'updated' : 'registered'} successfully.`,
    });
    router.push("/devices");
  };

  const inputClasses = 'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClasses = 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';
  const selectClasses = 'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none';
  const readonlyClasses = 'h-10 flex items-center rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground font-data';

  const availablePatients = mockPatients.filter(p => p.status !== 'discharged');
  const activeFirmware = mockFirmwareVersions.filter(f => f.status === 'active' || f.status === 'staged');

  return (
    <div className="flex flex-col">
      <TopBar title={isEdit ? 'Edit Device' : 'Register Device'} />
      <div className="p-6 space-y-6 max-w-3xl">
        <Link href="/devices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Devices
        </Link>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ─── Section: Device Identity ─── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Device Identity</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClasses}>Serial Number *</label>
                <input className={inputClasses} value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="e.g. SW-8829-A" required />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Model / Device Type *</label>
                <select className={selectClasses} value={form.model} onChange={e => set('model', e.target.value)}>
                  <option value="SmartWeight Pro">SmartWeight Pro</option>
                  <option value="SmartWeight Lite">SmartWeight Lite</option>
                  <option value="SmartWeight Mini">SmartWeight Mini</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Device ID</label>
                {isEdit ? (
                  <div className={readonlyClasses}>{form.id}</div>
                ) : (
                  <input className={inputClasses} value={form.id} onChange={e => set('id', e.target.value)} placeholder="Auto-generated if blank" />
                )}
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Hardware Revision</label>
                <input className={inputClasses} value={form.hardwareRevision} onChange={e => set('hardwareRevision', e.target.value)} placeholder="e.g. Rev C" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className={labelClasses}>Display Name (Optional)</label>
                <input className={inputClasses} value={form.displayName} onChange={e => set('displayName', e.target.value)} placeholder="Friendly name for quick identification" />
              </div>
            </div>
          </div>

          {/* ─── Section: Patient Assignment ─── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Patient Assignment</h3>
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Assigned Patient</label>
              <select className={selectClasses} value={form.patientId} onChange={e => set('patientId', e.target.value)}>
                <option value="">Unassigned</option>
                {availablePatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Leave unassigned if this device is not yet paired with a patient.
              </p>
            </div>
          </div>

          {/* ─── Section: Software / Deployment ─── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Software &amp; Deployment</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClasses}>Firmware Version</label>
                <select className={selectClasses} value={form.firmwareVersion} onChange={e => set('firmwareVersion', e.target.value)}>
                  <option value="">Select version</option>
                  {activeFirmware.map(f => (
                    <option key={f.id} value={f.version}>
                      {f.version} ({f.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Deployment Group</label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Determines the software update track for this device.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['production', 'qa', 'test'] as DeploymentGroup[]).map(group => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => set('deploymentGroup', group)}
                    className={`rounded-lg border px-4 py-3 text-left transition-all ${
                      form.deploymentGroup === group
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <p className={`text-sm font-semibold uppercase tracking-wide ${
                      form.deploymentGroup === group ? 'text-primary' : 'text-foreground'
                    }`}>{group}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {group === 'production' && 'Stable release track'}
                      {group === 'qa' && 'QA / staging builds'}
                      {group === 'test' && 'Internal test builds'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Section: Device Status (Edit only) ─── */}
          {isEdit && existing && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Device Status</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <label className={labelClasses}>Status</label>
                  <div className="h-10 flex items-center">
                    <StatusBadge status={existing.status} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Battery</label>
                  <div className={readonlyClasses}>{existing.battery}%</div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Signal Strength</label>
                  <div className={readonlyClasses}>{existing.signal} dBm</div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Last Contact</label>
                  <div className={readonlyClasses}>{new Date(existing.lastContact).toLocaleString()}</div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Last Sync</label>
                  <div className={readonlyClasses}>{new Date(existing.lastSync).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Notes ─── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Notes</h3>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Device notes, location, special configuration..."
            />
          </div>

          {/* ─── Actions ─── */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Save className="h-4 w-4" />
              {isEdit ? 'Save Changes' : 'Register Device'}
            </button>
            <button
              type="button"
              onClick={() => router.push("/devices")}
              className="flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
