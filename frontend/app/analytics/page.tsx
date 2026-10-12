'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart as LucideLineChart,
  Sun,
  Wind,
  Thermometer,
  Calendar,
  Layers,
  Sparkles,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts';
import { fetchAnalytics, AnalyticsData } from '@/services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchAnalytics();
        setData(res);
      } catch (e) {
        console.error('Analytics load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
          <LucideLineChart className="w-3.5 h-3.5" />
          Empirical Grid Physics & EDA
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Exploratory Data Analytics (EDA)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Rigorous meteorological and electrical dynamics: diurnal cycle, thermo-electrical elasticity, and renewable complementarity.
        </p>
      </div>

      {/* Grid of Visualizations: 2 x 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Diurnal Profile (Weekday vs Weekend) */}
        <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Diurnal Load Pattern (24-Hour Cycle)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Weekday industrial ramp vs Weekend baseload</p>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.hourly_profile || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={11} tickFormatter={(h) => `${h}:00`} />
                <YAxis stroke="#64748B" fontSize={11} domain={['auto', 'auto']} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="weekday_load" name="Weekday (Mon–Fri)" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="weekend_load" name="Weekend (Sat–Sun)" stroke="#F59E0B" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 border-t border-white/5 pt-2">
            Insight: Lowest demand occurs at 04:00 UTC (~22,500 MW), sharp morning ramp between 06:00-10:00 UTC, and evening peak at 20:00-21:00 UTC (~33,000 MW).
          </p>
        </div>

        {/* Graph 2: Monthly Seasonal Trend */}
        <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                Monthly Seasonal Trend
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Dual-peak seasonal cycle in Spain</p>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthly_trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={['auto', 'auto']} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
                />
                <Bar dataKey="avg_load" name="Average Load (MW)" fill="#22D3EE" radius={[6, 6, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 border-t border-white/5 pt-2">
            Insight: January & February represent the winter heating maximum (~29,800 MW), with a secondary summer air-conditioning peak in July (~29,900 MW).
          </p>
        </div>

        {/* Graph 3: Non-Linear Temperature vs Load (U-Shape) */}
        <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-rose-400" />
                Temperature vs. Load Elasticity (U-Shape)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Non-linear thermo-electrical sensitivity</p>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.temp_vs_load || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="temp_c" stroke="#64748B" fontSize={11} tickFormatter={(t) => `${t}°C`} />
                <YAxis stroke="#64748B" fontSize={11} domain={['auto', 'auto']} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
                />
                <Line type="monotone" dataKey="load_mw" name="Average Load (MW)" stroke="#EF4444" strokeWidth={3} dot={{ r: 3, fill: '#EF4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 border-t border-white/5 pt-2">
            Insight: The thermal comfort equilibrium occurs between 18°C–22°C (minimum load). Below 15°C, heating demand surges; above 25°C, cooling demand drives summer peaks.
          </p>
        </div>

        {/* Graph 4: Renewable Complementarity Mix */}
        <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                Renewable Generation vs. Grid Demand
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Solar PV & Wind Onshore dynamics</p>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.renewable_mix?.slice(0, 48) || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} domain={['auto', 'auto']} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="total_load" name="Grid Demand" stroke="#64748B" fill="#64748B" fillOpacity={0.1} />
                <Area type="monotone" dataKey="solar" name="Solar PV" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} />
                <Area type="monotone" dataKey="wind" name="Wind Onshore" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 border-t border-white/5 pt-2">
            Insight: Solar follows deterministic diurnal irradiation, whereas wind generation exhibits stochastic weather swings requiring flexible gas reserve dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}
