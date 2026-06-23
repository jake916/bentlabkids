const BASE_URL = typeof window !== "undefined"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL || "");

export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

export function getBunnyThumbnailUrl(playbackUrl: string | undefined | null): string | null {
  if (!playbackUrl || !playbackUrl.includes("iframe.mediadelivery.net")) {
    return null;
  }
  const cleanUrl = playbackUrl.split("?")[0].split("#")[0];
  const parts = cleanUrl.split("/");
  const videoId = parts[parts.length - 1];
  if (videoId) {
    return `https://iframe.mediadelivery.net/${videoId}/thumbnail.jpg`;
  }
  return null;
}

export interface ApiError {
  message: string;
  status: number;
}

// ─── Generic Fetch Helper ────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("session_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    // Include cookies so session-based auth works correctly
    credentials: "include",
    ...options,
    headers,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Error shape: { success: false, message: string, statusCode: number, errors: ... }
    const message =
      body?.message ||
      body?.error ||
      `Request failed with status ${res.status}`;

    if (res.status === 401 && typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (
        pathname !== "/login" &&
        pathname !== "/forgot-password" &&
        pathname !== "/reset-password" &&
        pathname !== "/"
      ) {
        window.location.href = "/login";
      }
    }

    throw { message, status: res.status } as ApiError;
  }

  return body as T;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
}

// ─── Sign In ─────────────────────────────────────────────────────────────────

export interface SignInPayload {
  email: string;
  password: string;
}

// 200: { success: true, data: { user: User, session: Session } }
export interface SignInResponse {
  success: boolean;
  data: {
    user: User;
    session: Session;
  };
}

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  return apiFetch<SignInResponse>("/api/v1/sign-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export interface ForgotPasswordPayload {
  email: string;
  redirectTo: string;
}

// 200: { success: true, message: string }
export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
}

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>("/api/v1/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  return apiFetch<ResetPasswordResponse>("/api/v1/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<{ success: boolean }> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("session_token");
  }
  return apiFetch<{ success: boolean }>("/api/v1/sign-out", {
    method: "POST",
  });
}

// ─── Get Current User ─────────────────────────────────────────────────────────

export interface GetMeResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export async function getCurrentUser(): Promise<GetMeResponse> {
  return apiFetch<GetMeResponse>("/api/v1/me");
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export interface StatItem {
  count: number;
  thisweek: number;
  growthPct: number;
}

export interface AdminStatsResponse {
  success: boolean;
  data: {
    bibleStories: StatItem;
    prayers: StatItem;
    videos: StatItem;
    categories: {
      count: number;
    };
    users: StatItem;
  };
}

export async function getAdminStats(): Promise<AdminStatsResponse> {
  return apiFetch<AdminStatsResponse>("/api/v1/admin/stats");
}

// ─── Admin Stories ────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "BIBLE_STORY" | "PRAYER" | "VIDEO";
}

export interface StoryTag {
  tag: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface StoryResponse {
  id: string;
  title: string;
  slug: string;
  type: "BIBLE_STORY" | "PRAYER";
  content: string;
  duration: number | null;
  verseReference: string | null;
  ageGroup: "TODDLER" | "PRESCHOOL" | "EARLY" | "KIDS" | null;
  featuredImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  scheduledFor: string | null;
  publishedAt: string | null;
  category: Category | null;
  tags: StoryTag[];
  createdAt: string;
  updatedAt: string;
}

export interface StoriesListResponse {
  success: boolean;
  data: StoryResponse[];
}

export async function getStories(params?: {
  categoryId?: string;
  status?: string;
  ageGroup?: string;
  search?: string;
}): Promise<StoriesListResponse> {
  const query = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  return apiFetch<StoriesListResponse>(`/api/v1/admin/stories${query}`);
}

export interface CreateStoryPayload {
  title: string;
  slug: string;
  content: string;
  duration?: number;
  verseReference?: string;
  ageGroup?: "TODDLER" | "PRESCHOOL" | "EARLY" | "KIDS";
  categoryId?: string;
  image?: string;
  tags?: string[];
  scheduledFor?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "SCHEDULED";
}

export interface CreateStoryResponse {
  success: boolean;
  data: StoryResponse;
}

export async function createStory(
  payload: CreateStoryPayload
): Promise<CreateStoryResponse> {
  return apiFetch<CreateStoryResponse>("/api/v1/admin/stories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getStoryById(
  id: string
): Promise<CreateStoryResponse> {
  return apiFetch<CreateStoryResponse>(`/api/v1/admin/stories/${id}`);
}

export async function updateStory(
  id: string,
  payload: Partial<CreateStoryPayload>
): Promise<CreateStoryResponse> {
  return apiFetch<CreateStoryResponse>(`/api/v1/admin/stories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteStory(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/admin/stories/${id}`, {
    method: "DELETE",
  });
}

export async function getStoryBySlug(
  slug: string
): Promise<CreateStoryResponse> {
  return apiFetch<CreateStoryResponse>(`/api/v1/admin/stories/slug/${slug}`);
}

export async function publishStory(
  id: string
): Promise<CreateStoryResponse> {
  return apiFetch<CreateStoryResponse>(`/api/v1/admin/stories/${id}/publish`, {
    method: "PATCH",
  });
}

export async function unpublishStory(
  id: string
): Promise<CreateStoryResponse> {
  return apiFetch<CreateStoryResponse>(`/api/v1/admin/stories/${id}/unpublish`, {
    method: "PATCH",
  });
}

// ─── Prayers Management API ───────────────────────────────────────────────────

export interface PrayerResponse {
  id: string;
  title: string;
  slug: string;
  type: "BIBLE_STORY" | "PRAYER";
  content: string;
  duration: number | null;
  verseReference: string | null;
  ageGroup: "TODDLER" | "PRESCHOOL" | "EARLY" | "KIDS" | null;
  featuredImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  scheduledFor: string | null;
  publishedAt: string | null;
  category: Category | null;
  tags: StoryTag[];
  createdAt: string;
  updatedAt: string;
}

export interface PrayersListResponse {
  success: boolean;
  data: PrayerResponse[];
}

export interface CreatePrayerPayload {
  title: string;
  slug: string;
  content: string;
  duration?: number;
  verseReference?: string;
  ageGroup?: "TODDLER" | "PRESCHOOL" | "EARLY" | "KIDS";
  categoryId?: string;
  image?: string;
  tags?: string[];
  scheduledFor?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "SCHEDULED";
}

export interface CreatePrayerResponse {
  success: boolean;
  data: PrayerResponse;
}

export async function getPrayers(params?: {
  categoryId?: string;
  status?: string;
  ageGroup?: string;
  search?: string;
}): Promise<PrayersListResponse> {
  const query = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  return apiFetch<PrayersListResponse>(`/api/v1/admin/prayers${query}`);
}

export async function createPrayer(
  payload: CreatePrayerPayload
): Promise<CreatePrayerResponse> {
  return apiFetch<CreatePrayerResponse>("/api/v1/admin/prayers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPrayerById(
  id: string
): Promise<CreatePrayerResponse> {
  return apiFetch<CreatePrayerResponse>(`/api/v1/admin/prayers/${id}`);
}

export async function updatePrayer(
  id: string,
  payload: Partial<CreatePrayerPayload>
): Promise<CreatePrayerResponse> {
  return apiFetch<CreatePrayerResponse>(`/api/v1/admin/prayers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePrayer(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/admin/prayers/${id}`, {
    method: "DELETE",
  });
}

export async function getPrayerBySlug(
  slug: string
): Promise<CreatePrayerResponse> {
  return apiFetch<CreatePrayerResponse>(`/api/v1/admin/prayers/slug/${slug}`);
}

export async function publishPrayer(
  id: string
): Promise<CreatePrayerResponse> {
  return apiFetch<CreatePrayerResponse>(`/api/v1/admin/prayers/${id}/publish`, {
    method: "PATCH",
  });
}

export async function unpublishPrayer(
  id: string
): Promise<CreatePrayerResponse> {
  return apiFetch<CreatePrayerResponse>(`/api/v1/admin/prayers/${id}/unpublish`, {
    method: "PATCH",
  });
}

// ─── Admin Uploads / Media ───────────────────────────────────────────────────

export interface CloudinaryImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface VideoResponse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  provider: "BUNNY" | "YOUTUBE" | "VIMEO";
  externalVideoId: string | null;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  processingStatus: "PROCESSING" | "READY" | "FAILED" | "QUEUED" | "UPLOADING";
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  ageGroup: string | null;
  category: Category | null;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  tags: {
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface UploadsListResponse {
  success: boolean;
  data: {
    images?: {
      images: CloudinaryImage[];
      nextCursor: string | null;
    };
    videos?: {
      data: VideoResponse[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export async function getUploads(params?: {
  type?: "all" | "image" | "video";
  imageCursor?: string;
  videoPage?: number;
  videoLimit?: number;
}): Promise<UploadsListResponse> {
  const query = params
    ? "?" + new URLSearchParams(params as any).toString()
    : "";
  return apiFetch<UploadsListResponse>(`/api/v1/admin/uploads${query}`);
}

export async function deleteVideo(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/admin/videos/${id}`, {
    method: "DELETE",
  });
}

export interface VideoStatusResponse {
  success: boolean;
  data: {
    id: string;
    processingStatus: "QUEUED" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
    uploadProgress: number;
    failureReason: string | null;
    playbackUrl?: string | null;
    thumbnailUrl?: string | null;
  };
}

export async function getVideoStatus(id: string): Promise<VideoStatusResponse> {
  return apiFetch<VideoStatusResponse>(`/api/v1/admin/videos/${id}/status`);
}

// ─── Video Contents (Video Listing Page) ─────────────────────────────────────

export interface VideoAsset {
  id: string;
  title: string;
  provider: "BUNNY" | "YOUTUBE" | "VIMEO";
  externalVideoId: string | null;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  processingStatus: "QUEUED" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  uploadProgress: number;
  failureReason: string | null;
  uploadedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoContentItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  content: string;
  description: string | null;
  duration: number | null;
  verseReference: string | null;
  ageGroup: string | null;
  featuredImage: string | null;
  prayerWhen: string | null;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  category: Category | null;
  videoAssetId: string | null;
  videoAsset: VideoAsset | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoContentsResponse {
  success: boolean;
  data: VideoContentItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getVideoContents(params?: {
  categoryId?: string;
  status?: string;
  ageGroup?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<VideoContentsResponse> {
  const query = params
    ? "?" + new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        )
      ).toString()
    : "";
  return apiFetch<VideoContentsResponse>(`/api/v1/admin/video-contents${query}`);
}

export async function deleteVideoContent(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/admin/video-contents/${id}`, {
    method: "DELETE",
  });
}

// ─── Admin Categories ─────────────────────────────────────────────────────────

export type CategoryApiType = "BIBLE_STORY" | "PRAYER" | "VIDEO";

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  type: CategoryApiType;
}

export interface CategoryApiData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: CategoryApiType;
  _count: {
    contents: number;
    videos: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryResponse {
  success: boolean;
  data: CategoryApiData;
}

export async function createCategory(
  payload: CreateCategoryPayload
): Promise<CreateCategoryResponse> {
  return apiFetch<CreateCategoryResponse>("/api/v1/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ListCategoriesResponse {
  success: boolean;
  data: CategoryApiData[];
}

export async function getCategories(
  type?: CategoryApiType
): Promise<ListCategoriesResponse> {
  const query = type ? `?type=${type}` : "";
  return apiFetch<ListCategoriesResponse>(`/api/v1/admin/categories${query}`);
}

// ─── Get Category by Slug ─────────────────────────────────────────────────────

// Response shape is identical to CreateCategoryResponse: { success, data: CategoryApiData }
export async function getCategoryBySlug(
  slug: string
): Promise<CreateCategoryResponse> {
  return apiFetch<CreateCategoryResponse>(
    `/api/v1/admin/categories/slug/${encodeURIComponent(slug)}`
  );
}

// ─── Get Category by ID ───────────────────────────────────────────────────────

export async function getCategoryById(
  id: string
): Promise<CreateCategoryResponse> {
  return apiFetch<CreateCategoryResponse>(`/api/v1/admin/categories/${id}`);
}

// ─── Update Category ──────────────────────────────────────────────────────────

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  type?: CategoryApiType;
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload
): Promise<CreateCategoryResponse> {
  return apiFetch<CreateCategoryResponse>(`/api/v1/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ─── Delete Category ──────────────────────────────────────────────────────────

export async function deleteCategory(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/api/v1/admin/categories/${id}`,
    { method: "DELETE" }
  );
}
