"use client";

import { useRef, useEffect } from "react";
import ModelSelector from "./ModelSelector";

/**
 * ChatPanel.tsx
 *
 * PURPOSE: The left column in the workspace — shows the AI conversation.
 *
 * CONCEPTS USED:
 * - `useRef + useEffect for auto-scroll`: After every new message is added
 *   to the `messages` array, we call `messagesEndRef.current?.scrollIntoView()`.
 *   The `?` is optional chaining — if the ref isn't attached yet, it does nothing
 *   instead of throwing an error.
 *
 * - `whitespace-pre-wrap`: Preserves newlines in message text so AI responses
 *   that contain line breaks render correctly.
 *
 * - Message alignment: User messages are right-aligned (`ml-auto items-end`),
 *   AI messages are left-aligned (`mr-auto items-start`). This is the standard
 *   chat UI pattern (like WhatsApp, iMessage).
 *
 * - `dangerouslySetInnerHTML`: We use this to render **bold** markdown from AI.
 *   We sanitize it by only allowing a specific regex replacement, keeping it safe.
 */

type Message = { role: "user" | "assistant"; content: string };

interface ChatPanelProps {
  messages: Message[];
  chatInput: string;
  onChatInputChange: (v: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isTyping: boolean;
  cleanedDataset: any;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedModel: string;
  onModelChange: (m: string) => void;
  chatPlaceholder?: string;
}

/**
 * Renders AI text with **bold** markdown support.
 * We replace `**text**` with <strong> tags using a regex.
 * This is safe because we control the exact replacement — no arbitrary HTML.
 */
function renderMarkdown(text: string) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-blue-300 text-[11px] font-mono">$1</code>');
  return { __html: html };
}

export default function ChatPanel({
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  isTyping,
  cleanedDataset,
  onFileSelect,
  selectedModel,
  onModelChange,
  chatPlaceholder,
}: ChatPanelProps) {
  // Ref points to a hidden div at the bottom of the messages list
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Every time messages or isTyping changes, scroll to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Panel Header ── */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 flex-shrink-0 bg-[#0d1117]">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[12px] font-semibold text-slate-400 flex-1">
          {cleanedDataset ? "Cleaned Data Chat" : "Optima AI Chat"}
        </span>
        {/* Model selector in compact pill mode */}
        <ModelSelector value={selectedModel} onChange={onModelChange} compact />
      </div>

      {/* ── Messages List ── */}
      {/*
       * `flex-1 overflow-y-auto`: Takes remaining height, enables vertical scroll.
       * When content overflows vertically, the user can scroll.
       * The hidden div at the bottom (`messagesEndRef`) is what we scroll to.
       */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
            <svg className="w-10 h-10 text-blue-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-slate-500">Upload a dataset to start chatting</p>
          </div>
        )}

        {/* Render each message bubble */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[88%] gap-1 ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
          >
            {/* Role label */}
            <div className="flex items-center gap-1.5">
              {msg.role === "assistant" && (
                // AI avatar — small gradient dot
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                </div>
              )}
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-600">
                {msg.role === "user" ? "You" : "Optima AI"}
              </span>
            </div>

            {/* Message bubble */}
            <div
              className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm
                ${msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-[#1a2235] text-slate-200 border border-white/5 rounded-tl-sm"
                }`}
            >
              {msg.role === "assistant" ? (
                // AI messages: render inline markdown (bold, code)
                <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
              ) : (
                // User messages: plain text
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator — animated dots while AI is "thinking" */}
        {isTyping && (
          <div className="flex flex-col mr-auto max-w-[80%] items-start gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-600">Optima AI</span>
            </div>
            <div className="px-4 py-3 bg-[#1a2235] border border-white/5 rounded-2xl rounded-tl-sm shadow-sm">
              {/* Three bouncing dots */}
              <div className="flex gap-1.5 items-center h-4">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Invisible anchor div — scrolled into view on new messages */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Chat Input Bar ── */}
      <div className="p-3 border-t border-white/5 flex-shrink-0 bg-[#0d1117]">
        {/* Hidden file input for attaching files from chat */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          accept=".csv,.xlsx"
          className="hidden"
        />

        <form
          onSubmit={onSendMessage}
          className="flex items-end gap-2 bg-[#111827] border border-white/8 rounded-xl p-2 focus-within:border-blue-500/40 transition-all"
        >
          {/* Attach button inside chat input */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a new dataset"
            className="p-2 text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 mb-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Text input */}
          <textarea
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSendMessage(e as any);
              }
            }}
            placeholder={chatPlaceholder ?? (cleanedDataset ? "Ask about your cleaned data..." : "Tell Optima what to clean or analyze...")}
            className="flex-1 bg-transparent resize-none py-2 px-1 text-[13px] text-slate-200 focus:outline-none placeholder:text-slate-600 min-h-[36px] max-h-[120px] no-scrollbar"
            disabled={isTyping}
            rows={1}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!chatInput.trim() || isTyping}
            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-600 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-lg shadow-blue-600/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        <p className="text-[10px] text-slate-700 text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
