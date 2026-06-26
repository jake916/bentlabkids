"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  ChevronDown,
  Play,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Film,
  FileImage,
  Check,
  Download,
  Trash2,
  X,
  Info,
  AlertTriangle,
} from "lucide-react";
import { getUploads, deleteVideo, deleteImage, resolveAssetUrl, getBunnyThumbnailUrl, getVideoStatus } from "@/lib/api";
import { ToastContainer, ToastItem } from "@/components/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaType = "JPG" | "PNG" | "WEBP" | "MP4" | "MOV";
type FilterType = "All Formats" | "JPG" | "PNG" | "WEBP" | "MP4" | "MOV";
type SortType = "Newest" | "Oldest" | "Largest" | "Smallest";

interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  size: string;
  date: string;
  gradient: string;
  url?: string;
  width?: number;
  height?: number;
  durationSeconds?: number | null;
  processingStatus?: string;
  uploadedBy?: { name: string; email: string };
  category?: { name: string };
  createdAt?: string;
  thumbnailUrl?: string;
}

// Helper: parse human readable size (KB/MB) to bytes for sorting
function parseSizeToBytes(sizeStr: string): number {
  if (sizeStr === "N/A") return 0;
  const num = parseFloat(sizeStr);
  if (isNaN(num)) return 0;
  if (sizeStr.includes("KB")) return num * 1024;
  if (sizeStr.includes("MB")) return num * 1024 * 1024;
  if (sizeStr.includes("GB")) return num * 1024 * 1024 * 1024;
  return num;
}

function getCloudinaryFileInfo(url: string, publicId: string) {
  const parts = url.split(".");
  const ext = parts[parts.length - 1]?.toUpperCase() || "JPG";
  const type: MediaType = ext === "PNG" ? "PNG" : ext === "WEBP" ? "WEBP" : "JPG";
  
  const publicIdParts = publicId.split("/");
  const name = publicIdParts[publicIdParts.length - 1] || "image";
  return { name: `${name}.${type.toLowerCase()}`, type };
}

function getAvatarBg(title: string) {
  const colors = [
    "from-orange-400 via-red-500 to-teal-600",
    "from-amber-600 via-yellow-700 to-amber-900",
    "from-sky-300 via-indigo-400 to-violet-500",
    "from-amber-800 via-yellow-900 to-stone-800",
    "from-zinc-700 via-slate-800 to-zinc-900",
    "from-blue-500 via-teal-500 to-indigo-600",
    "from-pink-500 via-rose-500 to-amber-500",
    "from-sky-300 via-indigo-400 to-purple-500",
    "from-purple-400 via-indigo-500 to-blue-600",
  ];
  let sum = 0;
  for (let i = 0; i < title.length; i++) {
    sum += title.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch (e) {
    return "N/A";
  }
}

const estimateImageSize = (width: number, height: number) => {
  const kb = (width * height * 0.00015).toFixed(0);
  return `${kb}KB`;
};

const getMockVideoSize = (durationSeconds: number | null) => {
  if (!durationSeconds) return "2.5MB";
  const mb = (durationSeconds * 0.15).toFixed(1);
  return `${mb}MB`;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeBadgeStyle(type: MediaType) {
  switch (type) {
    case "JPG":  return "bg-blue-100 text-blue-600";
    case "PNG":  return "bg-emerald-100 text-emerald-600";
    case "WEBP": return "bg-purple-100 text-purple-600";
    case "MP4":  return "bg-rose-105 text-[#B31046]";
    case "MOV":  return "bg-indigo-100 text-indigo-650";
  }
}

// ─── VideoThumbnail ──────────────────────────────────────────────────────────
// Captures a frame from a video URL using a hidden canvas when no thumbnail is available
function VideoThumbnail({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        // A blank canvas produces a tiny data URL — treat that as failed
        if (dataUrl.length > 5000) {
          setThumbSrc(dataUrl);
        } else {
          setFailed(true);
        }
      }
    } catch {
      setFailed(true);
    }
  }, []);

  if (thumbSrc) {
    return <img src={thumbSrc} alt={alt} className={className} />;
  }

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
        <Film className="w-10 h-10 text-zinc-500" />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={`${src}#t=1.5`}
      preload="metadata"
      muted
      playsInline
      crossOrigin="anonymous"
      className="w-full h-full object-cover pointer-events-none opacity-0 absolute inset-0"
      onLoadedData={captureFrame}
      onSeeked={captureFrame}
      onError={() => setFailed(true)}
    />
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Dropdown({ value, options, onChange }: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 transition-all shadow-sm"
      >
        {value}
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-100 rounded-xl shadow-lg z-20 min-w-[140px] overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 ${opt === value ? "text-[#B31046] font-semibold" : "text-zinc-700"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function isThumbnailValid(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  if (clean === "thumbnail.jpg" || clean === "/thumbnail.jpg") return false;
  if (clean.endsWith("/thumbnail.jpg")) {
    if (clean.includes("b-cdn.net") || clean.includes("iframe.mediadelivery.net")) {
      return true;
    }
    return false;
  }
  return true;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("All Formats");
  const [sort, setSort]     = useState<SortType>("Newest");
  const [page, setPage]     = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailFile, setDetailFile] = useState<MediaFile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    setLoading(true);
    getUploads({ type: "all", videoLimit: 100 })
      .then((res) => {
        if (res?.success && res.data) {
          const files: MediaFile[] = [];

          // 1. Process Cloudinary Images
          if (res.data.images?.images) {
            res.data.images.images.forEach((img) => {
              const info = getCloudinaryFileInfo(img.url, img.publicId);
              files.push({
                id: `img-${img.publicId}`,
                name: info.name,
                type: info.type,
                size: estimateImageSize(img.width || 800, img.height || 600),
                date: formatDate(img.createdAt),
                gradient: getAvatarBg(img.publicId),
                url: resolveAssetUrl(img.url),
                width: img.width,
                height: img.height,
                createdAt: img.createdAt,
              });
            });
          }

          // 2. Process Prisma Videos
          if (res.data.videos?.data) {
            res.data.videos.data.forEach((vid) => {
              const playbackUrl = vid.playbackUrl || "";
              console.log("[Media Library] Video Item:", {
                id: vid.id,
                title: vid.title,
                playbackUrl,
                thumbnailUrl: vid.thumbnailUrl,
                processingStatus: vid.processingStatus
              });
              const ext = playbackUrl.split(".").pop()?.toUpperCase() || "MP4";
              const type: MediaType = ext === "MOV" ? "MOV" : "MP4";
              
              files.push({
                id: `vid-${vid.id}`,
                name: vid.title + (type === "MOV" ? ".mov" : ".mp4"),
                type,
                size: getMockVideoSize(vid.durationSeconds),
                date: formatDate(vid.createdAt),
                gradient: getAvatarBg(vid.title),
                url: resolveAssetUrl(playbackUrl),
                thumbnailUrl: isThumbnailValid(vid.thumbnailUrl) ? resolveAssetUrl(vid.thumbnailUrl!) : (getBunnyThumbnailUrl(playbackUrl) || undefined),
                durationSeconds: vid.durationSeconds,
                processingStatus: vid.processingStatus,
                uploadedBy: vid.uploadedBy ? { name: vid.uploadedBy.name, email: vid.uploadedBy.email } : undefined,
                category: vid.category ? { name: vid.category.name } : undefined,
                createdAt: vid.createdAt,
              });
            });
          }

          setMediaFiles(files);
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve live uploads list.", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Poll processing videos
  useEffect(() => {
    const processingItems = mediaFiles.filter(
      (f) =>
        (f.type === "MP4" || f.type === "MOV") &&
        (f.processingStatus === "PROCESSING" ||
          f.processingStatus === "QUEUED" ||
          f.processingStatus === "UPLOADING")
    );

    if (processingItems.length === 0) return;

    const intervalId = setInterval(async () => {
      for (const item of processingItems) {
        const realId = item.id.startsWith("vid-") ? item.id.substring(4) : item.id;
        try {
          const res = await getVideoStatus(realId);
          if (res?.success && res.data) {
            let status = res.data.processingStatus;
            // Workaround for backend mapping bug: if status is FAILED but there is no failureReason,
            // it means Bunny.net is still encoding (status code 2). Treat as PROCESSING and keep polling.
            if (status === "FAILED" && !res.data.failureReason) {
              status = "PROCESSING";
            }

            const newPlaybackUrl = res.data.playbackUrl;
            const rawThumbnailUrl = (res.data as any).thumbnailUrl;
            const newThumbnailUrl = isThumbnailValid(rawThumbnailUrl)
              ? rawThumbnailUrl
              : (newPlaybackUrl ? getBunnyThumbnailUrl(newPlaybackUrl) : null);

            setMediaFiles((prev) =>
              prev.map((f) => {
                if (f.id === item.id) {
                  return {
                    ...f,
                    processingStatus: status,
                    url: newPlaybackUrl ? resolveAssetUrl(newPlaybackUrl) : f.url,
                    thumbnailUrl: newThumbnailUrl ? resolveAssetUrl(newThumbnailUrl) : f.thumbnailUrl
                  };
                }
                return f;
              })
            );
          }
        } catch (err) {
          console.warn("Failed to check status for video:", realId, err);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [mediaFiles]);

  // Sync detailFile state with mediaFiles updates
  useEffect(() => {
    if (detailFile) {
      const updated = mediaFiles.find((f) => f.id === detailFile.id);
      if (updated && (updated.processingStatus !== detailFile.processingStatus || updated.url !== detailFile.url)) {
        setDetailFile(updated);
      }
    }
  }, [mediaFiles, detailFile]);

  const selectedFile = selectedIds.length === 1 ? mediaFiles.find((f) => f.id === selectedIds[0]) : null;

  const filtered = mediaFiles.filter((f) => {
    if (filter === "All Formats") return true;
    return f.type === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (sort === "Newest") return timeB - timeA;
    if (sort === "Oldest") return timeA - timeB;
    if (sort === "Largest") {
      return parseSizeToBytes(b.size) - parseSizeToBytes(a.size);
    }
    if (sort === "Smallest") {
      return parseSizeToBytes(a.size) - parseSizeToBytes(b.size);
    }
    return 0;
  });

  const PER_PAGE = 10;
  const TOTAL_FILES = sorted.length;
  const TOTAL_PAGES = Math.ceil(TOTAL_FILES / PER_PAGE);
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0) return;
    
    addToast("info", `Starting download for ${selectedIds.length} file(s)...`);

    for (const id of selectedIds) {
      const file = mediaFiles.find((f) => f.id === id);
      if (file && file.url) {
        try {
          const res = await fetch(file.url);
          if (!res.ok) throw new Error("Network response was not ok");
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.warn("CORS download blocked, falling back to opening in a new tab:", err);
          window.open(file.url, "_blank");
        }
      }
    }
    
    addToast("success", `Successfully downloaded ${selectedIds.length} file(s).`);
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      const idsToDelete = [...selectedIds];
      let deletedCount = 0;
      let videoDeletes = 0;

      for (const id of idsToDelete) {
        if (id.startsWith("vid-")) {
          const realId = id.substring(4);
          try {
            await deleteVideo(realId);
            videoDeletes++;
            deletedCount++;
          } catch (err) {
            console.error(`Failed to delete video ${realId}`, err);
          }
        } else {
          const realId = id.startsWith("img-") ? id.substring(4) : id;
          try {
            await deleteImage(realId);
            deletedCount++;
          } catch (err) {
            console.error(`Failed to delete image ${realId}`, err);
            // Fall back to client-only delete if API call fails
            deletedCount++;
          }
        }
      }

      setMediaFiles((prev) => prev.filter((file) => !idsToDelete.includes(file.id)));
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      
      if (videoDeletes > 0) {
        addToast("success", `Successfully deleted ${videoDeletes} video(s)`);
      } else {
        addToast("success", `Successfully deleted ${deletedCount} item(s)`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header ── */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Media Library</h1>
          <p className="text-sm text-zinc-500 mt-0.5">All uploaded images in one place</p>
        </div>

        <Link
          href="/media/upload"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Media
        </Link>
      </header>

      {/* ── Filters ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dropdown
            value={filter}
            options={["All Formats", "JPG", "PNG", "WEBP", "MP4", "MOV"]}
            onChange={(v) => { setFilter(v as FilterType); setPage(1); }}
          />
          <Dropdown
            value={`Sort by: ${sort}`}
            options={["Sort by: Newest", "Sort by: Oldest", "Sort by: Largest", "Sort by: Smallest"]}
            onChange={(v) => setSort(v.replace("Sort by: ", "") as SortType)}
          />
        </div>
        <span className="text-sm font-semibold text-zinc-500">{TOTAL_FILES} files</span>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm space-y-3 p-0"
            >
              {/* Thumbnail Placeholder */}
              <div className="w-full aspect-square bg-zinc-200"></div>
              {/* Info Placeholder */}
              <div className="px-3 pb-3.5 pt-0.5 space-y-2">
                {/* Filename */}
                <div className="h-3.5 w-2/3 bg-zinc-200 rounded-lg"></div>
                {/* Meta details */}
                <div className="flex gap-2">
                  <div className="h-3 w-8 bg-zinc-200 rounded"></div>
                  <div className="h-3 w-16 bg-zinc-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-20 text-center text-zinc-400 font-semibold bg-white rounded-3xl border border-zinc-100 shadow-sm">
          No media files found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginated.map((file) => {
            const isSelected = selectedIds.includes(file.id);
            const isProcessing = file.type === "MP4" || file.type === "MOV"
              ? (file.processingStatus === "QUEUED" || file.processingStatus === "UPLOADING" || file.processingStatus === "PROCESSING")
              : false;
            const isFailed = file.type === "MP4" || file.type === "MOV"
              ? file.processingStatus === "FAILED"
              : false;

            return (
              <div
                key={file.id}
                onClick={() => setDetailFile(file)}
                className={`group bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer select-none
                  ${isSelected ? "border-[#B31046] ring-2 ring-[#B31046]/10" : "border-zinc-100 hover:border-zinc-200 shadow-sm hover:shadow-md"}`}
              >
                {/* Thumbnail */}
                <div className={`relative w-full aspect-square flex items-center justify-center overflow-hidden
                  ${(file.type === "MP4" || file.type === "MOV") ? "bg-zinc-900" : `bg-gradient-to-br ${file.gradient}`}`}>
                  {file.url ? (
                    file.type === "MP4" || file.type === "MOV" ? (
                      <div className="w-full h-full relative">
                        {file.thumbnailUrl ? (
                          <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                        ) : (
                          <VideoThumbnail src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                        )}
                        {isProcessing ? (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-amber-500 tracking-wide uppercase">Processing</span>
                          </div>
                        ) : isFailed ? (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                            <span className="text-[10px] font-bold text-red-500 tracking-wide uppercase">Failed</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <Play className="w-8 h-8 text-white fill-white/80 drop-shadow-md" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                    )
                  ) : file.type === "PNG" && file.gradient.includes("zinc-100") ? (
                    <ImageIcon className="w-10 h-10 text-zinc-300" />
                  ) : (
                    <FileImage className="w-10 h-10 text-white/30" />
                  )}

                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(file.id);
                    }}
                    className={`absolute top-2 right-2 w-5 h-5 rounded-md border flex items-center justify-center transition-all z-10 ${
                      isSelected
                        ? "bg-[#B31046] border-[#B31046] text-white opacity-100"
                        : "bg-white/90 border-zinc-300 shadow-sm opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </button>
                </div>

                {/* Info */}
                <div className="px-3 py-2.5 space-y-1">
                  <p className="text-xs font-semibold text-zinc-800 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeBadgeStyle(file.type)}`}>
                      {file.type}
                    </span>
                    <span className="text-[10px] text-zinc-400">{file.size} · {file.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      <div className="flex flex-col items-center gap-4 pb-8">
        <p className="text-sm text-zinc-500">
          Showing {Math.min(PER_PAGE, TOTAL_FILES)} of {TOTAL_FILES} files
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-[#B31046] hover:text-[#B31046] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                p === page
                  ? "bg-[#B31046] text-white shadow-md"
                  : "border border-zinc-200 text-zinc-600 hover:border-[#B31046] hover:text-[#B31046]"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(TOTAL_PAGES, p + 1))}
            disabled={page === TOTAL_PAGES}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-[#B31046] hover:text-[#B31046] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1A1A1A] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 backdrop-blur-sm border border-zinc-800 animate-in slide-in-from-bottom-4 duration-305 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#B31046] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {selectedIds.length}
            </div>
            <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider leading-none">
              {selectedIds.length === 1 ? "file selected" : "files selected"}
            </div>
          </div>

          {selectedFile && (
            <>
              <div className="h-6 w-px bg-zinc-800" />
              <div className="text-xs text-zinc-400 max-w-[240px] truncate flex items-center gap-1.5">
                <span className="font-semibold text-zinc-200">{selectedFile.name}</span>
                <span className="text-zinc-650">•</span>
                <span>{selectedFile.size}</span>
                <span className="text-zinc-650">•</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-350">{selectedFile.type}</span>
              </div>
            </>
          )}

          <div className="h-6 w-px bg-zinc-800" />

          <div className="flex items-center gap-5">
            {selectedIds.length === 1 && (
              <button
                onClick={() => setDetailFile(selectedFile || null)}
                className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                <Info className="w-4 h-4 text-zinc-400" />
                View details
              </button>
            )}

            <button
              onClick={handleDownloadSelected}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              Download selected
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-xs font-semibold bg-[#B31046] hover:bg-[#960d3a] px-4 py-2 rounded-full transition-all text-white shadow-md active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete selected
            </button>
          </div>

          <div className="h-6 w-px bg-zinc-800" />

          <button
            onClick={() => setSelectedIds([])}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Details Modal ── */}
      {detailFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setDetailFile(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-900">File Details</h3>
              <p className="text-xs text-zinc-400">Detailed information about the selected asset</p>
            </div>

            <div className="relative w-full aspect-video rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center overflow-hidden border border-zinc-100 bg-zinc-950">
              {detailFile.type === "MP4" || detailFile.type === "MOV" ? (
                (detailFile.processingStatus === "QUEUED" || detailFile.processingStatus === "UPLOADING" || detailFile.processingStatus === "PROCESSING") ? (
                  <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-3 p-4 text-center z-10">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-500">Video is processing</p>
                      <p className="text-xs text-zinc-400">Bunny.net is currently converting and optimizing this video for playback.</p>
                    </div>
                  </div>
                ) : detailFile.processingStatus === "FAILED" ? (
                  <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-3 p-4 text-center z-10">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-red-500">Processing Failed</p>
                      <p className="text-xs text-zinc-400">The video failed to transcode. Please try re-uploading.</p>
                    </div>
                  </div>
                ) : detailFile.url && (detailFile.url.includes("iframe.mediadelivery.net") || detailFile.url.includes("embed")) ? (
                  <iframe
                    src={detailFile.url}
                    loading="lazy"
                    className="w-full h-full border-0 relative z-10"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                  />
                ) : (
                  <video src={detailFile.url || undefined} controls className="w-full h-full object-contain relative z-10" />
                )
              ) : detailFile.url ? (
                <img src={detailFile.url} alt={detailFile.name} className="w-full h-full object-cover relative z-10" />
              ) : (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${detailFile.gradient} opacity-90`} />
                  <ImageIcon className="w-10 h-10 text-white/40 z-10" />
                </>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-zinc-50">
                <span className="text-xs font-semibold text-zinc-400">Name</span>
                <span className="text-xs font-bold text-zinc-800 truncate max-w-[200px]" title={detailFile.name}>
                  {detailFile.name}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50">
                <span className="text-xs font-semibold text-zinc-400">Size</span>
                <span className="text-xs font-bold text-zinc-800">{detailFile.size}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50">
                <span className="text-xs font-semibold text-zinc-400">Format</span>
                <span className="text-xs font-bold text-zinc-800">{detailFile.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-50">
                <span className="text-xs font-semibold text-zinc-400">Date Uploaded</span>
                <span className="text-xs font-bold text-zinc-800">{detailFile.date}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-xs font-semibold text-zinc-400">Uploaded By</span>
                <span className="text-xs font-bold text-[#B31046]">
                  {detailFile.uploadedBy ? detailFile.uploadedBy.name : "Curator"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setDetailFile(null)}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm rounded-full transition-colors active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3 pt-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-[#B31046]">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900">Delete Selected Asset{selectedIds.length > 1 ? "s" : ""}?</h3>
                <p className="text-xs text-zinc-500 max-w-[280px]">
                  Are you sure you want to permanently delete {selectedIds.length} selected file{selectedIds.length > 1 ? "s" : ""}? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 border border-zinc-200 text-zinc-500 hover:bg-zinc-50 font-bold text-sm rounded-full transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full transition-colors active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
