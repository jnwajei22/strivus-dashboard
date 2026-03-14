"use client";

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge } from '@/components/ui/kinetica';
import { mockPatients, mockDevices } from '@/data/mock-data';
import { Search, Plus, ChevronRight, Pencil } from 'lucide-react';
import  Link  from 'next/link';
import type { PatientStatus } from '@/types';

export default function Patients() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');

  const filtered = mockPatients.filter(p => {
    const matchSearch =
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getDevice = (deviceId?: string) => mockDevices.find(d => d.id === deviceId);

  return (
    <div className="flex flex-col">
      <TopBar title="Patients" />
      <div className="p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(['all', 'active', 'inactive', 'discharged'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Link
            href="/patients/new"
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Patient
          </Link>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-kinetica overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-label px-4 py-3 text-left">Patient</th>
                <th className="text-label px-4 py-3 text-left">Status</th>
                <th className="text-label px-4 py-3 text-left hidden md:table-cell">Device</th>
                <th className="text-label px-4 py-3 text-left hidden lg:table-cell">Last Activity</th>
                <th className="text-label px-4 py-3 text-left hidden lg:table-cell">Enrolled</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(patient => {
                const device = getDevice(patient.deviceId);
                return (
                  <tr
                    key={patient.id}
                    className="border-b border-border last:border-0 hover:bg-surface transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/patients/${patient.id}`} className="group">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{patient.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={patient.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {device ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              device.status === 'online'
                                ? 'bg-success'
                                : device.status === 'offline'
                                ? 'bg-destructive'
                                : 'bg-warning'
                            }`}
                          />
                          <span className="font-data text-xs text-muted-foreground">
                            {device.serialNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-data text-xs text-muted-foreground">
                        {device?.lastSync
                          ? new Date(device.lastSync).toLocaleDateString()
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-data text-xs text-muted-foreground">
                        {new Date(patient.enrolledAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/patients/${patient.id}/edit`} className="text-muted-foreground hover:text-foreground" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <Link href={`/patients/${patient.id}`}>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
