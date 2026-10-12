'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtext?: string;
  change?: string;
  changePositive?: boolean;
  icon: LucideIcon;
  badge?: string;
  accentColor?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'purple';
}

export default function KpiCard({
  title,
  value,
  subtext,
  change,
  changePositive = true,
  icon: Icon,
  badge,
  accentColor = 'blue',
}: KpiCardProps) {
  const accentClasses = {
    blue: 'from-blue-500/10 to-blue-500/0 text-blue-400 border-blue-500/20 group-hover:border-blue-500/40',
    cyan: 'from-cyan-500/10 to-cyan-500/0 text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/40',
    emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40',
    amber: 'from-amber-500/10 to-amber-500/0 text-amber-400 border-amber-500/20 group-hover:border-amber-500/40',
    purple: 'from-purple-500/10 to-purple-500/0 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40',
  }[accentColor];

  const iconBgClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }[accentColor];

  return (
    <div className="group relative rounded-2xl bg-[#111827]/80 border border-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/15 hover:shadow-xl hover:shadow-black/40 overflow-hidden">
      {/* Background radial gradient accent */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${accentClasses} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />

      <div className="relative flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${iconBgClasses}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="relative flex items-baseline justify-between gap-2">
        <div className="text-2xl font-black tracking-tight text-white">
          {value}
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {badge}
          </span>
        )}
      </div>

      {(subtext || change) && (
        <div className="relative mt-2.5 flex items-center gap-2 text-xs">
          {change && (
            <span className={`font-semibold ${changePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change}
            </span>
          )}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
