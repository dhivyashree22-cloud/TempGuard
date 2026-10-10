import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  status?: 'normal' | 'warning' | 'danger' | 'info' | 'neutral';
  tooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon,
  subtitle,
  status = 'neutral',
  tooltip,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'danger':
        return 'border-rose-500/40 bg-rose-950/20 text-rose-300';
      case 'warning':
        return 'border-amber-500/40 bg-amber-950/20 text-amber-300';
      case 'normal':
        return 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
      case 'info':
        return 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300';
      default:
        return 'border-slate-800 bg-slate-900/60 text-slate-300';
    }
  };

  const getValueColor = () => {
    switch (status) {
      case 'danger':
        return 'text-rose-400';
      case 'warning':
        return 'text-amber-400';
      case 'normal':
        return 'text-emerald-400';
      case 'info':
        return 'text-cyan-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div
      title={tooltip}
      className={`rounded-xl border p-4 backdrop-blur-sm transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium tracking-wide uppercase text-slate-400">
          {title}
        </span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className={`text-2xl font-bold font-mono tracking-tight ${getValueColor()}`}>
          {value}
        </span>
        {unit && <span className="text-xs font-mono font-medium text-slate-400">{unit}</span>}
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-1 truncate" title={subtitle}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
