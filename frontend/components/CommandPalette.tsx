'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, Bell, BrainCircuit, Database, Gauge, LayoutDashboard, Network, Radar, Search, ShieldAlert, SlidersHorizontal, Sparkles, Upload } from 'lucide-react';

const commands = [
  { title: 'Executive dashboard', detail: 'Overview · forecast and KPIs', path: '/', icon: LayoutDashboard, terms: 'home overview grid' },
  { title: 'Interactive forecast', detail: 'Forecast curve and confidence bounds', path: '/forecast', icon: Gauge, terms: 'prediction demand load' },
  { title: 'What-if simulation', detail: 'Adjust conditions and compare scenarios', path: '/simulation', icon: SlidersHorizontal, terms: 'scenario temperature battery' },
  { title: 'Explainability center', detail: 'Inspect forecast drivers and attribution', path: '/explainability', icon: BrainCircuit, terms: 'shap ai features xai' },
  { title: 'Digital twin', detail: 'Explore network nodes and grid corridors', path: '/digital-twin', icon: Network, terms: 'map network twin power' },
  { title: 'Decision intelligence', detail: 'Risks, recommendations, and insights', path: '/decisions', icon: ShieldAlert, terms: 'risk executive alert insight' },
  { title: 'Enterprise workbench', detail: 'Models, quality, alerts, reporting', path: '/workbench', icon: Activity, terms: 'mlops registry automl report' },
  { title: 'Model & Reliability Lab', detail: 'Compare models, drift, anomalies, confidence', path: '/operations-lab', icon: Radar, terms: 'model benchmark compare anomaly drift reliability' },
  { title: 'Dataset explorer', detail: 'Browse the active dataset', path: '/dataset', icon: Database, terms: 'data csv records' },
  { title: 'Upload and analyze', detail: 'Analyze a dataset', path: '/upload', icon: Upload, terms: 'import file upload' },
  { title: 'API and telemetry', detail: 'Service health and endpoints', path: '/status', icon: Bell, terms: 'status backend health live' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? commands.filter((item) => `${item.title} ${item.detail} ${item.terms}`.toLowerCase().includes(value)) : commands;
  }, [query]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.shiftKey) {
        event.preventDefault(); setOpen((wasOpen) => !wasOpen); setQuery(''); setSelected(0);
      } else if (event.key === 'Escape') setOpen(false);
      else if (open && event.key === 'ArrowDown') { event.preventDefault(); setSelected((index) => Math.min(index + 1, results.length - 1)); }
      else if (open && event.key === 'ArrowUp') { event.preventDefault(); setSelected((index) => Math.max(0, index - 1)); }
      else if (open && event.key === 'Enter' && results[selected]) { event.preventDefault(); router.push(results[selected].path); setOpen(false); }
    };
    const openPalette = () => { setOpen(true); setQuery(''); setSelected(0); };
    window.addEventListener('keydown', handle);
    window.addEventListener('gridpulse:commands', openPalette);
    return () => { window.removeEventListener('keydown', handle); window.removeEventListener('gridpulse:commands', openPalette); };
  }, [open, results, selected, router]);

  useEffect(() => setSelected(0), [query]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
    <section role="dialog" aria-modal="true" aria-label="Command palette" className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c1422] shadow-2xl shadow-black/50">
      <div className="flex items-center gap-3 border-b border-white/10 px-4"><Search size={17} className="text-cyan-300"/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, models, and actions…" className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"/><kbd className="rounded border border-white/10 px-1.5 py-1 text-[10px] text-slate-500">ESC</kbd></div>
      <div className="max-h-[55vh] overflow-y-auto p-2">{results.length ? results.map((item, index) => { const Icon = item.icon; return <button key={item.path} onMouseEnter={() => setSelected(index)} onClick={() => {router.push(item.path);setOpen(false);}} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${selected === index ? 'bg-cyan-400/10' : 'hover:bg-white/[.04]'}`}><span className="rounded-lg border border-white/5 bg-white/[.03] p-2 text-cyan-300"><Icon size={16}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-100">{item.title}</span><span className="mt-0.5 block text-xs text-slate-500">{item.detail}</span></span>{selected === index && <ArrowRight size={15} className="text-cyan-300"/>}</button>; }) : <div className="p-8 text-center text-sm text-slate-500">No matching commands. Try “forecast”, “risk”, or “model”.</div>}</div>
      <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><Sparkles size={12} className="text-cyan-400"/> GridPulse quick navigation</span><span><kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> open</span></div>
    </section>
  </div>;
}
