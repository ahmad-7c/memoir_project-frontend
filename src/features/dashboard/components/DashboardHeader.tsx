"use client";
import { motion } from "framer-motion";
import { Search, Lock, Copy, Check, Sparkles } from "lucide-react";
interface DashboardHeaderProps {
  name: string;
  setName: (name: string) => void;
  dates: string;
  setDates: (dates: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleCopyLink: () => void;
  isLinkCopied: boolean;
  onLockClick?: () => void;
  onNarrativeClick?: () => void;
}

export function DashboardHeader({
  name, setName, dates, setDates, searchQuery, setSearchQuery, handleCopyLink, isLinkCopied, onLockClick, onNarrativeClick
}: DashboardHeaderProps) {
  return (
    <>
      {/* Slightly darkened the bottom border to match */}
      <header className="w-full border-b border-stone-400/80 bg-memory-bg/80 backdrop-blur-sm px-8 py-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            // Changed font-normal to font-bold to highlight
            className="bg-transparent font-sans text-2xl text-memory-primary font-bold tracking-tight placeholder:text-stone-400 border-none outline-none focus:ring-0 p-0 w-40"
          />
          {/* Darkened the slash to stone-600 and made it bold */}
          <span className="text-stone-600 font-bold">/</span>
          <input
            type="text"
            value={dates}
            onChange={(e) => setDates(e.target.value)}
            // Changed text-stone-500 to text-stone-800 and added font-bold to highlight
            className="bg-transparent text-xs font-sans uppercase tracking-[0.15em] text-stone-800 font-bold placeholder:text-stone-400 border-none outline-none focus:ring-0 p-0 w-28"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar - Darkened border from stone-300 to stone-500 */}
          <div className="relative p-2 shadow-sm bg-white border border-stone-500 w-48 transform -rotate-1 hover:rotate-0 transition-all z-10"
               style={{ borderRadius: "2px 20px 4px 15px / 15px 4px 20px 3px" }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-stone-400/50 border-dashed pl-6 py-0.5 text-[12px] font-sans text-stone-900 font-medium placeholder-stone-500 outline-none focus:border-memory-primary transition-colors"
            />
          </div>

          {/* Share Button - Darkened border from stone-300 to stone-500 */}
          <motion.button 
            type="button"
            onClick={handleCopyLink}
            whileHover={{ y: -1, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}
            whileTap={{ y: 1 }}
            className="relative w-40 h-11 bg-white shadow-sm border border-stone-500 rounded-r-md rounded-l-sm flex items-center justify-between pl-5 pr-3 cursor-pointer overflow-hidden group"
          >
            {/* The dark "book spine" accent on the left */}
            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-[#240d14]" />
            <span className="font-sans text-[12px] text-stone-800 font-bold tracking-wide">
              {isLinkCopied ? "Link Copied." : "Share Memoir"}
            </span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isLinkCopied ? 'bg-memory-primary text-white' : 'bg-stone-200 text-stone-600 group-hover:bg-stone-300'}`}>
              {isLinkCopied ? <Check size={10} /> : <Copy size={10} />}
            </div>
          </motion.button>

          {/* Narrative Button */}
          <motion.button
            type="button"
            onClick={onNarrativeClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-11 h-11 bg-white border border-stone-500 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-stone-100 transition-colors"
            title="The Narrative"
          >
            <Sparkles size={15} className="text-memory-primary" />
          </motion.button>

          {/* Lock Button - Darkened outer border to match the dark maroon */}
          <motion.button
            type="button"
            onClick={onLockClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-11 h-11 bg-memory-primary rounded-full flex items-center justify-center shadow-md cursor-pointer border border-[#240d14]/40 hover:bg-[#240d14] transition-colors"
            title="Lock & Publish Memoir"
          >
            <Lock size={15} className="text-white" />
          </motion.button>
        </div>
      </header>

      <div className="w-full flex items-center justify-center py-2 px-12">
        {/* Darkened pulsing line from stone-400 to stone-500 */}
        <div className="w-full h-0.5 bg-stone-500 animate-smooth-pulse rounded-full"></div>
      </div>
    </>
  );
}