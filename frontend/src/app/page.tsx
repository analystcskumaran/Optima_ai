"use client";

/**
 * page.tsx — The Root Application Entry Point
 *
 * PURPOSE: This file is the "brain" of the app. It:
 *   1. Holds ALL shared state (datasets, messages, UI toggles)
 *   2. Contains ALL API call functions
 *   3. Composes (assembles) all the components into one layout
 *
 * CONCEPTS USED:
 * - "Lifting state up": State like `messages`, `activeDataset`, and `isSidebarOpen`
 *   is defined HERE (the parent) and passed DOWN to child components as props.
 *   This makes the parent the single "source of truth" — multiple children
 *   can read from and react to the same state.
 *
 * - Props as callbacks: Functions like `handleFileUpload` are defined here and
 *   passed to child components. When a child calls `onFileSelect(...)`, it
 *   is actually calling `handleFileUpload` from this parent. This lets children
 *   trigger actions without knowing the implementation details.
 *
 * - Conditional rendering: We show LandingScreen OR WorkflowLayout depending
 *   on whether `activeDataset` is set. This is the core navigation pattern
 *   for this single-page application.
 *
 * HOW API CALLS WORK:
 * - `fetch()` is the browser's built-in HTTP client. We use it to call our
 *   FastAPI backend at `http://localhost:8000`.
 * - `await` pauses execution until the Promise resolves (the server responds).
 * - We wrap calls in `try/catch` to handle network errors gracefully.
 */

import { useState, useEffect } from "react";
import Sidebar, { SessionRecord } from "@/components/Sidebar";
import Header from "@/components/Header";
import LandingScreen from "@/components/LandingScreen";
import ChatPanel from "@/components/ChatPanel";
import DataPanel from "@/components/DataPanel";
import WorkflowLayout from "@/components/WorkflowLayout";
import { useRole } from "@/lib/hooks";
import * as api from "@/lib/api";
import { DatasetFingerprint } from "@/lib/schemas";

// ── Type definitions ──
type Message = { role: "user" | "assistant"; content: string };
type TabId = "diagnostics" | "plan" | "dashboard" | "metrics";
type Dataset = {
  fileName: string;
  filePath: string;
  shape: [number, number];
  fingerprint: any;
};

// ── localStorage helpers ──
// These keep session history in the browser across page refreshes.
const STORAGE_KEY = "optima_sessions";

function loadSessions(): SessionRecord[] {
  // typeof window check prevents SSR crash (Next.js renders on server too)
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveSessions(sessions: SessionRecord[]): void {
  if (typeof window === "undefined") return;
  // Keep only the last 20 sessions to avoid filling up localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
}

export default function Home() {
  // ── Sidebar State ──
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ── Session History State ──
  // Loaded from localStorage on mount, saved whenever a new dataset is uploaded.
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load sessions from localStorage on first render (client-side only)
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  // ── Upload & Dataset State ──
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ msg: string; isError: boolean } | null>(null);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);

  // ── Chat State ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const { copy } = useRole();

  // ── Workflow State ──
  const [activeTab, setActiveTab] = useState<TabId>("diagnostics");
  const [diagnosticReport, setDiagnosticReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cleanedDataset, setCleanedDataset] = useState<any | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");

  // ── Close sidebar on mobile when dataset loads ──
  useEffect(() => {
    if (activeDataset && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [activeDataset]);

  // ── Auto-save Session State ──
  // Watches for changes and continuously updates the active session in localStorage
  useEffect(() => {
    if (!activeSessionId || !activeDataset) return;
    
    setSessions((prev) => {
      const idx = prev.findIndex(s => s.id === activeSessionId);
      if (idx === -1) return prev;
      
      const updatedSessions = [...prev];
      updatedSessions[idx] = {
        ...updatedSessions[idx],
        filePath: activeDataset.filePath,
        messages,
        diagnosticReport,
        cleanedDataset,
      };
      
      saveSessions(updatedSessions);
      return updatedSessions;
    });
  }, [activeSessionId, activeDataset, messages, diagnosticReport, cleanedDataset]);

  // ────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ────────────────────────────────────────────

  // Save a new session to history after a successful upload
  const saveSession = (dataset: Dataset, sessionId: string) => {
    const newSession: SessionRecord = {
      id: sessionId,
      fileName: dataset.fileName,
      filePath: dataset.filePath,
      shape: dataset.shape,
      fingerprint: dataset.fingerprint,
      createdAt: new Date().toISOString(),
    };
    // Prepend new session (most recent first), remove duplicates by filename
    const updated = [
      newSession,
      ...sessions.filter((s) => s.fileName !== dataset.fileName),
    ];
    setSessions(updated);
    saveSessions(updated);
  };

  // "New Session" button — resets all state and goes back to landing screen
  const handleNewSession = () => {
    setActiveDataset(null);
    setCleanedDataset(null);
    setDiagnosticReport(null);
    setMessages([]);
    setActiveTab("diagnostics");
    setUploadStatus(null);
    setChatInput("");
    setActiveSessionId(null);
  };

  // Load a past session from the history list in the sidebar
  const handleLoadSession = (session: SessionRecord) => {
    // Reconstruct the dataset object from the stored session
    const dataset: Dataset = {
      fileName: session.fileName,
      filePath: session.filePath || "",
      shape: session.shape,
      fingerprint: session.fingerprint,
    };
    setActiveDataset(dataset);
    setActiveSessionId(session.id);
    
    // Restore chat and panels from the saved session
    if (session.messages && session.messages.length > 0) {
      setMessages(session.messages);
    } else {
      setMessages([
        {
          role: "assistant",
          content: `📂 Loaded session: **${session.fileName}** (${session.shape[0].toLocaleString()} rows × ${session.shape[1]} cols). Note: the cleaned file may need to be re-processed if the backend was restarted.`,
        },
      ]);
    }
    
    setCleanedDataset(session.cleanedDataset || null);
    setDiagnosticReport(session.diagnosticReport || null);
    
    // Auto-switch to the most relevant tab
    if (session.cleanedDataset) {
      setActiveTab("dashboard");
    } else if (session.diagnosticReport) {
      setActiveTab("diagnostics");
    } else {
      setActiveTab("diagnostics");
    }
    
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // Remove one session from history
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveSessions(updated);
    // If the deleted session was active, go back to landing
    if (id === activeSessionId) handleNewSession();
  };

  // ────────────────────────────────────────────
  // FILE UPLOAD HANDLER
  // Called when: user picks a file from LandingScreen or ChatPanel
  //
  // Steps:
  //  1. POST the file to /api/upload → get back `file_path` on disk
  //  2. POST file_path to /api/analyze-init → get shape + fingerprint
  //  3. Build the `activeDataset` object and set it in state
  //  4. If the user had typed a prompt before uploading, auto-send it
  // ────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);
    const initialPrompt = chatInput.trim();
    if (initialPrompt) setChatInput("");

    try {
      // Step 1: Upload file
      const uploadData = await api.uploadFile(file);

      // Step 2: Analyze/fingerprint the file
      const analyzeData = await api.analyzeInit(uploadData.file_path);

      // Step 3: Store dataset in state
      const newDataset: Dataset = {
        fileName: file.name,
        filePath: uploadData.file_path,
        shape: analyzeData.fingerprint.shape,
        fingerprint: analyzeData.fingerprint,
      };
      setActiveDataset(newDataset);
      setUploadStatus({ msg: "Dataset loaded into memory.", isError: false });
      setActiveTab("diagnostics");

      // Save to history
      const sessionId = `${Date.now()}-${file.name}`;
      setActiveSessionId(sessionId);
      saveSession(newDataset, sessionId);

      // Finish upload state immediately so the workspace shows
      setUploading(false);

      // Step 4: Initial messages
      const baseMessages: Message[] = [
        {
          role: "assistant",
          content: `Dataset **${file.name}** loaded! It has **${newDataset.shape[0].toLocaleString()} rows** and **${newDataset.shape[1]} columns**. What would you like to analyze or clean?`,
        },
      ];

      if (initialPrompt) {
        baseMessages.push({ role: "user", content: initialPrompt });
        setMessages(baseMessages);
        setIsTyping(true);
        try {
          const chatData = await api.chat(
            initialPrompt,
            `Loaded file: ${newDataset.fileName}`,
            newDataset.fingerprint as any,
            analyzeData.safe_summary,
            selectedModel
          );
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: chatData.reply },
          ]);
        } catch (chatErr: any) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `❌ Chat error: ${chatErr.message}` },
          ]);
        } finally {
          setIsTyping(false);
        }
      } else {
        setMessages(baseMessages);
      }
    } catch (err: any) {
      setUploadStatus({ msg: err.message ?? "Upload failed", isError: true });
      setUploading(false);
    }
  };

  // ────────────────────────────────────────────
  // SEND MESSAGE HANDLER
  // Called when: user submits the chat input form
  //
  // Process:
  //   1. Add user message to the messages array immediately (optimistic update)
  //   2. Show the typing indicator
  //   3. POST to /api/chat and await the AI reply
  //   4. Append the AI reply to messages, hide typing indicator
  // ────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput;
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const chatData = await api.chat(
        userMsg,
        activeDataset ? `Loaded file: ${activeDataset.fileName}` : "mock",
        (activeDataset?.fingerprint ?? {}) as any,
        JSON.stringify(activeDataset?.fingerprint?.safe_sample ?? {}),
        selectedModel
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: chatData.reply },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Network error: ${err.message}` },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ────────────────────────────────────────────
  // RUN DIAGNOSTICS
  // POSTs the dataset fingerprint to /api/diagnose and gets back a text report
  // ────────────────────────────────────────────
  const runDiagnostics = async () => {
    if (!activeDataset) return;
    setIsAnalyzing(true);
    try {
      const data = await api.diagnose(
        activeDataset.fingerprint as any,
        selectedModel
      );
      setDiagnosticReport(data.report);
    } catch (err: any) {
      setDiagnosticReport(`❌ Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ────────────────────────────────────────────
  // RUN REFINERY (Clean the data)
  // POSTs to /api/clean, stores cleaned dataset, switches to cleaned tab
  // ────────────────────────────────────────────
  const runRefinery = async () => {
    if (!activeDataset) return;
    setIsCleaning(true);
    try {
      const data = await api.cleanDataset(
        activeDataset.filePath,
        activeDataset.fingerprint as any,
        selectedModel
      );
      
      const finalCleanedDataset = {
        ...data.cleaned_data,
        plan: data.plan,                   // The JSON plan
        python_code: data.python_code,     // The actual Python script
        explanation: data.explanation,
      };
      setCleanedDataset(finalCleanedDataset);
      setActiveTab("dashboard");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `✨ Dataset cleaned! ${data.message}\n\n${data.explanation ?? ""}` },
      ]);
    } catch (err: any) {
      const errMsg = err?.message ?? "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ **Cleaning failed:** ${errMsg}`,
        },
      ]);
    } finally {
      setTimeout(() => setIsCleaning(false), 500);
    }
  };

  // ────────────────────────────────────────────
  // RENDER
  // This is the JSX tree — React converts this to real DOM elements.
  // ────────────────────────────────────────────
  return (
    /*
     * Root container: full viewport height, dark background, dark text.
     * `overflow-hidden` prevents any global scrollbar — each panel scrolls independently.
     * `flex` makes children lay out as a row (sidebar + main).
     */
    <div className="flex h-screen bg-[#080e1a] text-slate-200 font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((v) => !v)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={handleNewSession}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* ── Mobile overlay backdrop (darkens content behind open sidebar) ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Main Content Area ── */}
      {/*
       * `flex-1`: Takes all remaining width after the sidebar.
       * `flex flex-col`: Stack header + page content vertically.
       * `min-w-0`: Prevents flex children from overflowing (important with flex-1).
       */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Header ── */}
        <Header
          fileName={activeDataset?.fileName}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onMobileMenuToggle={() => setIsSidebarOpen((v) => !v)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* ── Page Body: Landing OR Workspace ── */}
        {activeDataset ? (
          /*
           * WORKSPACE VIEW — shown when a dataset is active.
           * WorkflowLayout provides the two-column split.
           * We pass ChatPanel to `leftPanel` and DataPanel to `rightPanel`.
           */
          <WorkflowLayout
            left={
              <ChatPanel
                messages={messages}
                chatInput={chatInput}
                onChatInputChange={setChatInput}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                cleanedDataset={cleanedDataset}
                onFileSelect={handleFileUpload}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                chatPlaceholder={copy.chatPlaceholder}
              />
            }
            right={
              <DataPanel
                activeTab={activeTab}
                onTabChange={setActiveTab}
                activeDataset={activeDataset}
                cleanedDataset={cleanedDataset}
                diagnosticReport={diagnosticReport}
                isAnalyzing={isAnalyzing}
                isCleaning={isCleaning}
                onRunDiagnostics={runDiagnostics}
                onRunRefinery={runRefinery}
                showAdvanced={copy.showAdvancedOptions}
                onClose={() => {
                  setActiveDataset(null);
                  setCleanedDataset(null);
                  setDiagnosticReport(null);
                  setMessages([]);
                  setActiveTab("diagnostics");
                }}
              />
            }
            onUploadTrigger={() => document.getElementById("file-upload-input")?.click()}
            onClean={runRefinery}
            onToggleDiff={() => setActiveTab("dashboard")}
          />
        ) : (
          /*
           * LANDING VIEW — shown when no dataset is loaded yet.
           */
          <LandingScreen
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onFileSelect={handleFileUpload}
            onSubmit={handleSendMessage}
            uploading={uploading}
            uploadStatus={uploadStatus}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        )}
      </main>
    </div>
  );
}
