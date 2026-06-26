"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import NavigationGuard from "@/components/NavigationGuard";
import {
  Video, Clock, Calendar, ChevronDown, Sparkles,
  Send, Folder, Image as ImageIcon, Upload, X, ArrowLeft, FileImage, Link as LinkIcon,
  Play, FileVideo, VideoOff,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import {
  getCategories,
  createVideoContent,
  getVideoContentById,
  updateVideoContent,
  resolveAssetUrl,
  CategoryApiData,
  publishVideoContent,
  unpublishVideoContent,
} from "@/lib/api";
import MediaSelectModal, { MediaFile } from "@/components/MediaSelectModal";
import BibleVerseSelector from "@/components/BibleVerseSelector";

type PublishStatus = "immediately" | "scheduled" | "draft";

interface VideoMediaFile {
  id: string;
  name: string;
  url: string;
  duration: string;
  size: string;
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

const getMockVideoSize = (durationSeconds: number | null) => {
  if (!durationSeconds) return "2.5MB";
  const mb = (durationSeconds * 0.15).toFixed(1);
  return `${mb}MB`;
};

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

function CreateVideoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [isLoadingDetails, setIsLoadingDetails] = useState(!!editId);

  // Keep track of initial loaded state to perform dirty checking
  const initialValuesRef = useRef({
    title: "",
    duration: "",
    verseRef: "",
    ageGroup: "PRESCHOOL",
    description: "",
    categoryId: "",
    tags: "",
    statusOpt: "immediately" as PublishStatus,
    featuredImageUrl: null as string | null,
    attachedVideoId: null as string | null,
  });

  const [title, setTitle]                 = useState("");
  const [duration, setDuration]           = useState("");
  const [verseRef, setVerseRef]           = useState("");
  const [ageGroup, setAgeGroup]           = useState<string>("PRESCHOOL");
  const [description, setDescription]     = useState("");
  const [statusOpt, setStatusOpt]         = useState<PublishStatus>("immediately");
  const [publishDate, setPublishDate]     = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  });
  const [publishTime, setPublishTime]     = useState("09:00");
  const [categories, setCategories]       = useState<CategoryApiData[]>([]);
  const [categoryId, setCategoryId]       = useState("");
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null);
  const [attachedVideo, setAttachedVideo] = useState<VideoMediaFile | null>(null);
  const [tags, setTags]                   = useState<string>("");

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalMode, setMediaModalMode] = useState<"featured" | "editor" | "video">("featured");
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

  const isDirty =
    title !== initialValuesRef.current.title ||
    duration !== initialValuesRef.current.duration ||
    verseRef !== initialValuesRef.current.verseRef ||
    ageGroup !== initialValuesRef.current.ageGroup ||
    description !== initialValuesRef.current.description ||
    categoryId !== initialValuesRef.current.categoryId ||
    tags !== initialValuesRef.current.tags ||
    statusOpt !== initialValuesRef.current.statusOpt ||
    (featuredImage?.url || null) !== (initialValuesRef.current.featuredImageUrl || null) ||
    (attachedVideo?.id || null) !== (initialValuesRef.current.attachedVideoId || null);
  const editorImageInsert = useRef<((url: string) => void) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const originalStatus = useRef<string | null>(null);

  const addToast = (type: "success" | "error" | "info", msg: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((p) => [...p, { id, type, message: msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  // Fetch categories dynamically
  useEffect(() => {
    getCategories("VIDEO")
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCategories(res.data);
          if (res.data.length > 0 && !editId) {
            setCategoryId(res.data[0].id);
            initialValuesRef.current.categoryId = res.data[0].id;
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to load categories in create video form", err);
      });
  }, [editId]);

  // Load editing details if editId is provided
  useEffect(() => {
    if (editId) {
      setIsLoadingDetails(true);
      getVideoContentById(editId)
        .then((res) => {
          if (res.success && res.data) {
            const videoContent = res.data;
            originalStatus.current = videoContent.status;
            setTitle(videoContent.title);
            setDescription(videoContent.content || "");
            
            let formattedDuration = "";
            if (videoContent.duration) {
              const dSec = videoContent.duration;
              const m = Math.floor(dSec / 60);
              const s = String(dSec % 60).padStart(2, "0");
              formattedDuration = `${m}:${s}`;
              setDuration(formattedDuration);
            } else {
              setDuration("");
            }
            setVerseRef(videoContent.verseReference || "");
            setAgeGroup(videoContent.ageGroup || "PRESCHOOL");
            setCategoryId(videoContent.category?.id || "");
            
            const formattedTags = videoContent.tags ? videoContent.tags.map((t) => t.tag.name).join(", ") : "";
            setTags(formattedTags);

            let statusVal: PublishStatus = "immediately";
            if (videoContent.status === "PUBLISHED") {
              setStatusOpt("immediately");
              statusVal = "immediately";
            } else if (videoContent.status === "SCHEDULED") {
              setStatusOpt("scheduled");
              statusVal = "scheduled";
              if (videoContent.scheduledFor) {
                const d = new Date(videoContent.scheduledFor);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const date = String(d.getDate()).padStart(2, "0");
                const dateStr = `${year}-${month}-${date}`;
                const hours = String(d.getHours()).padStart(2, "0");
                const minutes = String(d.getMinutes()).padStart(2, "0");
                const timeStr = `${hours}:${minutes}`;
                setPublishDate(dateStr);
                setPublishTime(timeStr);
              }
            } else {
              setStatusOpt("draft");
              statusVal = "draft";
            }

            if (videoContent.featuredImage) {
              setFeaturedImage({
                id: videoContent.featuredImage,
                name: videoContent.featuredImage.split("/").pop() || "thumbnail",
                url: videoContent.featuredImage,
                gradient: getAvatarBg(videoContent.title),
                type: "JPG",
              });
            }

            let attachedId: string | null = null;
            if (videoContent.videoAsset) {
              const asset = videoContent.videoAsset;
              attachedId = asset.id;
              setAttachedVideo({
                id: asset.id,
                name: asset.title,
                url: resolveAssetUrl(asset.playbackUrl || ""),
                duration: asset.durationSeconds
                  ? `${Math.floor(asset.durationSeconds / 60)}:${String(asset.durationSeconds % 60).padStart(2, "0")}`
                  : "0:00",
                size: getMockVideoSize(asset.durationSeconds),
              });
            }

            // Populate initial values for navigation guard comparison
            initialValuesRef.current = {
              title: videoContent.title || "",
              duration: formattedDuration,
              verseRef: videoContent.verseReference || "",
              ageGroup: videoContent.ageGroup || "PRESCHOOL",
              description: videoContent.content || "",
              categoryId: videoContent.category?.id || "",
              tags: formattedTags,
              statusOpt: statusVal,
              featuredImageUrl: videoContent.featuredImage || null,
              attachedVideoId: attachedId,
            };
          }
        })
        .catch((err) => {
          console.error("Failed to load video details for editing", err);
          addToast("error", "Failed to load video details.");
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    }
  }, [editId]);

  const handleEditorImageRequest = useCallback((insert: (url: string) => void) => {
    editorImageInsert.current = insert;
    setSelectedMediaId(null);
    setMediaModalMode("editor");
    setIsMediaModalOpen(true);
  }, []);

  const openFeaturedImageModal = () => {
    setSelectedMediaId(featuredImage?.id ?? null);
    setMediaModalMode("featured");
    setIsMediaModalOpen(true);
  };

  const openVideoAttachModal = () => {
    setSelectedMediaId(attachedVideo?.id ?? null);
    setMediaModalMode("video");
    setIsMediaModalOpen(true);
  };

  const handleMediaConfirm = (media: MediaFile) => {
    if (mediaModalMode === "video") {
      setAttachedVideo({
        id: media.id,
        name: media.name,
        url: media.url || "",
        duration: media.duration || "0:00",
        size: media.size || "2.5MB",
      });
      // Automatically prefill duration if empty
      if (!duration && media.duration) {
        setDuration(media.duration);
      }
    } else if (mediaModalMode === "featured") {
      setFeaturedImage(media);
    } else if (mediaModalMode === "editor" && editorImageInsert.current && media.url) {
      editorImageInsert.current(media.url);
      editorImageInsert.current = null;
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSaveAsDraft = async (): Promise<boolean> => {
    try {
      const baseSlug = slugify(title || "untitled-video");
      const finalSlug = editId ? baseSlug : `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
      
      let parsedDuration = 0;
      const cleanDuration = duration.trim();
      if (cleanDuration.includes(":")) {
        const parts = cleanDuration.split(":");
        if (parts.length === 3) {
          const h = parseInt(parts[0], 10) || 0;
          const m = parseInt(parts[1], 10) || 0;
          const s = parseInt(parts[2], 10) || 0;
          parsedDuration = h * 3600 + m * 60 + s;
        } else if (parts.length === 2) {
          const m = parseInt(parts[0], 10) || 0;
          const s = parseInt(parts[1], 10) || 0;
          parsedDuration = m * 60 + s;
        }
      } else {
        const secs = parseInt(cleanDuration, 10);
        parsedDuration = isNaN(secs) ? 0 : secs;
      }

      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: (title || "Untitled Video").trim(),
        slug: finalSlug,
        content: description.trim() || "Draft video description",
        duration: Math.max(1, parsedDuration || 1),
        verseReference: verseRef.trim() || undefined,
        ageGroup: ageGroup || undefined,
        categoryId: categoryId || undefined,
        image: featuredImage?.url || undefined,
        videoAssetId: attachedVideo?.id || undefined,
        tags: tagList,
        status: "DRAFT" as const,
      };

      if (editId) {
        const res = await updateVideoContent(editId, payload);
        if (res.success) {
          addToast("success", "Saved draft successfully!");
          return true;
        }
      } else {
        const res = await createVideoContent(payload);
        if (res.success) {
          addToast("success", "Saved draft successfully!");
          return true;
        }
      }
      addToast("error", "Failed to save draft.");
      return false;
    } catch (err: any) {
      console.error("Failed to save draft:", JSON.stringify(err));
      const validationDetails = err?.errors && Array.isArray(err.errors)
        ? ": " + err.errors.map((e: any) => `${e.path || e.field || ""}: ${e.message || ""}`).join(", ")
        : "";
      addToast("error", (err?.message || "Failed to save draft") + validationDetails);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { addToast("error", "Video title is required."); return; }
    if (!attachedVideo) { addToast("error", "Please attach a video file."); return; }
    setIsSubmitting(true);

    try {
      const baseSlug = slugify(title);
      const finalSlug = editId ? baseSlug : `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
      
      let parsedDuration = 0;
      const cleanDuration = duration.trim();
      if (cleanDuration.includes(":")) {
        const parts = cleanDuration.split(":");
        if (parts.length === 3) {
          const h = parseInt(parts[0], 10) || 0;
          const m = parseInt(parts[1], 10) || 0;
          const s = parseInt(parts[2], 10) || 0;
          parsedDuration = h * 3600 + m * 60 + s;
        } else if (parts.length === 2) {
          const m = parseInt(parts[0], 10) || 0;
          const s = parseInt(parts[1], 10) || 0;
          parsedDuration = m * 60 + s;
        }
      } else {
        const secs = parseInt(cleanDuration, 10);
        parsedDuration = isNaN(secs) ? 0 : secs;
      }

      let status: "DRAFT" | "PUBLISHED" | "SCHEDULED" = "PUBLISHED";
      let scheduledFor: string | undefined;

      if (statusOpt === "scheduled") {
        status = "SCHEDULED";
        scheduledFor = new Date(`${publishDate}T${publishTime}`).toISOString();
      } else if (statusOpt === "draft") {
        status = "DRAFT";
      }

      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: title.trim(),
        slug: finalSlug,
        content: description,
        duration: parsedDuration,
        verseReference: verseRef.trim() || undefined,
        ageGroup: ageGroup || undefined,
        categoryId: categoryId || undefined,
        image: featuredImage?.url || undefined,
        videoAssetId: attachedVideo.id,
        tags: tagList,
        ...(scheduledFor !== undefined ? { scheduledFor } : {}),
        status,
      };

      if (editId) {
        const res = await updateVideoContent(editId, payload);
        if (res.success) {
          if (statusOpt === "immediately" && originalStatus.current !== "PUBLISHED") {
            await publishVideoContent(editId).catch((err) => {
              console.error("Failed to publish video. Message:", err?.message, "Status:", err?.status, "Errors:", err?.errors);
            });
          }
          addToast("success", `Video "${title.trim()}" updated successfully!`);
          setTimeout(() => {
            router.push("/videos");
          }, 1200);
        } else {
          addToast("error", "Failed to update video.");
        }
      } else {
        const res = await createVideoContent(payload);
        if (res.success) {
          if (statusOpt === "immediately") {
            await publishVideoContent(res.data.id).catch((err) => {
              console.error("Failed to publish video:", err);
            });
          }
          addToast("success", `Video "${title.trim()}" created successfully!`);
          setTimeout(() => {
            router.push("/videos");
          }, 1200);
        } else {
          addToast("error", "Failed to create video.");
        }
      }
    } catch (err: any) {
      console.error("Failed to submit video. message:", err?.message, "status:", err?.status, "errors:", err?.errors);
      let msg = err?.message || "An unexpected error occurred.";
      if (err?.errors) {
        if (Array.isArray(err.errors)) {
          const details = err.errors.map((e: any) => `${e.field}: ${e.message}`).join(", ");
          msg = `${msg} (${details})`;
        } else if (typeof err.errors === "string") {
          msg = `${msg} (${err.errors})`;
        } else if (typeof err.errors === "object") {
          msg = `${msg} (${JSON.stringify(err.errors)})`;
        }
      }
      addToast("error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };


  const inputCls = "w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-5 py-4 rounded-2xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all";
  const inputSmCls = "w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all";

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-100 pb-4 bg-white -mx-8 px-8 -mt-8 pt-8 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/videos" className="p-1.5 rounded-full hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-[#B31046] tracking-tight">
            {editId ? "Edit Video" : "Upload New Video"}
          </h1>
        </div>
        <Link href="/videos" className="text-sm font-extrabold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer">
          Cancel
        </Link>
      </header>

      {isLoadingDetails ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <style>{`
            @keyframes shimmer {
              0%   { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
          {/* Left Column Skeleton */}
          <div className="lg:col-span-8 space-y-6 animate-pulse">
            {/* Video File Card Skeleton */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-6">
              <SkeletonPulse className="h-5 w-28 rounded-lg" />
              <SkeletonPulse className="h-32 w-full rounded-2xl" />
            </div>
            {/* Form Fields Skeleton */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-6">
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-20" />
                <SkeletonPulse className="h-12 w-full rounded-2xl" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <SkeletonPulse className="h-4 w-48" />
                  <SkeletonPulse className="h-12 w-full rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <SkeletonPulse className="h-4 w-16" />
                  <SkeletonPulse className="h-12 w-full rounded-2xl" />
                </div>
              </div>
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-24" />
                <SkeletonPulse className="h-48 w-full rounded-2xl" />
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-4 space-y-6 animate-pulse">
            {/* Publish Settings */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
              <SkeletonPulse className="h-5 w-24 rounded-lg" />
              <SkeletonPulse className="h-10 w-full rounded-full" />
            </div>
            {/* Category */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
              <SkeletonPulse className="h-5 w-20 rounded-lg" />
              <SkeletonPulse className="h-10 w-full rounded-2xl" />
            </div>
            {/* Custom Thumbnail */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
              <SkeletonPulse className="h-5 w-32 rounded-lg" />
              <SkeletonPulse className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── Left Column ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* ── Video Player / Attachment Section ── */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2 pb-2 border-b border-zinc-50">
              <Video className="w-4 h-4 text-[#B31046]" />
              Video File
            </h3>

            {attachedVideo ? (
              <div className="space-y-4">
                {/* Premium Video Player — iframe for Bunny CDN, native <video> for direct MP4 */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950 aspect-video flex items-center justify-center shadow-inner group/player">
                  {attachedVideo.url.includes("iframe.mediadelivery.net") ? (
                    <iframe
                      src={attachedVideo.url}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <video
                      src={attachedVideo.url || undefined}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* File details + action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] flex items-center justify-center shrink-0">
                      <FileVideo className="w-5 h-5 text-[#B31046]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-zinc-850 truncate">{attachedVideo.name}</p>
                      <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{attachedVideo.size} • {attachedVideo.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={openVideoAttachModal}
                      className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm select-none active:scale-[0.98]"
                    >
                      Replace Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachedVideo(null)}
                      className="p-2 bg-[#FFF0F2] text-[#B31046] hover:bg-[#B31046] hover:text-white rounded-full transition-all cursor-pointer"
                      title="Remove Video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Dashed Attachment Zone */
              <div
                onClick={openVideoAttachModal}
                className="border-2 border-dashed border-[#FFF0F2] hover:border-[#B31046]/30 bg-[#FFF0F2]/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[#FFF0F2]/20 space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center shadow-sm">
                  <Upload className="w-6 h-6 text-[#B31046]" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-[#B31046] block">Click to attach video from media library</span>
                  <span className="text-[10px] font-bold text-zinc-400 block">MP4, MOV (max. 100MB)</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-6">

            {/* Video Title */}
            <div>
              <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">Video Title</label>
              <input type="text" placeholder="Enter an exciting video title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </div>

            {/* Bible Verse Reference & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">Bible Verse Reference</label>
                <BibleVerseSelector value={verseRef} onChange={setVerseRef} />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">Duration</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                  <input type="text" placeholder="e.g. 2:30 or 150" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputSmCls} />
                </div>
                <p className="text-[10px] text-zinc-400 font-semibold mt-1.5">Enter format MM:SS (e.g., 2:30) or total seconds (e.g., 150).</p>
              </div>
            </div>



            {/* Video Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 tracking-wide block">Description</label>
              <RichTextEditor value={description} onChange={setDescription} placeholder="Write a short summary about the video..." onImageRequest={handleEditorImageRequest} />
            </div>
          </div>

          {/* Tip Box */}
          <div className="bg-[#FFF0F2]/40 border border-[#FFF0F2]/60 rounded-3xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#B31046]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-[#B31046]">Engagement Tip</h4>
              <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
                Add an engaging custom thumbnail image and descriptive keywords in the description to help parents find topics like "faith", "kindness" or "obedience".
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Publishing */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2 pb-2 border-b border-zinc-50">
              <Send className="w-4 h-4 text-[#B31046]" />
              {editId ? "Update" : "Publishing"}
            </h3>

            <div className="space-y-4">
              {(["immediately", "scheduled", "draft"] as PublishStatus[]).map((opt) => (
                <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                  <input type="radio" name="status-opt" checked={statusOpt === opt} onChange={() => setStatusOpt(opt)} className="sr-only" />
                  <div className="pt-0.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${statusOpt === opt ? "border-[#B31046] ring-4 ring-[#B31046]/10" : "border-zinc-300 group-hover:border-zinc-400"}`}>
                      {statusOpt === opt && <div className="w-2 h-2 rounded-full bg-[#B31046]" />}
                    </div>
                  </div>
                  <div className="text-xs font-extrabold text-zinc-700 select-none capitalize">
                    {opt === "immediately" ? "Publish immediately" : opt === "scheduled" ? "Schedule for later" : "Save as draft"}
                  </div>
                </label>
              ))}

              {statusOpt === "scheduled" && (
                <div className="pl-7 space-y-3 pt-1">
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                    <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 focus:bg-white focus:border-[#B31046] pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-800 outline-none transition-all cursor-pointer" />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                    <input type="time" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 focus:bg-white focus:border-[#B31046] pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-800 outline-none transition-all cursor-pointer" />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-extrabold text-sm rounded-full shadow-md active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50">
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : editId ? "Update Video" : statusOpt === "immediately" ? "Publish Video" : statusOpt === "scheduled" ? "Schedule Video" : "Save Draft"}
            </button>
          </div>

          {/* Category */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2 pb-2 border-b border-zinc-50">
              <Folder className="w-4 h-4 text-[#B31046]" />
              Category
            </h3>
            <div className="relative">
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-4 py-3.5 rounded-2xl text-xs font-semibold text-zinc-800 outline-none transition-all appearance-none cursor-pointer">
                {categories.length === 0 ? (
                  <option value="">No categories loaded</option>
                ) : (
                  categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)
                )}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2 pb-2 border-b border-zinc-50">
              <ImageIcon className="w-4 h-4 text-[#B31046]" />
              Custom Thumbnail
            </h3>
            {featuredImage ? (
              <div className="relative rounded-2xl aspect-[4/3] overflow-hidden group">
                {featuredImage.url ? (
                  <img src={featuredImage.url} alt={featuredImage.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${featuredImage.gradient}`} />
                )}
                <div className="relative z-10 flex flex-col items-center text-center p-4">
                  <FileImage className="w-10 h-10 text-white/40" />
                  <span className="text-xs font-extrabold text-white truncate max-w-[150px]">{featuredImage.name}</span>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-200">
                  <button type="button" onClick={openFeaturedImageModal} className="px-3.5 py-1.5 bg-white text-zinc-800 text-xs font-bold rounded-full hover:bg-zinc-100 cursor-pointer">Change</button>
                  <button type="button" onClick={() => setFeaturedImage(null)} className="p-1.5 bg-[#B31046] text-white rounded-full hover:bg-[#960d3a] cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <div onClick={openFeaturedImageModal} className="border-2 border-dashed border-[#FFF0F2] hover:border-[#B31046]/30 bg-[#FFF0F2]/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[#FFF0F2]/20 space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#B31046]" />
                </div>
                <span className="text-xs font-extrabold text-[#B31046] block">Click to select from media library</span>
                <span className="text-[10px] font-bold text-zinc-400 block">PNG, JPG (max. 5MB)</span>
              </div>
            )}
          </div>
        </div>
      </form>
      )}

      {/* ── Reusable Media Library Modal ── */}
      <MediaSelectModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onConfirm={handleMediaConfirm}
        selectedId={selectedMediaId}
        title={
          mediaModalMode === "video"
            ? "Select Video File"
            : mediaModalMode === "editor"
            ? "Insert Image"
            : "Select Featured Image"
        }
        type={mediaModalMode === "video" ? "video" : "image"}
      />

      <NavigationGuard
        isDirty={isDirty && !isSubmitting}
        onSaveAsDraft={handleSaveAsDraft}
        onDiscard={() => {}}
      />
    </div>
  );
}

export default function CreateVideoPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-[#B31046] border-t-transparent rounded-full animate-spin" /></div>}>
      <CreateVideoForm />
    </Suspense>
  );
}
