"use client";

import { useState, useMemo } from "react";
import { 
  BarChart3, 
  BrainCircuit, 
  Settings2, 
  Play, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  Cpu,
  Zap,
  LineChart,
  Target,
  FileSearch,
  Database
} from "lucide-react";
import type { MetricsResponse } from "@/lib/schemas";
import * as api from "@/lib/api";

type TaskType = "classification" | "regression";

const ALGORITHMS = {
  classification: [
    { id: "logistic_regression", label: "Logistic Regression", icon: Activity },
    { id: "random_forest_clf",   label: "Random Forest",      icon: BrainCircuit },
    { id: "svm_clf",            label: "SVM (SVC)",          icon: Zap },
    { id: "decision_tree_clf",   label: "Decision Tree",      icon: BarChart3 },
    { id: "knn_clf",            label: "K-Nearest Neighbors", icon: Cpu },
    { id: "xgboost_clf",        label: "XGBoost",            icon: Zap },
    { id: "lightgbm_clf",       label: "LightGBM",           icon: Zap },
    { id: "adaboost_clf",       label: "AdaBoost",           icon: BrainCircuit },
  ],
  regression: [
    { id: "linear_regression",   label: "Linear Regression",   icon: LineChart },
    { id: "random_forest_reg",   label: "Random Forest",      icon: BrainCircuit },
    { id: "svm_reg",            label: "SVM (SVR)",          icon: Zap },
    { id: "decision_tree_reg",   label: "Decision Tree",      icon: BarChart3 },
    { id: "ridge",              label: "Ridge Regression",    icon: Activity },
    { id: "lasso",              label: "Lasso Regression",    icon: Activity },
    { id: "elastic_net",        label: "Elastic Net",        icon: Activity },
    { id: "bayesian_ridge",     label: "Bayesian Ridge",     icon: LineChart },
  ]
};

interface MetricCardProps {
  label: string;
  value: number;
  good: number;
  great: number;
  format?: "percent" | "raw";
}

function MetricCard({ label, value, good, great, format = "percent" }: MetricCardProps) {
  const isPercent = format === "percent";
  const displayValue = isPercent ? (value * 100).toFixed(1) + "%" : value.toFixed(4);
  
  const color = value >= great ? "text-emerald-400" : value >= good ? "text-yellow-400" : "text-red-400";
  const bgColor = value >= great ? "bg-emerald-500/10" : value >= good ? "bg-yellow-500/10" : "bg-red-500/10";
  
  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-white/[0.04] transition-all duration-300">
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-black font-mono tracking-tighter ${color}`}>{displayValue}</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold mb-1 ${bgColor} ${color}`}>
          {value >= great ? "EXCELLENT" : value >= good ? "STABLE" : "WEAK"}
        </span>
      </div>
    </div>
  );
}

interface MetricsPaneProps {
  cleanedFilePath: string | null;
  showAdvanced?: boolean;
}

export default function MetricsPane({ cleanedFilePath, showAdvanced = false }: MetricsPaneProps) {
  const [targetColumn, setTargetColumn] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("classification");
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useMemo(() => {
    setSelectedModel(ALGORITHMS[taskType][1].id);
  }, [taskType]);

  const runMetrics = async () => {
    if (!cleanedFilePath || !targetColumn) return;
    setLoading(true);
    setError(null);
    setMetrics(null);
    try {
      const data = await api.computeMetrics(cleanedFilePath, targetColumn, taskType, selectedModel);
      setMetrics(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const currentAlgo = useMemo(() => {
    return ALGORITHMS[taskType]?.find(a => a.id === selectedModel) || ALGORITHMS.classification[0];
  }, [taskType, selectedModel]);

  if (!cleanedFilePath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b1120] h-full">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
          <Database className="w-8 h-8 text-slate-700" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Data Source Required</h3>
        <p className="text-[11px] text-slate-500 max-w-[220px] leading-relaxed">
          The metrics engine requires a cleaned dataset to perform model training and evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-5 gap-5 bg-[#0b1120] h-full">
      
      {/* Header & Config */}
      <div className="space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" />
            <span className="text-[13px] font-bold text-slate-100 tracking-tight">Model Evaluation</span>
          </div>
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => setTaskType("classification")}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${taskType === "classification" ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-slate-500 hover:text-slate-300"}`}
            >
              Classification
            </button>
            <button 
              onClick={() => setTaskType("regression")}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${taskType === "regression" ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-slate-500 hover:text-slate-300"}`}
            >
              Regression
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4 relative group">
            <input
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              placeholder="Target Column Name"
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 transition-all font-medium"
            />
            <FileSearch className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-600 group-focus-within:text-violet-400 transition-colors" />
          </div>

          <div className="col-span-4 relative font-medium text-[11px]">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full appearance-none h-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-violet-500/40 transition-all pr-10"
            >
              {ALGORITHMS[taskType]?.map(algo => (
                <option key={algo.id} value={algo.id}>{algo.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-2.5 pointer-events-none text-slate-600 flex items-center gap-1">
              <currentAlgo.icon className="w-3.5 h-3.5" />
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <button
            onClick={runMetrics}
            disabled={!targetColumn || loading}
            className="col-span-4 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[11px] font-bold rounded-xl transition-all shadow-xl shadow-violet-600/10 active:scale-95"
          >
            {loading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {loading ? "Training..." : "Run Engine"}
          </button>
        </div>
      </div>

      {/* Error View */}
      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3 animate-in shake">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-red-400">Execution Blocked</p>
            <p className="text-[10px] text-red-400/70 leading-relaxed font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Results View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {metrics ? (
          <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Model Badge */}
            <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <currentAlgo.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[12px] font-bold text-slate-100">{currentAlgo.label}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Model Ready • Trained on latest slice</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-black">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400">VERIFIED</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {metrics.task === "classification" && (
                <>
                  <MetricCard label="Accuracy" value={metrics.accuracy} good={0.7} great={0.85} />
                  <MetricCard label="F1 Score" value={metrics.f1} good={0.7} great={0.85} />
                  <MetricCard label="Precision" value={metrics.precision} good={0.7} great={0.85} />
                  <MetricCard label="Recall" value={metrics.recall} good={0.7} great={0.85} />
                </>
              )}

              {metrics.task === "regression" && (
                <>
                  <MetricCard label="R² Accuracy" value={metrics.r2} good={0.6} great={0.8} />
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">MAE Deviation</p>
                    <p className="text-2xl font-black text-blue-400 font-mono tracking-tighter">{metrics.mae?.toFixed(4)}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">MSE Variance</p>
                    <p className="text-2xl font-black text-blue-400 font-mono tracking-tighter">{metrics.mse?.toFixed(4)}</p>
                  </div>
                </>
              )}
            </div>

            {/* Advanced Inspection */}
            {showAdvanced && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-3 h-3 text-slate-600" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Neural Link Preview</span>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[10px] text-violet-300/60 overflow-x-auto custom-scrollbar">
                  <pre>{JSON.stringify(metrics, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        ) : !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
             <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
                <Play className="w-5 h-5 text-slate-700 ml-1 opacity-20" />
             </div>
             <div className="space-y-1">
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Signal</p>
               <p className="text-[10px] text-slate-600 max-w-[150px] leading-relaxed mx-auto">Select a target variable and an algorithm to start computation.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
