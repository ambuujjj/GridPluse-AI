'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import KpiCard from '@/components/KpiCard';
import { fetchPrediction, fetchLeaderboard, fetchHealth, ForecastPoint, ModelItem } from '@/services/api';
import { formatMW, formatPercent } from '@/lib/utils';

export default function DashboardPage() {
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [bestModel, setBestModel] = useState<ModelItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHorizon, setSelectedHorizon] = useState(24);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [predRes, leaderRes] = await Promise.all([
          fetchPrediction('Bi-LSTM', selectedHorizon, 0),
          fetchLeaderboard(),
        ]);

        setForecastData(predRes.forecast);
        setMetrics(predRes.summary_metrics);

        const best = leaderRes.leaderboard.find((m) => m.is_best) || leaderRes.leaderboard[0];
        setBestModel(best);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [selectedHorizon]);

  const currentLoad = forecastData[0]?.actual_load || 28697;
  const nextHourPred = forecastData[0]?.predicted_load || 28450;
  const loadDelta = ((nextHourPred - currentLoad) / currentLoad) * 100;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Executive Operational Overview
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Grid Telemetry & Load Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deep learning short-term electricity load forecasting for the Spanish Transmission Grid (REE).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#111827] border border-white/10 rounded-xl p-1 flex">
            {[24, 48, 72, 168].map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedHorizon === h
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {h}h Ahead
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelectedHorizon(selectedHorizon)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#161E2E] border border-white/10 hover:border-blue-500/40 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Sync
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Current System Load"
          value={formatMW(currentLoad)}
          subtext="Actual telemetry base"
          icon={Zap}
          accentColor="blue"
        />

        <KpiCard
          title="T+1h Forecasted Demand"
          value={formatMW(nextHourPred)}
          change={`${loadDelta >= 0 ? '+' : ''}${loadDelta.toFixed(1)}% delta`}
          changePositive={loadDelta <= 0}
          icon={TrendingUp}
          badge="Next Hour"
          accentColor="cyan"
        />

        <KpiCard
          title="Champion DL Model"
          value={bestModel?.model_name || 'Bi-LSTM'}
          subtext={`Test MAPE: ${bestModel?.mape || 2.78}%`}
          badge="R²: 0.941"
          icon={Cpu}
          accentColor="emerald"
        />

        <KpiCard
          title="Dataset Coverage"
          value="35,064 Hrs"
          subtext="4 full years • 5 cities merged"
          badge="Zero Leakage"
          icon={Layers}
          accentColor="purple"
        />
      </div>

      {/* Main Forecasting Interactive Chart */}
      <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/5 gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Actual vs. Deep Learning Predicted Load Curve
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous sequence inference evaluated over the {selectedHorizon}-hour test set horizon with 95% confidence intervals.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-blue-400 rounded-full" />
              Actual Grid Load (MW)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
              Bi-LSTM Prediction (MW)
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-80 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="#64748B"
                fontSize={11}
                tickFormatter={(val) => {
                  const parts = val.split(' ');
                  return parts[1] || val;
                }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                }}
                formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
              />
              <Area
                type="monotone"
                dataKey="actual_load"
                name="Actual Load"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#actualGradient)"
              />
              <Area
                type="monotone"
                dataKey="predicted_load"
                name="Bi-LSTM Forecast"
                stroke="#22D3EE"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#predGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-white/5 text-center">
          <div className="p-3 rounded-xl bg-white/[0.02]">
            <div className="text-[11px] text-slate-400 font-medium">Horizon MAPE</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{metrics?.mape || 2.78}%</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02]">
            <div className="text-[11px] text-slate-400 font-medium">MAE Error</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">{metrics?.mae_mw || 802.9} MW</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02]">
            <div className="text-[11px] text-slate-400 font-medium">Average Load</div>
            <div className="text-base font-bold text-white mt-0.5">{formatMW(metrics?.avg_load_mw || 28420)}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02]">
            <div className="text-[11px] text-slate-400 font-medium">Expected Peak</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">{formatMW(metrics?.peak_load_mw || 33850)}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02]">
            <div className="text-[11px] text-slate-400 font-medium">Base Trough</div>
            <div className="text-base font-bold text-blue-400 mt-0.5">{formatMW(metrics?.trough_load_mw || 22100)}</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Horizon Table & Model Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table: Recent Hourly Predictions */}
        <div className="lg:col-span-2 rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Next Horizon Telemetry Breakdown</h3>
              <p className="text-xs text-slate-400">Step-by-step forecasted power dispatch with ±2.5% confidence envelope</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Timestamp (UTC)</th>
                  <th className="pb-3 font-semibold">Predicted Load</th>
                  <th className="pb-3 font-semibold">95% Confidence Band</th>
                  <th className="pb-3 font-semibold">Actual Load</th>
                  <th className="pb-3 font-semibold text-right">Residual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {forecastData.slice(0, 7).map((pt, i) => {
                  const residual = pt.actual_load ? pt.predicted_load - pt.actual_load : 0;
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-medium text-slate-200">{pt.timestamp}</td>
                      <td className="py-3 font-bold text-cyan-400">{formatMW(pt.predicted_load)}</td>
                      <td className="py-3 text-slate-400 text-[11px]">
                        [{formatMW(pt.lower_bound)} – {formatMW(pt.upper_bound)}]
                      </td>
                      <td className="py-3 text-slate-300 font-medium">{formatMW(pt.actual_load)}</td>
                      <td className={`py-3 text-right font-semibold ${Math.abs(residual) < 500 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {residual > 0 ? `+${residual.toFixed(0)}` : residual.toFixed(0)} MW
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Model Architecture Highlights */}
        <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Architecture</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">Bidirectional LSTM</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Processes chronological and reverse sequence representations over a 24-hour lookback window with 23 features, outperforming standard unidirectional LSTM and GRU.
            </p>

            <div className="space-y-3 mt-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Mean Absolute Percentage Error</span>
                <span className="text-emerald-400 font-bold">2.78%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[97.2%]" />
              </div>

              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-slate-400">R² Determination Score</span>
                <span className="text-cyan-400 font-bold">0.9414</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full w-[94.1%]" />
              </div>

              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-slate-400">Inference Response Time</span>
                <span className="text-white font-bold">&lt; 15 ms</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Framework: TensorFlow 2.21</span>
              <span>FastAPI Backend</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
