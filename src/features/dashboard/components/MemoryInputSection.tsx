"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Mic, Camera, FileText, X, Image as ImageIcon, Square } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

interface MemoryInputSectionProps {
  activeInput: "none" | "text" | "audio" | "media" | "combined";
  setActiveInput: (val: "none" | "text" | "audio" | "media" | "combined") => void;
  isTextExpanded: boolean;
  setIsTextExpanded: (val: boolean) => void;
  isAssembling: boolean;
  inputTitle: string;
  setInputTitle: (val: string) => void;
  inputDate: string;
  setInputDate: (val: string) => void;
  inputContent: string;
  setInputContent: (val: string) => void;
  handleLocalSubmit: (e: React.FormEvent) => void;

  // Media controls wired from useCaptureMemory
  photoFile: File | null;
  setPhotoFile: (file: File | null) => void;
  recording: boolean;
  audioUrl: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  clearRecording: () => void;
}

const CHOICES = [
  { key: "text" as const, icon: PenLine, label: "Write", hint: "Put it into words" },
  { key: "audio" as const, icon: Mic, label: "Record", hint: "Say it out loud" },
  { key: "media" as const, icon: Camera, label: "Photograph", hint: "Share a picture" },
  { key: "combined" as const, icon: FileText, label: "All of it", hint: "Voice, photo and text together" },
];

/**
 * The dashboard's one primary action. Previously four "puzzle piece" and
 * "polaroid" cards with bespoke border-radius shapes, rotation, and drop
 * shadows -- replaced with equal, calm, hairline choices, matching the
 * brief's "three calm, equal choices with real space between them" (a
 * fourth, combined option is kept since it's real, already-wired capture
 * behaviour, not a styling flourish, so removing it would be a feature
 * change rather than a visual one).
 */
export function MemoryInputSection(props: MemoryInputSectionProps) {
  const {
    activeInput, setActiveInput, isTextExpanded, setIsTextExpanded, isAssembling,
    inputTitle, setInputTitle, inputDate, setInputDate, inputContent, setInputContent, handleLocalSubmit,
    photoFile, setPhotoFile, recording, audioUrl, startRecording, stopRecording, clearRecording,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section id="overview" className="relative z-50 mb-16">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setPhotoFile(e.target.files[0]);
          }
        }}
      />

      {activeInput === "none" && (
        <div className="flex flex-col items-center justify-center py-10">
          <p className="font-serif text-xl text-foreground mb-10 text-center">
            How would you like to hold onto today?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl">
            {CHOICES.map(({ key, icon: Icon, label, hint }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveInput(key)}
                className="flex flex-col items-start gap-3 p-6 rounded-md border border-border bg-card hover:border-primary transition-colors text-left cursor-pointer min-h-11"
              >
                <span className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground">
                  <Icon size={16} />
                </span>
                <span>
                  <span className="block font-serif text-xl text-foreground">{label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeInput !== "none" && (
          <motion.div
            key="memory-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="bg-card border border-border rounded-md p-6 md:p-8"
          >
            <div className="flex items-center justify-end mb-4">
              <button
                type="button"
                onClick={() => {
                  setActiveInput("none");
                  setIsTextExpanded(false);
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-2 rounded-sm transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLocalSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="memory-title">Title</Label>
                  <Input
                    id="memory-title"
                    type="text"
                    required
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    placeholder="Give this memory a title"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="memory-date">Date</Label>
                  <Input
                    id="memory-date"
                    type="date"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              {(activeInput === "text" || activeInput === "combined") && (
                <div>
                  <Label htmlFor="memory-content">
                    {activeInput === "combined" ? "Reflection" : "Write it the way you'd tell it"}
                  </Label>
                  {isTextExpanded ? (
                    <Textarea
                      id="memory-content"
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      placeholder="Write your story here, with care..."
                      rows={6}
                      autoFocus
                      className="font-serif text-sm"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsTextExpanded(true)}
                      className="w-full text-left rounded-sm border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground hover:border-primary transition-colors cursor-pointer min-h-11"
                    >
                      {inputContent || "Click here to expand and write freely"}
                    </button>
                  )}
                </div>
              )}

              {(activeInput === "audio" || activeInput === "combined") && (
                <div>
                  <Label>Voice note</Label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={recording ? stopRecording : startRecording}
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        recording ? "bg-destructive text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary"
                      }`}
                    >
                      {recording ? <Square size={16} /> : <Mic size={16} />}
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {recording
                        ? "Recording… click to stop"
                        : audioUrl
                          ? "Voice note captured"
                          : "Tap to record a voice note"}
                    </span>
                  </div>

                  {audioUrl && (
                    <div className="flex items-center gap-3 mt-3">
                      <AudioPlayer src={audioUrl} />
                      <button
                        type="button"
                        onClick={clearRecording}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
                        title="Delete recording"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(activeInput === "media" || activeInput === "combined") && (
                <div>
                  <Label>Photograph</Label>
                  {!photoFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-3 rounded-sm border border-border bg-secondary px-6 py-6 text-sm text-muted-foreground hover:border-primary transition-colors cursor-pointer min-h-11"
                    >
                      <Camera size={18} />
                      Attach a photo
                    </button>
                  ) : (
                    <div className="flex items-center justify-between rounded-sm border border-border bg-secondary px-4 py-3">
                      <span className="flex items-center gap-3 truncate">
                        <ImageIcon size={16} className="text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">{photoFile.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPhotoFile(null)}
                        className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={isAssembling}>
                  {isAssembling ? "Preserving…" : "Preserve memory"}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
