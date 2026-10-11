"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Sparkles } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ProposedAction } from "../types/organization";

interface ArchiveChatWidgetProps {
  memoirId: string;
}

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  /**
   * Changes the assistant would like to make. Rendered for review only —
   * nothing here has been applied, and applying requires going through the
   * proposal flow rather than clicking something in this widget.
   */
  proposedActions?: ProposedAction[];
}

export function ArchiveChatWidget({ memoirId }: ArchiveChatWidgetProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);

  const handleSendChat = async () => {
    if (!chatQuery.trim() || !memoirId) return;
    const userText = chatQuery.trim();
    setChatQuery("");

    const currentHistoryForApi = [...chatHistory];
    setChatHistory((prev) => [...prev, { role: "user", text: userText }]);

    try {
      const backendHistory = currentHistoryForApi.map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.text,
      }));

      const res = await api.askArchive(memoirId, userText, backendHistory);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.reply || "I have looked through the archive.",
          proposedActions: res.proposed_actions,
        },
      ]);
    } catch (e) {
      console.error("Chat error:", e);
      setChatHistory((prev) => [...prev, { role: "assistant", text: "That search didn't go through. Please try again." }]);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="mb-4 w-80 md:w-96 bg-surface border border-line rounded-md overflow-hidden flex flex-col"
            style={{ height: "450px" }}
          >
            <div className="border-b border-line p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-ink-secondary" />
                <span className="text-body-ui font-semibold text-ink">Ask the archive</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-ink-muted hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {chatHistory.length === 0 ? (
                <p className="text-center text-small text-ink-muted mt-10 px-4">
                  Search for specific memories, names, or patterns in the timeline.
                </p>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-sm max-w-[85%] text-small ${
                        msg.role === "user" ? "bg-surface-sunk text-ink" : "border border-line text-ink-secondary"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Suggestions are shown, never auto-applied. Applying a
                        change requires the proposal review flow, which is where
                        the owner sees what would change and confirms it. */}
                    {msg.proposedActions && msg.proposedActions.length > 0 && (
                      <div className="max-w-[85%] mt-1.5 flex flex-col gap-1.5">
                        {msg.proposedActions.map((action, j) => (
                          <div key={j} className="flex items-start gap-1.5 text-micro text-ink-muted border border-line rounded-sm px-2.5 py-1.5">
                            <Sparkles size={11} className="text-ink-secondary shrink-0 mt-0.5" />
                            <span>
                              <span className="font-semibold text-ink-secondary">{action.action_type.replace(/_/g, " ")}</span>
                              {action.rationale ? ` — ${action.rationale}` : ""}
                            </span>
                          </div>
                        ))}
                        <p className="text-micro text-ink-muted px-1">
                          Suggestions only — nothing has changed. Use &ldquo;Organize into chapters&rdquo; to review and apply.
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-line">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChat();
                }}
                placeholder="Search your memories…"
                className="w-full bg-surface-sunk border border-line rounded-sm px-3 py-2.5 text-body-ui outline-none focus:border-brass text-ink placeholder:text-ink-muted transition-colors"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label={isChatOpen ? "Close archive search" : "Ask the archive"}
        className="w-14 h-14 bg-surface border border-line rounded-md flex items-center justify-center cursor-pointer text-ink-secondary hover:text-ink hover:bg-surface-sunk transition-colors"
      >
        {isChatOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </div>
  );
}
