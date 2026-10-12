'use client';

import React from 'react';
import { Activity, Bell, Sparkles, Server, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-20 bg-[#070B14]/80 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-30 ml-64">
      {/* Left: Ticker & Status */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 bg-[#111827] px-3.5 py-1.5 rounded-full border border-white/5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="text-xs font-medium text-slate-300">Spain TSO Grid:</span>
          <span className="text-xs font-bold text-white tracking-wide">35,064 Hourly Telemetry Hours</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Zero Data Leakage Pipeline</span>
        </div>
      </div>

      {/* Right: Active Model Pill & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-blue-900/30 to-cyan-950/30 border border-cyan-500/20 px-3.5 py-1.5 rounded-xl">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <div className="text-right">
            <div className="text-[10px] text-cyan-300 uppercase tracking-wider font-semibold">Active Model</div>
            <div className="text-xs font-bold text-white">Bi-LSTM (2.78% MAPE)</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">Engineering Final Year</div>
            <div className="text-[10px] text-slate-400">Power Systems AI v1.0</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
            EE
          </div>
        </div>
      </div>
    </header>
  );
}
