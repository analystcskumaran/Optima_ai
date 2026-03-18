"use client";

/**
 * MetricsPane.tsx — Optional Model Quality Metrics
 *
 * PURPOSE: When the user specifies a target column, this pane calls /api/metrics
 *   and shows classification (F1/Accuracy) or regression (MAE/R²) metrics.
 *   For Beginners, shows simple "Good / Fair / Poor" labels. For Seniors, shows raw numbers.
 *
 * PROPS:
 *   cleanedFilePath — file_path of the cleaned CSV served by the backend
 *   showAdvanced    — Senior mode (from useRole)
 */

import { useState } from "react";
import type { MetricsResponse } from "@/lib/schemas";
import * as api from "@/lib/api";

interface MetricsPaneProps {
  cleanedFilePath: string | null;
  showAdvanced?: boolean;
}

type TaskType = "classification" | "regression";

function MetricCard({ label, value, good, great }: { label: string; value: number; good: number; great: number }) {
  const pct = Math.min(100, (value / Math.max(good, great)) * 100);
  const color = value >= great ? "bg-emerald-500" : value >= good ? "bg-yellow-500" : "bg-red-500";
  const textColor = value >= great ? "text-emerald-400" : value >= good ? "text-yellow-400" : "text-red-400";
  const rating = value >= great ? "Great" : value >= good ? "Good" : "Needs Improvement";

  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-slate-400 font-medium">{label}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-current/10 ${textColor}`}>{rating}</span>
      </div>
      <p className={`text-[24px] font-bold font-mono mb-3 ${textColor}`}>{(value * 100).toFixed(1)}%</p>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MetricsPane({ cleanedFilePath, showAdvanced = false }: MetricsPaneProps) {
  const [targetColumn, setTargetColumn] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("classification");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMetrics = async () => {
    if (!cleanedFilePath || !targetColumn) return;
    setLoading(true);
    setError(null);
    setMetrics(null);
    try {
      const data = await api.computeMetrics(cleanedFilePath, targetColumn, taskType);
      setMetrics(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!cleanedFilePath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-2xl">📊</div>
        <p className="text-[13px] font-semibold text-slate-300">Metrics Unavailable</p>
        <p className="text-[11px] text-slate-500 max-w-xs">Clean the dataset first to enable quality metrics evaluation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
      {/* Config Row */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-[12px] font-semibold text-slate-300">Quality Metrics</span>
        </div>
        <div className="flex gap-2">
          <input
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            placeholder="Target column name (e.g. 'label')"
            className="flex-1 px-3 py-2 bg-[#0d1117] border border-white/10 rounded-lg text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40"
          />
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskType)}
            className="px-3 py-2 bg-[#0d1117] border border-white/10 rounded-lg text-[12px] text-slate-300 focus:outline-none focus:border-violet-500/40"
          >
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
          </select>
          <button
            onClick={runMetrics}
            disabled={!targetColumn || loading}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-all"
          >
            {loading ? "Running..." : "Evaluate"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400">
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {metrics && (
        <div className="flex-1 overflow-auto custom-scrollbar flex flex-col gap-3">
          <p className="text-[11px] text-slate-500">
            Task: <strong className="text-slate-300">{metrics.task}</strong> · Target: <strong className="text-slate-300">{targetColumn}</strong>
          </p>

          {metrics.task === "classification" && (
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Accuracy" value={metrics.accuracy} good={0.7} great={0.85} />
              <MetricCard label="F1 Score" value={metrics.f1} good={0.7} great={0.85} />
              <MetricCard label="Precision" value={metrics.precision} good={0.7} great={0.85} />
              <MetricCard label="Recall" value={metrics.recall} good={0.7} great={0.85} />
            </div>
          )}

          {metrics.task === "regression" && (
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="R² Score" value={metrics.r2} good={0.6} great={0.8} />
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-[11px] text-slate-400 mb-1">MAE</p>
                <p className="text-[22px] font-bold text-blue-400 font-mono">{metrics.mae.toFixed(4)}</p>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-[11px] text-slate-400 mb-1">MSE</p>
                <p className="text-[22px] font-bold text-blue-400 font-mono">{metrics.mse.toFixed(4)}</p>
              </div>
            </div>
          )}

          {showAdvanced && (
            <pre className="text-[10px] text-slate-600 font-mono p-3 bg-black/20 rounded-xl border border-white/5 overflow-x-auto">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Empty state prior to run */}
      {!metrics && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
          <p className="text-[12px] text-slate-500">Enter a target column and click Evaluate</p>
          <p className="text-[10px] text-slate-600">Works for any column you want to predict / classify</p>
        </div>
      )}
    </div>
  );
}
