import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config: Record<string, string> = {
    online: 'bg-success/15 text-success border-success/30',
    offline: 'bg-destructive/15 text-destructive border-destructive/30',
    syncing: 'bg-primary/15 text-primary border-primary/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    idle: 'bg-muted text-muted-foreground border-border',
    active: 'bg-success/15 text-success border-success/30',
    inactive: 'bg-warning/15 text-warning border-warning/30',
    discharged: 'bg-muted text-muted-foreground border-border',
    completed: 'bg-success/15 text-success border-success/30',
    in_progress: 'bg-primary/15 text-primary border-primary/30',
    cancelled: 'bg-muted text-muted-foreground border-border',
    staged: 'bg-accent/15 text-accent border-accent/30',
    deprecated: 'bg-muted text-muted-foreground border-border',
    success: 'bg-success/15 text-success border-success/30',
    failed: 'bg-destructive/15 text-destructive border-destructive/30',
    pending: 'bg-warning/15 text-warning border-warning/30',
    timeout: 'bg-destructive/15 text-destructive border-destructive/30',
    acknowledged: 'bg-warning/15 text-warning border-warning/30',
    resolved: 'bg-muted text-muted-foreground border-border',
    critical: 'bg-destructive/15 text-destructive border-destructive/30',
    high: 'bg-destructive/15 text-destructive border-destructive/30',
    medium: 'bg-warning/15 text-warning border-warning/30',
    low: 'bg-primary/15 text-primary border-primary/30',
    info: 'bg-primary/15 text-primary border-primary/30',
    error: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        config[status] || 'bg-muted text-muted-foreground border-border',
        className
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  trend,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const borderColors: Record<string, string> = {
    default: 'border-border',
    primary: 'border-primary/30',
    success: 'border-success/30',
    warning: 'border-warning/30',
    destructive: 'border-destructive/30',
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 shadow-kinetica',
        borderColors[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-label">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-tight text-foreground font-data">
          {value}
        </span>
        {trend && (
          <span className="mb-1 text-xs font-medium text-muted-foreground">{trend}</span>
        )}
      </div>
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
      {action}
    </div>
  );
}
