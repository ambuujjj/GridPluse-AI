'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { fetchPrediction, ForecastPoint } from '@/services/api';
import { formatMW } from '@/lib/utils';

export default function ForecastPage() {
  const [modelName, setModelName] = useState('Bi-LSTM');
  const [horizon, setHorizon] = useState(24);
  const [startOffset, setStartOffset] = useState(0);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getForecast() {
      setLoading(true);
      try {
        const res = await fetchPrediction(modelName, horizon, startOffset);
        setForecast(res.forecast);
        setMetrics(res.summary_metrics);
      } catch (e) {
        console.error('Forecast fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    getForecast();
  }, [modelName, horizon, startOffset]);

  const handleDownloadCSV = () => {
    if (!forecast.length) return;
    const headers = ['Timestamp', 'Predicted_Load_MW', 'Lower_Bound_MW', 'Upper_Bound_MW', 'Actual_Load_MW'];
    const rows = forecast.map((f) => [
      f.timestamp,
      f.predicted_load,
      f.lower_bound,
      f.upper_bound,
      f.actual_load || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `load_forecast_${modelName}_${horizon}h.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Operational Dispatch Forecasting
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Interactive Load Forecasting Studio
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate point forecasts and uncertainty envelopes for transmission system dispatch scheduling.
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Forecast CSV
        </button>
      </div>

      {/* Control Panel */}
      <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Model Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Model Architecture</label>
          <div className="grid grid-cols-2 gap-2">
            {['Bi-LSTM', 'GRU', 'LSTM', 'CNN-LSTM'].map((m) => (
              <button
                key={m}
                onClick={() => setModelName(m)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  modelName === m
                    ? 'bg-blue-600/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Horizon Selector */}
        <div>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-300">Prediction Horizon</span>
            <span className="font-mono text-cyan-400 font-bold">{horizon} Hours Ahead</span>
          </div>
          <input
            type="range"
            min={6}
            max={168}
            step={6}
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>6h (Intraday)</span>
            <span>24h (Day-Ahead)</span>
            <span>168h (1-Week)</span>
          </div>
        </div>

        {/* Test Set Timeline Offset */}
        <div>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-300">Timeline Slice Offset</span>
            <span className="font-mono text-cyan-400 font-bold">Hour +{startOffset}</span>
          </div>
          <input
            type="range"
            min={0}
            max={500}
            step={24}
            value={startOffset}
            onChange={(e) => setStartOffset(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>June 2018</span>
            <span>October 2018</span>
            <span>December 2018</span>
          </div>
        </div>
      </div>

      {/* Main Forecast Chart with Confidence Band */}
      <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/5 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {modelName} Dispatch Forecast Curve ({horizon} Hours Ahead)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual-layer uncertainty band visualizing 95% confidence interval boundaries.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-0.5 bg-blue-500 rounded-full" />
              Actual Grid Telemetry
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
              Model Point Forecast
            </span>
          </div>
        </div>

        <div className="h-80 w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickFormatter={(val) => val.split(' ')[1] || val} />
              <YAxis stroke="#64748B" fontSize={11} domain={['auto', 'auto']} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }}
                formatter={(val: any) => [`${Number(val).toLocaleString()} MW`]}
              />
              <Area type="monotone" dataKey="upper_bound" name="95% Upper CI" stroke="none" fill="url(#bandGradient)" />
              <Area type="monotone" dataKey="actual_load" name="Actual Load" stroke="#3B82F6" strokeWidth={2} fillOpacity={0} />
              <Area type="monotone" dataKey="predicted_load" name="Predicted Load" stroke="#22D3EE" strokeWidth={2.5} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Data Table */}
      <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
        <h3 className="text-base font-bold text-white mb-4">Detailed Hourly Predictions Table</h3>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider sticky top-0 bg-[#111827]">
                <th className="pb-3 font-semibold">Step</th>
                <th className="pb-3 font-semibold">Timestamp (UTC)</th>
                <th className="pb-3 font-semibold">Predicted Demand</th>
                <th className="pb-3 font-semibold">95% Range</th>
                <th className="pb-3 font-semibold">Actual Telemetry</th>
                <th className="pb-3 font-semibold text-right">Residual Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {forecast.map((pt, idx) => {
                const residual = pt.actual_load ? pt.predicted_load - pt.actual_load : 0;
                return (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 text-slate-400">T+{idx + 1}h</td>
                    <td className="py-2.5 text-slate-200 font-sans">{pt.timestamp}</td>
                    <td className="py-2.5 text-cyan-400 font-bold">{formatMW(pt.predicted_load)}</td>
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {formatMW(pt.lower_bound)} – {formatMW(pt.upper_bound)}
                    </td>
                    <td className="py-2.5 text-slate-300 font-sans">{formatMW(pt.actual_load)}</td>
                    <td className={`py-2.5 text-right font-semibold ${Math.abs(residual) < 600 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {residual > 0 ? `+${residual.toFixed(0)}` : residual.toFixed(0)} MW
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
