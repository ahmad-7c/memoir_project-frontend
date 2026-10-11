import { api } from "@/lib/api/client";

/**
 * Presigned-URL -> direct-to-storage PUT -> metadata registration, the one
 * real media upload path this app has. Extracted from useCaptureMemory
 * (its original, only caller) once a second caller (the memoir cover photo
 * upload) needed the exact same three steps.
 */
export async function uploadMediaAsset(
  memoirId: string,
  file: Blob,
  filename: string,
  mimeType: string,
  kind: "photo" | "audio",
  options?: { caption?: string; durationMs?: number | null; widthPx?: number; heightPx?: number },
): Promise<string> {
  const presignRes = await api.getPresignedUrl({
    memoir_id: memoirId,
    filename,
    file_type: mimeType,
    kind,
  });

  const uploadUrl = presignRes.upload_url || presignRes.signed_url || presignRes.url;
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
    throw new Error(`Failed to upload ${kind} to storage bucket: ${errorText}`);
  }

  const metaRes = await api.registerMediaMetadata({
    memoir_id: memoirId,
    storage_key: storageKey,
    kind,
    mime_type: mimeType,
    byte_size: file.size,
    original_filename: filename,
    caption: options?.caption,
    duration_ms: options?.durationMs,
    width_px: options?.widthPx,
    height_px: options?.heightPx,
  });

  return metaRes.id;
}
