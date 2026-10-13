"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { uploadMediaAsset } from "@/hooks/useMediaUpload";

export function useCoverPhotoUpload(memoirId: string, onDone: (url: string | null) => void) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    if (!memoirId) return;
    setUploading(true);
    setError(null);
    try {
      const mediaId = await uploadMediaAsset(memoirId, file, file.name, file.type, "photo");
      const url = await api.setMemoirCover(memoirId, mediaId);
      onDone(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the cover photo.");
    } finally {
      setUploading(false);
    }
  };

  // An imperatively-created, one-shot <input type="file"> rather than a ref
  // threaded out of this hook into the page's JSX -- React's ref-safety
  // analysis flags a ref object returned from a hook and later attached to
  // an element in a *different* component as a potential render-time ref
  // read, even though it's only ever dereferenced inside an event handler.
  // A detached input element sidesteps that entirely.
  const trigger = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) upload(file);
    };
    input.click();
  };

  return { trigger, uploading, error };
}
