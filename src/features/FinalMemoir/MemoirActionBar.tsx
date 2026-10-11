import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface MemoirActionBarProps {
  pdfFileName: string;
  setPdfFileName: (val: string) => void;
  triggerExport: (name: string) => void;
  isExporting: boolean;
  searchQuery: string;
  handleSearchTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isTyping: boolean;
}

export default function MemoirActionBar({
  pdfFileName, setPdfFileName, triggerExport, isExporting,
  searchQuery, handleSearchTyping,
}: MemoirActionBarProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 pt-2 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <Input
          type="text"
          value={pdfFileName}
          onChange={(e) => setPdfFileName(e.target.value)}
          placeholder="Filename"
          className="w-40"
        />
        <button
          type="button"
          onClick={() => triggerExport(pdfFileName)}
          disabled={isExporting}
          className="px-4 py-2.5 rounded-sm border border-line text-ink-secondary text-small font-semibold hover:bg-surface-sunk transition-colors cursor-pointer disabled:opacity-50 min-h-11"
        >
          {isExporting ? "Exporting…" : "Download PDF"}
        </button>
      </div>

      <div className="relative w-full sm:w-72">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Search this memoir"
          value={searchQuery}
          onChange={handleSearchTyping}
          className="w-full bg-surface-sunk border border-line rounded-sm pl-9 pr-3 py-2.5 text-body-ui text-ink placeholder:text-ink-muted outline-none focus:border-brass transition-colors"
        />
      </div>
    </div>
  );
}
