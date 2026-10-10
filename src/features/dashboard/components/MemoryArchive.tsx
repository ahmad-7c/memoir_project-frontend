"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Wand2,
  Edit2,
  LayoutGrid,
  ListTree,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { MemoryItem } from "../types";
import { MemoryCard } from "./MemoryCard";

interface MemoryArchiveProps {
  expandedStacks: string[];
  toggleStack: (kind: string) => void;
  // Extended type ensures TypeScript knows about the media fields
  mockMemories: (MemoryItem & { 
    audioUrl?: string; 
    mediaUrl?: string; 
    transcription?: string; 
    chapter_id?: string; 
    content?: string;
    title?: string;
  })[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chapters?: any[]; 
  isGenerating?: boolean;
  onGenerateTimeline?: () => void;
  onRenameChapter?: (chapterId: string, newTitle: string) => void;
  onMemoryOptionSelect?: (action: string, memoryId: string, targetChapterId?: string) => void;

  /** Active pipeline stage from the backend, e.g. "reading memories". */
  organizeStage?: string | null;
  /** Full stage list, so the wait is legible instead of an opaque spinner. */
  organizeStages?: string[];
  /** Owner-facing failure message, if the last run failed or stalled. */
  organizeError?: string | null;
}

export function MemoryArchive({ 
  expandedStacks, 
  toggleStack, 
  mockMemories,
  chapters = [],
  isGenerating = false,
  onGenerateTimeline,
  onRenameChapter,
  onMemoryOptionSelect,
  organizeStage = null,
  organizeStages = [],
  organizeError = null,
}: MemoryArchiveProps) {
  
  const [viewMode, setViewMode] = useState<"material" | "timeline">("material");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleSaveChapterTitle = (chapterId: string) => {
    if (editTitle.trim() && onRenameChapter) {
      onRenameChapter(chapterId, editTitle.trim());
    }
    setEditingChapterId(null);
  };

  return (
    <>
      <div className="w-full flex items-center justify-center my-12 opacity-80">
        <div className="h-0.5 bg-stone-400 w-32"></div>
        <div className="mx-4 w-2 h-2 rounded-full bg-stone-500"></div>
        <div className="h-0.5 bg-stone-400 w-32"></div>
      </div>

      <section id="archive" className="relative z-10 pt-4">
        <div className="flex flex-col">
          
          <div className="text-center mb-8">
            <h3 className="font-sans font-bold text-3xl text-stone-900 mb-2">The Memory Archive</h3>
            <div className="w-16 h-1 bg-memory-primary rounded-full mx-auto mt-4"></div>
          </div>

          {/* VIEW TOGGLE */}
          <div className="flex justify-center mb-16">
            <div className="bg-stone-200/50 p-1 rounded-lg flex items-center gap-1 border border-stone-300 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode("material")}
                className={`flex items-center gap-2 px-5 py-2 rounded-md font-sans text-sm font-semibold transition-all cursor-pointer ${
                  viewMode === "material" 
                    ? "bg-white text-stone-900 shadow-sm border border-stone-200" 
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <LayoutGrid size={16} /> Group by Material
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-2 px-5 py-2 rounded-md font-sans text-sm font-semibold transition-all cursor-pointer ${
                  viewMode === "timeline" 
                    ? "bg-white text-stone-900 shadow-sm border border-stone-200" 
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <ListTree size={16} /> Assemble Timeline
              </button>
            </div>
          </div>

          {/* ORIGINAL MATERIAL VIEW - WORKSPACE */}
          {viewMode === "material" && (
            <div className="space-y-20">
              {[
                { id: 'text', title: "Written Reflections", items: mockMemories.filter(m => m.kind === 'text') },
                { id: 'photo', title: "Photographic Plates", items: mockMemories.filter(m => m.kind === 'photo' || m.kind === 'combined') },
                { id: 'audio', title: "Voice Notes", items: mockMemories.filter(m => m.kind === 'audio') }
              ].map(group => {
                if (group.items.length === 0) return null;
                const isExpanded = expandedStacks.includes(group.id);

                return (
                  <div key={group.id} className="flex flex-col">
                    <div className="flex items-center gap-4 mb-8 border-b border-stone-300 pb-3">
                      <h4 className="font-sans font-semibold text-2xl text-stone-800">{group.title}</h4>
                    </div>
                    <div className="relative w-full mx-auto flex flex-col">
                      <AnimatePresence>
                        {group.items.map((memory, index) => {
                          if (!isExpanded && index > 2) return null;
                          const isStacked = !isExpanded && index > 0;
                          return (
                            <motion.div 
                              key={memory.id} 
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ 
                                opacity: 1,
                                scale: isStacked ? 1 - (index * 0.03) : 1,
                                rotate: isExpanded ? 0 : (index === 1 ? -1 : index === 2 ? 1 : 0),
                                marginTop: isExpanded ? (index > 0 ? "32px" : "0px") : (index > 0 ? "-120px" : "0px")
                              }}
                              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                              className={`w-full ${isStacked ? 'pointer-events-none' : ''}`}
                              style={{ zIndex: 40 - index }}
                            >
                              <div className={isStacked ? "opacity-50 saturate-50 bg-memory-bg border-stone-300/50 rounded-xl transition-all" : ""}>
                                <MemoryCard 
                                  memory={memory} 
                                  availableChapters={chapters}
                                  onOptionSelect={(action, id, targetChapterId) => {
                                    if (onMemoryOptionSelect) {
                                      onMemoryOptionSelect(action, id, targetChapterId);
                                    }
                                  }}
                                  onPlayAudio={(id) => console.log("Play audio", id)}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                    {group.items.length > 1 && (
                      <div className="mt-12 flex justify-center z-50">
                        <motion.button
                          type="button"
                          onClick={() => toggleStack(group.id)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="cursor-pointer bg-white border-2 border-stone-300 text-stone-800 px-8 py-4 rounded-xl text-[16px] font-semibold transition-all duration-300 shadow-md flex items-center gap-3 group hover:border-memory-primary hover:text-memory-primary"
                        >
                          <Layers size={18} className={`text-stone-400 group-hover:text-memory-primary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          {isExpanded ? `Close ${group.title} Stack` : `Unpack All ${group.items.length} Pieces`}
                        </motion.button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* PUBLISHED BIOGRAPHY CHAPTER VIEW (TIGHT SIDE-BY-SIDE TEXT WRAP) */}
          {viewMode === "timeline" && (
            <div className="flex flex-col w-full max-w-2xl mx-auto px-4 font-serif text-stone-800">
              {chapters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-[#FAF7F2] border border-stone-300 border-dashed rounded-2xl font-sans">
                  <Wand2 size={32} className="text-memory-primary mb-4 opacity-80" />
                  <h4 className="text-xl font-bold text-stone-900 mb-2">Unstructured Archive</h4>
                  <p className="text-sm text-stone-600 max-w-sm mb-8">
                    Allow the system to organize your memories into chronological book chapters.
                  </p>
                  <motion.button
                    onClick={onGenerateTimeline}
                    disabled={isGenerating}
                    whileHover={!isGenerating ? { scale: 1.02 } : {}}
                    whileTap={!isGenerating ? { scale: 0.98 } : {}}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-md ${
                      isGenerating ? 'bg-stone-400 cursor-not-allowed' : 'bg-memory-primary hover:bg-[#5a222a] cursor-pointer'
                    }`}
                  >
                    <Wand2 size={16} className={isGenerating ? "animate-spin" : ""} />
                    {isGenerating
                      ? (organizeStage ?? "Reading your memories...")
                      : "Organize Timeline"}
                  </motion.button>

                  {/* Stage list while running. The backend reports which agent
                      stage is active, so the wait is legible instead of an
                      indefinite spinner. */}
                  {isGenerating && organizeStages.length > 0 && (
                    <ul className="mt-8 space-y-2 text-left" aria-live="polite">
                      {organizeStages.map((stage, i) => {
                        const activeIndex = organizeStages.indexOf(
                          organizeStage ?? organizeStages[0],
                        );
                        const state =
                          i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
                        return (
                          <li
                            key={stage}
                            className={`flex items-center gap-2.5 text-sm ${
                              state === "pending" ? "text-stone-400" : "text-stone-700"
                            }`}
                          >
                            {state === "done" ? (
                              <Check size={14} className="text-green-600 shrink-0" />
                            ) : state === "active" ? (
                              <Loader2 size={14} className="text-memory-primary animate-spin shrink-0" />
                            ) : (
                              <span className="w-3.5 shrink-0" />
                            )}
                            <span className={state === "active" ? "font-semibold" : ""}>
                              {stage}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {organizeError && (
                    <div
                      role="alert"
                      className="mt-6 flex gap-2.5 items-start text-left bg-red-50 border border-red-200 rounded-xl px-4 py-3 max-w-sm mx-auto"
                    >
                      <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      <p className="text-[13px] text-red-800 leading-relaxed">
                        {organizeError}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Reduced gap between chapters from space-y-40 down to space-y-16 */
                <div className="space-y-16">
                  {chapters.map((chapter) => {
                    const chapterMemories = mockMemories.filter(m => 
                      m.chapter_id && chapter.id && String(m.chapter_id).trim() === String(chapter.id).trim()
                    );

                    return (
                      <article key={chapter.id} className="flex flex-col space-y-6">
                        
                        {/* CHAPTER HEADING & SUMMARY */}
                        <div className="border-b border-stone-300 pb-4 group">
                          <div className="flex items-center justify-between">
                            {editingChapterId === chapter.id ? (
                              <div className="flex items-center gap-2 font-sans w-full">
                                <input 
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="font-sans font-bold text-3xl text-stone-900 bg-transparent border-b border-memory-primary outline-none px-1 w-full"
                                  autoFocus
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveChapterTitle(chapter.id)}
                                />
                                <button onClick={() => handleSaveChapterTitle(chapter.id)} className="text-xs font-semibold text-memory-primary hover:underline cursor-pointer">Save</button>
                              </div>
                            ) : (
                              <>
                                <h2 className="font-sans font-bold text-3xl md:text-4xl text-stone-900 tracking-tight">
                                  {chapter.title}
                                </h2>
                                <button 
                                  onClick={() => { setEditingChapterId(chapter.id); setEditTitle(chapter.title); }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-stone-400 hover:text-memory-primary cursor-pointer font-sans"
                                  title="Edit Chapter Title"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </>
                            )}
                          </div>

                          {chapter.summary && (
                            <p className="font-serif italic text-stone-500 text-sm mt-2">
                              {chapter.summary}
                            </p>
                          )}
                        </div>

                        {/* TIGHT SIDE-BY-SIDE MEMORY STREAM */}
                        {/* Reduced gap between paragraphs/memories from space-y-12 down to space-y-6 */}
                        <div className="space-y-6">
                          {chapterMemories.length === 0 ? (
                            <p className="text-stone-400 text-sm italic font-sans py-4 text-center border border-stone-200 border-dashed rounded-lg">
                              No memories recorded in this chapter yet.
                            </p>
                          ) : (
                            chapterMemories.map((memory, mIdx) => {
                              const isEven = mIdx % 2 === 0;

                              return (
                                <div key={memory.id} className="clearfix leading-[1.9] text-[17.5px] text-stone-800">
                                  
                                  {/* Tightly Integrated Inline Photograph */}
                                  {memory.mediaUrl && (
                                    <figure className={`float-${isEven ? 'left mr-5' : 'right ml-5'} mt-1 mb-2 p-1.5 bg-white shadow-md border border-stone-200 rounded-sm transform ${isEven ? '-rotate-1' : 'rotate-1'} w-48 shrink-0`}>
                                      <div className="relative w-full aspect-4/3 bg-stone-100 overflow-hidden">
                                        <img src={memory.mediaUrl} alt={memory.title || "Archival Photo"} className="object-cover w-full h-full" />
                                      </div>
                                    </figure>
                                  )}

                                  {/* Paragraph Content wrapping naturally alongside the image */}
                                  <p className={`whitespace-pre-wrap book-text ${
                                    mIdx === 0 && !memory.mediaUrl ? "first-letter:text-4xl first-letter:font-bold first-letter:mr-2.5 first-letter:float-left" : ""
                                  }`}>
                                    {memory.content || memory.transcription}
                                  </p>

                                  {/* Discreet inline audio note if present */}
                                  {memory.audioUrl && (
                                    <div className="mt-2 inline-flex items-center gap-2.5 bg-[#FAF7F2] border border-stone-200 py-1 px-2.5 rounded-xl shadow-sm font-sans clear-both">
                                      <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Voice Note</span>
                                      <audio controls src={memory.audioUrl} className="w-40 h-5 outline-none" controlsList="nodownload" />
                                    </div>
                                  )}

                                </div>
                              );
                            })
                          )}
                        </div>

                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    </>
  );
}