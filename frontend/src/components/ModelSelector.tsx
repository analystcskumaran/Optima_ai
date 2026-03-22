"use client";

/**
 * ModelSelector.tsx — Groq Model Dropdown
 *
 * PURPOSE: Lets the user pick which free Groq AI model to use.
 *   The selection is persisted in sessionStorage so it survives navigation
 *   but resets on a new tab.
 *
 * PROPS:
 *   value    — currently selected model ID string
 *   onChange — callback when user picks a different model
 */

export const FREE_MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    desc: "Powerful reasoning — best for structured JSON plans",
    badge: "Recommended",
    color: "text-emerald-400",
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B",
    desc: "Lightning fast — perfect for quick data chats",
    badge: "Fast",
    color: "text-blue-400",
  },
  {
    id: "mixtral-8x7b-32768",
    label: "Mixtral 8x7B",
    desc: "Strong capability with MoE architecture",
    badge: null,
    color: "text-purple-400",
  },
  {
    id: "gemma2-9b-it",
    label: "Gemma 2 9B",
    desc: "Google's open weight model — highly efficient",
    badge: null,
    color: "text-orange-400",
  },
];

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  /** If true, renders as a compact inline pill instead of a full dropdown */
  compact?: boolean;
}

export default function ModelSelector({ value, onChange, compact = false }: ModelSelectorProps) {
  const current = FREE_MODELS.find((m) => m.id === value) ?? FREE_MODELS[0];

  if (compact) {
    // Compact mode: used inside Chat header
    return (
      <div className="relative group">
        <button className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/8 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all">
          <span className={`w-1.5 h-1.5 rounded-full bg-current ${current.color}`} />
          <span>{current.label}</span>
          <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown — appears on hover/focus */}
        <div className="absolute bottom-full left-0 mb-1 z-50 hidden group-hover:block w-[240px] bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {FREE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => onChange(model.id)}
              className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-start gap-2.5 border-b border-white/5 last:border-0 ${
                value === model.id ? "bg-white/5" : ""
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${model.color}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-200">{model.label}</span>
                  {model.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded font-medium">
                      {model.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5">{model.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full mode: used in Settings or Landing
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">AI Model</label>
      <div className="grid gap-2">
        {FREE_MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => onChange(model.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
              value === model.id
                ? "border-blue-500/30 bg-blue-500/5"
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${model.color} ${value === model.id ? "ring-2 ring-offset-1 ring-offset-[#0d1117] ring-current" : ""}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-200">{model.label}</span>
                {model.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded font-medium">
                    {model.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{model.desc}</p>
            </div>
            {value === model.id && (
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
