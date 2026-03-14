"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from "next/navigation";
import  Link  from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { mockPatients } from '@/data/mock-data';
import { ArrowLeft, Save, X } from 'lucide-react';
import type { Patient, DeploymentGroup } from '@/types';
import { toast } from '@/hooks/use-toast';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  dob: '',
  sex: 'M' as Patient['sex'],
  height: '',
  weight: '',
  email: '',
  phone: '',
  medicareId: '',
  providerFacility: '',
  deploymentGroup: 'production' as DeploymentGroup,
  notes: '',
};

export default function PatientForm() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined
  const router = useRouter();
  const isEdit = !!id;
  const existing = isEdit ? mockPatients.find(p => p.id === id) : null;

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (existing) {
      setForm({
        firstName: existing.firstName,
        lastName: existing.lastName,
        dob: existing.dob,
        sex: existing.sex,
        height: existing.height || '',
        weight: existing.weight || '',
        email: existing.email,
        phone: existing.phone,
        medicareId: existing.medicareId || '',
        providerFacility: existing.providerFacility || '',
        deploymentGroup: existing.deploymentGroup || 'production',
        notes: existing.notes,
      });
    }
  }, [existing]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return `${Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))} yrs`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dob || !form.email.trim()) {
      toast({ title: 'Missing required fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    toast({
      title: isEdit ? 'Patient Updated' : 'Patient Created',
      description: `${form.firstName} ${form.lastName} has been ${isEdit ? 'updated' : 'created'} successfully.`,
    });
    router.push("/patients");
  };

  const inputClasses = 'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  const labelClasses = 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';
  const selectClasses = 'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none';

  return (
    <div className="flex flex-col">
      <TopBar title={isEdit ? 'Edit Patient' : 'Create Patient'} />
      <div className="p-6 space-y-6 max-w-3xl">
        <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Patients
        </Link>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ─── Section: Personal Information ─── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Personal Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClasses}>First Name *</label>
                <input className={inputClasses} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" required />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Last Name *</label>
                <input className={inputClasses} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" required />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Date of Birth *</label>
                <input type="date" className={inputClasses} value={form.dob} onChange={e => set('dob', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Age</label>
                <div className="h-10 flex items-center rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground font-data">
                  {calculateAge(form.dob) || '—'}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Sex *</label>
                <select className={selectClasses} value={form.sex} onChange={e => set('sex', e.target.value)}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Height</label>
                <input className={inputClasses} value={form.height} onChange={e => set('height', e.target.value)} placeholder={"e.g. 5'10\""} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Weight</label>
                <input className={inputClasses} value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="e.g. 175 lbs" />
              </div>
            </div>
          </div>

          {/* ─── Section: Contact Information ─── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Contact Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClasses}>Email Address *</label>
                <input type="email" className={inputClasses} value={form.email} onChange={e => set('email', e.target.value)} placeholder="patient@email.com" required />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Phone Number</label>
                <input className={inputClasses} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Medicare ID</label>
                <input className={inputClasses} value={form.medicareId} onChange={e => set('medicareId', e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Provider / Facility</label>
                <input className={inputClasses} value={form.providerFacility} onChange={e => set('providerFacility', e.target.value)} placeholder="Clinic, rehab center, or provider name" />
              </div>
            </div>
          </div>

          {/* ─── Section: Deployment / Software Group ─── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Deployment Group</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Determines the software update track for this patient's assigned device.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
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

          {/* ─── Notes ─── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-kinetica space-y-5">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Clinical Notes</h3>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              rows={4}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Diagnosis, rehab goals, special considerations..."
            />
          </div>

          {/* ─── Actions ─── */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Save className="h-4 w-4" />
              {isEdit ? 'Save Changes' : 'Create Patient'}
            </button>
            <button
              type="button"
              onClick={() => router.push("/patients")}
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
