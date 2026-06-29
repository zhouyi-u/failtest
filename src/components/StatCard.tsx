import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon | React.ReactNode;
  trend?: string | number;
  trendUp?: boolean;
  accentColor?: string;
  description?: string;
}

export default function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendUp,
  accentColor = '#3B82F6',
  description,
}: StatCardProps) {
  return (
    <div className="stat-card" style={{ ['--accent-color' as any]: accentColor }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm text-text-secondary mb-1">{title}</div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-3xl font-bold font-mono tracking-tight"
              style={{ color: accentColor }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="text-sm text-text-secondary">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}15`, color: accentColor }}
          >
            {typeof icon === 'function' ? React.createElement(icon as LucideIcon, { size: 20 }) : icon}
          </div>
        )}
      </div>
      {(trend !== undefined || description) && (
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trendUp ? 'text-status-disabled' : 'text-status-online'
              }`}
            >
              <TrendingUp size={14} style={{ transform: trendUp ? 'none' : 'scaleY(-1)' }} />
              <span>{typeof trend === 'number' ? `${trend > 0 ? '+' : ''}${trend}%` : trend}</span>
              <span className="text-text-secondary">较昨日</span>
            </div>
          )}
          {description && <span className="text-xs text-text-secondary">{description}</span>}
        </div>
      )}
    </div>
  );
}
