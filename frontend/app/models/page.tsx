'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingDown,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { fetchLeaderboard, ModelItem } from '@/services/api';
import { formatPercent } from '@/lib/utils';

export default function ModelsPage() {
  const [leaderboard, setLeaderboard] = useState<ModelItem[]>([]);
  const [bestModel, setBestModel] = useState<ModelItem | null>(null);

  useEffect(() => {
    async function loadModels() {
      const res = await fetchLeaderboard();
      setLeaderboard(res.leaderboard);
      const champion = res.leaderboard.find((m) => m.is_best) || res.leaderboard[0];
      setBestModel(champion);
    }
    loadModels();
  }, []);

  const chartData = leaderboard.map((m) => ({
    name: m.model_name.replace('Persistence ', '').replace(' Baseline', ''),
    mape: m.mape,
    mae: m.mae,
    r2: m.r2,
    is_best: m.is_best
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
          <Award className="w-3.5 h-3.5" />
          Benchmarking & Model Selection
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Model Leaderboard & Comparative Evaluation
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Evaluation of 5 sequence architectures under strictly identical chronological train/val/test splits.
        </p>
      </div>

      {/* Champion Banner Card */}
      {bestModel && (
        <div className="rounded-3xl bg-gradient-to-r from-blue-950/60 via-[#111827] to-cyan-950/40 border border-cyan-500/30 p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                <Sparkles className="w-4 h-4" />
                Tournament Champion Architecture
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {bestModel.model_name} Network
              </h2>
              <p className="text-slate-300 text-xs md:text-sm mt-2 max-w-2xl leading-relaxed">
                Demonstrated the highest predictive accuracy with a test Mean Absolute Percentage Error of{' '}
                <span className="text-emerald-400 font-bold">{bestModel.mape}%</span> and coefficient of determination R² of{' '}
                <span className="text-cyan-400 font-bold">{bestModel.r2}</span>. Bidirectional recurrent pathways successfully encode both morning demand ramps and evening heating peaks.
              </p>
            </div>

            <div className="flex flex-row md:flex-col gap-4 text-right">
              <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-left md:text-right">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Test MAPE</div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">{bestModel.mape}%</div>
              </div>
              <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-left md:text-right">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">R² Score</div>
                <div className="text-2xl font-black text-cyan-400 mt-0.5">{bestModel.r2}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
        <h3 className="text-base font-bold text-white mb-1">Official Benchmark Leaderboard</h3>
        <p className="text-xs text-slate-400 mb-6">Metrics evaluated on unseen 5,211 test hours (May–December 2018)</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="pb-3.5 font-semibold">Rank</th>
                <th className="pb-3.5 font-semibold">Model Architecture</th>
                <th className="pb-3.5 font-semibold">MAPE (%)</th>
                <th className="pb-3.5 font-semibold">MAE (MW)</th>
                <th className="pb-3.5 font-semibold">RMSE (MW)</th>
                <th className="pb-3.5 font-semibold">R² Score</th>
                <th className="pb-3.5 font-semibold">Train Time</th>
                <th className="pb-3.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard.map((m, idx) => (
                <tr
                  key={m.model_name}
                  className={`transition-colors ${
                    m.is_best ? 'bg-cyan-500/10 hover:bg-cyan-500/15' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="py-3.5 font-bold font-mono text-slate-400">
                    {idx === 0 ? <span className="text-cyan-400 text-sm">#1</span> : `#${idx + 1}`}
                  </td>
                  <td className="py-3.5 font-bold text-white flex items-center gap-2">
                    {m.model_name}
                    {m.is_best && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                        Champion
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 font-bold font-mono text-emerald-400">{m.mape}%</td>
                  <td className="py-3.5 font-mono text-slate-200">{m.mae.toLocaleString()} MW</td>
                  <td className="py-3.5 font-mono text-slate-400">{m.rmse.toLocaleString()} MW</td>
                  <td className="py-3.5 font-bold font-mono text-cyan-400">{m.r2}</td>
                  <td className="py-3.5 font-mono text-slate-400">{m.train_time_sec}s</td>
                  <td className="py-3.5 text-right font-medium">
                    {m.is_best ? (
                      <span className="text-emerald-400 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Deployed
                      </span>
                    ) : (
                      <span className="text-slate-500">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparative Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: MAPE Comparison */}
        <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
          <h3 className="text-base font-bold text-white mb-1">Mean Absolute Percentage Error (MAPE)</h3>
          <p className="text-xs text-slate-400 mb-4">Lower is better. Deep learning architectures achieve &lt; 3.1%</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.filter(d => d.name !== 'Baseline')} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 4]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }} />
                <Bar dataKey="mape" name="MAPE (%)" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: R² Score Comparison */}
        <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
          <h3 className="text-base font-bold text-white mb-1">Coefficient of Determination (R² Score)</h3>
          <p className="text-xs text-slate-400 mb-4">Higher is better. Bi-LSTM captures 94.14% of system load variance</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.filter(d => d.name !== 'Baseline')} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0.9, 1.0]} tickFormatter={(v) => v.toFixed(2)} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }} />
                <Bar dataKey="r2" name="R² Score" fill="#22D3EE" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
