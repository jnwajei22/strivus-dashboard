"use client";

import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, MetricCard, SectionHeader } from '@/components/ui/kinetica';
import { mockFirmwareVersions, mockDeployments, mockDevices, getDeviceSerial } from '@/data/mock-data';
import { Package, Upload, Cpu, RotateCcw, Send, Server, CheckCircle2, AlertTriangle, Clock, ChevronDown, FileUp, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { DeploymentGroup } from '@/types';

type DeploymentGroupOption = DeploymentGroup | 'all';

export default function Firmware() {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<DeploymentGroupOption>('production');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    version: '',
    updateType: 'minor' as 'major' | 'minor' | 'patch' | 'hotfix',
    targetGroup: 'test' as DeploymentGroup,
    notes: '',
    fileName: '',
  });

  // Firmware versions enriched with group info
  const firmwareByGroup = useMemo(() => {
    if (selectedGroup === 'all') return mockFirmwareVersions;
    // Map versions to groups: staged → test/qa, active → production, deprecated → all
    return mockFirmwareVersions.filter(fw => {
      if (selectedGroup === 'production') return fw.status === 'active' || fw.status === 'deprecated';
      if (selectedGroup === 'qa') return fw.status === 'active' || fw.status === 'staged';
      if (selectedGroup === 'test') return true; // test sees all
      return true;
    });
  }, [selectedGroup]);

  const activeVersion = firmwareByGroup.find(v => v.status === 'active');
  const stagedVersion = mockFirmwareVersions.find(v => v.status === 'staged');

  // Deployment stats
  const totalDeployments = mockDeployments.length;
  const successfulDeployments = mockDeployments.filter(d => d.result === 'success').length;
  const failedDeployments = mockDeployments.filter(d => d.result === 'failed').length;
  const pendingDeployments = mockDeployments.filter(d => d.result === 'pending' || d.result === 'in_progress').length;

  // Devices by firmware version
  const devicesOnLatest = mockDevices.filter(d => d.firmwareVersion === activeVersion?.version).length;
  const devicesTotal = mockDevices.length;

  const groups: { value: DeploymentGroupOption; label: string; desc: string }[] = [
    { value: 'production', label: 'Production', desc: 'Live fleet' },
    { value: 'qa', label: 'QA', desc: 'Validation' },
    { value: 'test', label: 'Test', desc: 'Development' },
    { value: 'all', label: 'All', desc: 'All tracks' },
  ];

  const handleUploadSubmit = () => {
    toast({ title: 'Firmware Uploaded', description: `${uploadForm.version} staged for ${uploadForm.targetGroup}` });
    setShowUpload(false);
    setUploadForm({ version: '', updateType: 'minor', targetGroup: 'test', notes: '', fileName: '' });
  };

  return (
    <div className="flex flex-col">
      <TopBar title="Firmware Management" />
      <div className="p-6 space-y-6">

        {/* Deployment Group Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label text-[11px] mr-1">Environment</span>
          {groups.map(g => (
            <button
              key={g.value}
              onClick={() => setSelectedGroup(g.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                selectedGroup === g.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <span>{g.label}</span>
              <span className="ml-1.5 text-[10px] opacity-60">{g.desc}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-4 w-4" /> Upload New Version
            </button>
            {stagedVersion && (
              <button
                onClick={() => toast({ title: 'Deployment Started', description: `Rolling out ${stagedVersion.version} to ${selectedGroup} fleet` })}
                className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Send className="h-4 w-4" /> Deploy {stagedVersion.version}
              </button>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Active Version"
            value={activeVersion?.version || '—'}
            icon={<Package className="h-5 w-5" />}
            variant="success"
            trend={`${devicesOnLatest}/${devicesTotal} devices`}
          />
          <MetricCard
            label="Total Deployments"
            value={totalDeployments}
            icon={<Send className="h-5 w-5" />}
            variant="primary"
            trend={`${successfulDeployments} successful`}
          />
          <MetricCard
            label="Staged Release"
            value={stagedVersion?.version || 'None'}
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
            trend={stagedVersion ? 'Pending rollout' : ''}
          />
          <MetricCard
            label="Fleet Coverage"
            value={devicesTotal > 0 ? `${Math.round((devicesOnLatest / devicesTotal) * 100)}%` : '—'}
            icon={<Server className="h-5 w-5" />}
            variant="default"
            trend={`${devicesTotal - devicesOnLatest} behind`}
          />
        </div>

        {/* Current Active Version Banner */}
        {activeVersion && (
          <div className="rounded-xl border border-success/30 bg-success/5 p-5 shadow-kinetica">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-data text-xl font-semibold text-foreground">{activeVersion.version}</span>
                    <StatusBadge status="active" />
                    <span className="text-xs text-muted-foreground">
                      {selectedGroup !== 'all' ? selectedGroup.toUpperCase() : 'ALL ENVIRONMENTS'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Released {new Date(activeVersion.releaseDate).toLocaleDateString()} · {activeVersion.deviceCount} devices running this version
                  </p>
                  <p className="mt-2 text-sm text-foreground/70">{activeVersion.notes}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-label text-[10px]">Fleet Coverage</p>
                  <div className="mt-1 w-32">
                    <Progress value={devicesTotal > 0 ? (devicesOnLatest / devicesTotal) * 100 : 0} className="h-2" />
                  </div>
                  <p className="mt-0.5 font-data text-[11px] text-muted-foreground">
                    {devicesOnLatest} of {devicesTotal} devices
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Middle: Version History + Recent Deployments */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Version History — 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            <SectionHeader
              title="Version History"
              action={
                <span className="text-xs text-muted-foreground font-data">
                  {firmwareByGroup.length} versions · {selectedGroup !== 'all' ? selectedGroup : 'all groups'}
                </span>
              }
            />
            <div className="relative space-y-3 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {firmwareByGroup.map(fw => {
                const deployCount = mockDeployments.filter(d => d.firmwareVersionId === fw.id).length;
                const isExpanded = selectedVersion === fw.id;
                return (
                  <div key={fw.id} className="relative">
                    <div
                      className={`absolute -left-6 top-4 h-3 w-3 rounded-full border-2 ${
                        fw.status === 'active'
                          ? 'border-success bg-success/30'
                          : fw.status === 'staged'
                          ? 'border-accent bg-accent/30'
                          : 'border-muted-foreground bg-muted'
                      }`}
                    />
                    <div
                      className={`rounded-xl border bg-card p-4 shadow-kinetica cursor-pointer transition-all ${
                        isExpanded ? 'border-primary/50' : 'border-border hover:border-border/80'
                      }`}
                      onClick={() => setSelectedVersion(isExpanded ? null : fw.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-data text-base font-semibold text-foreground">{fw.version}</span>
                            <StatusBadge status={fw.status} />
                            {deployCount > 0 && (
                              <span className="text-[10px] font-data text-muted-foreground">{deployCount} deploys</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(fw.releaseDate).toLocaleDateString()} · {fw.deviceCount} devices
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {fw.status !== 'deprecated' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ title: 'Deploying', description: `${fw.version} deployment initiated` });
                              }}
                              className="flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 transition-colors"
                            >
                              <Cpu className="h-3 w-3" /> Deploy
                            </button>
                          )}
                          {fw.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ title: 'Rollback Initiated', description: `Rolling back from ${fw.version}` });
                              }}
                              className="flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-warning/50 hover:text-warning transition-colors"
                            >
                              <RotateCcw className="h-3 w-3" /> Rollback
                            </button>
                          )}
                          {fw.status === 'deprecated' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ title: 'Reinstall', description: `Reinstalling ${fw.version}` });
                              }}
                              className="flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-accent/50 hover:text-accent transition-colors"
                            >
                              <RotateCcw className="h-3 w-3" /> Reinstall
                            </button>
                          )}
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 border-t border-border pt-3 space-y-3">
                          <p className="text-sm text-foreground/80">{fw.notes}</p>

                          {/* Devices on this version */}
                          <div>
                            <p className="text-label text-[10px] mb-1.5">Devices on This Version</p>
                            <div className="flex flex-wrap gap-2">
                              {mockDevices.filter(d => d.firmwareVersion === fw.version).map(d => (
                                <span key={d.id} className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 font-data text-xs text-foreground">
                                  <span className={`h-1.5 w-1.5 rounded-full ${d.status === 'online' ? 'bg-success' : d.status === 'offline' ? 'bg-destructive' : 'bg-warning'}`} />
                                  {d.serialNumber}
                                </span>
                              ))}
                              {mockDevices.filter(d => d.firmwareVersion === fw.version).length === 0 && (
                                <span className="text-xs text-muted-foreground">No devices</span>
                              )}
                            </div>
                          </div>

                          {/* Deployments for this version */}
                          <div>
                            <p className="text-label text-[10px] mb-1.5">Deployment History</p>
                            {mockDeployments.filter(d => d.firmwareVersionId === fw.id).length > 0 ? (
                              <div className="space-y-1.5">
                                {mockDeployments
                                  .filter(d => d.firmwareVersionId === fw.id)
                                  .map(dep => (
                                    <div key={dep.id} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-data text-xs text-foreground">{getDeviceSerial(dep.deviceId)}</span>
                                        <span className="text-[10px] text-muted-foreground">by {dep.actor}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-data text-[11px] text-muted-foreground">
                                          {new Date(dep.deployedAt).toLocaleDateString()}
                                        </span>
                                        <StatusBadge status={dep.result} />
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No deployments yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Deployments / Rollout Status — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <SectionHeader title="Recent Deployments" />
            <div className="space-y-2">
              {mockDeployments
                .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())
                .map(dep => {
                  const fw = mockFirmwareVersions.find(f => f.id === dep.firmwareVersionId);
                  return (
                    <div key={dep.id} className="rounded-xl border border-border bg-card p-4 shadow-kinetica">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-data text-sm font-semibold text-foreground">{getDeviceSerial(dep.deviceId)}</span>
                            <StatusBadge status={dep.result} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {fw?.version || '—'} · {dep.actor}
                          </p>
                        </div>
                        <span className="font-data text-xs text-muted-foreground">
                          {new Date(dep.deployedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {dep.result === 'success' && (
                        <div className="mt-2">
                          <Progress value={100} className="h-1.5" />
                        </div>
                      )}
                      {dep.result === 'in_progress' && (
                        <div className="mt-2">
                          <Progress value={65} className="h-1.5" />
                          <p className="mt-0.5 text-[10px] text-muted-foreground font-data">65% — transferring…</p>
                        </div>
                      )}
                      {dep.result === 'pending' && (
                        <div className="mt-2">
                          <Progress value={0} className="h-1.5" />
                          <p className="mt-0.5 text-[10px] text-muted-foreground font-data">Queued</p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Rollout Summary */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-kinetica">
              <p className="text-label text-[10px] mb-3">Rollout Summary</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm text-foreground">Successful</span>
                  </div>
                  <span className="font-data text-sm font-semibold text-success">{successfulDeployments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-foreground">Failed</span>
                  </div>
                  <span className="font-data text-sm font-semibold text-destructive">{failedDeployments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-sm text-foreground">Pending</span>
                  </div>
                  <span className="font-data text-sm font-semibold text-warning">{pendingDeployments}</span>
                </div>
                <div className="border-t border-border pt-2">
                  <p className="text-label text-[10px] mb-1">Success Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress value={totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0} className="h-2 flex-1" />
                    <span className="font-data text-xs text-foreground">
                      {totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-kinetica-lg space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Upload Firmware Update</h2>
                <button onClick={() => setShowUpload(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* File Upload Area */}
                <div>
                  <label className="text-label text-[11px] mb-1.5 block">Firmware Binary</label>
                  <div
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface p-8 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => {
                      setUploadForm(prev => ({ ...prev, fileName: 'kinetica-fw-v2.4.1.bin' }));
                    }}
                  >
                    {uploadForm.fileName ? (
                      <div className="flex items-center gap-2 text-primary">
                        <FileUp className="h-5 w-5" />
                        <span className="font-data text-sm">{uploadForm.fileName}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to select firmware binary</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">.bin, .hex, .uf2 supported</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Version + Update Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label text-[11px] mb-1.5 block">Version Number</label>
                    <input
                      type="text"
                      placeholder="e.g. v2.4.1"
                      value={uploadForm.version}
                      onChange={e => setUploadForm(prev => ({ ...prev, version: e.target.value }))}
                      className="flex h-10 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground font-data ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-label text-[11px] mb-1.5 block">Update Type</label>
                    <select
                      value={uploadForm.updateType}
                      onChange={e => setUploadForm(prev => ({ ...prev, updateType: e.target.value as any }))}
                      className="flex h-10 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                      <option value="patch">Patch</option>
                      <option value="hotfix">Hotfix</option>
                    </select>
                  </div>
                </div>

                {/* Target Group */}
                <div>
                  <label className="text-label text-[11px] mb-1.5 block">Deploy Target Group</label>
                  <div className="flex gap-2">
                    {(['test', 'qa', 'production'] as DeploymentGroup[]).map(g => (
                      <button
                        key={g}
                        onClick={() => setUploadForm(prev => ({ ...prev, targetGroup: g }))}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                          uploadForm.targetGroup === g
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Release Notes */}
                <div>
                  <label className="text-label text-[11px] mb-1.5 block">Release Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Describe changes in this release..."
                    value={uploadForm.notes}
                    onChange={e => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="flex w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowUpload(false)}
                  className="rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={!uploadForm.version || !uploadForm.fileName}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-4 w-4" /> Upload &amp; Stage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
