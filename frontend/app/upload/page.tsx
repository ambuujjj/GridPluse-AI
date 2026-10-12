'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Database,
  Clock,
  Trash2,
  Eye,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Activity,
  Columns3,
  TableProperties,
  ScatterChart as ScatterIcon,
  Grid3X3,
  Download,
  Search,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from 'recharts';
import {
  uploadAndAnalyze,
  fetchReports,
  fetchReport,
  deleteReport,
  reconfigureDatasetReport,
  DatasetReport,
  ReportSummary,
} from '@/services/api';

// ---------- Color Palette ----------
const CHART_COLORS = ['#3B82F6', '#22D3EE', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#6366F1'];
const GRADIENT_COLORS = {
  blue: ['#3B82F6', '#1D4ED8'],
  cyan: ['#22D3EE', '#0891B2'],
  amber: ['#F59E0B', '#D97706'],
  rose: ['#F43F5E', '#BE123C'],
  emerald: ['#10B981', '#059669'],
  violet: ['#8B5CF6', '#6D28D9'],
};

// ---------- Helpers ----------
function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(2);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}

function downloadText(filename: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string) {
  const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

// ---------- Drag-and-Drop Zone ----------
function DropZone({ onFile, isUploading, progress }: {
  onFile: (f: File) => void;
  isUploading: boolean;
  progress: number;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 group
        ${dragOver
          ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
          : 'border-white/10 bg-[#111827]/60 hover:border-blue-500/40 hover:bg-blue-500/5'
        }
        ${isUploading ? 'pointer-events-none' : ''}
      `}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      {isUploading ? (
        <div className="space-y-4 relative z-10">
          <Loader2 className="w-12 h-12 text-cyan-400 mx-auto animate-spin" />
          <p className="text-white font-semibold text-lg">Analyzing your dataset...</p>
          <div className="w-64 mx-auto bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: `${Math.max(progress, 15)}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm">
            {progress < 50 ? 'Uploading CSV...' : 'Profiling columns, quality checks, and statistical summaries...'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
            <Upload className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl">Drop your CSV here</p>
            <p className="text-slate-400 text-sm mt-1">or click to browse • Supports any tabular CSV dataset</p>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 mt-2">
            <span className="flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> CSV format</span>
            <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Auto-EDA</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Time-series</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Report Card (for report list) ----------
function ReportCard({ report, onView, onDelete }: {
  report: ReportSummary;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#111827]/80 border border-white/10 p-5 hover:border-blue-500/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm truncate max-w-[220px]">{report.filename}</p>
            <p className="text-slate-500 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDate(report.generated_at)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
        <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {formatNumber(report.total_rows)} rows</span>
        <span className="flex items-center gap-1"><Columns3 className="w-3 h-3" /> {report.total_columns} cols</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-semibold hover:bg-blue-600/30 border border-blue-500/20 transition-all"
        >
          <Eye className="w-3.5 h-3.5" /> View Report
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="px-3 py-2 rounded-lg bg-rose-600/10 text-rose-400 text-xs font-semibold hover:bg-rose-600/20 border border-rose-500/20 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---------- Section Wrapper ----------
function ReportSection({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-[#111827]/90 border border-white/10 overflow-hidden backdrop-blur-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}

// ---------- KPI Mini Card ----------
function MiniKpi({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-600 to-blue-800 text-blue-400 border-blue-500/20',
    cyan: 'from-cyan-600 to-cyan-800 text-cyan-400 border-cyan-500/20',
    amber: 'from-amber-600 to-amber-800 text-amber-400 border-amber-500/20',
    rose: 'from-rose-600 to-rose-800 text-rose-400 border-rose-500/20',
    emerald: 'from-emerald-600 to-emerald-800 text-emerald-400 border-emerald-500/20',
    violet: 'from-violet-600 to-violet-800 text-violet-400 border-violet-500/20',
  };
  const c = colorMap[color] || colorMap.blue;
  const [grad, text, border] = [c.split(' ')[0] + ' ' + c.split(' ')[1] + ' ' + c.split(' ')[2], c.split(' ')[3], c.split(' ')[4]];

  return (
    <div className={`rounded-xl border ${border} bg-white/[0.02] p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${grad} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className={`text-lg font-bold ${text}`}>{value}</p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function UploadAnalyzePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<DatasetReport | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Load previous reports
  useEffect(() => {
    async function load() {
      setLoadingReports(true);
      const data = await fetchReports();
      setReports(data);
      setLoadingReports(false);
    }
    load();
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) { setError('Choose a .csv file.'); return; }
    if (file.size > 50 * 1024 * 1024) { setError('This file exceeds the 50 MB upload limit.'); return; }
    if (file.size === 0) { setError('The selected file is empty.'); return; }
    setIsUploading(true);
    setProgress(0);

    try {
      const report = await uploadAndAnalyze(file, (pct) => {
        setProgress(Math.min(pct * 0.5, 50)); // Upload is first 50%
      });

      setProgress(100);
      setActiveReport(report);

      // Refresh report list
      const updated = await fetchReports();
      setReports(updated);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  const handleViewReport = useCallback(async (reportId: string) => {
    const report = await fetchReport(reportId);
    if (report) setActiveReport(report);
  }, []);

  const handleDeleteReport = useCallback(async (reportId: string) => {
    await deleteReport(reportId);
    setReports(prev => prev.filter(r => r.report_id !== reportId));
    if (activeReport?.report_id === reportId) setActiveReport(null);
  }, [activeReport]);

  // ========== REPORT VIEW ==========
  if (activeReport) {
    return <ReportView key={activeReport.report_id} report={activeReport} onBack={() => setActiveReport(null)} onUpdate={setActiveReport} />;
  }

  // ========== UPLOAD VIEW ==========
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          Custom Dataset Intelligence
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Upload & Auto-Analyze
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload any CSV dataset and get instant comprehensive EDA reports — distributions, correlations, time-series patterns, outlier detection, and more.
        </p>
      </div>

      {/* Drop Zone */}
      <DropZone onFile={handleUpload} isUploading={isUploading} progress={progress} />
      <p className="-mt-5 px-1 text-[10px] leading-relaxed text-slate-500">CSV files are processed by the configured GridPulse API and retained with their report on that server. Deleting a report also removes its retained source file. Do not upload data you are not authorized to process.</p>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Previous Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Previous Analysis Reports
          </h2>
          <span className="text-xs text-slate-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
        </div>

        {loadingReports ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#111827]/50 border border-white/5">
            <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No reports yet. Upload a CSV to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((r) => (
              <ReportCard
                key={r.report_id}
                report={r}
                onView={() => handleViewReport(r.report_id)}
                onDelete={() => handleDeleteReport(r.report_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// FULL REPORT VIEW
// ============================================================
function ReportView({ report, onBack, onUpdate }: { report: DatasetReport; onBack: () => void; onUpdate: (report: DatasetReport) => void }) {
  const ov = report.dataset_overview;
  const dq = report.data_quality;
  const ts = report.time_series_analytics;
  const corrCols = Object.keys(report.correlation_matrix || {});
  const [selectedDatetime, setSelectedDatetime] = useState(ov.datetime_column || '');
  const [selectedTarget, setSelectedTarget] = useState(ov.target_column || '');
  const [reconfiguring, setReconfiguring] = useState(false);
  const [configError, setConfigError] = useState('');
  const [profileQuery, setProfileQuery] = useState('');
  const [sampleQuery, setSampleQuery] = useState('');
  const analystInsights: string[] = [];
  if (dq.complete_rows_percent < 95) analystInsights.push(`Only ${dq.complete_rows_percent}% of rows are complete; assess missingness by feature before imputation.`);
  if ((dq.duplicate_rows ?? 0) > 0) analystInsights.push(`${dq.duplicate_rows?.toLocaleString()} duplicate rows can overweight repeated observations.`);
  if (dq.high_missing_columns?.length) analystInsights.push(`High missingness (≥20%) in ${dq.high_missing_columns.slice(0, 4).join(', ')}${dq.high_missing_columns.length > 4 ? ', …' : ''}.`);
  if (dq.constant_columns?.length) analystInsights.push(`Remove or investigate constant features: ${dq.constant_columns.slice(0, 4).join(', ')}.`);
  const targetCorrelations = ov.target_column ? Object.entries(report.correlation_matrix).map(([feature, values]) => ({ feature, value: values[ov.target_column!] })).filter((row): row is { feature: string; value: number } => row.value != null && row.feature !== ov.target_column).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 3) : [];
  if (targetCorrelations.length) analystInsights.push(`Strongest linear associations with ${ov.target_column}: ${targetCorrelations.map((row) => `${row.feature} (${row.value > 0 ? '+' : ''}${row.value.toFixed(2)})`).join(', ')}. Correlation does not establish causality.`);
  if (ov.datetime_column && ts.time_series_trend?.length) analystInsights.push(`Time index detected across ${ts.time_series_trend.length.toLocaleString()} sampled points; verify regular cadence and timezone before forecasting.`);
  if (!analystInsights.length) analystInsights.push('No major completeness or duplication flags were detected by the current profile. Validate domain-specific ranges and measurement units before model training.');
  const runConfiguration = async () => {
    setReconfiguring(true);
    setConfigError('');
    try {
      const refreshed = await reconfigureDatasetReport(report.report_id, selectedDatetime, selectedTarget);
      onUpdate(refreshed);
    } catch (err: any) {
      setConfigError(err?.response?.data?.detail || err?.message || 'Could not re-run analysis with this configuration.');
    } finally {
      setReconfiguring(false);
    }
  };
  const exportDictionary = () => {
    const rows = [['column', 'dtype', 'non_null_count', 'null_count', 'null_percent', 'unique_count', 'mean', 'std', 'min', 'q25', 'median', 'q75', 'max', 'skewness', 'kurtosis']];
    report.column_profiles.forEach((col) => rows.push([col.name, col.dtype, String(col.non_null_count), String(col.null_count), String(col.null_percent), String(col.unique_count), String(col.mean ?? ''), String(col.std ?? ''), String(col.min ?? ''), String(col.q25 ?? ''), String(col.median ?? ''), String(col.q75 ?? ''), String(col.max ?? ''), String(col.skewness ?? ''), String(col.kurtosis ?? '')]));
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
    downloadText(`${report.filename.replace(/\.csv$/i, '')}-data-dictionary.csv`, csv, 'text/csv;charset=utf-8');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-blue-400 text-xs font-semibold mb-2 hover:underline flex items-center gap-1">
            ← Back to Upload
          </button>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Auto-Generated Report
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            {report.filename}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Generated {formatDate(report.generated_at)} • Report ID: {report.report_id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadText(`${report.filename.replace(/\.csv$/i, '')}-analysis.json`, JSON.stringify(report, null, 2), 'application/json')} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-cyan-400/30"><Download size={14}/> JSON report</button>
          <button onClick={exportDictionary} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-cyan-400/30"><FileSpreadsheet size={14}/> Data dictionary</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniKpi label="Total Rows" value={formatNumber(ov.total_rows)} icon={Database} color="blue" />
        <MiniKpi label="Columns" value={ov.total_columns} icon={Columns3} color="cyan" />
        <MiniKpi label="Memory" value={`${ov.memory_usage_mb} MB`} icon={Activity} color="violet" />
        <MiniKpi label="Numeric Cols" value={ov.numeric_columns.length} icon={BarChart3} color="emerald" />
        <MiniKpi label="Missing Cols" value={dq.columns_with_missing} icon={AlertTriangle} color="amber" />
        <MiniKpi label="Complete Rows" value={`${dq.complete_rows_percent}%`} icon={CheckCircle2} color="emerald" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs text-slate-400">DATA QUALITY SCORE</p><p className={`mt-2 text-4xl font-extrabold ${(dq.quality_score ?? dq.complete_rows_percent) >= 90 ? 'text-emerald-300' : (dq.quality_score ?? dq.complete_rows_percent) >= 75 ? 'text-amber-300' : 'text-rose-300'}`}>{dq.quality_score ?? dq.complete_rows_percent}<span className="text-base text-slate-500"> / 100</span></p></div><ShieldCheck className="h-6 w-6 text-cyan-300"/></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${Math.max(0, Math.min(100, dq.quality_score ?? dq.complete_rows_percent))}%` }}/></div>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">Composite score summarizes completeness, duplicates, and constant-feature checks. Review each check before modeling.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-bold text-white">Dataset readiness checks</h3><p className="mt-1 text-[10px] text-slate-500">Automated profile · review findings against domain expectations</p></div><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-400">{dq.checks?.length ?? 2} checks</span></div><div className="grid gap-2 sm:grid-cols-2">{(dq.checks || [{ name: 'Missing values', status: dq.columns_with_missing ? 'warning' as const : 'pass' as const, detail: `${dq.columns_with_missing} columns contain missing values.` }, { name: 'Complete rows', status: dq.complete_rows_percent >= 95 ? 'pass' as const : 'warning' as const, detail: `${dq.complete_rows_percent}% rows are complete.` }]).map((check) => <div key={check.name} className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[.02] p-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${check.status === 'pass' ? 'bg-emerald-400' : check.status === 'warning' ? 'bg-amber-400' : 'bg-slate-500'}`}/><div><div className="text-xs font-semibold text-slate-200">{check.name}</div><div className="mt-1 text-[10px] leading-relaxed text-slate-500">{check.detail}</div></div></div>)}</div>{(dq.duplicate_rows ?? 0) > 0 && <p className="mt-3 text-[10px] text-amber-300">{dq.duplicate_rows?.toLocaleString()} duplicate rows detected ({dq.duplicate_rows_percent}%).</p>}</div>
      </div>

      <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-r from-cyan-500/[.04] via-[#111827]/90 to-blue-500/[.04] p-5"><div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300"/><h3 className="text-sm font-bold text-white">Profile findings & recommended next steps</h3><span className="ml-auto text-[9px] uppercase tracking-wider text-slate-500">Computed from this report</span></div><div className="grid gap-2 md:grid-cols-2">{analystInsights.slice(0, 6).map((insight, index) => <div key={insight} className="flex gap-2 rounded-lg border border-white/5 bg-black/10 p-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-400/10 text-[9px] text-cyan-300">0{index + 1}</span><span className="text-[11px] leading-relaxed text-slate-300">{insight}</span></div>)}</div></div>

      {/* Auto-Detected Info */}
      <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-5 backdrop-blur-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Auto-Detected Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
            <label className="mb-1 block text-xs text-slate-400" htmlFor="report-datetime">Datetime Column</label>
            <select id="report-datetime" value={selectedDatetime} onChange={(event) => setSelectedDatetime(event.target.value)} className="w-full rounded-md border border-white/10 bg-[#0b1220] px-2 py-2 text-xs text-white"><option value="">None / not a time series</option>{ov.column_names.map((column) => <option key={column} value={column}>{column}</option>)}</select>
            {ov.date_range && (
              <p className="text-slate-500 text-xs mt-1">{ov.date_range.start} → {ov.date_range.end}</p>
            )}
          </div>
          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
            <label className="mb-1 block text-xs text-slate-400" htmlFor="report-target">Target Variable</label>
            <select id="report-target" value={selectedTarget} onChange={(event) => setSelectedTarget(event.target.value)} className="w-full rounded-md border border-white/10 bg-[#0b1220] px-2 py-2 text-xs text-white"><option value="">None / profile only</option>{ov.numeric_columns.map((column) => <option key={column} value={column}>{column}</option>)}</select>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
            <p className="text-slate-400 text-xs mb-1">Feature Categories</p>
            <p className="text-white font-semibold">{ov.numeric_columns.length} numeric • {ov.categorical_columns.length} categorical</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4"><button disabled={reconfiguring} onClick={runConfiguration} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${reconfiguring ? 'animate-spin' : ''}`}/>{reconfiguring ? 'Re-running analysis…' : 'Apply roles & re-run analysis'}</button><span className="text-[10px] text-slate-500">Recalculates time-series and target analyses from the retained CSV.</span>{configError && <span role="alert" className="w-full text-xs text-rose-300">{configError}</span>}</div>
      </div>

      {/* Data Quality Section */}
      <ReportSection title="Data Quality & Missing Values" icon={AlertTriangle}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 text-center">
              <p className="text-xs text-slate-400">Complete Rows</p>
              <p className="text-xl font-bold text-emerald-400">{dq.complete_rows_percent}%</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 text-center">
              <p className="text-xs text-slate-400">Columns w/ Missing</p>
              <p className="text-xl font-bold text-amber-400">{dq.columns_with_missing}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 text-center">
              <p className="text-xs text-slate-400">Total Rows</p>
              <p className="text-xl font-bold text-blue-400">{formatNumber(dq.total_rows)}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 text-center">
              <p className="text-xs text-slate-400">Complete Rows #</p>
              <p className="text-xl font-bold text-cyan-400">{formatNumber(dq.complete_rows)}</p>
            </div>
          </div>

          {/* Missing per column bar chart */}
          {dq.per_column.filter(c => c.missing_count > 0).length > 0 && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dq.per_column.filter(c => c.missing_count > 0).slice(0, 20)}
                  margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="column" stroke="#64748B" fontSize={10} angle={-35} textAnchor="end" interval={0} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }}
                    formatter={(val: any, name?: string | number) => [
                      name === 'missing_percent' ? `${val}%` : val,
                      name === 'missing_percent' ? 'Missing %' : 'Missing Count'
                    ]}
                  />
                  <Bar dataKey="missing_percent" name="Missing %" fill="#F59E0B" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {dq.per_column.filter(c => c.missing_count > 0).length === 0 && (
            <div className="text-center py-8 text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> No missing values detected — your dataset is fully complete!
            </div>
          )}
        </div>
      </ReportSection>

      {/* Column Profiles Section */}
      <ReportSection title="Column Statistical Profiles" icon={TableProperties} defaultOpen={false}>
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b1220] px-3"><Search className="h-4 w-4 text-slate-500"/><input value={profileQuery} onChange={(event) => setProfileQuery(event.target.value)} placeholder="Search column names or data types…" className="h-10 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-500"/><span className="text-[10px] text-slate-500">{report.column_profiles.filter((col) => `${col.name} ${col.dtype}`.toLowerCase().includes(profileQuery.toLowerCase())).length} columns</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-slate-400 font-semibold">Column</th>
                <th className="text-left py-2 px-3 text-slate-400 font-semibold">Type</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">Non-Null</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">Null %</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">Unique</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">Mean</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">Std</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">Min</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">Max</th>
              </tr>
            </thead>
            <tbody>
              {report.column_profiles.filter((col) => `${col.name} ${col.dtype}`.toLowerCase().includes(profileQuery.toLowerCase())).map((col, i) => (
                <tr key={col.name} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="py-2 px-3 text-white font-medium truncate max-w-[200px]">{col.name}</td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold
                      ${col.dtype.includes('float') || col.dtype.includes('int') ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'}
                    `}>
                      {col.dtype}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300">{formatNumber(col.non_null_count)}</td>
                  <td className="py-2 px-3 text-right">
                    <span className={col.null_percent > 5 ? 'text-amber-400' : 'text-emerald-400'}>{col.null_percent}%</span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300">{formatNumber(col.unique_count)}</td>
                  <td className="py-2 px-3 text-right text-slate-300">{col.mean != null ? formatNumber(col.mean) : '—'}</td>
                  <td className="py-2 px-3 text-right text-slate-300">{col.std != null ? formatNumber(col.std) : '—'}</td>
                  <td className="py-2 px-3 text-right text-slate-300">{col.min != null ? formatNumber(col.min) : '—'}</td>
                  <td className="py-2 px-3 text-right text-slate-300">{col.max != null ? formatNumber(col.max) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Distributions Section */}
      {Object.keys(report.distributions).length > 0 && (
        <ReportSection title="Feature Distributions" icon={BarChart3}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(report.distributions).map(([colName, dist], idx) => (
              <div key={colName} className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-white mb-3 truncate">{colName}</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dist.bins.map((b, i) => ({ bin: dist.bin_labels[i], count: dist.counts[i] }))} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="bin" stroke="#64748B" fontSize={9} angle={-30} textAnchor="end" interval={Math.floor(dist.bins.length / 6)} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF', fontSize: '11px' }}
                      />
                      <Bar dataKey="count" fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={[3, 3, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {/* Correlation Matrix */}
      {corrCols.length > 1 && (
        <ReportSection title="Correlation Matrix" icon={Grid3X3}>
          <div className="overflow-x-auto">
            <table className="text-xs min-w-full">
              <thead>
                <tr>
                  <th className="py-2 px-2 text-slate-400 font-semibold text-left sticky left-0 bg-[#111827] z-10" />
                  {corrCols.map(col => (
                    <th key={col} className="py-2 px-2 text-slate-400 font-semibold text-center" style={{ maxWidth: '80px' }}>
                      <span className="block truncate" style={{ maxWidth: '70px' }} title={col}>{col.length > 10 ? col.slice(0, 10) + '…' : col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corrCols.map((row) => (
                  <tr key={row}>
                    <td className="py-1.5 px-2 text-white font-medium sticky left-0 bg-[#111827] z-10 truncate" style={{ maxWidth: '120px' }} title={row}>
                      {row.length > 14 ? row.slice(0, 14) + '…' : row}
                    </td>
                    {corrCols.map(col => {
                      const val = report.correlation_matrix[col]?.[row];
                      const absVal = Math.abs(val || 0);
                      let bg = 'bg-transparent';
                      if (val !== null && val !== undefined) {
                        if (val > 0.7) bg = 'bg-blue-500/40';
                        else if (val > 0.4) bg = 'bg-blue-500/20';
                        else if (val < -0.7) bg = 'bg-rose-500/40';
                        else if (val < -0.4) bg = 'bg-rose-500/20';
                        else bg = 'bg-white/[0.03]';
                      }
                      return (
                        <td key={col} className={`py-1.5 px-2 text-center ${bg} border border-white/5`}>
                          <span className={`text-[11px] font-mono ${absVal > 0.5 ? 'text-white font-bold' : 'text-slate-400'}`}>
                            {val != null ? val.toFixed(2) : '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      {/* Outlier Analysis */}
      {Object.keys(report.outlier_analysis).length > 0 && (
        <ReportSection title="Outlier Detection (IQR Method)" icon={AlertTriangle} defaultOpen={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(report.outlier_analysis).map(([col, info]) => (
              <div key={col} className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-white mb-2 truncate">{col}</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outlier Count</span>
                    <span className={info.outlier_percent > 5 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {info.outlier_count} ({info.outlier_percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${info.outlier_percent > 5 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(info.outlier_percent * 3, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Q1: {formatNumber(info.q1)}</span>
                    <span>Q3: {formatNumber(info.q3)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Lower: {formatNumber(info.lower_fence)}</span>
                    <span>Upper: {formatNumber(info.upper_fence)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {/* Time Series Analytics */}
      {(ts.hourly_profile || ts.monthly_trend || ts.time_series_trend || ts.day_of_week_profile) && (
        <ReportSection title="Time Series Analytics" icon={TrendingUp}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Profile */}
            {ts.hourly_profile && ts.hourly_profile.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Hourly Average Pattern</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ts.hourly_profile} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="hour" stroke="#64748B" fontSize={10} tickFormatter={h => `${h}:00`} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }} />
                      <Area type="monotone" dataKey="avg_value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Day of Week */}
            {ts.day_of_week_profile && ts.day_of_week_profile.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Day of Week Pattern</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ts.day_of_week_profile} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }} />
                      <Bar dataKey="avg_value" fill="#22D3EE" radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Monthly Trend */}
            {ts.monthly_trend && ts.monthly_trend.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Monthly Trend</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ts.monthly_trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748B" fontSize={10} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }} />
                      <Bar dataKey="avg_value" name="Average" fill="#F59E0B" radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Time Series Trend with Rolling Mean */}
            {ts.time_series_trend && ts.time_series_trend.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Overall Trend (with Rolling Mean)</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ts.time_series_trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="timestamp" stroke="#64748B" fontSize={9} tickFormatter={() => ''} />
                      <YAxis stroke="#64748B" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line type="monotone" dataKey="value" name="Raw" stroke="#64748B" strokeWidth={1} dot={false} opacity={0.5} />
                      <Line type="monotone" dataKey="rolling_mean" name="Rolling Mean" stroke="#22D3EE" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </ReportSection>
      )}

      {/* Scatter Analysis */}
      {report.scatter_analysis.length > 0 && (
        <ReportSection title="Feature vs Target Scatter Analysis" icon={ScatterIcon} defaultOpen={false}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {report.scatter_analysis.map((scatter, idx) => (
              <div key={scatter.feature} className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-white mb-1 truncate">
                  {ov.target_column} vs {scatter.feature}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Pearson r = <span className={`font-bold ${Math.abs(scatter.correlation || 0) > 0.5 ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {scatter.correlation?.toFixed(3) ?? '—'}
                  </span>
                </p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" dataKey="x" name={scatter.feature} stroke="#64748B" fontSize={10} />
                      <YAxis type="number" dataKey="y" name={ov.target_column || 'Target'} stroke="#64748B" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF', fontSize: '11px' }}
                        cursor={{ strokeDasharray: '3 3' }}
                      />
                      <Scatter data={scatter.points} fill={CHART_COLORS[idx % CHART_COLORS.length]} opacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {/* Sample Data Table */}
      <ReportSection title="Sample Data Preview (First 20 Rows)" icon={TableProperties} defaultOpen={false}>
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b1220] px-3"><Search className="h-4 w-4 text-slate-500"/><input value={sampleQuery} onChange={(event) => setSampleQuery(event.target.value)} placeholder="Search values in the preview…" className="h-10 min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-500"/><button onClick={() => { const header = report.sample_data.columns; const rows = report.sample_data.rows.filter((row) => header.some((column) => String(row[column] ?? '').toLowerCase().includes(sampleQuery.toLowerCase()))); const csv = [header, ...rows.map((row) => header.map((column) => String(row[column] ?? '')))].map((row) => row.map(csvEscape).join(',')).join('\r\n'); downloadText(`${report.filename.replace(/\.csv$/i, '')}-sample.csv`, csv, 'text/csv;charset=utf-8'); }} className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-slate-300"><Download size={12}/> Export preview</button></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                {report.sample_data.columns.map(col => (
                  <th key={col} className="text-left py-2 px-2 text-slate-400 font-semibold whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.sample_data.rows.filter((row) => report.sample_data.columns.some((column) => String(row[column] ?? '').toLowerCase().includes(sampleQuery.toLowerCase()))).map((row, i) => (
                <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                  {report.sample_data.columns.map(col => (
                    <td key={col} className="py-1.5 px-2 text-slate-300 whitespace-nowrap truncate max-w-[150px]">
                      {row[col] != null ? String(row[col]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>
    </div>
  );
}
