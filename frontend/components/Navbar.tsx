'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Bell, Command, Sparkles, ShieldCheck, X, Check, Radio, Menu } from 'lucide-react';

const seedAlerts = [
  { id: 1, title: 'Forecast interval widening', detail: 'Confidence envelope · monitor horizon', severity: 'Watch', time: '2 min ago' },
  { id: 2, title: 'Model drift feed not connected', detail: 'Configure a feature monitoring source', severity: 'Info', time: 'Today' },
  { id: 3, title: 'Evening peak approaching', detail: 'Review reserve capacity for 19:00–21:00', severity: 'Advisory', time: 'Today' },
];

export default function Navbar() {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState(seedAlerts);
  const [liveDemo, setLiveDemo] = useState(false);
  const [demoTick, setDemoTick] = useState(0);

  useEffect(() => {
    if (!liveDemo) return;
    const timer = window.setInterval(() => setDemoTick((tick) => tick + 1), 3000);
    return () => window.clearInterval(timer);
  }, [liveDemo]);

  return <header className="sticky top-0 z-30 ml-0 flex h-[68px] items-center justify-between border-b border-white/[.07] bg-[#070b14]/80 px-3 backdrop-blur-2xl md:ml-64 md:h-[76px] md:px-8">
    <div className="flex min-w-0 items-center gap-2 md:gap-4">
      <button onClick={() => window.dispatchEvent(new Event('gridpulse:toggle-menu'))} aria-label="Open navigation" className="rounded-xl border border-white/[.08] bg-white/[.03] p-2.5 text-slate-300 hover:border-cyan-300/20 hover:text-white md:hidden"><Menu size={17}/></button>
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/[.07] bg-white/[.035] px-2.5 py-1.5 md:gap-3 md:px-3.5"><span className={`inline-block h-2 w-2 shrink-0 rounded-full ${liveDemo ? 'animate-pulse bg-amber-400' : 'bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,.55)]'}`} /><span className="truncate text-[10px] font-medium text-slate-300 md:text-xs">Spain TSO Grid</span><span className="hidden text-xs font-bold tracking-wide text-white lg:inline">· 35,064 telemetry hours</span></div>
      <div className="hidden items-center gap-2 text-[11px] text-slate-500 xl:flex"><ShieldCheck className="h-4 w-4 text-cyan-400/80"/><span>Forecast API connected</span></div>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={() => window.dispatchEvent(new Event('gridpulse:commands'))} aria-label="Quick search" className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.03] p-2.5 text-slate-400 transition hover:border-cyan-400/20 hover:text-white md:px-3 md:py-2"><Command size={14}/><span className="hidden text-xs md:inline">Search</span><kbd className="hidden rounded border border-white/10 px-1 py-0.5 text-[9px] lg:inline">Ctrl K</kbd></button>
      <button onClick={() => setLiveDemo((value) => !value)} aria-pressed={liveDemo} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition md:px-3 ${liveDemo ? 'border-amber-400/25 bg-amber-400/10 text-amber-200' : 'border-white/[.08] bg-white/[.03] text-slate-400 hover:text-white'}`}><Radio size={14}/><span className="hidden sm:inline">{liveDemo ? 'Demo live' : 'Live demo'}</span></button>
      <div className="relative"><button onClick={() => setAlertsOpen((value) => !value)} aria-label="Open alerts" className="relative rounded-xl border border-white/10 bg-white/[.03] p-2.5 text-slate-400 hover:text-white"><Bell size={16}/>{alerts.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{alerts.length}</span>}</button>
      {alertsOpen && <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-[#0c1422] p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-white">Alert center</h3><p className="mt-1 text-[10px] text-slate-500">Dashboard advisories · not live SCADA alarms</p></div><button onClick={() => setAlertsOpen(false)} aria-label="Close alerts" className="text-slate-500 hover:text-white"><X size={16}/></button></div>{alerts.length ? alerts.map((alert) => <div key={alert.id} className="border-t border-white/5 py-3 first:border-0"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-medium text-slate-200">{alert.title}</div><div className="mt-1 text-[10px] leading-relaxed text-slate-500">{alert.detail}</div><div className="mt-1.5 text-[9px] text-slate-600">{alert.severity} · {alert.time}</div></div><button onClick={() => setAlerts((items) => items.filter((item) => item.id !== alert.id))} aria-label={`Acknowledge ${alert.title}`} title="Acknowledge" className="rounded-md p-1.5 text-slate-500 hover:bg-emerald-400/10 hover:text-emerald-300"><Check size={14}/></button></div></div>) : <div className="py-7 text-center text-xs text-slate-500">All advisories acknowledged</div>}<button onClick={() => setAlerts([])} className="mt-2 w-full rounded-lg border border-white/10 py-2 text-[10px] text-slate-400 hover:text-white">Acknowledge all</button></div>}</div>
      <div className="hidden items-center gap-2.5 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-blue-900/30 to-cyan-950/30 px-3.5 py-1.5 sm:flex"><Sparkles className="h-4 w-4 text-cyan-400"/><div className="text-right"><div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">Active Model</div><div className="text-xs font-bold text-white">Bi-LSTM (2.78% MAPE)</div></div></div>
      <div className="hidden items-center gap-2 border-l border-white/10 pl-3 sm:flex"><div className="text-right"><div className="text-xs font-semibold text-slate-200">Operations console</div><div className="text-[10px] text-slate-500">GridPulse Intelligence</div></div><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/10 bg-gradient-to-br from-blue-500/30 to-cyan-300/10 text-xs font-bold text-cyan-100">GP</div></div>
    </div>
    {liveDemo && <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden bg-white/5"><div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${20 + (demoTick % 8) * 10}%` }}/></div>}
  </header>;
}
