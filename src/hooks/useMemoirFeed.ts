"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { MemoryItem } from "@/features/dashboard/types"; 

// 1. Strict TypeScript Interfaces to clear "@typescript-eslint/no-explicit-any"
interface BackendAsset {
  id?: string;
  kind?: string;
  mime_type?: string;
  playback_url?: string;
  url?: string;
  signed_url?: string;
  duration_ms?: number;
  transcription_status?: string;
  transcript?: {
    display_text?: string;
    raw_text?: string;
  } | Array<{ display_text?: string; raw_text?: string; }>;
}

interface BackendMemory {
  id: string;
  title?: string;
  body_text?: string;
  occurred_start?: string;
  created_at?: string;
  chapter_id?: string; // Added chapter_id mapping
  author_participant_id?: string;
  media_assets?: BackendAsset[];
  memory_media?: Array<{ media_asset?: BackendAsset } | BackendAsset>;
}

export function useMemoirFeed(memoirId: string) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  
  // Initializes as true, preventing the need to synchronously call it in the effect
  const [loading, setLoading] = useState<boolean>(true); 
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (isRefresh: boolean = false) => {
    if (!memoirId) return;
    
    // Only trigger a new loading state if this is a manual refresh
    if (isRefresh) {
      setLoading(true);
    }
    
    try {
      const data: BackendMemory[] = await api.getMemoirFeed(memoirId);
      
      const normalizedMemories: MemoryItem[] = data.map((item: BackendMemory) => {
        const mediaList: BackendAsset[] = item.media_assets || 
                        (Array.isArray(item.memory_media) 
                          ? item.memory_media.map((mm) => ('media_asset' in mm ? mm.media_asset : mm) as BackendAsset) 
                          : []) || 
                        [];
        
        const photoAsset = mediaList.find((m) => m.kind === 'photo' || m.kind === 'image' || m.mime_type?.includes('image'));
        const audioAsset = mediaList.find((m) => m.kind === 'audio' || m.mime_type?.includes('audio'));

        const hasText = Boolean(item.body_text && item.body_text.trim().length > 0);
        const hasPhoto = Boolean(photoAsset);
        const hasAudio = Boolean(audioAsset);

        let kind: 'text' | 'photo' | 'combined' | 'audio' = 'text';
        const mediaCount = (hasText ? 1 : 0) + (hasPhoto ? 1 : 0) + (hasAudio ? 1 : 0);
        
        if (mediaCount > 1) {
            kind = 'combined';
        } else if (hasAudio) {
            kind = 'audio';
        } else if (hasPhoto) {
            kind = 'photo';
        }

        const getUrl = (asset?: BackendAsset) => asset ? (asset.playback_url || asset.url || asset.signed_url) : undefined;
        
        const transcriptObj = Array.isArray(audioAsset?.transcript) ? audioAsset?.transcript[0] : audioAsset?.transcript;
        const transcriptText = transcriptObj?.display_text || transcriptObj?.raw_text || undefined;

        return {
          id: item.id,
          title: item.title || "Untitled",
          content: item.body_text || "", 
          date: item.occurred_start || item.created_at?.split("T")[0] || "",
          kind: kind,
          // Resolved against the real participants list by the page that
          // renders this feed (see /memories' `participantsById`) -- this
          // hook only has the raw id, never a display name to invent.
          author: "",
          author_participant_id: item.author_participant_id,
          chapter_id: item.chapter_id, // Attached chapter_id here
          mediaUrl: getUrl(photoAsset),
          audioUrl: getUrl(audioAsset),
          transcription: transcriptText,
          audioAssetId: audioAsset?.id,
          transcriptionStatus: audioAsset ? audioAsset.transcription_status : undefined,
          duration: audioAsset?.duration_ms ? `${Math.round(audioAsset.duration_ms / 1000)}s` : undefined,
        };
      });

      setMemories(normalizedMemories);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load archive");
    } finally {
      setLoading(false);
    }
  }, [memoirId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeed(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchFeed]);

  return { memories, loading, error, refreshFeed: () => fetchFeed(true) };
}