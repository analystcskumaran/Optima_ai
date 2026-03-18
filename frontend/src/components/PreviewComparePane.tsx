"use client";

/**
 * PreviewComparePane.tsx — Side-by-Side Original vs Cleaned Data with Charts
 *
 * PURPOSE: Shows the before/after of data cleaning with:
 *   - Summary delta badges (rows, columns, null%)
 *   - Quality score bar chart (null % per column before vs after)
 *   - Side-by-side data table comparison
 *   - Cleaning summary scores
 */

interface Dataset {
  shape: [number, number];
  fingerprint: {
    columns: string[];
    null_pct?: Record<string, number>;
    safe_sample: Record<string, unknown>[];
    dtypes?: Record<string, string>;
  };
}

interface PreviewComparePaneProps {
  rawDataset: Dataset | null;
  cleanedDataset: Dataset | null;
  explanation?: string | null;
}

function DeltaBadge({
  before, after, label, unit = "", reverse = false
}: {
  before: number; after: number; label: string; unit?: string; reverse?: boolean;
}) {
  const delta = after - before;
  const isGood = reverse ? delta > 0 : delta < 0;
  const isNeutral = delta === 0;
  return (
    <div className="flex flex-col items-center px-3 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl gap-1 min-w-0">
      <p className="text-[9px] text-slate-600 uppercase tracking-wide">{label}</p>
      <p className="text-[13px] font-bold text-slate-200 font-mono">{before.toLocaleString()}{unit} → {after.toLocaleString()}{unit}</p>
      {!isNeutral && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isGood ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {isGood ? "▼" : "▲"} {Math.abs(delta).toLocaleString()}{unit}
        </span>
      )}
      {isNeutral && <span className="text-[10px] text-slate-600">No change</span>}
    </div>
  );
}

function ScoreBar({ label, before, after }: { label: string; before: number; after: number }) {
  const improved = after < before;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{label}</span>
        <span className="text-[10px] font-mono text-slate-500">{before.toFixed(1)}% → <span className={improved ? "text-emerald-400" : "text-red-400"}>{after.toFixed(1)}%</span></span>
      </div>
      <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
        {/* Before bar (full red) */}
        <div className="absolute inset-y-0 left-0 bg-red-500/20 rounded-full" style={{ width: `${Math.min(100, before)}%` }} />
        {/* After bar (green overlay) */}
        <div className="absolute inset-y-0 left-0 bg-emerald-500/60 rounded-full transition-all" style={{ width: `${Math.min(100, after)}%` }} />
      </div>
    </div>
  );
}

function DataTable({ dataset, label, accent }: { dataset: Dataset; label: string; accent: "blue" | "emerald" }) {
  const cols = dataset.fingerprint.columns.slice(0, 6);
  const rows = dataset.fingerprint.safe_sample;
  const colors = {
    blue:    { dot: "bg-blue-500", header: "text-blue-400", border: "border-blue-500/10" },
    emerald: { dot: "bg-emerald-500", header: "text-emerald-400", border: "border-emerald-500/10" },
  }[accent];
  return (
    <div className="flex flex-col overflow-hidden min-w-0 flex-1">
      <div className={`px-3 py-2 flex items-center gap-2 border-b ${colors.border} bg-black/20 flex-shrink-0`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        <span className={`text-[10px] font-semibold ${colors.header}`}>{label}</span>
        <span className="text-[10px] text-slate-600 font-mono ml-auto">
          {dataset.shape[0].toLocaleString()} × {dataset.shape[1]}
        </span>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-[10px] border-collapse">
          <thead className="bg-[#0d1117] sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-slate-700 font-mono border-b border-r border-white/5 w-5">#</th>
              {cols.map((col) => (
                <th key={col} className="px-2 py-1.5 text-slate-500 font-semibold border-b border-r border-white/5 whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.03]">
                <td className="px-2 py-1.5 text-slate-700 font-mono border-r border-white/5">{i + 1}</td>
                {cols.map((col) => {
                  const val = row[col];
                  const isMissing = val === null || val === undefined || val === "";
                  return (
                    <td key={col} className="px-2 py-1.5 border-r border-white/[0.03] whitespace-nowrap max-w-[120px] truncate">
                      {isMissing ? <span className="text-red-500/50 italic">null</span> : <span className="text-slate-300">{String(val)}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PreviewComparePane({ rawDataset, cleanedDataset, explanation }: PreviewComparePaneProps) {
  if (!cleanedDataset || !rawDataset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl">🔀</div>
        <p className="text-[13px] font-semibold text-slate-300">No Comparison Available</p>
        <p className="text-[11px] text-slate-500 max-w-xs">
          Click "Approve & Refine" in the Diagnosis tab to generate the cleaned dataset, then come back here to compare.
        </p>
      </div>
    );
  }

  const rawNulls = Object.values(rawDataset.fingerprint.null_pct ?? {});
  const cleanNulls = Object.values(cleanedDataset.fingerprint.null_pct ?? {});
  const avgRawNull = rawNulls.length ? rawNulls.reduce((a, b) => a + b, 0) / rawNulls.length : 0;
  const avgCleanNull = cleanNulls.length ? cleanNulls.reduce((a, b) => a + b, 0) / cleanNulls.length : 0;

  // Quality score: 100 - avg null % (simple heuristic)
  const rawScore = Math.round(100 - avgRawNull);
  const cleanScore = Math.round(100 - avgCleanNull);
  const scoreColor = cleanScore >= 90 ? "text-emerald-400" : cleanScore >= 70 ? "text-yellow-400" : "text-red-400";

  // Top 6 columns that improved the most
  const cols = rawDataset.fingerprint.columns;
  const nullChart = cols
    .filter((c) => (rawDataset.fingerprint.null_pct?.[c] ?? 0) > 0 || (cleanedDataset.fingerprint.null_pct?.[c] ?? 0) > 0)
    .slice(0, 6)
    .map((c) => ({
      col: c,
      before: rawDataset.fingerprint.null_pct?.[c] ?? 0,
      after: cleanedDataset.fingerprint.null_pct?.[c] ?? 0,
    }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Summary Header ── */}
      <div className="flex-shrink-0 p-3 border-b border-white/5 bg-[#080e18]">
        <div className="flex gap-2 mb-3">
          <DeltaBadge before={rawDataset.shape[0]} after={cleanedDataset.shape[0]} label="Rows" />
          <DeltaBadge before={rawDataset.shape[1]} after={cleanedDataset.shape[1]} label="Columns" />
          <DeltaBadge before={Math.round(avgRawNull)} after={Math.round(avgCleanNull)} label="Avg Null %" unit="%" />
          {/* Quality Score */}
          <div className="flex flex-col items-center px-3 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl gap-1 min-w-0">
            <p className="text-[9px] text-slate-600 uppercase tracking-wide">Quality Score</p>
            <p className={`text-[16px] font-bold font-mono ${scoreColor}`}>{rawScore} → {cleanScore}</p>
            <span className="text-[10px] text-emerald-400">+{cleanScore - rawScore} pts</span>
          </div>
        </div>

        {/* AI Explanation */}
        {explanation && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl px-3 py-2 mb-2">
            <p className="text-[10px] text-blue-300/80 leading-relaxed line-clamp-3">{explanation}</p>
          </div>
        )}

        {/* Null % bar charts */}
        {nullChart.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] text-slate-600 uppercase tracking-wide">Null % by Column (Before → After)</p>
            {nullChart.map((item) => (
              <ScoreBar key={item.col} label={item.col} before={item.before} after={item.after} />
            ))}
          </div>
        )}
      </div>

      {/* ── Side-by-side tables ── */}
      <div className="flex-1 flex overflow-hidden">
        <DataTable dataset={rawDataset} label="Original" accent="blue" />
        <div className="w-px bg-white/5 flex-shrink-0" />
        <DataTable dataset={cleanedDataset} label="Cleaned" accent="emerald" />
      </div>
    </div>
  );
}
