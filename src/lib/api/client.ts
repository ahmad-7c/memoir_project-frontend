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

function parseErrorDetail(
  errData: ApiErrorResponse | null | undefined,
  defaultMessage: string,
): string {
  if (!errData) return defaultMessage;
  if (typeof errData.detail === "string") return errData.detail;

  if (Array.isArray(errData.detail)) {
    return errData.detail
      .map((err: ApiErrorDetail) => {
        const field =
          err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : "Field";
        return `${field}: ${err.msg || "Invalid value"}`;
      })
      .join(" | ");
  }

  if (errData.message) return errData.message;
  return defaultMessage;
}

export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface MemoirCreatePayload {
  subject_name: string;
  subject_born_on?: string;
  subject_died_on?: string;
  subject_is_living: boolean;
  description?: string;
  visibility?: string;
  comment_policy?: string;
  relationship?: string;
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
  media_asset_id?: string | null;
  author_participant_id?: string | null;
  parent_comment_id?: string | null;
  body: string;
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

  // 2. FIX THIS: Remove the duplicate/crashing !res.ok block
  async createMemory(payload: MemoryCreatePayload) {
    const res = await apiFetch("/api/memories/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData: ApiErrorResponse = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(errData, "Failed to create memory"));
    }

    return res.json();
  },
  async deleteMemory(memoryId: string) {
    const res = await apiFetch(`/api/memories/${memoryId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete memory");
    return res.json();
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

  // Comments
  async getComments(memoryId: string): Promise<CommentEntity[]> {
    const res = await apiFetch(`/api/comments/?memory_id=${memoryId}`, {
      method: "GET",
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

  async createComment(payload: CommentCreatePayload): Promise<CommentEntity> {
    const res = await apiFetch("/api/comments/", {
      method: "POST",
      body: JSON.stringify(payload),
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
  // Search
  async searchMemories(memoirId: string, query: string) {
    const res = await apiFetch(
      `/api/memoirs/${memoirId}/search?q=${encodeURIComponent(query)}`,
      {
        method: "GET",
      },
    );
    if (!res.ok) throw new Error("Failed to search archive");
    const json = await res.json();
    return json.data || json;
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
  async getSharedMemoir(token: string) {
    const res = await apiFetch(`/api/share/${token}`, {
      method: "GET",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData.detail ||
          "Failed to load shared memoir. The link may be expired or invalid.",
      );
    }
    const json = await res.json();
    return json.data;
  },

  // AI Organization & Chapters
  async generateTimeline(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/organize`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to generate timeline");
    return (await res.json()).data;
  },

  async getChapters(memoirId: string) {
    const res = await apiFetch(`/api/memoirs/${memoirId}/chapters`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch chapters");
    return (await res.json()).data;
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
  
  async moveMemory(memoryId: string, chapterId: string) {
    const res = await apiFetch(`/api/memories/${memoryId}/move`, {
      method: "PATCH",
      body: JSON.stringify({ chapter_id: chapterId }),
    });
    if (!res.ok) throw new Error("Failed to move memory");
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

    const data = await res.json();
    return data; 
  },
};
