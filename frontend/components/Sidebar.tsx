'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Award, BrainCircuit, ChevronRight, Cpu, Database, LayoutDashboard, LineChart, Network, PanelsTopLeft, Radar, ShieldAlert, SlidersHorizontal, TrendingUp, Upload, X, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Executive Dashboard', path: '/', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Interactive Forecast', path: '/forecast', icon: TrendingUp, group: 'Overview' },
  { label: 'Decision Intelligence', path: '/decisions', icon: ShieldAlert, group: 'Overview' },
  { label: 'Dataset Explorer', path: '/dataset', icon: Database, group: 'Data & models' },
  { label: 'Upload & Analyze', path: '/upload', icon: Upload, group: 'Data & models' },
  { label: 'Data Analytics', path: '/analytics', icon: LineChart, group: 'Data & models' },
  { label: 'Model Training', path: '/training', icon: Cpu, group: 'Data & models' },
  { label: 'Model Benchmarking', path: '/models', icon: Award, group: 'Data & models' },
  { label: 'Explainability', path: '/explainability', icon: BrainCircuit, group: 'Grid intelligence' },
  { label: 'What-if Simulation', path: '/simulation', icon: SlidersHorizontal, group: 'Grid intelligence' },
  { label: 'Digital Twin', path: '/digital-twin', icon: Network, group: 'Grid intelligence' },
  { label: 'Enterprise Workbench', path: '/workbench', icon: PanelsTopLeft, group: 'Platform' },
  { label: 'Reliability Lab', path: '/operations-lab', icon: Radar, group: 'Platform' },
  { label: 'API & Telemetry', path: '/status', icon: Activity, group: 'Platform' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const open = () => setMobileOpen(true);
    const close = () => setMobileOpen(false);
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('gridpulse:toggle-menu', open);
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('gridpulse:toggle-menu', open); window.removeEventListener('keydown', keydown); };
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const groups = [...new Set(NAV_ITEMS.map((item) => item.group))];
  return <>
    {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"/>}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(300px,86vw)] flex-col border-r border-white/[.07] bg-[#090f1b]/95 shadow-2xl shadow-black/30 backdrop-blur-2xl transition-transform duration-300 md:w-64 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-white/[.06] px-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200/20 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-300 shadow-lg shadow-cyan-900/30"><Zap className="h-5 w-5 fill-white/10 text-white"/><span className="absolute -inset-1 -z-10 rounded-2xl bg-cyan-400/15 blur-md"/></div>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-1 text-[15px] font-bold tracking-[.08em] text-white">GRID<span className="text-cyan-300">PULSE</span></div><p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.17em] text-slate-500">Energy intelligence</p></div>
        <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white md:hidden"><X size={17}/></button>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {groups.map((group) => <section key={group}><h2 className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-600">{group}</h2><div className="space-y-1">{NAV_ITEMS.filter((item) => item.group === group).map((item) => { const Icon = item.icon; const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`)); return <Link key={item.path} href={item.path} onClick={() => setMobileOpen(false)} aria-current={active ? 'page' : undefined} className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all duration-200 ${active ? 'border border-cyan-300/[.13] bg-gradient-to-r from-cyan-400/[.11] to-blue-500/[.05] text-white shadow-[inset_0_0_18px_rgba(34,211,238,.035)]' : 'border border-transparent text-slate-400 hover:bg-white/[.04] hover:text-slate-100'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${active ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500 group-hover:text-slate-300'}`}><Icon size={15}/></span><span className="min-w-0 flex-1 truncate">{item.label}</span>{active && <><span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.7)]"/><ChevronRight size={13} className="text-cyan-300/70"/></>}</Link>; })}</div></section>)}
      </nav>
      <div className="m-3 mb-4 rounded-2xl border border-white/[.07] bg-gradient-to-br from-white/[.045] to-white/[.015] p-3.5">
        <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-slate-300">Inference services</span><span className="flex items-center gap-1.5 text-[9px] font-medium text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"/>Ready</span></div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">Bi-LSTM forecast engine · 2.78% benchmark MAPE</p>
        <div className="mt-3 flex items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full w-[94%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"/></div><span className="font-mono text-[9px] text-cyan-300">94.1</span></div>
      </div>
    </aside>
  </>;
}
