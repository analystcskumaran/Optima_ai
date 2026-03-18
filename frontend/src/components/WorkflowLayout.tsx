"use client";

/**
 * WorkflowLayout.tsx — Main Desktop Two-Pane Layout
 *
 * PURPOSE: Houses the Chat (left) and Data panels (right) side by side.
 *   Also provides global keyboard shortcuts and the Help modal.
 *
 * KEYBOARD SHORTCUTS:
 *   U — focus / trigger upload (calls onUploadTrigger)
 *   C — start cleaning (calls onClean)
 *   D — toggle Preview diff (switches to preview tab)
 *   ? — open Help modal
 *   Esc — close Help modal
 */

import { useEffect, useCallback, useState } from "react";
import HelpModal from "./HelpModal";

interface WorkflowLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  onUploadTrigger?: () => void;
  onClean?: () => void;
  onToggleDiff?: () => void;
}

export default function WorkflowLayout({
  left,
  right,
  onUploadTrigger,
  onClean,
  onToggleDiff,
}: WorkflowLayoutProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire shortcuts when user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      switch (e.key) {
        case "?":
          e.preventDefault();
          setHelpOpen((v) => !v);
          break;
        case "Escape":
          setHelpOpen(false);
          break;
        case "u":
        case "U":
          e.preventDefault();
          onUploadTrigger?.();
          break;
        case "c":
        case "C":
          e.preventDefault();
          onClean?.();
          break;
        case "d":
        case "D":
          e.preventDefault();
          onToggleDiff?.();
          break;
      }
    },
    [onUploadTrigger, onClean, onToggleDiff]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {/*
       * Two-column split layout.
       * `min-h-0` on the flex children is critical: it lets them shrink below their
       * natural content height, which enables the inner scroll areas to work correctly.
       */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Chat */}
        <div className="flex flex-col min-h-0 w-[380px] flex-shrink-0 border-r border-white/5">
          {left}
        </div>

        {/* RIGHT: Data Panels */}
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
          {right}
        </div>
      </div>

      {/* Keyboard hints bar — visible at bottom */}
      <div className="flex-shrink-0 hidden md:flex items-center gap-4 px-4 py-1.5 border-t border-white/5 bg-[#080e1a]">
        {[
          { key: "U", label: "Upload" },
          { key: "C", label: "Clean" },
          { key: "D", label: "Diff" },
          { key: "?", label: "Help" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[9px] font-bold bg-white/5 border border-white/10 rounded text-slate-500 font-mono">{key}</kbd>
            <span className="text-[10px] text-slate-700">{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
