"use client";

/**
 * CleaningPlanPane.tsx — Toggleable Action Cards for the Cleaning Plan
 *
 * PURPOSE: Displays the AI-generated cleaning plan as a list of action cards.
 *   Each card shows the action type, description, and can be toggled on/off
 *   by the user before execution. Senior mode also shows the raw JSON params.
 *
 * PROPS:
 *   cleaningReport  — The string report from the backend (or JSON plan if available)
 *   onApprove       — Called when user clicks "Approve & Clean"
 *   isCleaning      — Whether the cleaning job is running
 *   showJsonPlan    — Senior mode: show raw JSON params
 */

import { useState } from "react";

// The 15 deterministic actions the backend supports
const ACTION_DESCRIPTIONS: Record<string, { label: string; desc: string; icon: string; color: string }> = {
  normalize_columns:     { label: "Normalize Column Names",  desc: "Lowercase, replace spaces with underscores.",          icon: "Aa", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  strip_whitespace:      { label: "Strip Whitespace",         desc: "Remove leading/trailing spaces from text cells.",       icon: "✂️", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
  drop_empty_rows:       { label: "Drop Empty Rows",          desc: "Remove rows that are entirely null.",                  icon: "🗑", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  drop_empty_cols:       { label: "Drop Empty Columns",       desc: "Remove columns that are entirely null.",               icon: "🗑", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  deduplicate:           { label: "Remove Duplicates",        desc: "Drop exact duplicate rows.",                           icon: "🔁", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  coerce_numeric:        { label: "Coerce to Numeric",        desc: "Convert text columns that look numeric.",              icon: "#",  color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  parse_dates:           { label: "Parse Dates",              desc: "Detect and convert date-like columns.",                icon: "📅", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  standardize_categories:{ label: "Standardize Categories",  desc: "Normalize inconsistent text values (e.g. USA/U.S.A).", icon: "≈",  color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  outliers_iqr:          { label: "Handle Outliers (IQR)",    desc: "Cap outliers using the interquartile range method.",   icon: "📉", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  drop_high_null_cols:   { label: "Drop High-Null Columns",   desc: "Remove columns with >70% missing values.",             icon: "🚫", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  impute:                { label: "Impute Missing Values",     desc: "Fill nulls with mean, median, or mode.",              icon: "🔧", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  drop_columns:          { label: "Drop Columns",             desc: "Remove specific columns from the dataset.",            icon: "🗑", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  extract_numeric:       { label: "Extract Numeric",          desc: "Parse numbers from mixed text (e.g. '$1,200').",       icon: "💲", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  regex_extract:         { label: "Regex Extract",            desc: "Extract values using regular expressions.",            icon: ".*", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
  map_categories:        { label: "Map Categories",           desc: "Replace category values with a defined mapping.",      icon: "↔", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  filter_range:          { label: "Filter Range",             desc: "Remove rows outside a numeric range.",                 icon: "≤",  color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
};

interface CleaningPlanPaneProps {
  cleaningReport: string | null;
  explanation: string | null;
  onApprove: () => void;
  isCleaning: boolean;
  showJsonPlan?: boolean;
  pythonCode?: string | null;
}

// Try to parse the report as a JSON plan; fall back to a simple list of steps
function parseActions(report: string | null): { type: string; params?: any }[] {
  if (!report) return [];
  try {
    const parsed = JSON.parse(report);
    if (Array.isArray(parsed?.actions)) return parsed.actions;
  } catch { /* not JSON */ }
  // Parse markdown-style "- action_name" lines as a fallback
  return report
    .split("\n")
    .filter((l) => /^\s*[-*•]\s/.test(l))
    .map((l) => ({ type: l.replace(/^\s*[-*•]\s/, "").split(":")[0].trim().toLowerCase().replace(/ /g, "_") }));
}

export default function CleaningPlanPane({
  cleaningReport,
  explanation,
  onApprove,
  isCleaning,
  showJsonPlan = false,
  pythonCode = null,
}: CleaningPlanPaneProps) {
  const actions = parseActions(cleaningReport);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());

  const toggleAction = (type: string) =>
    setDisabled((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  const [showCode, setShowCode] = useState(false);

  const enabledCount = actions.filter((a) => !disabled.has(a.type)).length;

  // If no plan yet, show the AI explanation text instead
  if (!cleaningReport) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 text-xl">📋</div>
        <p className="text-[13px] font-semibold text-slate-300">No Cleaning Plan Yet</p>
        <p className="text-[11px] text-slate-500 max-w-xs">
          Run the AI Diagnostic first, review the report, then click "Approve & Refine" to generate a cleaning plan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-[12px] font-semibold text-slate-300">Cleaning Plan</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
            {enabledCount} of {actions.length} actions
          </span>
        </div>
        <button
          onClick={onApprove}
          disabled={isCleaning || enabledCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg transition-all font-medium shadow-lg shadow-orange-600/20"
        >
          {isCleaning ? (
            <>
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 3 0 12h4z" /></svg>
              Cleaning...
            </>
          ) : (
            <>🚀 Approve & Clean</>
          )}
        </button>
      </div>

      {/* AI Explanation */}
      {explanation && (
        <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 flex-shrink-0">
          <p className="text-[11px] text-blue-300/80 leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Action Cards */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-1">
        
        {/* Python Code Toggle Section */}
        {pythonCode && (
          <div className="mb-2 bg-[#0d1525] border border-blue-500/20 rounded-xl overflow-hidden shadow-xl">
            <button 
              onClick={() => setShowCode(!showCode)}
              className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🐍</span>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-blue-300">Generated Python Script</p>
                  <p className="text-[9px] text-slate-500">Reproducible cleaning pipeline</p>
                </div>
              </div>
              <span className={`text-slate-500 transition-transform ${showCode ? "rotate-90" : ""}`}>▶</span>
            </button>
            {showCode && (
              <div className="p-3 pt-0 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                <pre className="text-[10px] text-blue-200/70 font-mono whitespace-pre overflow-x-auto p-3 bg-black/40 rounded-lg custom-scrollbar">
                  {pythonCode}
                </pre>
              </div>
            )}
          </div>
        )}

        {actions.length > 0 ? (
          actions.map((action, i) => {
            const meta = ACTION_DESCRIPTIONS[action.type] ?? {
              label: action.type.replace(/_/g, " "),
              desc: "Custom action",
              icon: "⚙️",
              color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
            };
            const isOn = !disabled.has(action.type);
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isOn
                    ? "bg-white/[0.02] border-white/5"
                    : "bg-black/20 border-white/[0.03] opacity-50"
                }`}
              >
                {/* Icon */}
                <div className={`w-7 h-7 flex-shrink-0 rounded-lg border flex items-center justify-center text-[11px] font-bold ${meta.color}`}>
                  {meta.icon}
                </div>
                {/* Body */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-200">{meta.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{meta.desc}</p>
                  {showJsonPlan && action.params && (
                    <pre className="mt-1 text-[9px] text-slate-600 font-mono overflow-x-auto">
                      {JSON.stringify(action.params, null, 2)}
                    </pre>
                  )}
                </div>
                {/* Toggle */}
                <button
                  onClick={() => toggleAction(action.type)}
                  aria-label={isOn ? "Disable action" : "Enable action"}
                  className={`flex-shrink-0 w-8 h-4 rounded-full transition-all relative ${
                    isOn ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${
                      isOn ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })
        ) : (
          // No parseable actions — show the raw report text
          <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed p-3 bg-black/20 rounded-xl border border-white/5">
            {cleaningReport}
          </pre>
        )}
      </div>
    </div>
  );
}
