export interface MemoryItem {
  id: string;
  kind: "text" | "photo" | "audio" | "combined";
  title: string;
  content: string;
  date: string;
  author: string;
  author_participant_id?: string;
  chapter_id?: string;
  mediaUrl?: string | null;
  audioUrl?: string | null;
  duration?: string;
  transcription?: string | null;
}