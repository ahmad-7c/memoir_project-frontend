/**
 * @file useComments.ts
 * @description Custom React hook for managing comment state and submissions.
 *
 * Branches between two ENTIRELY separate backend code paths depending on
 * the caller:
 *   - owner (no shareToken): /api/comments/, cookie-authenticated.
 *   - reader (shareToken set): /api/share/{shareToken}/comments, authenticated
 *     by the reader token via domain/reader_access.py on the backend.
 * This mirrors the backend's own split (see domain/reader_access.py's
 * docstring) -- a reader session and an owner session never share a request
 * path, on either side of the wire.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { api, CommentEntity } from "@/lib/api/client";

interface UseCommentsTarget {
  memoryId?: string;
  narrativeSectionId?: string;
}

export function useComments(
  target: UseCommentsTarget,
  memoirId: string,
  shareToken?: string,
  readerToken?: string,
) {
  const { memoryId, narrativeSectionId } = target;
  const [comments, setComments] = useState<CommentEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!memoryId && !narrativeSectionId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data =
        shareToken && readerToken
          ? await api.getSharedComments(
              shareToken,
              { memory_id: memoryId, narrative_section_id: narrativeSectionId },
              readerToken,
            )
          : await api.getComments(memoryId || "");
      setComments(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error loading comments";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [memoryId, narrativeSectionId, shareToken, readerToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComments();
  }, [loadComments]);

  const addComment = async (body: string, parentCommentId?: string) => {
    if (!body.trim()) return;

    if (!memoirId) {
      setError("Memoir ID is missing.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        memoir_id: memoirId,
        memory_id: memoryId || null,
        narrative_section_id: narrativeSectionId || null,
        parent_comment_id: parentCommentId || null,
        body: body.trim(),
      };

      const newComment =
        shareToken && readerToken
          ? await api.postSharedComment(shareToken, payload, readerToken)
          : await api.createComment({ ...payload, media_asset_id: null });

      setComments((prev) => [...prev, newComment]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit comment";
      setError(errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    comments,
    loading,
    submitting,
    error,
    addComment,
    refreshComments: loadComments,
  };
}
