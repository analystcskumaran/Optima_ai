"use client";

import { useRef } from "react";

/**
 * LandingScreen.tsx
 *
 * PURPOSE: The "What do you want to analyze?" hero screen shown before any file is uploaded.
 *
 * CONCEPTS USED:
 * - `useRef`: We attach a ref to the hidden <input type="file"> element so we can
 *   call `.click()` on it programmatically. This is the standard way to trigger
 *   a file picker from a custom-styled button (since the default file input is ugly).
 *
 * - CSS `@keyframes gradient-shift` (defined in globals.css): Animates the background
 *   position of a gradient, giving the headline a shifting color effect.
 *
 * - Glassmorphism: Achieved with `backdrop-blur-sm` + semi-transparent backgrounds
 *   (`bg-white/5`). It gives a frosted-glass effect to the input card.
 *
 * - Feature cards below the input: These are decorative/informational. They show
 *   the three core capabilities of Optima.
 */

interface LandingScreenProps {
  chatInput: string;
  onChatInputChange: (val: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  uploading: boolean;
  uploadStatus: { msg: string; isError: boolean } | null;
  selectedModel: string;
  onModelChange: (m: string) => void;
}

const FEATURE_CARDS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Smart Cleaning",
    desc: "AI detects and fixes missing values, duplicates, and outliers automatically.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "AI Diagnostics",
    desc: "Get a health report on data quality with actionable recommendations.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    title: "Code Export",
    desc: "Download auto-generated Python scripts for reproducible data pipelines.",
  },
];

export default function LandingScreen({
  chatInput,
  onChatInputChange,
  onFileSelect,
  onSubmit,
  uploading,
  uploadStatus,
}: LandingScreenProps) {
  // Ref to the hidden file input — lets us trigger it from our styled button
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* ── Background ambient glow ── */}
      {/*
       * These are decorative radial gradient divs positioned behind the content.
       * `pointer-events-none` means they never block clicks.
       * They give the page depth and a premium "glow" feel.
       */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[200px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Main Content Container ── */}
      <div className="w-full max-w-[680px] flex flex-col items-center gap-8 relative z-10">

        {/* ── Headline ── */}
        <div className="text-center space-y-3">
          {/* Badge label */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[11px] font-semibold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Data Refinery
          </div>

          {/* Gradient animated headline */}
          {/*
           * `bg-clip-text text-transparent` makes the gradient show through the text.
           * The gradient goes from blue → violet → cyan.
           * `animate-gradient` references a @keyframes defined in globals.css below.
           */}
          <h1 className="text-[30px] md:text-[38px] font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              What do you want
            </span>
            <br />
            <span className="text-slate-100">to analyze today?</span>
          </h1>
          <p className="text-slate-500 text-[14px] max-w-md">
            Upload a CSV or Excel file and let Optima&apos;s AI clean, diagnose, and transform your data.
          </p>
        </div>

        {/* ── Input Card (Glassmorphism) ── */}
        {/*
         * This is the main interaction element.
         * `backdrop-blur-sm` creates the frosted glass effect.
         * `focus-within:border-blue-500/40` highlights the card border when any
         *   child element (the textarea) is focused — useful UX pattern.
         */}
        <form onSubmit={onSubmit} className="w-full">
          <div className="w-full bg-[#111827]/80 backdrop-blur-sm border border-white/8 rounded-2xl shadow-2xl focus-within:border-blue-500/30 transition-all duration-300">

            {/* Text area for the prompt */}
            <textarea
              className="w-full bg-transparent px-5 py-5 text-[14px] text-slate-200 placeholder:text-slate-600 focus:outline-none min-h-[96px] resize-none leading-relaxed no-scrollbar"
              placeholder="e.g. Clean my sales data, remove duplicates, fill missing revenue with median..."
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyDown={(e) => {
                // Submit on Enter (without Shift held down)
                // Shift+Enter creates a newline instead
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e as any);
                }
              }}
            />

            {/* Card bottom row: Attach + Model + Send */}
            <div className="px-4 pb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">

                {/* Hidden actual file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileSelect}
                  accept=".csv,.xlsx"
                  className="hidden"
                />

                {/* Styled "Attach Dataset" button that triggers the hidden input */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 rounded-lg text-[12px] text-slate-300 font-medium transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Attach Dataset
                    </>
                  )}
                </button>

                <span className="text-slate-700 text-[11px]">CSV · XLSX · up to 50MB</span>
              </div>

              {/* Send / Upload button */}
              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25"
              >
                {chatInput.trim() ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    Send
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Upload status message */}
        {uploadStatus && (
          <p className={`text-[12px] font-medium -mt-4 ${uploadStatus.isError ? "text-red-400" : "text-emerald-400"}`}>
            {uploadStatus.isError ? "❌ " : "✅ "}{uploadStatus.msg}
          </p>
        )}

        {/* ── Feature Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          {FEATURE_CARDS.map((card) => (
            <div
              key={card.title}
              className={`p-4 rounded-xl border bg-white/[0.02] hover:bg-white/[0.04] transition-colors ${card.bg} cursor-default`}
            >
              <div className={`${card.color} mb-2`}>{card.icon}</div>
              <p className="text-[13px] font-semibold text-slate-200 mb-1">{card.title}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
