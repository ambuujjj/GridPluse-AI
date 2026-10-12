'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  LineChart,
  Cpu,
  TrendingUp,
  Award,
  Activity,
  Zap,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Executive Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Dataset Explorer', path: '/dataset', icon: Database },
  { label: 'Data Analytics (EDA)', path: '/analytics', icon: LineChart },
  { label: 'Model Training Studio', path: '/training', icon: Cpu },
  { label: 'Interactive Forecast', path: '/forecast', icon: TrendingUp },
  { label: 'Model Benchmarking', path: '/models', icon: Award },
  { label: 'API & Telemetry', path: '/status', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0A101D] border-r border-white/5 flex flex-col z-40">
      {/* Brand Header */}
      <div className="h-20 px-6 flex items-center border-b border-white/5 gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            GRID<span className="text-cyan-400">PULSE</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">MVP</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium tracking-tight">AI Short-Term Load Forecast</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Platform Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Telemetry Card */}
      <div className="p-4 border-t border-white/5 m-3 rounded-2xl bg-white/[0.02] border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">FastAPI Model Engine</span>
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
          Bi-LSTM Champion active with 2.78% test MAPE.
        </p>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-[94.1%]" />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
          <span>Accuracy Score</span>
          <span className="text-cyan-400 font-bold">94.1% R²</span>
        </div>
      </div>
    </aside>
  );
}
