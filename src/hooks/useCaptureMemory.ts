// cspell:disable

/**
 * @file useCaptureMemory.ts
 * @description Production-grade custom React hook managing draft states,
 * secure audio/photo media upload pipelines, memory submission,
 * and strict resource cleanup to prevent memory leaks.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api/client";
import { useLocalStorageDraft } from "@/hooks/useLocalStorageDraft";
import { memoryInputSchema } from "@/lib/validations/memory";
export function useCaptureMemory(memoirId: string, onSuccess?: () => void) {
  const [draft, setDraft] = useLocalStorageDraft(`memory_draft_${memoirId}`, {
    title: "",
    body_text: "",
    occurred_start: new Date().toISOString().split("T")[0],
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string>("");

  const [recording, setRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /**
   * Cleans up active media stream tracks to release microphone hardware and memory.
   */
  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  /**
   * Resets audio states and revokes object URLs to prevent browser memory leaks.
   */
  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
  };

  /**
   * Component unmount cleanup guard against memory leaks and lingering media streams.
   */
  useEffect(() => {
    return () => {
      stopMediaStream();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  /**
   * Requests microphone permissions, cleans up past streams/URLs, and initializes recording.
   */
  const startRecording = async () => {
    // Ensure prior stream is completely terminated before starting a new one
    stopMediaStream();

    // Revoke any existing audio preview URL to prevent memory accumulation
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);

        // Safely generate and assign new object URL
        setAudioUrl((prevUrl) => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return URL.createObjectURL(blob);
        });

        // Terminate stream tracks immediately once recording stops
        stopMediaStream();
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied or unavailable.");
    }
  };

  /**
   * Halts active media recording streams.
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };
  // This giving us memoir is
  const resolveMemoirId = (): string => {
    // 1. If memoirId was passed as a prop, handle it whether it's a string or an object
    if (memoirId) {
      if (typeof memoirId === "string") {
        return memoirId;
      }
     if (typeof memoirId === "object" && memoirId !== null) {
      // Extract the ID if an object or response wrapper was passed
      const obj = memoirId as Record<string, unknown>;
      const dataObj = obj.data as Record<string, unknown> | undefined;
      const nestedDataObj = dataObj?.data as Record<string, unknown> | undefined;

      return (
        (typeof obj.id === "string" ? obj.id : "") ||
        (typeof dataObj?.id === "string" ? dataObj.id : "") ||
        (typeof nestedDataObj?.id === "string" ? nestedDataObj.id : "") ||
        ""
      );
    }
    }

    // 2. Fallback to localStorage if prop is empty
    if (typeof window !== "undefined") {
      try {
        const savedMemoir = localStorage.getItem("active_memoir");
        if (savedMemoir) {
          const parsed = JSON.parse(savedMemoir);
          if (parsed && parsed.data && typeof parsed.data.id === "string") {
            return parsed.data.id;
          }
          if (parsed && typeof parsed.id === "string") {
            return parsed.id;
          }
        }
      } catch (err) {
        console.error("Failed to parse active memoir from localStorage", err);
      }
    }

    return "";
  };

  /**
   * Helper function to handle presigned URL requests, direct storage uploads,
   * and metadata registration for any media asset type.
   */
  const uploadMediaAsset = async (
    currentMemoirId: string,
    file: Blob,
    filename: string,
    mimeType: string,
    kind: "photo" | "audio",
    caption?: string,
    durationMs?: number | null,
  ): Promise<string> => {
    const presignRes = await api.getPresignedUrl({
      memoir_id: currentMemoirId,
      filename,
      file_type: mimeType,
      kind,
    });

    const uploadUrl =
      presignRes.upload_url || presignRes.signed_url || presignRes.url;
    const storageKey = presignRes.storage_key || presignRes.path;

    if (!uploadUrl || !storageKey) {
      throw new Error(`Failed to retrieve upload parameters for ${kind}.`);
    }

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: file,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(
        `Failed to upload ${kind} to storage bucket: ${errorText}`,
      );
    }

    const metaRes = await api.registerMediaMetadata({
      memoir_id: currentMemoirId,
      storage_key: storageKey,
      kind,
      mime_type: mimeType,
      byte_size: file.size,
      original_filename: filename,
      caption,
      duration_ms: durationMs,
    });

    return metaRes.id;
  };

  /**
   * Handles form submission, orchestrates file uploads, and saves the final memory entry.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // 1. Zod Form Validation (Check required title and valid date)
    const validation = memoryInputSchema.safeParse({
      title: draft.title,
      occurred_start: draft.occurred_start,
      body_text: draft.body_text,
    });

    if (!validation.success) {
      // Displays the friendly message defined in your Zod schema (e.g., "Please provide a title for this memory.")
      setError(validation.error.issues[0].message);
      return;
    }

    // 2. Content Guard: Ensure the user provided at least some reflection or media
    const hasText = Boolean(
      draft.body_text && draft.body_text.trim().length > 0,
    );
    const hasMedia = Boolean(photoFile || audioBlob);

    if (!hasText && !hasMedia) {
      setError(
        "Please write a reflection, record a voice note, or attach a photograph.",
      );
      return;
    }

    // 3. Memoir Session Check
    const currentMemoirId = resolveMemoirId();
    if (!currentMemoirId) {
      setError(
        "No active memoir found. Please refresh or restart your session.",
      );
      return;
    }

    // All pre-checks passed: activate loading spinner and begin network pipeline
    setLoading(true);

    try {
      const mediaAssetIds: string[] = [];

      // 4. Photo Upload Pipeline
      if (photoFile) {
        const photoId = await uploadMediaAsset(
          currentMemoirId,
          photoFile,
          photoFile.name,
          photoFile.type,
          "photo",
          photoCaption,
          null,
        );
        mediaAssetIds.push(photoId);
      }

      // 5. Audio Upload Pipeline
      if (audioBlob) {
        const audioFileName = `voice_memo_${Date.now()}.webm`;
        // const calculatedDuration = await getAudioDurationMs(audioBlob);
        const audioId = await uploadMediaAsset(
          currentMemoirId,
          audioBlob,
          audioFileName,
          "audio/webm",
          "audio",
          "Voice recording",
          0,
        );
        mediaAssetIds.push(audioId);
      }

      // 6. Persist Memory to Supabase
      const hasDate = Boolean(draft.occurred_start);

      await api.createMemory({
        memoir_id: currentMemoirId,
        title: draft.title.trim(),
        body_text: draft.body_text ? draft.body_text.trim() : null,
        // "submitted" (finalized), not "draft": this form has no separate
        // draft/finalize step, so submitting it here IS the finalization.
        // "draft" would make the memory invisible to the share link and AI
        // organization -- both filter on status="submitted". Must match the
        // public.memory_status Postgres enum exactly (draft/submitted) --
        // "saved" is not a valid value there and 500s at the DB layer.
        status: "submitted",
        occurred_start: hasDate ? draft.occurred_start : null,
        occurred_end: hasDate ? draft.occurred_start : null,
        occurred_precision: hasDate ? "day" : null,
        date_source: hasDate ? "owner" : null,
        media_asset_ids: mediaAssetIds,
      });

      // 7. Cleanup form state and storage on success
      localStorage.removeItem(`memory_draft_${currentMemoirId}`);
      setDraft({
        title: "",
        body_text: "",
        occurred_start: new Date().toISOString().split("T")[0],
      });
      setPhotoFile(null);
      setPhotoCaption("");
      clearRecording();

      setSuccessMsg("Memory successfully captured! Transcribing audio...");
      
      // before we refresh the visual feed.
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000); 
      }
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while saving your memory.");
      }
    } finally {
      // Keep the loading spinner spinning while we wait for the transcript
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    }
  };
  return {
    draft,
    setDraft,
    photoFile,
    setPhotoFile,
    photoCaption,
    setPhotoCaption,
    recording,
    audioUrl,
    loading,
    error,
    successMsg,
    startRecording,
    stopRecording,
    clearRecording,
    handleSubmit,
  };
}
