"use client";

import { useState, useMemo } from "react";
import { 
  CheckCircle2, 
  Trash2, 
  Eraser, 
  Dna, 
  Binary, 
  Calendar, 
  Filter, 
  Layers, 
  AlertCircle, 
  Scissors, 
  LayoutGrid,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Terminal,
  FileText,
  RotateCcw
} from "lucide-react";

/**
 * CleaningPlanPane.tsx — Redesigned for Visual Excellence
 */

const ACTION_META: Record<string, { label: string; desc: string; icon: any; color: string }> = {
  normalize_columns:     { label: "Normalize Headers",      desc: "Lowercase & underscore spacing.", icon: Layers,  color: "blue" },
  strip_whitespace:      { label: "Cleanse Content",        desc: "Remove orphan spaces in cells.",  icon: Scissors, color: "slate" },
  drop_empty_rows:       { label: "Prune Rows",             desc: "Remove completely null rows.",    icon: Trash2,   color: "red" },
  drop_empty_cols:       { label: "Prune Columns",          desc: "Remove completely null columns.", icon: Trash2,   color: "red" },
  deduplicate:           { label: "De-duplicate",           desc: "Remove exact duplicate entries.",   icon: RotateCcw, color: "orange" },
  coerce_numeric:        { label: "Numeric Cast",           desc: "Fix improperly typed numbers.",   icon: Binary,   color: "blue" },
  parse_dates:           { label: "Date Analysis",          desc: "Convert text to standardized dates.", icon: Calendar, color: "purple" },
  standardize_categories:{ label: "Cat. Sync",              desc: "Standardize inconsistent labels.", icon: LayoutGrid, color: "yellow" },
  outliers_iqr:          { label: "Outlier Clip",           desc: "Clip statistical noise (IQR).",    icon: Filter,   color: "orange" },
  drop_high_null_cols:   { label: "Sparsity Cut",           desc: "Drop columns with severe data loss.", icon: Eraser,   color: "red" },
  impute:                { label: "Smart Fill",             desc: "Fill holes via statistics.",      icon: Sparkles, color: "emerald" },
  drop_columns:          { label: "Manual Drop",            desc: "Remove user-selected columns.",   icon: Trash2,   color: "red" },
  extract_numeric:       { label: "Num. Extraction",        desc: "Parse numbers from mixed text.", icon: Binary,   color: "blue" },
  regex_extract:         { label: "Pattern Extract",        desc: "Extract via custom AI regex.",     icon: Terminal, color: "slate" },
  map_categories:        { label: "Semantic Map",           desc: "Remap values per intent.",      icon: Dna,      color: "yellow" },
  filter_range:          { label: "Range Guard",            desc: "Filter values out of bounds.", icon: Filter,   color: "orange" },
};

const COLOR_VARIANTS: Record<string, string> = {
  blue:    "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
  slate:   "text-slate-400 bg-slate-500/10 border-slate-500/20 shadow-slate-500/5",
  red:     "text-red-400 bg-red-500/10 border-red-500/20 shadow-red-500/5",
  orange:  "text-orange-400 bg-orange-500/10 border-orange-500/20 shadow-orange-500/5",
  purple:  "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
  yellow:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/5",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
};

interface CleaningPlanPaneProps {
  cleaningReport: string | null;
  explanation: string | null;
  onApprove: () => void;
  isCleaning: boolean;
  showJsonPlan?: boolean;
  pythonCode?: string | null;
}

export default function CleaningPlanPane({
  cleaningReport,
  explanation,
  onApprove,
  isCleaning,
  showJsonPlan = false,
  pythonCode = null,
}: CleaningPlanPaneProps) {
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [showCode, setShowCode] = useState(false);

  // Parse actions with improved robustness
  const actions = useMemo(() => {
    if (!cleaningReport) return [];
    try {
      const parsed = JSON.parse(cleaningReport);
      if (Array.isArray(parsed?.actions)) {
        return (parsed.actions as any[]).filter(a => 
          typeof a?.type === "string" && a.type.trim() !== ""
        );
      }
    } catch { /* not JSON */ }

    // Fallback: Parse markdown-style list
    return cleaningReport
      .split("\n")
      .filter((l) => /^\s*[-*•\d+.]\s/.test(l))
      .map((l) => {
        const rawType = l
          .replace(/^\s*[-*•\d+.]\s+/, "")
          .replace(/\*\*/g, "")
          .split(":")[0]
          .trim();
        
        return { 
          type: rawType.toLowerCase().replace(/ /g, "_"),
          originalLabel: rawType
        };
      })
      .filter(a => a.type.length > 2);
  }, [cleaningReport]);

  const toggleAction = (type: string) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const enabledCount = actions.filter((a) => !disabled.has(a.type)).length;

  if (!cleaningReport) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b1120] animate-in fade-in duration-500 h-full">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-700" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">No Active Pipeline</h3>
        <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
          Run the AI Diagnostic and approve the findings to generate a cleaning plan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-5 gap-4 bg-[#0b1120] animate-in slide-in-from-right-2 duration-300 h-full">
      
      {/* Header Area */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-100 tracking-tight">Cleaning Pipeline</span>
            {actions.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase tracking-wider">
                {enabledCount}/{actions.length} Steps
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500">AI-optimized data transformation</p>
        </div>

        <button
          onClick={onApprove}
          disabled={isCleaning || (actions.length > 0 && enabledCount === 0)}
          className="group relative flex items-center gap-2 px-4 py-2 text-[11px] font-bold bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-xl shadow-orange-600/20 overflow-hidden"
        >
          {isCleaning ? (
            <>
              <Dna className="animate-spin w-3.5 h-3.5" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Deploy Pipeline
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar pr-1">
        
        {/* Explanation Card */}
        {explanation && (
          <div className="relative overflow-hidden bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 group hover:bg-blue-500/8 transition-all duration-300 text-left">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-12 h-12 text-blue-400" />
            </div>
            <h4 className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
              <AlertCircle className="w-3 h-3" />
              AI Reasoning
            </h4>
            <p className="text-[11px] text-slate-200/90 leading-relaxed font-medium">
              {explanation}
            </p>
          </div>
        )}

        {/* Script Section */}
        {pythonCode && (
          <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <button 
              onClick={() => setShowCode(!showCode)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-200">Production Script</p>
                  <p className="text-[9px] text-slate-500">Standalone Python source code</p>
                </div>
              </div>
              {showCode ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
            </button>
            {showCode && (
              <div className="p-4 pt-0 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-1 duration-200">
                <pre className="text-[10px] text-blue-200/60 font-mono whitespace-pre overflow-x-auto p-4 bg-black/40 rounded-xl custom-scrollbar border border-white/5">
                  {pythonCode}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Pipeline Steps */}
        <div className="space-y-2">
          {actions.length > 0 ? (
            actions.map((action, i) => {
              const type = action.type;
              const meta = ACTION_META[type] ?? {
                label: action.originalLabel || type.replace(/_/g, " "),
                desc: "Custom transformation step",
                icon: LayoutGrid,
                color: "slate",
              };
              const isOn = !disabled.has(type);
              const IconComp = meta.icon;

              return (
                <div
                  key={i}
                  className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${
                    isOn
                      ? "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04] shadow-lg shadow-black/20"
                      : "bg-black/20 border-white/[0.02] opacity-40 grayscale blur-[0.5px]"
                  }`}
                >
                  <div className={`w-10 h-10 flex-shrink-0 rounded-xl border flex items-center justify-center transition-all ${COLOR_VARIANTS[meta.color]}`}>
                    <IconComp className="w-5 h-5" strokeWidth={2} />
                  </div>

                  <div className="flex-1 min-w-0 py-0.5">
                    <h5 className="text-[12px] font-bold text-slate-200 tracking-tight">{meta.label}</h5>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{meta.desc}</p>
                    
                    {showJsonPlan && (action as any).params && (
                      <div className="mt-2 p-2 rounded-lg bg-black/20 border border-white/5">
                        <pre className="text-[9px] text-slate-600 font-mono overflow-x-auto">
                          {JSON.stringify((action as any).params, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleAction(type)}
                    className={`flex-shrink-0 w-10 h-5 rounded-full transition-all relative mt-1 ${
                      isOn ? "bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-md transition-all ${
                        isOn ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })
          ) : (
            /* Professional Fallback for Unstructured Reports */
            <div className="p-6 bg-[#070d18] rounded-2xl border border-white/5 shadow-inner text-left">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">Detail Report</span>
              </div>
              <div className="space-y-4">
                {cleaningReport.split('\n').filter(l => l.trim()).map((line, idx) => {
                  const isHeading = line.startsWith('#');
                  const isList = /^\d+\.\s|^\s*[-*•]\s/.test(line);
                  
                  if (isHeading) {
                    return <h3 key={idx} className="text-[13px] font-bold text-slate-100 pt-2 border-t border-white/5 mt-2 first:mt-0 first:border-0">{line.replace(/#/g, '').trim()}</h3>;
                  }
                  if (isList) {
                    return (
                      <div key={idx} className="flex gap-3 pl-2">
                        <div className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                        <p className="text-[11px] text-slate-400 leading-relaxed italic">{line.replace(/^\s*[-*•\d+.]\s+/, '').trim()}</p>
                      </div>
                    );
                  }
                  return <p key={idx} className="text-[11px] text-slate-400 leading-relaxed font-medium">{line}</p>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
