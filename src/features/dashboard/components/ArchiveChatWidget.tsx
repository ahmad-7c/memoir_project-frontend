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
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);

    try {
      const backendHistory = currentHistoryForApi.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      // Response is validated by a Zod schema at the API boundary, so `reply`
      // and `proposed_actions` are guaranteed present here rather than being
      // probed for across four possible field names.
      const res = await api.askArchive(memoirId, userText, backendHistory);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply || "I have analyzed your archive records.",
          proposedActions: res.proposed_actions,
        },
      ]);
    } catch (e) {
      console.error("Chat error:", e);
      setChatHistory(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an error querying your archive." }]);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 md:w-96 bg-white border border-stone-300 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            style={{ height: "450px" }}
          >
            <div className="bg-[#FAF7F2] border-b border-stone-200 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-memory-primary" />
                <span className="font-sans font-bold text-stone-800 text-sm tracking-wide">Ask the Archive</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-stone-400 hover:text-stone-800 cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-stone-50 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center text-stone-500 text-xs mt-10 px-4">
                  Search for specific memories, names, or patterns hidden within your timeline.
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-xl max-w-[85%] text-[13px] font-sans ${msg.role === 'user' ? 'bg-memory-primary text-white rounded-tr-sm' : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm'}`}>
                      {msg.text}
                    </div>

                    {/* Suggestions are shown, never auto-applied. Applying a
                        change requires the proposal review flow, which is where
                        the owner sees what would change and confirms it. */}
                    {msg.proposedActions && msg.proposedActions.length > 0 && (
                      <div className="max-w-[85%] mt-1.5 space-y-1.5">
                        {msg.proposedActions.map((action, j) => (
                          <div
                            key={j}
                            className="flex items-start gap-1.5 text-[11px] text-stone-500 bg-white/70 border border-stone-200 rounded-lg px-2.5 py-1.5"
                          >
                            <Sparkles size={11} className="text-memory-primary shrink-0 mt-0.5" />
                            <span>
                              <span className="font-semibold text-stone-700">
                                {action.action_type.replace(/_/g, " ")}
                              </span>
                              {action.rationale ? ` — ${action.rationale}` : ""}
                            </span>
                          </div>
                        ))}
                        <p className="text-[10px] text-stone-400 px-1">
                          Suggestions only — nothing has been changed. Use
                          &ldquo;Organize Timeline&rdquo; to review and apply
                          chapter changes.
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-white border-t border-stone-200">
              <input 
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter') handleSendChat();
                }}
                placeholder="Search your memories..."
                className="w-full bg-[#FAF7F2] border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-memory-primary text-stone-800 placeholder:text-stone-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsChatOpen(!isChatOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-memory-primary text-white rounded-full shadow-xl flex items-center justify-center cursor-pointer border-2 border-white/20 hover:bg-[#5a222a] transition-colors"
      >
        {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
}