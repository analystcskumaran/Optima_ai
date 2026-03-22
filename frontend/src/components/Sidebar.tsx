"use client";

/**
 * Sidebar.tsx — Redesigned with Session History
 *
 * WHAT CHANGED:
 * - Removed broken "Comparison View" and "AI Chat" nav items
 * - Renamed "Data Refinery" to "My Workspace"
 * - Added "New Session" button (resets everything)
 * - Added scrollable session history list
 * - History items stored in localStorage (persists across browser refreshes)
 *
 * CONCEPTS:
 * - `localStorage`: Browser's built-in key-value store. Data persists even when
 *   you close and reopen the browser. We store sessions as a JSON string.
 *   Reading: `localStorage.getItem("key")` → string | null
 *   Writing: `localStorage.setItem("key", JSON.stringify(data))`
 *
 * - Session history is stored OUTSIDE this component in page.tsx and passed in
 *   as a prop. This keeps Sidebar "dumb" (just display) and page.tsx as the
 *   single source of truth — the correct React pattern.
 */

export type SessionRecord = {
  id: string;           // Unique ID (timestamp-based)
  fileName: string;     // e.g. "sales_data.csv"
  shape: [number, number];   // [rows, cols]
  fingerprint: any;     // Full fingerprint to reload the session
  filePath?: string;    // Backend storage path (e.g. uploads/uuid_file.csv)
  createdAt: string;    // ISO date string for display
  
  // Full session state for resuming
  messages?: { role: "user" | "assistant"; content: string }[];
  diagnosticReport?: string | null;
  cleanedDataset?: any;
};

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: SessionRecord[];           // History list from localStorage
  activeSessionId: string | null;      // Which session is currently active
  onNewSession: () => void;            // Clear everything, go to landing
  onLoadSession: (s: SessionRecord) => void;  // Reload a past session
  onDeleteSession: (id: string) => void;      // Remove a session from history
}

// Helper: format relative time ("2 hours ago", "Yesterday", etc.)
function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function Sidebar({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onNewSession,
  onLoadSession,
  onDeleteSession,
}: SidebarProps) {
  return (
    <aside
      className={`
        bg-[#0a0f1a] flex flex-col border-r border-white/5 z-50
        transition-all duration-300 ease-in-out
        absolute md:relative h-full flex-shrink-0
        ${isOpen ? "w-[240px] translate-x-0" : "w-0 md:w-[60px] -translate-x-full md:translate-x-0"}
        overflow-hidden
      `}
    >
      {/* ── Top: Logo + Toggle ── */}
      <div className="h-[64px] flex items-center px-3 border-b border-white/5 flex-shrink-0 gap-2">
        <button
          onClick={onToggle}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all flex-shrink-0 hidden md:flex"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand — only when expanded */}
        <div className={`flex items-center gap-2 transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0 pointer-events-none"} overflow-hidden whitespace-nowrap`}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
          </div>
          <span className="font-semibold text-[15px] text-white tracking-tight">Optima</span>
        </div>
      </div>

      {/* ── New Session Button ── */}
      <div className={`px-3 pt-3 pb-2 flex-shrink-0 ${isOpen ? "" : "flex justify-center"}`}>
        <button
          onClick={onNewSession}
          title="New Session"
          className={`
            flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30
            border border-blue-500/30 hover:border-blue-400/50
            text-blue-300 rounded-lg transition-all font-medium text-[12px]
            ${isOpen ? "w-full px-3 py-2.5 justify-start" : "w-10 h-10 justify-center"}
          `}
        >
          {/* Plus icon */}
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          {isOpen && <span className="whitespace-nowrap">New Session</span>}
        </button>
      </div>

      {/* ── My Workspace nav item (the only real nav item) ── */}
      <div className={`px-3 pb-2 flex-shrink-0 ${isOpen ? "" : "flex justify-center"}`}>
        {/*
         * "My Workspace" is the only working view in the current version.
         * We removed "Comparison View" and "AI Chat" because they had no
         * working backend and were misleading the user.
         */}
        <div
          className={`
            flex items-center gap-2.5 rounded-lg text-[12px] font-semibold
            bg-white/5 text-slate-300 border border-white/5
            ${isOpen ? "px-3 py-2 w-full" : "w-10 h-10 justify-center"}
            cursor-default
          `}
          title="My Workspace"
        >
          <svg className="w-4 h-4 flex-shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {isOpen && <span className="whitespace-nowrap">My Workspace</span>}
        </div>
      </div>

      {/* ── Session History ── */}
      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section header */}
          <div className="px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Recent Sessions</span>
          </div>

          {/* Session list — scrollable */}
          {/*
           * `overflow-y-auto` — this div scrolls independently if history is long.
           * Each item is a button that calls onLoadSession() with the full session data.
           */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Upload a dataset to start your first session
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    className={`group relative flex items-start gap-2 rounded-lg px-2 py-2.5 cursor-pointer transition-all
                      ${isActive
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : "hover:bg-white/[0.04] border border-transparent"
                      }`}
                    onClick={() => onLoadSession(session)}
                  >
                    {/* File icon */}
                    <svg className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? "text-blue-400" : "text-slate-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>

                    {/* Session info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium truncate leading-tight ${isActive ? "text-blue-300" : "text-slate-300"}`}>
                        {session.fileName}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {session.shape[0].toLocaleString()} rows · {timeAgo(session.createdAt)}
                      </p>
                    </div>

                    {/* Delete button — appears on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Don't trigger onLoadSession
                        onDeleteSession(session.id);
                      }}
                      title="Remove from history"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-600 hover:text-red-400 flex-shrink-0 mt-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Collapsed state: show clock icon for history */}
      {!isOpen && (
        <div className="flex-1 flex flex-col items-center pt-2 gap-1">
          <div className="p-2 text-slate-700" title="Session history (expand sidebar to view)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {/* Dots for each session (visual indicator) */}
          {sessions.slice(0, 5).map((s) => (
            <button
              key={s.id}
              onClick={() => onLoadSession(s)}
              title={s.fileName}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${s.id === activeSessionId ? "bg-blue-400" : "bg-slate-700 hover:bg-slate-500"}`}
            />
          ))}
        </div>
      )}

      {/* ── Bottom: User area ── */}
      <div className={`border-t border-white/5 p-3 flex items-center gap-2.5 flex-shrink-0 ${isOpen ? "" : "justify-center"}`}>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 border border-white/10">
          U
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <p className="text-[11px] text-slate-300 font-medium truncate">user@gmail.com</p>
            <p className="text-[10px] text-slate-600">Free Plan</p>
          </div>
        )}
      </div>
    </aside>
  );
}
