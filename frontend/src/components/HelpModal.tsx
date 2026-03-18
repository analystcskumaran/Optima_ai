"use client";

/**
 * HelpModal.tsx — Keyboard Shortcuts & Quick Help Overlay
 *
 * PURPOSE: Shown when the user presses "?" anywhere in the workspace.
 *   Lists all keyboard shortcuts and explains the two-pane layout.
 *   Closes on Escape or clicking outside.
 */

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["U"], desc: "Upload a new file" },
  { keys: ["C"], desc: "Start cleaning (Approve & Refine)" },
  { keys: ["D"], desc: "Toggle Preview & Compare diff" },
  { keys: ["?"], desc: "Open this help screen" },
  { keys: ["Esc"], desc: "Close dialogs / reset focus" },
  { keys: ["Enter"], desc: "Send chat message" },
  { keys: ["Shift", "Enter"], desc: "New line in chat input" },
];

const FEATURES = [
  {
    icon: "💬",
    title: "Chat (Left Pane)",
    desc: "Ask questions about your data. The AI sees a summary and sample rows — never raw sensitive data.",
  },
  {
    icon: "🔬",
    title: "AI Diagnostic (Right → Diagnosis tab)",
    desc: "Run a full data health report. Get a score, per-column issues, and recommended fixes.",
  },
  {
    icon: "🧹",
    title: "Cleaning Plan (Right → Plan tab)",
    desc: "Review the AI's proposed cleaning actions before they run. Toggle off any you don't want.",
  },
  {
    icon: "🔀",
    title: "Preview & Compare (Right → Preview tab)",
    desc: "Side-by-side original vs cleaned data with row/column counts, missingness deltas.",
  },
  {
    icon: "📊",
    title: "Metrics (Right → Metrics tab)",
    desc: "Optional: provide a target column to see F1/Accuracy (classification) or MAE/R² (regression).",
  },
  {
    icon: "📥",
    title: "Downloads",
    desc: "Cleaned CSV, Diagnosis PDF, Cleaning Report PDF with script, and the raw Python .py file.",
  },
];

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⌨️</span>
            <div>
              <h2 className="text-[14px] font-bold text-slate-100">Optima Quick Reference</h2>
              <p className="text-[11px] text-slate-500">Keyboard shortcuts and feature overview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
            aria-label="Close help modal"
          >
            ✕
          </button>
        </div>

        <div className="p-6 grid gap-6">
          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Keyboard Shortcuts
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {SHORTCUTS.map((s) => (
                <div
                  key={s.desc}
                  className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 text-[10px] font-bold bg-[#1e293b] border border-white/15 rounded text-slate-300 font-mono"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">{s.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Feature Overview */}
          <section>
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Features
            </h3>
            <div className="flex flex-col gap-2">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex gap-3 px-3 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl"
                >
                  <span className="text-lg flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-200">{f.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy note */}
          <p className="text-[10px] text-slate-600 text-center border-t border-white/5 pt-4">
            🔒 Your data never leaves your machine for AI calls — only a statistical fingerprint and masked 10-row sample is sent.
          </p>
        </div>
      </div>
    </div>
  );
}
