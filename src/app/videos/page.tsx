"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  X,
  AlertTriangle,
  LayoutGrid,
  List,
  Pencil,
  Play,
  Clock,
  EyeOff,
  Globe,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { VIDEO_CATEGORIES, VIDEO_CATEGORY_COLOURS } from "@/lib/videoCategories";
import { getVideoContents, deleteVideoContent, resolveAssetUrl, VideoContentItem, getCategories, CategoryApiData, getVideoContentById, publishVideoContent, unpublishVideoContent } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoStatus = "PUBLISHED" | "SCHEDULED" | "DRAFT";

const GRADIENT_POOL = [
  "from-blue-500 via-teal-500 to-indigo-600",
  "from-pink-500 via-rose-500 to-amber-500",
  "from-sky-300 via-indigo-400 to-purple-500",
  "from-purple-400 via-indigo-500 to-blue-600",
  "from-emerald-400 via-teal-500 to-green-600",
  "from-indigo-600 via-blue-700 to-slate-800",
  "from-amber-500 via-orange-600 to-red-700",
  "from-yellow-400 via-amber-500 to-orange-600",
];

function getGradient(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h += str.charCodeAt(i);
  return GRADIENT_POOL[h % GRADIENT_POOL.length];
}

function formatDuration(secs: number | null | undefined): string {
  if (!secs) return "--";
  const m = Math.floor(secs / 60);
  const s = String(Math.floor(secs % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "N/A"; }
}

// Categories are fetched dynamically from the API

// ─── Dropdown Component ───────────────────────────────────────────────────────

function FilterDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 transition-all shadow-sm select-none"
      >
        <span>{value}</span>
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-150 rounded-2xl shadow-xl z-20 py-2 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 max-h-64 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors select-none ${
                  opt === value ? "bg-[#FFF0F2] text-[#B31046]" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const colorClass = VIDEO_CATEGORY_COLOURS[category] || "bg-zinc-50 border-zinc-100 text-zinc-500";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${colorClass} tracking-wide`}>
      {category}
    </span>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VideoStatus }) {
  switch (status) {
    case "PUBLISHED":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-100 text-emerald-700 border border-emerald-250/20">
          Published
        </span>
      );
    case "SCHEDULED":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-blue-50 text-blue-600 border border-blue-100">
          Scheduled
        </span>
      );
    case "DRAFT":
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-zinc-100 text-zinc-500 border border-zinc-200">
          Draft
        </span>
      );
  }
}

// ─── Skeleton Screen Helpers ──────────────────────────────────────────────────

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        backgroundImage: "linear-gradient(90deg, #e4e4e7 25%, #f0f0f2 50%, #e4e4e7 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}

function VideosGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm flex flex-col">
          <SkeletonPulse className="w-full aspect-video rounded-none" />
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <SkeletonPulse className={`h-4 rounded-full ${i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-2/3"}`} />
              <SkeletonPulse className="h-3 w-5/6 rounded-full" />
              <div className="flex items-center gap-2 pt-1">
                <SkeletonPulse className="h-5 w-24 rounded-md" />
                <SkeletonPulse className="h-3.5 w-16 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <SkeletonPulse className="flex-1 h-8 rounded-full" />
              <SkeletonPulse className="w-8 h-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VideosListSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden animate-pulse">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="grid grid-cols-[56px_2fr_1fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
        {["Image", "Video Title", "Duration", "Category", "Date Added", "Status", "Actions"].map((h) => (
          <span key={h} className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">{h}</span>
        ))}
      </div>
      <div className="divide-y divide-zinc-50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[56px_2fr_1fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-6 py-3.5">
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
            <SkeletonPulse className={`h-3.5 rounded-full ${i % 2 === 0 ? "w-3/4" : "w-2/3"}`} />
            <SkeletonPulse className="h-3.5 w-12 rounded-full" />
            <SkeletonPulse className="h-5 w-24 rounded-md" />
            <SkeletonPulse className="h-3.5 w-20 rounded-full" />
            <SkeletonPulse className="h-6 w-20 rounded-full" />
            <div className="flex items-center gap-2">
              <SkeletonPulse className="w-7 h-7 rounded-full" />
              <SkeletonPulse className="w-7 h-7 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Video Dashboard Component ───────────────────────────────────────────

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<CategoryApiData[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const [deletingVideo, setDeletingVideo] = useState<VideoContentItem | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewVideo, setPreviewVideo] = useState<VideoContentItem | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handlePreviewVideo = async (video: VideoContentItem) => {
    setIsLoadingPreview(true);
    setPreviewVideo(video);
    try {
      const res = await getVideoContentById(video.id);
      if (res?.success && res.data) {
        setPreviewVideo(res.data);
      }
    } catch (err) {
      console.error("Failed to load video details:", err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleTogglePublish = async (id: string, action: "publish" | "unpublish") => {
    setTogglingId(id);
    try {
      const res = action === "publish" ? await publishVideoContent(id) : await unpublishVideoContent(id);
      if (res?.success) {
        addToast("success", `Video ${action === "publish" ? "published" : "unpublished"} successfully.`);
        fetchVideos();
      } else {
        addToast("error", `Failed to ${action} video.`);
      }
    } catch (err) {
      console.error(`Failed to ${action} video`, err);
      addToast("error", `An error occurred while trying to ${action} the video.`);
    } finally {
      setTogglingId(null);
    }
  };

  const itemsPerPage = 6;

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Fetch video categories once on mount
  useEffect(() => {
    getCategories("VIDEO")
      .then((res) => { if (res?.success) setCategories(res.data); })
      .catch(() => {});
  }, []);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (selectedStatus === "Scheduled") {
        params.limit = 100;
      } else {
        params.page = page;
        params.limit = itemsPerPage;
        if (selectedStatus !== "All Statuses") {
          params.status = selectedStatus.toUpperCase();
        }
      }
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      
      const res = await getVideoContents(params as Parameters<typeof getVideoContents>[0]);
      if (res?.success) {
        if (selectedStatus === "Scheduled") {
          const filtered = res.data.filter((item) => item.status === "SCHEDULED");
          const totalItems = filtered.length;
          const totalPagesScheduled = Math.max(1, Math.ceil(totalItems / itemsPerPage));
          setTotalPages(totalPagesScheduled);
          setTotalVideos(totalItems);
          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          setVideos(filtered.slice(startIndex, endIndex));
        } else {
          setVideos(res.data);
          setTotalPages(res.meta.totalPages);
          setTotalVideos(res.meta.total);
        }
      }
    } catch (err: any) {
      console.error("Failed to load videos. Message:", err?.message, "Status:", err?.status, "Errors:", err?.errors);
      addToast("error", "Failed to load videos.");
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus, searchTerm, selectedCategoryId]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const paginatedVideos = videos;

  const handleDelete = async () => {
    if (!deletingVideo) return;
    try {
      await deleteVideoContent(deletingVideo.id);
      addToast("success", `"${deletingVideo.title}" deleted successfully.`);
      setDeletingVideo(null);
      fetchVideos();
    } catch {
      addToast("error", "Failed to delete video.");
      setDeletingVideo(null);
    }
  };

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header Row ── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Videos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage and publish your video and song content</p>
        </div>

        <button
          onClick={() => router.push("/videos/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full shadow-md active:scale-[0.98] transition-all self-start md:self-auto select-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Video
        </button>
      </header>

      {/* ── Filters bar ── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-full focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 outline-none transition-all placeholder-zinc-400 font-semibold text-zinc-800 shadow-sm"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3">
          {/* Live Category Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedCategoryId}
              onChange={(e) => { setSelectedCategoryId(e.target.value); setPage(1); }}
              className="appearance-none flex items-center gap-3 pl-4 pr-9 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 transition-all shadow-sm cursor-pointer focus:outline-none focus:border-[#B31046]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          </div>

          <FilterDropdown
            value={selectedStatus}
            options={["All Statuses", "Published", "Scheduled", "Draft"]}
            onChange={(val) => {
              setSelectedStatus(val);
              setPage(1);
            }}
          />

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-full p-1 gap-0.5 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid view"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-[#B31046] text-white shadow-sm" : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List view"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === "list" ? "bg-[#B31046] text-white shadow-sm" : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Table / Grid ── */}
      {loading ? (
        viewMode === "list" ? <VideosListSkeleton /> : <VideosGridSkeleton />
      ) : paginatedVideos.length > 0 ? (
        viewMode === "list" ? (
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[56px_2fr_1fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
              {["Image", "Video Title", "Duration", "Category", "Date Added", "Status", "Actions"].map((h) => (
                <span key={h} className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-zinc-50">
              {paginatedVideos.map((video) => (
                <div key={video.id} className="grid grid-cols-[56px_2fr_1fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-6 py-3.5 hover:bg-zinc-50/50 transition-colors group">
                  {/* Thumbnail */}
                  <div 
                    onClick={() => handlePreviewVideo(video)}
                    className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative cursor-pointer group-hover:scale-103 transition-transform duration-200"
                  >
                    <img
                      src={resolveAssetUrl(video.featuredImage || video.videoAsset?.thumbnailUrl || "")}
                      alt={video.title}
                      onError={(e) => {
                        e.currentTarget.src = "/logogo.png";
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      <Play className="w-3.5 h-3.5 text-white fill-white/80" />
                    </div>
                  </div>
                  {/* Title + description */}
                  <div 
                    onClick={() => handlePreviewVideo(video)}
                    className="min-w-0 cursor-pointer"
                  >
                    <p className="text-sm font-extrabold text-zinc-900 truncate group-hover:text-[#B31046] transition-colors">{video.title}</p>
                    <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">{video.description || "—"}</p>
                  </div>
                  {/* Duration */}
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-bold">{formatDuration(video.duration || video.videoAsset?.durationSeconds)}</span>
                  </div>
                  {/* Category */}
                  <div><CategoryBadge category={video.category?.name || "—"} /></div>
                  {/* Date */}
                  <span className="text-xs font-semibold text-zinc-500">{formatDate(video.createdAt)}</span>
                  {/* Status */}
                  <div><StatusBadge status={video.status as VideoStatus} /></div>
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/videos/new?edit=${video.id}`)} className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] hover:border-[#FFF0F2] transition-all cursor-pointer" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    {video.status === "PUBLISHED" ? (
                      <button
                        onClick={() => handleTogglePublish(video.id, "unpublish")}
                        disabled={togglingId === video.id}
                        className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-450 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Unpublish to Draft"
                      >
                        {togglingId === video.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTogglePublish(video.id, "publish")}
                        disabled={togglingId === video.id}
                        className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-[#B31046] hover:border-[#FFF0F2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Publish Immediately"
                      >
                        {togglingId === video.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#B31046] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button onClick={() => setDeletingVideo(video)} className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] hover:border-[#FFF0F2] transition-all cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Grid View ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div 
                  onClick={() => handlePreviewVideo(video)}
                  className={`relative aspect-video bg-gradient-to-br ${getGradient(video.id)} flex items-center justify-center overflow-hidden group cursor-pointer`}
                >
                  <img
                    src={resolveAssetUrl(video.featuredImage || video.videoAsset?.thumbnailUrl || "")}
                    alt={video.title}
                    onError={(e) => {
                      e.currentTarget.src = "/logogo.png";
                    }}
                    className="w-full h-full object-cover transition-transform hover:scale-103 duration-300"
                  />
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/95 text-[#B31046] flex items-center justify-center shadow-lg transform group-hover:scale-108 transition-all">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  {/* Duration Badge */}
                  <span className="absolute bottom-4 left-4 text-[10px] font-extrabold bg-black/60 text-white px-2 py-0.5 rounded-md backdrop-blur-md flex items-center gap-1 select-none">
                    <Clock className="w-3 h-3" />
                    {formatDuration(video.duration || video.videoAsset?.durationSeconds)}
                  </span>
                  {/* Status Badge */}
                  <span className={`absolute top-4 right-4 text-[9px] font-extrabold px-3 py-1 rounded-full tracking-wider uppercase backdrop-blur-md shadow-sm select-none ${
                    video.status === "PUBLISHED" ? "bg-emerald-100/80 text-emerald-800 border border-emerald-200/30"
                    : video.status === "SCHEDULED" ? "bg-blue-50/90 text-blue-600 border border-blue-100/50"
                    : "bg-zinc-800/40 text-zinc-200 border border-white/10"
                  }`}>{video.status}</span>
                </div>
                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 
                      onClick={() => handlePreviewVideo(video)}
                      className="text-base font-extrabold text-zinc-900 leading-snug line-clamp-1 hover:text-[#B31046] transition-colors cursor-pointer"
                    >
                      {video.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold leading-relaxed line-clamp-2">{video.description || "—"}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <CategoryBadge category={video.category?.name || "—"} />
                      <span className="text-xs text-zinc-400 font-semibold">{formatDate(video.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => router.push(`/videos/new?edit=${video.id}`)} className="flex-1 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-xs rounded-full transition-all text-center cursor-pointer select-none active:scale-[0.98]">Edit</button>
                    {video.status === "PUBLISHED" ? (
                      <button
                        onClick={() => handleTogglePublish(video.id, "unpublish")}
                        disabled={togglingId === video.id}
                        className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 border border-zinc-200 rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Unpublish to Draft"
                      >
                        {togglingId === video.id ? (
                          <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTogglePublish(video.id, "publish")}
                        disabled={togglingId === video.id}
                        className="p-2 hover:bg-[#FFF0F2] text-[#B31046] border border-zinc-200 hover:border-[#FFF0F2] rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Publish Immediately"
                      >
                        {togglingId === video.id ? (
                          <div className="w-4 h-4 border-2 border-[#B31046] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button onClick={() => setDeletingVideo(video)} className="p-2 hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] border border-zinc-200 hover:border-[#FFF0F2] rounded-full transition-all cursor-pointer active:scale-[0.95]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-3xl py-20 text-center border border-zinc-100 shadow-sm space-y-2">
          <p className="text-sm font-extrabold text-zinc-700">No videos found</p>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-xs font-semibold text-zinc-500">
              Page <span className="font-extrabold text-zinc-700">{page}</span> of{" "}
              <span className="font-extrabold text-zinc-700">{totalPages}</span> · {totalVideos} total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50 text-zinc-500 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all select-none cursor-pointer ${p === page ? "bg-[#B31046] text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100"}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50 text-zinc-500 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingVideo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setDeletingVideo(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mx-auto w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#B31046]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-zinc-900">Delete Video</h3>
              <p className="text-sm font-semibold text-zinc-500 leading-relaxed">
                Are you sure you want to delete <span className="font-extrabold text-zinc-800">"{deletingVideo.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeletingVideo(null)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-sm rounded-full transition-all active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video Preview Modal ── */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl border border-zinc-100 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 pb-4 flex items-start justify-between border-b border-zinc-100 shrink-0">
              <div className="space-y-1.5 pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold text-zinc-900 leading-snug">{previewVideo.title}</h3>
                  {previewVideo.category && (
                    <CategoryBadge category={previewVideo.category.name} />
                  )}
                  <StatusBadge status={previewVideo.status as VideoStatus} />
                </div>
                {previewVideo.verseReference && (
                  <p className="text-xs text-zinc-500 font-bold">
                    Bible Reference: {previewVideo.verseReference}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setPreviewVideo(null);
                  setIsLoadingPreview(false);
                }}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Section */}
            <div className="relative aspect-video bg-zinc-950 flex items-center justify-center border-b border-zinc-100 shrink-0">
              {isLoadingPreview && !previewVideo.videoAsset?.playbackUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-[#B31046] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-zinc-400">Loading player...</p>
                </div>
              ) : previewVideo.videoAsset?.playbackUrl ? (
                (() => {
                  const resolvedUrl = resolveAssetUrl(previewVideo.videoAsset.playbackUrl);
                  const isIframe = resolvedUrl.includes("iframe.mediadelivery.net");
                  if (isIframe) {
                    return (
                      <iframe
                        src={resolvedUrl}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    );
                  }
                  return (
                    <video
                      src={resolvedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                      poster={resolveAssetUrl(previewVideo.featuredImage || previewVideo.videoAsset?.thumbnailUrl || "")}
                    />
                  );
                })()
              ) : (
                <div className="flex flex-col items-center gap-2.5 text-zinc-450 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  </div>
                  <p className="text-sm font-semibold">No video file attached</p>
                </div>
              )}
            </div>

            {/* Description & Tags */}
            <div className="p-6 space-y-4 max-h-[25vh] overflow-y-auto min-h-[100px] flex-1">
              {previewVideo.content && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Description</h4>
                  <div 
                    className="text-sm font-medium text-zinc-600 leading-relaxed rich-text-preview"
                    dangerouslySetInnerHTML={{ __html: previewVideo.content }}
                  />
                </div>
              )}
              {previewVideo.tags && previewVideo.tags.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-zinc-100">
                  <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {previewVideo.tags.map(({ tag }) => (
                      <span key={tag.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF0F2] text-[#B31046] border border-[#FFF0F2]">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
