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
import { uploadMediaAsset } from "@/hooks/useMediaUpload";
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
      const hasDate = Boolean(draft.occurred_start);

      // ---------------------------------------------------------------
      // STEP 1 -- THE WORDS, FIRST. Before a single byte is uploaded.
      //
      // The old order was uploads first, createMemory last, which meant a
      // connection that dropped partway through a photo upload threw away
      // everything the author had typed. Media is replaceable; a memory
      // someone sat down to write is not.
      //
      // Saved as "draft" so it is not yet visible to the share link or to
      // AI organization (both filter on status="submitted"); it is promoted
      // to "submitted" at the end, once the attachments are on it.
      // ---------------------------------------------------------------
      const created = await api.createMemory({
        memoir_id: currentMemoirId,
        title: draft.title.trim(),
        body_text: draft.body_text ? draft.body_text.trim() : null,
        status: "draft",
        occurred_start: hasDate ? draft.occurred_start : null,
        occurred_end: hasDate ? draft.occurred_start : null,
        occurred_precision: hasDate ? "day" : null,
        date_source: hasDate ? "owner" : null,
        media_asset_ids: [],
      });

      const memoryId: string | undefined = created?.data?.id ?? created?.id;
      if (!memoryId) {
        throw new Error("The memory was saved but the server did not return its id.");
      }

      // ---------------------------------------------------------------
      // STEP 2 -- attachments, one at a time, each attached to the memory
      // that already exists. A failure here is reported honestly and does
      // NOT discard the text, because the text is already on the server.
      // ---------------------------------------------------------------
      const uploadFailures: string[] = [];

      if (photoFile) {
        try {
          const photoId = await uploadMediaAsset(
            currentMemoirId,
            photoFile,
            photoFile.name,
            photoFile.type,
            "photo",
            { caption: photoCaption, durationMs: null },
          );
          await api.updateMemory(currentMemoirId, memoryId, { media_asset_ids: [photoId] });
        } catch (photoErr) {
          console.error("Photo upload failed", photoErr);
          uploadFailures.push("the photograph");
        }
      }

      if (audioBlob) {
        try {
          const audioId = await uploadMediaAsset(
            currentMemoirId,
            audioBlob,
            `voice_memo_${Date.now()}.webm`,
            "audio/webm",
            "audio",
            { caption: "Voice recording", durationMs: 0 },
          );
          await api.updateMemory(currentMemoirId, memoryId, { media_asset_ids: [audioId] });
        } catch (audioErr) {
          console.error("Audio upload failed", audioErr);
          uploadFailures.push("the recording");
        }
      }

      // STEP 3 -- finalize. Promoting to "submitted" is what makes it real
      // to the rest of the product.
      await api.updateMemory(currentMemoirId, memoryId, { status: "submitted" });

      if (uploadFailures.length > 0) {
        // Says exactly what survived and what didn't, per §5a.
        setError(
          `Your words are saved. ${uploadFailures.join(" and ")} didn't finish uploading — ` +
            `open the memory to try attaching ${uploadFailures.length > 1 ? "them" : "it"} again.`,
        );
      }

      // Cleanup form state and storage. Safe even on a partial failure --
      // the memory exists and the attachments that did upload are on it.
      localStorage.removeItem(`memory_draft_${currentMemoirId}`);
      setDraft({
        title: "",
        body_text: "",
        occurred_start: new Date().toISOString().split("T")[0],
      });
      const hadAudio = Boolean(audioBlob);
      setPhotoFile(null);
      setPhotoCaption("");
      clearRecording();

      if (uploadFailures.length === 0) {
        // Only mention transcription when there is actually audio to
        // transcribe -- the old copy claimed it on every text-only memory.
        setSuccessMsg(
          hadAudio ? "Saved. The recording is being transcribed." : "Saved.",
        );
      }

      // Refresh immediately. The previous 3s delay was waiting on a
      // transcript that takes far longer than that anyway, so it only ever
      // made saving feel slow without making the transcript any readier.
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while saving your memory.");
      }
    } finally {
      setLoading(false);
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
