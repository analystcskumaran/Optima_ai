"use client";

/**
 * Header.tsx
 *
 * PURPOSE: The top navigation bar that appears at all times.
 *
 * CONCEPTS USED:
 * - Props with optional properties: `fileName?` uses `?` to mark it as optional.
 *   If not provided, it's `undefined` and we show a default message.
 * - Conditional rendering: `{fileName && <span>...</span>}` — only renders the
 *   filename span if `fileName` is truthy (not null/undefined/empty).
 * - `select` element: Native HTML dropdown. We style it with Tailwind to look custom
 *   using `appearance-none` to remove browser default styling.
 */

interface HeaderProps {
  fileName?: string;                      // Current active dataset filename (if any)
  selectedModel: string;                  // Currently selected AI model
  onModelChange: (m: string) => void;     // Callback when user picks a different model
  onMobileMenuToggle: () => void;         // Opens/closes sidebar on mobile
  isSidebarOpen: boolean;
}

const MODELS = [
  { value: "stepfun/step-3.5-flash:free", label: "StepFun 3.5 Flash" },
  { value: "mistralai/mistral-small-3.1-24b-instruct:free", label: "Mistral Small 3.1" },
  { value: "nvidia/nemotron-3-nano-30b-a3b:free", label: "Nemotron Nano 30B" },
  { value: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron Super 120B" },
];

export default function Header({ fileName, selectedModel, onModelChange, onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="h-[64px] flex items-center justify-between px-4 md:px-6 bg-[#0d1117] border-b border-white/5 flex-shrink-0 z-10">

      {/* ── Left Side: Mobile menu + breadcrumb ── */}
      <div className="flex items-center gap-3">
        {/* Mobile-only hamburger — hidden on md and above because the sidebar handles it */}
        <button
          onClick={onMobileMenuToggle}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors md:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb: "Data Refinery" > filename if active */}
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-semibold text-slate-200">Data Refinery</span>
          {fileName && (
            <>
              {/* Separator chevron */}
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              {/* Filename badge */}
              <span className="text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 font-mono text-[11px] max-w-[160px] truncate">
                {fileName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Right Side: Model selector ── */}
      <div className="flex items-center gap-3">
        {/*
         * Model selector: We use `appearance-none` to strip the native OS dropdown
         * styling. A `bg-[#1a202c]` gives it our dark theme look.
         * We use `<option>` elements inside `<select>` for the choices.
         */}
        <div className="relative flex items-center">
          <svg className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="appearance-none bg-[#161b27] hover:bg-[#1e2636] border border-white/8 hover:border-white/15 text-slate-300 text-[11px] font-medium py-1.5 pl-8 pr-7 rounded-lg outline-none transition-all cursor-pointer"
          >
            {MODELS.map((m) => (
              <option key={m.value} className="bg-[#1a202c] text-white" value={m.value}>
                {m.label} (Free)
              </option>
            ))}
          </select>
          {/* Custom arrow icon for the select */}
          <svg className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Status indicator dot: green = active, grey = idle */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className={`w-1.5 h-1.5 rounded-full ${fileName ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
          {fileName ? "Active" : "Ready"}
        </div>
      </div>
    </header>
  );
}
