"use client";

/**
 * DataPanel.tsx — Right Pane: Tabbed Data Workspace
 *
 * PURPOSE: Orchestrates the full right-column workspace. Shows 5 tabs matching the UX spec:
 *   1. Diagnosis   — AI health report (always available after upload)
 *   2. Plan        — Cleaning plan action cards (available after cleaning)
 *   3. Preview     — Side-by-side raw vs cleaned (available after cleaning)
 *   4. Metrics     — F1/Accuracy or MAE/R² (available after cleaning + target)
 *   5. Downloads   — Handled by the DownloadBar pinned to the bottom
 *
 * PATTERN: "Lifting state up" — all data state lives in page.tsx (parent).
 *   This component is purely presentational: it receives data as props and
 *   calls callbacks to request changes.
 */

import CleaningPlanPane from "./CleaningPlanPane";
import PreviewComparePane from "./PreviewComparePane";
import MetricsPane from "./MetricsPane";
import DownloadBar from "./DownloadBar";

type TabId = "diagnostics" | "plan" | "dashboard" | "metrics";

interface DataPanelProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  activeDataset: any;
  cleanedDataset: any;
  diagnosticReport: string | null;
  isAnalyzing: boolean;
  isCleaning: boolean;
  onRunDiagnostics: () => void;
  onRunRefinery: () => void;
  onClose: () => void;
  showAdvanced?: boolean;
}

// ── Tab strip button ────────────────────────────────────────────────────────────
interface TabButtonProps {
  id: TabId; label: string; activeTab: TabId;
  color: "blue" | "orange" | "emerald" | "purple" | "violet";
  onClick: (id: TabId) => void;
  disabled?: boolean;
  badge?: string;
}

function TabButton({ id, label, activeTab, color, onClick, disabled, badge }: TabButtonProps) {
  const isActive = activeTab === id;
  const colorMap: Record<typeof color, string> = {
    blue:    isActive ? "border-blue-500 text-blue-300"    : "border-transparent text-slate-500 hover:text-slate-300",
    orange:  isActive ? "border-orange-500 text-orange-300" : "border-transparent text-slate-500 hover:text-slate-300",
    emerald: isActive ? "border-emerald-500 text-emerald-300" : "border-transparent text-slate-500 hover:text-slate-300",
    purple:  isActive ? "border-purple-500 text-purple-300" : "border-transparent text-slate-500 hover:text-slate-300",
    violet:  isActive ? "border-violet-500 text-violet-300" : "border-transparent text-slate-500 hover:text-slate-300",
  };
  return (
    <button
      onClick={() => !disabled && onClick(id)}
      disabled={disabled}
      className={`py-2.5 px-3 text-[11px] font-semibold border-b-2 whitespace-nowrap tracking-wide uppercase transition-all relative disabled:opacity-30 disabled:cursor-not-allowed ${colorMap[color]}`}
      aria-selected={isActive}
      role="tab"
    >
      {label}
      {badge && (
        <span className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
      )}
    </button>
  );
}

export default function DataPanel({
  activeTab, onTabChange,
  activeDataset, cleanedDataset,
  diagnosticReport, isAnalyzing, isCleaning,
  onRunDiagnostics, onRunRefinery, onClose,
  showAdvanced = false,
}: DataPanelProps) {

  const isPostClean = !!cleanedDataset;
  const columns: string[] = activeDataset?.fingerprint?.columns ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0b1120]">

      {/* ── Tab Strip ── */}
      <div
        role="tablist"
        className="flex items-center gap-0.5 px-3 border-b border-white/5 bg-[#0d1117] flex-shrink-0 overflow-x-auto"
      >
        <TabButton id="diagnostics" label="Diagnosis"  activeTab={activeTab} color="blue"    onClick={onTabChange} />
        <TabButton id="plan"        label="Plan"        activeTab={activeTab} color="orange"  onClick={onTabChange} badge={isPostClean ? "new" : undefined} />
        <TabButton id="dashboard"   label="Dashboard 📊" activeTab={activeTab} color="emerald" onClick={onTabChange} />
        <TabButton id="metrics"     label="Metrics"     activeTab={activeTab} color="violet"  onClick={onTabChange} />

        {/* Spacer + Close button */}
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-600 hover:text-slate-400 transition-colors"
          aria-label="Close data panel"
        >
          ✕
        </button>
      </div>

      {/* ── Tab Content (fills remaining height) ── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ════ TAB: DIAGNOSIS ════ */}
        {activeTab === "diagnostics" && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
            {/* Header row */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[12px] font-semibold text-slate-300">AI Health Report</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {activeDataset?.shape?.[0]?.toLocaleString() ?? "?"} rows × {activeDataset?.shape?.[1] ?? "?"} cols
                </span>
              </div>
              {!diagnosticReport && !isAnalyzing && (
                <button
                  onClick={onRunDiagnostics}
                  id="run-diagnosis-btn"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-medium"
                >
                  🔬 Run Diagnosis
                </button>
              )}
            </div>

            {/* Data preview table — always visible */}
            <div className="bg-[#070d18] border border-white/5 rounded-xl overflow-hidden flex-shrink-0" style={{ maxHeight: "160px" }}>
              <div className="overflow-auto h-full custom-scrollbar">
                {activeDataset?.fingerprint?.safe_sample?.length > 0 ? (
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="bg-[#111827] sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-slate-700 font-mono border-b border-r border-white/5 w-6">#</th>
                        {columns.slice(0, 8).map((col) => (
                          <th key={col} className="px-2 py-2 text-slate-500 font-semibold border-b border-r border-white/5 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {activeDataset.fingerprint.safe_sample.slice(0, 5).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-2 py-1.5 text-slate-700 font-mono border-r border-white/5">{i + 1}</td>
                          {columns.slice(0, 8).map((col) => {
                            const val = row[col];
                            const isMissing = val === null || val === undefined || val === "";
                            return (
                              <td key={col} className="px-2 py-1.5 border-r border-white/[0.03] whitespace-nowrap max-w-[120px] truncate">
                                {isMissing ? <span className="text-red-500/50 italic text-[9px]">null</span> : <span className="text-slate-300">{String(val)}</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-20 text-slate-600 text-[11px]">No sample data available</div>
                )}
              </div>
            </div>

            {/* Report or placeholder */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="flex gap-1">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">Analyzing dataset patterns...</p>
                </div>
              ) : diagnosticReport ? (
                <div className="p-4 bg-[#070d18] rounded-xl border border-white/5">
                  <pre className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                    {diagnosticReport}
                  </pre>

                  {/* CTA: start cleaning */}
                  <button
                    onClick={onRunRefinery}
                    disabled={isCleaning}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-[12px] font-semibold rounded-xl transition-all shadow-lg shadow-orange-600/20"
                  >
                    {isCleaning ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Cleaning in progress...
                      </>
                    ) : (
                      <>🚀 Satisfied? Approve &amp; Refine Data</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-xl">🔬</div>
                  <p className="text-[12px] text-slate-500">Run the AI Diagnostic to see a health report</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ TAB: PLAN ════ */}
        {activeTab === "plan" && (
          <CleaningPlanPane
            cleaningReport={cleanedDataset?.plan ? JSON.stringify(cleanedDataset.plan) : null}
            explanation={cleanedDataset?.explanation ?? null}
            onApprove={onRunRefinery}
            isCleaning={isCleaning}
            showJsonPlan={showAdvanced}
            pythonCode={cleanedDataset?.python_code ?? null}
          />
        )}

        {/* ════ TAB: DASHBOARD ════ */}
        {activeTab === "dashboard" && (
          <PreviewComparePane
            rawDataset={activeDataset}
            cleanedDataset={cleanedDataset}
            explanation={cleanedDataset?.explanation ?? null}
          />
        )}

        {/* ════ TAB: METRICS ════ */}
        {activeTab === "metrics" && (
          <MetricsPane
            cleanedFilePath={cleanedDataset?.file_path ?? null}
            showAdvanced={showAdvanced}
          />
        )}
      </div>

      {/* ── DownloadBar — always pinned to bottom ── */}
      <DownloadBar
        cleanedFilePath={cleanedDataset?.file_path ?? null}
        pythonScript={cleanedDataset?.python_code ?? null}
        diagnosticReport={diagnosticReport}
        cleanedExplanation={cleanedDataset?.explanation ?? null}
      />
    </div>
  );
}
