import {
  ApplyProposalResultSchema,
  ChapterSchema,
  ChatResponseSchema,
  OrganizeStatusSchema,
  ProposalListResponseSchema,
} from "@/features/dashboard/types/organization";

import { z } from "zod";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Centralized wrapper to make sure every request sent to your
// FastAPI backend is properly formatted, secure, and pointed to the right address
//
// Auth is an httpOnly cookie set by the backend on login/signup -- there is
// no token for this code to read or attach. `credentials: "include"` is what
// makes the browser send that cookie on every request (required because
// frontend:3000 and backend:8000 are different origins even on localhost).
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}

interface ApiErrorDetail {
  loc?: (string | number)[];
  msg?: string;
}

interface ApiErrorResponse {
  detail?: string | ApiErrorDetail[];
  message?: string;
}

/**
 * Renders a backend error body as one human-readable string.
 *
 * Exported so it can be tested directly. Its failure modes are all in the
 * *rendered message*, not in the thrown type: an empty result shows as a toast
 * with no text, and a FastAPI debug body shows as a file path and exception
 * class. None of that is observable from a `rejects.toThrow()` assertion, so
 * testing this through a rejected request would pass while the actual defect
 * shipped.
 */
export function parseErrorDetail(
  errData: ApiErrorResponse | null | undefined,
  defaultMessage: string,
): string {
  if (!errData) return defaultMessage;
  // Non-empty checks, not truthiness alone. `typeof detail === "string"` is true
  // for `""`, so a backend that sends an empty detail produced a blank toast --
  // an error the user cannot act on and cannot tell apart from a rendering bug.
  // A message the user cannot read is strictly worse than a generic one.
  if (typeof errData.detail === "string" && errData.detail.trim()) {
    return errData.detail;
  }

  if (Array.isArray(errData.detail) && errData.detail.length > 0) {
    return errData.detail
      .map((err: ApiErrorDetail) => {
        const field =
          err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : "Field";
        return `${field}: ${err.msg || "Invalid value"}`;
      })
      .join(" | ");
  }

  if (errData.message && errData.message.trim()) return errData.message;
  return defaultMessage;
}

export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
}

// Union literals, not `string`. These map to Postgres enums on the server
// (public.memoir_visibility, public.comment_policy) and are enforced there by
// Literal types in backend/src/schemas/memoir.py. Typing them as plain `string`
// here let a typo compile cleanly and fail as a 500 from the database.
export type MemoirVisibility = "invited_only" | "link_with_password" | "link_public";
export type MemoirCommentPolicy = "nobody" | "invited_only" | "anyone_who_can_view";
export type MemoirRelationship =
  | "self"
  | "spouse_partner"
  | "parent"
  | "child"
  | "sibling"
  | "grandchild"
  | "extended_family"
  | "friend"
  | "colleague"
  | "neighbour"
  | "other";

export interface MemoirCreatePayload {
  subject_name: string;
  subject_born_on?: string;
  subject_died_on?: string;
  subject_is_living: boolean;
  description?: string;
  visibility?: MemoirVisibility;
  comment_policy?: MemoirCommentPolicy;
  relationship?: MemoirRelationship;
}

export interface MemoryCreatePayload {
  memoir_id: string;
  title: string;
  body_text?: string | null;
  status?: string;
  occurred_start?: string | null;
  occurred_end?: string | null;
  occurred_precision?: string | null;
  date_source?: string | null;
  media_asset_ids?: string[];
}

export interface PresignedUrlPayload {
  memoir_id: string;
  filename: string;
  file_type: string;
  kind: string;
}

export interface MediaMetadataPayload {
  memoir_id: string;
  storage_key: string;
  kind: string;
  mime_type: string;
  byte_size: number;
  original_filename: string;
  caption?: string;
  width_px?: number;
  height_px?: number;
  duration_ms?: number | null;
}

export interface CommentEntity {
  id: string;
  memoir_id: string;
  memory_id: string | null;
  narrative_section_id?: string | null;
  media_asset_id: string | null;
  parent_comment_id: string | null;
  author_participant_id: string;
  body: string;
  created_at: string;
  hidden_at: string | null;
  hidden_by_participant_id: string | null;
  deleted_at: string | null;
  author_name?: string;
}

export interface CommentCreatePayload {
  memoir_id: string;
  memory_id?: string | null;
  narrative_section_id?: string | null;
  media_asset_id?: string | null;
  author_participant_id?: string | null;
  parent_comment_id?: string | null;
  body: string;
}

export interface OwnerMemoirSummary {
  id: string;
  subject_name: string;
  subject_born_on?: string | null;
  subject_died_on?: string | null;
  subject_is_living: boolean;
  cover_image_url?: string | null;
  status: "draft" | "published";
  published_at?: string | null;
  memory_count: number;
  updated_at: string;
}

export interface OwnerProfile {
  name: string;
  email: string;
  subscription_status: string;
  memoirs: OwnerMemoirSummary[];
}

export type ShareLinkVisibility = "private" | "link" | "password";

export interface ShareLink {
  id: string;
  memoir_id: string;
  scope: string;
  token: string;
  url: string;
  visibility: ShareLinkVisibility;
  has_password: boolean;
  can_comment: boolean;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  open_count: number;
}

export interface SharedChapter {
  id: string;
  title: string;
  summary: string | null;
  sort_order: number;
}

export interface SharedNarrativeSection {
  id: string;
  chapter_id: string | null;
  position: number;
  body: string;
  source_memory_ids: string[];
}

export interface SharedMedia {
  id: string;
  kind: string;
  mime_type: string | null;
  caption: string | null;
  duration_ms: number | null;
  width_px: number | null;
  height_px: number | null;
  playback_url: string | null;
  transcript_text: string | null;
}

export interface SharedMemory {
  id: string;
  title: string | null;
  body_text: string | null;
  occurred_start: string | null;
  occurred_end: string | null;
  occurred_precision: string | null;
  chapter_id: string | null;
  created_at: string;
  media: SharedMedia[];
}

export interface Participant {
  id: string;
  display_name: string;
  relationship: string;
  relationship_label: string | null;
  role: string;
  first_opened_at: string | null;
}

export interface SharePreview {
  subject_name: string;
  cover_image_url: string | null;
  subject_is_living: boolean;
  subject_born_on: string | null;
  subject_died_on: string | null;
}

export interface SharedMemoirFull {
  id: string;
  subject_name: string;
  subject_born_on: string | null;
  subject_died_on: string | null;
  subject_is_living: boolean;
  description: string | null;
  can_comment: boolean;
  chapters: SharedChapter[];
  narrative_sections: SharedNarrativeSection[];
  memories: SharedMemory[];
}

export interface UnlockResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  display_name: string;
  can_comment: boolean;
}

export interface NarrativeSection {
  id: string;
  memoir_id?: string;
  chapter_id: string | null;
  position: number;
  body: string;
  body_original?: string;
  owner_edited?: boolean;
  source_memory_ids: string[];
  created_at?: string;
  updated_at?: string;
}

export interface NarrativeStatus {
  status: "none" | "processing" | "ready" | "failed" | "stalled";
  error_message: string | null;
  retry_available: boolean;
  warnings: string[];
}

export interface SourceMedia {
  id: string;
  kind: string;
  mime_type: string | null;
  caption: string | null;
  duration_ms: number | null;
  width_px: number | null;
  height_px: number | null;
  playback_url: string | null;
  transcript_text: string | null;
}

export interface SourceMemory {
  id: string;
  title: string | null;
  body_text: string | null;
  occurred_start: string | null;
  author_name: string | null;
  media: SourceMedia[];
}

export const api = {
  async signup(payload: SignupPayload) {
    const res = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Signup failed"));
    }
    return res.json();
  },

  async login(payload: { email: string; password: string }) {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Login failed"));
    }
    return res.json();
  },

  // The session cookie is httpOnly -- this is the only way to end it, since
  // frontend JS has no way to read or delete it directly.
  async logout() {
    const res = await apiFetch("/api/auth/logout", { method: "POST" });
    if (!res.ok) throw new Error("Failed to log out");
    return res.json();
  },

  async createMemoir(payload: MemoirCreatePayload) {
    const res = await apiFetch("/api/memoirs/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to create memoir"));
    }
    return res.json();
  },

  // Aligned with backend prefix /api/memories/feed/{memoir_id}
  async getMemoirFeed(memoirId: string) {
    const res = await apiFetch(`/api/memories/feed/${memoirId}`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch memoir feed");
    const json = await res.json();
    return json.data || json;
  },

  // Owner-only retry for a transcription that failed or stalled (bounded at
  // 3 attempts server-side). Keyed by media_asset_id, not memory_id -- one
  // memory can carry several audio assets in principle, each transcribed
  // independently.
  async retryTranscription(mediaAssetId: string) {
    const res = await apiFetch(`/api/transcript/${mediaAssetId}/retry`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Couldn't retry the transcription"));
    }
    return res.json().catch(() => ({}));
  },

  // Memory
  // 1. ADD THIS: To check if the user has an active memoir during login
  async getUserMemoirs() {
    const res = await apiFetch("/api/memoirs/", {
      method: "GET",
    });

    // Graceful fallback if the backend route (405) isn't fully ready yet
    if (res.status === 405 || res.status === 404) {
      console.warn(
        "GET /api/memoirs/ not available yet. Returning empty array.",
      );
      return [];
    }

    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(
        parseErrorDetail(errData, "Failed to fetch user memoirs"),
      );
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  // One memoir, scoped by id -- including `status` (draft/published) and a
  // resolved `cover_image_url`. Every workspace route is scoped to a single
  // memoir, and before this existed those screens fetched the whole list and
  // filtered client-side, which verified ownership of nothing in particular.
  // A 404 here means "not yours or not there" -- the backend deliberately
  // does not distinguish them.
  async getMemoir(memoirId: string): Promise<OwnerMemoirSummary & { status: "draft" | "published" }> {
    const res = await apiFetch(`/api/memoirs/${memoirId}`, { method: "GET" });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      const err = new Error(parseErrorDetail(errData, "Failed to load this memoir")) as Error & {
        status?: number;
      };
      err.status = res.status;
      throw err;
    }
    return (await res.json()).data;
  },

  // 2. FIX THIS: Remove the duplicate/crashing !res.ok block
  async createMemory(payload: MemoryCreatePayload) {
    // No trailing slash: the backend route is POST /api/memories (no slash),
    // and a trailing slash here only works by riding a 307 redirect.
    const res = await apiFetch("/api/memories", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to create memory"));
    }

    return res.json();
  },
  // Backend route is DELETE /api/memories/memoirs/{memoir_id}/memories/{memory_id}
  // -- memoir_id is required in the path, there is no bare /api/memories/{id}/ route.
  async deleteMemory(memoirId: string, memoryId: string) {
    const res = await apiFetch(
      `/api/memories/memoirs/${memoirId}/memories/${memoryId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to delete memory"));
    }
    return res.json();
  },

  // Partial update of a memory. This is what lets the capture flow save the
  // author's words BEFORE any upload starts: create with the text, then
  // attach each file to the same memory as it finishes uploading.
  //
  // `media_asset_ids` is ADDITIVE server-side -- it attaches and never
  // detaches -- so sending one new id does not disturb what is already there.
  async updateMemory(
    memoirId: string,
    memoryId: string,
    patch: {
      title?: string;
      body_text?: string;
      status?: "draft" | "submitted";
      occurred_start?: string;
      occurred_end?: string;
      occurred_precision?: "day" | "month" | "year" | "decade";
      media_asset_ids?: string[];
    },
  ) {
    const res = await apiFetch(
      `/api/memories/memoirs/${memoirId}/memories/${memoryId}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      const err = new Error(parseErrorDetail(errData, "Failed to save this memory")) as Error & {
        status?: number;
      };
      err.status = res.status;
      throw err;
    }
    return (await res.json()).data;
  },

  // Presigned Url for object storage storing
  async getPresignedUrl(payload: PresignedUrlPayload) {
    const res = await apiFetch("/api/media/presigned-url", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to get presigned URL"));
    }

    const responseJson = await res.json();
    return responseJson.data || responseJson;
  },

  // To upload meta data
  async registerMediaMetadata(payload: MediaMetadataPayload) {
    const res = await apiFetch("/api/media/metadata", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(
        parseErrorDetail(errData, "Failed to register media metadata"),
      );
    }

    const responseJson = await res.json();
    return responseJson.data || responseJson;
  },

  // Comments. `readerToken` is only needed on the reader share page -- the
  // owner's own session rides the httpOnly cookie automatically.
  async getComments(memoryId: string, readerToken?: string): Promise<CommentEntity[]> {
    const res = await apiFetch(`/api/comments/?memory_id=${memoryId}`, {
      method: "GET",
      headers: readerToken ? { Authorization: `Bearer ${readerToken}` } : {},
    });

    if (res.status === 404) {
      return [];
    }

    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to fetch comments"));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.comments || [];
  },

  // Owner-only moderation.
  async hideComment(commentId: string, memoirId: string) {
    const res = await apiFetch(`/api/comments/${commentId}/hide?memoir_id=${memoirId}`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Failed to hide comment.");
    return res.json();
  },

  async deleteComment(commentId: string, memoirId: string) {
    const res = await apiFetch(`/api/comments/${commentId}?memoir_id=${memoirId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete comment.");
    return res.json();
  },

  async createComment(
    payload: CommentCreatePayload,
    readerToken?: string,
  ): Promise<CommentEntity> {
    const res = await apiFetch("/api/comments/", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: readerToken ? { Authorization: `Bearer ${readerToken}` } : {},
    });

    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to post comment"));
    }

    const data = await res.json();
    return data.comment || data;
  },

  // PDF Export
  async requestMemoirExport(memoirId: string) {
    if (!memoirId) {
      throw new Error("No active memoir ID found.");
    }

    const res = await apiFetch(`/api/memoirs/${memoirId}/export`, {
      method: "POST",
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Backend export error response:", errorBody);
      throw new Error(
        `Failed to initiate PDF export: ${res.status} ${res.statusText}`,
      );
    }

    return res.json();
  },

  // PDF Export Status Polling
  async getLatestExportStatus(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/export/latest`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error("Failed to check export status.");
    }

    return res.json();
  },
  // Search -- the real route is the top-level /api/search/ router with
  // memoir_id as a query param, not nested under /api/memoirs/{id}/search.
  async searchMemories(memoirId: string, query: string) {
    const res = await apiFetch(
      `/api/search/?memoir_id=${encodeURIComponent(memoirId)}&q=${encodeURIComponent(query)}`,
      { method: "GET" },
    );
    if (!res.ok) throw new Error("Failed to search archive");
    const json = await res.json();
    return json.data || json;
  },

  // Points the memoir at an already-uploaded photo (upload it first via
  // getPresignedUrl + registerMediaMetadata, same as any other memory photo).
  async setMemoirCover(memoirId: string, mediaId: string): Promise<string | null> {
    const res = await apiFetch(`/api/memoirs/${memoirId}/cover`, {
      method: "PUT",
      body: JSON.stringify({ media_id: mediaId }),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to set cover photo"));
    }
    return (await res.json()).data?.cover_image_url ?? null;
  },

  // Publishing -- required once before a share link can be created (the
  // backend 409s on createShareLink otherwise). Idempotent server-side, so
  // it's safe to call this on every "copy link" click.
  async publishMemoir(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/publish`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      // 409 means "already published" (irreversible, so a second attempt is
      // rejected rather than treated as a no-op repeat) or "no memories yet" --
      // the status lets the caller tell those apart from a real failure and
      // react accordingly (e.g. fetch the existing share link instead of
      // showing an error for the already-published case).
      const message = parseErrorDetail(errData, "Failed to publish memoir");
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return (await res.json()).data;
  },

  // Share Link Generation
  async createShareLink(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/share-link`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to create share link"));
    }
    const json = await res.json();
    // Returns the exact ShareLinkResponse data from backend
    return json.data || json;
  },
  // Every active participant who has actually joined this memoir (unlocked
  // the share link, or been added directly) -- real people, not a
  // placeholder list.
  async getParticipants(memoirId: string): Promise<Participant[]> {
    const res = await apiFetch(`/api/memoirs/${memoirId}/participants`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to load participants");
    return (await res.json()).data;
  },
  // Set/replace the share link's unlock password, or change its visibility.
  // `clear_password` removes the password requirement entirely.
  async updateShareLink(
    memoirId: string,
    payload: {
      password?: string;
      clear_password?: boolean;
      visibility?: ShareLinkVisibility;
      can_comment?: boolean;
    },
  ): Promise<ShareLink> {
    const res = await apiFetch(`/api/memoirs/${memoirId}/share-link`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to update the share link"));
    }
    const json = await res.json();
    return json.data || json;
  },

  // Read-only retrieval for the owner's share panel -- never creates one.
  // 404 means no link exists yet (not: something is broken).
  async getShareLink(memoirId: string): Promise<ShareLink | null> {
    const res = await apiFetch(`/api/memoirs/${memoirId}/share-link`, {
      method: "GET",
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to load the share link"));
    }
    const json = await res.json();
    return json.data || json;
  },

  // Soft-revokes the current link (dead immediately). The next
  // createShareLink call then issues a brand new token.
  async revokeShareLink(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/share-link`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to revoke the share link"));
    }
    return res.json();
  },

  // The only share route a reader can call with no credential at all --
  // who this memoir is about, and their photo, so the password form isn't
  // the first thing they see. See SharePreviewResponse on the backend for
  // why this field list is a hard boundary and not just "whatever's handy".
  async getSharePreview(token: string): Promise<SharePreview> {
    const res = await apiFetch(`/api/share/${token}/preview`, { method: "GET" });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      const err = new Error(parseErrorDetail(errData, "This link no longer works.")) as Error & {
        status?: number;
      };
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    return json.data || json;
  },

  // Reader identifies with name + the password the owner shared personally.
  // Returns a short-lived signed reader token -- callers attach it as
  // `Authorization: Bearer <token>` on every subsequent call for this link
  // (getSharedMemoir, getComments, createComment).
  async unlockShareLink(
    token: string,
    display_name: string,
    password: string,
  ): Promise<UnlockResult> {
    const res = await apiFetch(`/api/share/${token}/unlock`, {
      method: "POST",
      body: JSON.stringify({ display_name, password }),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      // Thrown with the response attached so the caller can branch on status
      // (401 = wrong password / re-show the form, 404 = link is dead).
      const message = parseErrorDetail(errData, "Could not unlock this memoir.");
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    return json.data || json;
  },

  // `readerToken` is the access_token from unlockShareLink -- required for a
  // password/private link, since the owner's httpOnly cookie never applies
  // to an anonymous reader's browser.
  async getSharedMemoir(token: string, readerToken?: string) {
    const res = await apiFetch(`/api/share/${token}`, {
      method: "GET",
      headers: readerToken ? { Authorization: `Bearer ${readerToken}` } : {},
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message =
        errData.detail ||
        "Failed to load shared memoir. The link may be expired or invalid.";
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    return json.data;
  },

  // --- New share-scoped reader routes (/api/share/{token}/...). These are
  // the ONLY routes the reader page should call -- they go through the
  // standalone reader dependency on the backend (domain/reader_access.py),
  // never the owner's auth, and re-check the link's live state (revoked?
  // still published?) on every call, not just at unlock. ---

  async getSharedMemoirFull(token: string, readerToken: string): Promise<SharedMemoirFull> {
    const res = await apiFetch(`/api/share/${token}/memoir`, {
      method: "GET",
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const message = errData.detail || "Failed to load this memoir.";
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    return json.data;
  },

  async getSharedSources(
    token: string,
    sectionId: string,
    readerToken: string,
  ): Promise<SourceMemory[]> {
    const res = await apiFetch(`/api/share/${token}/memories/${sectionId}/sources`, {
      method: "GET",
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const err = new Error(errData.detail || "Failed to load sources.") as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    const json = await res.json();
    return json.memories || [];
  },

  async getSharedComments(
    token: string,
    target: { memory_id?: string; narrative_section_id?: string },
    readerToken: string,
  ): Promise<CommentEntity[]> {
    const params = new URLSearchParams();
    if (target.memory_id) params.set("memory_id", target.memory_id);
    if (target.narrative_section_id) params.set("narrative_section_id", target.narrative_section_id);
    const res = await apiFetch(`/api/share/${token}/comments?${params.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error("Failed to load comments.");
    const data = await res.json();
    return Array.isArray(data) ? data : data.comments || [];
  },

  async postSharedComment(
    token: string,
    payload: {
      memoir_id: string;
      memory_id?: string | null;
      narrative_section_id?: string | null;
      parent_comment_id?: string | null;
      body: string;
    },
    readerToken: string,
  ): Promise<CommentEntity> {
    const res = await apiFetch(`/api/share/${token}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      const message = parseErrorDetail(errData, "Failed to post comment.");
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    return data.comment || data;
  },

  // AI-composed narrative. generateNarrative/regenerateNarrativeSection run in
  // the background on the server -- callers poll getNarrativeStatus.
  async generateNarrative(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/generate-narrative`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to start narrative generation"));
    }
    return res.json();
  },

  async getNarrativeStatus(memoirId: string): Promise<NarrativeStatus> {
    const res = await apiFetch(`/api/memoirs/${memoirId}/narrative/status`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to check narrative status");
    return res.json();
  },

  // Reader token is required on the share page (readerToken attaches
  // Authorization: Bearer); omitted for the owner's own session, which rides
  // the httpOnly cookie.
  async getNarrativeSections(memoirId: string, readerToken?: string): Promise<NarrativeSection[]> {
    const res = await apiFetch(`/api/memoirs/${memoirId}/narrative`, {
      method: "GET",
      headers: readerToken ? { Authorization: `Bearer ${readerToken}` } : {},
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error("Failed to load the narrative");
    }
    const json = await res.json();
    return json.data || [];
  },

  async getNarrativeSources(
    memoirId: string,
    sectionId: string,
    readerToken?: string,
  ): Promise<SourceMemory[]> {
    const res = await apiFetch(`/api/memoirs/${memoirId}/narrative/${sectionId}/sources`, {
      method: "GET",
      headers: readerToken ? { Authorization: `Bearer ${readerToken}` } : {},
    });
    if (!res.ok) throw new Error("Failed to load sources for this section");
    const json = await res.json();
    return json.memories || [];
  },

  async updateNarrativeSection(
    memoirId: string,
    sectionId: string,
    body: string,
  ): Promise<NarrativeSection> {
    const res = await apiFetch(`/api/memoirs/${memoirId}/narrative/${sectionId}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to update this section"));
    }
    const json = await res.json();
    return json.data;
  },

  async deleteNarrativeSection(memoirId: string, sectionId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/narrative/${sectionId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to delete this section"));
    }
    return res.json();
  },

  async regenerateNarrativeSection(memoirId: string, sectionId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/narrative/${sectionId}/regenerate`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to regenerate this section"));
    }
    return res.json();
  },

  async markNarrativeReviewed(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/narrative/review`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to mark the narrative reviewed"));
    }
    return res.json();
  },

  // Owner profile: account details plus every memoir they own, drafts first.
  async getOwnerProfile(): Promise<OwnerProfile> {
    const res = await apiFetch("/api/me/profile", { method: "GET" });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to load your profile"));
    }
    const json = await res.json();
    return json.data || json;
  },

  // AI Organization & Chapters
  //
  // /organize is async on the backend: it returns 202 immediately with no
  // chapter data (the model call takes 10-20s and runs in the background).
  // There is nothing to unwrap here -- callers must poll getOrganizeStatus()
  // until it reports 'ready', then call getChapters() to load the result.
  async generateTimeline(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/organize`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to start organizing"));
    }
    return res.json();
  },

  async getOrganizeStatus(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/organize/status`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to check organize status");
    return OrganizeStatusSchema.parse(await res.json());
  },

  // The organize job now produces a REVIEWABLE PROPOSAL rather than writing
  // chapters directly. After status reports 'ready', fetch the proposal, show
  // it to the owner, and only then call applyOrganizationProposal.
  //
  // This two-step shape is deliberate: the server holds the plan and the client
  // holds only an id, so nothing about what gets written can be influenced by
  // a request body.
  async getOrganizeProposal(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/organize/proposal`, {
      method: "GET",
    });
    // 404 means "nothing pending to review", which is a normal state right
    // after a run completes for a memoir with no memories -- not an error.
    if (res.status === 404) return null;
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to load the proposal"));
    }
    // Validated at the boundary per the project convention -- no unvalidated
    // API data enters the app.
    return ProposalListResponseSchema.parse(await res.json());
  },

  async applyOrganizationProposal(memoirId: string, proposalId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/organize/apply`, {
      method: "POST",
      body: JSON.stringify({ proposal_id: proposalId }),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(
        parseErrorDetail(errData, "Could not apply the proposal"),
      );
    }
    return ApplyProposalResultSchema.parse(await res.json());
  },

  async getOrganizationHistory(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/organize/history`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to load organization history");
    return res.json();
  },

  async getChapters(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/chapters`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch chapters");
    // Validated rather than cast: the chapter shape drives what the memoir page
    // renders, and a silent field rename should fail here instead of producing
    // an empty heading in someone's family book.
    return z.array(ChapterSchema).parse((await res.json()).data);
  },

  async renameChapter(memoirId: string, chapterId: string, title: string) {
    const res = await apiFetch(
      `/api/memoirs/${memoirId}/chapters/${chapterId}`,
      {
        method: "PUT",
        body: JSON.stringify({ title }),
      },
    );
    if (!res.ok) throw new Error("Failed to rename chapter");
    return (await res.json()).data;
  },

  // Same endpoint as renameChapter, but for either field. The backend's
  // ChapterUpdateRequest accepts `title` and/or `summary`, and only the keys
  // sent are written -- so this can rewrite a summary without disturbing the
  // title. renameChapter is kept as the narrower, more readable call for the
  // inline-rename control, which is the common case.
  async updateChapter(
    memoirId: string,
    chapterId: string,
    patch: { title?: string; summary?: string },
  ) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/chapters/${chapterId}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to update chapter"));
    }
    return (await res.json()).data;
  },

  // Full new ordering only -- the backend's /chapters/reorder route takes the
  // complete list, not a single up/down delta, so callers resend every
  // chapter's { chapter_id, sort_order } on each move.
  async reorderChapters(memoirId: string, order: { chapter_id: string; sort_order: number }[]) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/chapters/reorder`, {
      method: "PUT",
      body: JSON.stringify({ order }),
    });
    if (!res.ok) throw new Error("Failed to reorder chapters");
    return z.array(ChapterSchema).parse((await res.json()).data);
  },

  // Real route is PUT /api/memoirs/{memoir_id}/memories/{memory_id}/move
  // with body { new_chapter_id }, not PATCH /api/memories/{id}/move with
  // { chapter_id } -- memoir_id is required (owner-only, 404 if not yours).
  async moveMemory(memoirId: string, memoryId: string, chapterId: string) {
    const res = await apiFetch(
      `/api/memoirs/${memoirId}/memories/${memoryId}/move`,
      {
        method: "PUT",
        body: JSON.stringify({ new_chapter_id: chapterId }),
      },
    );
    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to move memory"));
    }
    return (await res.json()).data;
  },

  // Archive Chat
  async askArchive(memoirId: string, message: string, history: Array<{ role: string; content: string }> = []) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, history }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to query archive"));
    }

    // Validated at the boundary. `proposed_actions` is part of the contract:
    // the assistant can suggest changes, and those suggestions arrive here for
    // the owner to review. Nothing in this response has been applied.
    return ChatResponseSchema.parse(await res.json());
  },
};
