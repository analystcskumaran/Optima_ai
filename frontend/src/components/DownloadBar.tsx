"use client";

/**
 * DownloadBar.tsx — Download Row with 4 Artifacts
 *
 * PURPOSE: Provides one-click download buttons for all 4 downloadable artifacts:
 *   1. Cleaned CSV   → direct download from /api/downloads/{filename}
 *   2. Diagnosis PDF → generates a text file with the report content
 *   3. Cleaning Report → generates a combined report text file  
 *   4. Python Script → blob download of the backend closing_script
 *
 * DESIGN: Horizontal bar pinned to the bottom of the DataPanel.
 */

interface DownloadBarProps {
  cleanedFilePath: string | null;
  pythonScript: string | null;
  diagnosticReport: string | null;
  cleanedExplanation?: string | null;
}

interface DownloadButtonProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  disabled: boolean;
  onClick: () => void;
  color?: "blue" | "emerald" | "purple" | "orange";
}

function DownloadButton({ icon, label, sub, disabled, onClick, color = "blue" }: DownloadButtonProps) {
  const colorMap = {
    blue:    "bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/20 text-blue-400",
    emerald: "bg-emerald-600/10 border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400",
    purple:  "bg-purple-600/10 border-purple-500/20 hover:bg-purple-600/20 text-purple-400",
    orange:  "bg-orange-600/10 border-orange-500/20 hover:bg-orange-600/20 text-orange-400",
  }[color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Generate this artifact first" : `Download ${label}`}
      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all font-medium disabled:opacity-30 disabled:cursor-not-allowed ${colorMap}`}
    >
      <span className="text-base flex-shrink-0">{icon}</span>
      <div className="text-left min-w-0">
        <p className="text-[11px] font-semibold truncate">{label}</p>
        <p className="text-[9px] opacity-60">{sub}</p>
      </div>
      {!disabled && (
        <svg className="w-3 h-3 flex-shrink-0 ml-auto opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
    </button>
  );
}

/** Downloads any text/code content as a file */
function downloadTextFile(content: string, filename: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import * as api from "@/lib/api";

export default function DownloadBar({
  cleanedFilePath,
  pythonScript,
  diagnosticReport,
  cleanedExplanation,
}: DownloadBarProps) {

  const downloadDiagnosisPDF = () => {
    if (!diagnosticReport) return;
    const content = `OPTIMA AI — DATA DIAGNOSIS REPORT\n${"=".repeat(50)}\n\n${diagnosticReport}`;
    downloadTextFile(content, "optima_diagnosis_report.txt");
  };

  const downloadCleaningReport = () => {
    const parts = [];
    if (cleanedExplanation) {
      parts.push(`CLEANING EXPLANATION\n${"=".repeat(50)}\n${cleanedExplanation}\n`);
    }
    if (pythonScript) {
      parts.push(`PYTHON CLEANING SCRIPT\n${"=".repeat(50)}\n${pythonScript}`);
    }
    downloadTextFile(parts.join("\n\n"), "optima_cleaning_report.txt");
  };

  const downloadScript = () => {
    if (!pythonScript) return;
    downloadTextFile(pythonScript, "optima_cleaning_script.py", "text/x-python");
  };

  return (
    <div className="flex-shrink-0 border-t border-white/5 bg-[#080e1a] px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Downloads</span>
      </div>
      <div className="flex gap-2">
        <DownloadButton
          icon="📥"
          label="Cleaned CSV"
          sub=".csv file"
          color="emerald"
          disabled={!cleanedFilePath}
          onClick={() => {
            if (cleanedFilePath) window.open(api.getCleanedCsvUrl(cleanedFilePath), "_blank");
          }}
        />
        <DownloadButton
          icon="🔬"
          label="Diagnosis Report"
          sub=".txt file"
          color="blue"
          disabled={!diagnosticReport}
          onClick={downloadDiagnosisPDF}
        />
        <DownloadButton
          icon="📄"
          label="Cleaning Report"
          sub=".txt file"
          color="orange"
          disabled={!pythonScript && !cleanedExplanation}
          onClick={downloadCleaningReport}
        />
        <DownloadButton
          icon="🐍"
          label="Python Script"
          sub=".py file"
          color="purple"
          disabled={!pythonScript}
          onClick={downloadScript}
        />
      </div>
    </div>
  );
}
