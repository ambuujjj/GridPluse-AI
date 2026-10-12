'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { fetchDatasetStats, fetchDatasetPage, DatasetStats } from '@/services/api';
import KpiCard from '@/components/KpiCard';
import { formatMW } from '@/lib/utils';

export default function DatasetExplorerPage() {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'generation' | 'weather'>('all');

  useEffect(() => {
    async function loadStats() {
      const data = await fetchDatasetStats();
      setStats(data);
    }
    loadStats();
  }, []);

  useEffect(() => {
    async function loadTable() {
      setLoading(true);
      const data = await fetchDatasetPage(page, 12, search);
      setRecords(data.records);
      setTotalPages(data.total_pages);
      setLoading(false);
    }
    loadTable();
  }, [page, search]);

  // Selected column sets
  const displayColumns = [
    { key: 'timestamp', label: 'Timestamp (UTC)' },
    { key: 'total load actual', label: 'Actual Load (MW)' },
    { key: 'temp_spain_avg', label: 'Temp Spain Avg (°C)' },
    { key: 'generation solar', label: 'Solar PV (MW)' },
    { key: 'generation wind onshore', label: 'Wind Onshore (MW)' },
    { key: 'generation nuclear', label: 'Nuclear (MW)' },
    { key: 'generation fossil gas', label: 'Fossil Gas (MW)' },
    { key: 'price actual', label: 'Price Actual (€/MWh)' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
          <Database className="w-3.5 h-3.5" />
          Data Foundation & Provenance
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Dataset Explorer & Feature Catalog
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Merged 35,064 hourly records across 4 full years (2015–2018) synthesizing Spanish electrical grid telemetry with 5-city weather observations.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Hourly Rows"
          value="35,064"
          subtext="100% continuous coverage"
          icon={Layers}
          accentColor="blue"
        />
        <KpiCard
          title="Engineered Features"
          value={`${stats?.columns_count || 58} Cols`}
          subtext="0 missing values remaining"
          icon={Database}
          accentColor="cyan"
        />
        <KpiCard
          title="Average Grid Load"
          value={formatMW(stats?.mean_load || 28697)}
          subtext="Standard Deviation: 4,575 MW"
          icon={Sparkles}
          accentColor="emerald"
        />
        <KpiCard
          title="Grid Load Range"
          value={`${((stats?.min_load || 18041) / 1000).toFixed(1)}k – ${((stats?.max_load || 41015) / 1000).toFixed(1)}k`}
          subtext="Min: 18,041 MW | Max: 41,015 MW"
          icon={Info}
          accentColor="amber"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-white/5">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date (e.g., 2018-06)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#070B14] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Quick Categories */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">View Category:</span>
            {['all', 'generation', 'weather'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white bg-white/5 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                {displayColumns.map((col) => (
                  <th key={col.key} className="pb-3.5 font-semibold">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {records.length > 0 ? (
                records.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-slate-200 font-sans font-medium">{row['timestamp']}</td>
                    <td className="py-3 text-cyan-400 font-bold">{formatMW(row['total load actual'])}</td>
                    <td className="py-3 text-slate-300">{Number(row['temp_spain_avg'] || 0).toFixed(1)} °C</td>
                    <td className="py-3 text-amber-400">{formatMW(row['generation solar'])}</td>
                    <td className="py-3 text-emerald-400">{formatMW(row['generation wind onshore'])}</td>
                    <td className="py-3 text-indigo-400">{formatMW(row['generation nuclear'])}</td>
                    <td className="py-3 text-slate-400">{formatMW(row['generation fossil gas'])}</td>
                    <td className="py-3 text-slate-300 font-sans font-semibold">€{Number(row['price actual'] || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={displayColumns.length} className="py-8 text-center text-slate-500">
                    {loading ? 'Fetching telemetry stream...' : 'No telemetry records matching search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-4 text-xs text-slate-400">
          <div>
            Showing Page <span className="font-bold text-white">{page}</span> of{' '}
            <span className="font-bold text-white">{totalPages || 1}</span> (35,064 hourly records total)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
