"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Clock,
  Calendar,
  ChevronDown,
  Sparkles,
  Send,
  Folder,
  Image as ImageIcon,
  Upload,
  X,
  ArrowLeft,
  FileImage,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import { STORY_CATEGORIES } from "@/lib/storyCategories";
import { getUploads, getCategories, createStory, getStoryById, updateStory, Category } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type PublishStatus = "immediately" | "scheduled" | "draft";
type StoryStatus = "Published" | "Scheduled" | "Draft";

interface MediaFile {
  id: string;
  name: string;
  gradient: string;
  type: string;
  url?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCloudinaryFileInfo(url: string, publicId: string) {
  const parts = url.split(".");
  const ext = parts[parts.length - 1]?.toUpperCase() || "JPG";
  const type = ext === "PNG" ? "PNG" : ext === "WEBP" ? "WEBP" : "JPG";
  
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

// Mock Media Library Files (aligned with /media page images)
const MOCK_MEDIA_LIBRARY: MediaFile[] = [
  { id: "m1", name: "moses_red_sea.jpg", gradient: "from-blue-600 to-indigo-650", type: "JPG", url: "https://images.unsplash.com/photo-1548625361-155deee223de?q=80&w=350&auto=format&fit=crop" },
  { id: "m2", name: "daniel_lions.jpg", gradient: "from-amber-500 to-orange-600", type: "JPG", url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=350&auto=format&fit=crop" },
  { id: "m3", name: "noah_ark.jpg", gradient: "from-sky-400 to-blue-500", type: "JPG", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=350&auto=format&fit=crop" },
  { id: "m4", name: "birth_jesus.jpg", gradient: "from-purple-500 to-pink-500", type: "JPG", url: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?q=80&w=350&auto=format&fit=crop" },
  { id: "m5", name: "david_goliath.jpg", gradient: "from-slate-600 to-zinc-700", type: "JPG", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=350&auto=format&fit=crop" },
  { id: "m6", name: "jonah_whale.jpg", gradient: "from-cyan-500 to-sky-600", type: "JPG", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=350&auto=format&fit=crop" },
];


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

// Inner component wrapped in Suspense for searchParams
function CreateStoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  
  const [isLoadingDetails, setIsLoadingDetails] = useState(!!editId);

  // State fields
  const [title, setTitle] = useState("");
  const [verseRef, setVerseRef] = useState("");
  const [duration, setDuration] = useState("");
  const [content, setContent] = useState("");
  const [statusOpt, setStatusOpt] = useState<PublishStatus>("immediately");
  const [publishDate, setPublishDate] = useState("2024-10-24");
  const [publishTime, setPublishTime] = useState("09:00");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null);

  // Live media library states
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  // "featured" = picking story thumbnail | "editor" = inserting into rich text
  const [mediaModalMode, setMediaModalMode] = useState<"featured" | "editor">("featured");
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const editorImageInsert = useRef<((url: string) => void) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Toast Helpers
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

  // Fetch live uploads (images only) & categories
  useEffect(() => {
    setLoadingMedia(true);
    getUploads({ type: "image" })
      .then((res) => {
        if (res?.success && res.data?.images?.images) {
          const imgs: MediaFile[] = [];
          res.data.images.images.forEach((img) => {
            const info = getCloudinaryFileInfo(img.url, img.publicId);
            imgs.push({
              id: img.publicId,
              name: info.name,
              gradient: getAvatarBg(img.publicId),
              type: info.type,
              url: img.url,
            });
          });
          setMediaList(imgs);
        }
      })
      .catch((err) => {
        console.warn("Failed to load uploads list in create story form", err);
      })
      .finally(() => {
        setLoadingMedia(false);
      });

    getCategories("BIBLE_STORY")
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCategories(res.data);
          if (res.data.length > 0 && !editId) {
            setCategoryId(res.data[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to load categories in create story form", err);
      });
  }, [editId]);

  // Populate form if editing
  useEffect(() => {
    if (editId) {
      setIsLoadingDetails(true);
      getStoryById(editId)
        .then((res) => {
          if (res.success && res.data) {
            const story = res.data;
            setTitle(story.title);
            setCategoryId(story.category?.id || "");
            setVerseRef(story.verseReference || "");
            setDuration(story.duration ? `${story.duration} minutes` : "");
            setContent(story.content || "");
            
            if (story.status === "PUBLISHED") {
              setStatusOpt("immediately");
            } else if (story.status === "SCHEDULED") {
              setStatusOpt("scheduled");
              if (story.scheduledFor) {
                const d = new Date(story.scheduledFor);
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
            }

            if (story.featuredImage) {
              setFeaturedImage({
                id: story.featuredImage,
                name: story.featuredImage.split("/").pop() || "image",
                gradient: getAvatarBg(story.title),
                type: "JPG",
                url: story.featuredImage,
              });
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load story details for editing", err);
          addToast("error", "Failed to load story details.");
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    }
  }, [editId]);

  // Called by RichTextEditor when user clicks the image toolbar button
  const handleEditorImageRequest = useCallback((insert: (url: string) => void) => {
    editorImageInsert.current = insert;
    setSelectedMediaId(null);
    setMediaModalMode("editor");
    setIsMediaModalOpen(true);
  }, []);

  // Open media modal in featured-image mode
  const openFeaturedImageModal = () => {
    setSelectedMediaId(featuredImage?.id ?? null);
    setMediaModalMode("featured");
    setIsMediaModalOpen(true);
  };

  const handleMediaConfirm = () => {
    const media = mediaList.find((m) => m.id === selectedMediaId) || MOCK_MEDIA_LIBRARY.find((m) => m.id === selectedMediaId);
    if (!media) { setIsMediaModalOpen(false); return; }
    if (mediaModalMode === "featured") {
      setFeaturedImage(media);
    } else if (mediaModalMode === "editor" && editorImageInsert.current && media.url) {
      editorImageInsert.current(media.url);
      editorImageInsert.current = null;
    }
    setIsMediaModalOpen(false);
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast("error", "Story title is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalSlug = slugify(title);
      const durationMinutes = parseInt(duration, 10) || 0;
      
      let scheduledFor: string | null = null;
      let status: "DRAFT" | "PUBLISHED" | "SCHEDULED" = "PUBLISHED";
      
      if (statusOpt === "scheduled") {
        status = "SCHEDULED";
        scheduledFor = new Date(`${publishDate}T${publishTime}`).toISOString();
      } else if (statusOpt === "draft") {
        status = "DRAFT";
      }

      const payload = {
        title: title.trim(),
        slug: finalSlug,
        content,
        duration: durationMinutes,
        verseReference: verseRef.trim() || undefined,
        ageGroup: "TODDLER" as const,
        categoryId: categoryId || undefined,
        image: featuredImage?.url || undefined,
        tags: [],
        scheduledFor,
        status,
      };

      if (editId) {
        const res = await updateStory(editId, payload);
        if (res.success) {
          addToast("success", `Story "${title.trim()}" updated successfully!`);
          setTimeout(() => {
            router.push("/bible-stories");
          }, 1200);
        } else {
          addToast("error", "Failed to update story.");
        }
      } else {
        const res = await createStory(payload);
        if (res.success) {
          addToast("success", `Story "${title.trim()}" created successfully!`);
          setTimeout(() => {
            router.push("/bible-stories");
          }, 1200);
        } else {
          addToast("error", "Failed to create story.");
        }
      }
    } catch (err: any) {
      console.error("Failed to submit story. Full error context:", err);
      console.error("Error name:", err?.name);
      console.error("Error message:", err?.message);
      console.error("Error status:", err?.status);
      console.error("Error stack:", err?.stack);
      console.error("Error keys:", Object.keys(err || {}));
      try {
        console.error("Error JSON stringified:", JSON.stringify(err));
      } catch (stringifyErr) {
        console.error("Could not stringify error:", stringifyErr);
      }

      if (err?.errors) {
        console.error("Validation error details:", JSON.stringify(err.errors, null, 2));
      }
      
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
      throw new Error(`Submit Failed: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header Row ── */}
      <header className="flex items-center justify-between border-b border-zinc-100 pb-4 bg-white -mx-8 px-8 -mt-8 pt-8 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/bible-stories")}
            className="p-1.5 rounded-full hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-extrabold text-[#B31046] tracking-tight">
            {editId ? "Edit Bible Story" : "Create New Bible Story"}
          </h1>
        </div>

        <button
          onClick={() => router.push("/bible-stories")}
          className="text-sm font-extrabold text-zinc-500 hover:text-zinc-800 transition-colors select-none cursor-pointer"
        >
          Cancel
        </button>
      </header>

      {/* ── Main Form Layout / Skeleton Loader ── */}
      {isLoadingDetails ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <style>{`
            @keyframes shimmer {
              0%   { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
          {/* Left Column Skeleton */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-24" />
                <SkeletonPulse className="h-12 w-full rounded-2xl" />
              </div>
              {/* Category + Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <SkeletonPulse className="h-4 w-20" />
                  <SkeletonPulse className="h-12 w-full rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <SkeletonPulse className="h-4 w-28" />
                  <SkeletonPulse className="h-12 w-full rounded-2xl" />
                </div>
              </div>
              {/* Rich text editor area */}
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-24" />
                <SkeletonPulse className="h-72 w-full rounded-2xl" />
              </div>
            </div>
            {/* Content Tip */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex items-start gap-4">
              <SkeletonPulse className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonPulse className="h-4 w-28" />
                <SkeletonPulse className="h-3 w-full" />
                <SkeletonPulse className="h-3 w-5/6" />
              </div>
            </div>
          </div>
          {/* Right Column Skeleton */}
          <div className="lg:col-span-4 space-y-6">
            {/* Publishing card */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
              <SkeletonPulse className="h-5 w-28 border-b border-zinc-50 pb-2" />
              <div className="space-y-3">
                <SkeletonPulse className="h-10 w-full rounded-xl" />
                <SkeletonPulse className="h-10 w-full rounded-xl" />
              </div>
              <SkeletonPulse className="h-12 w-full rounded-full" />
            </div>
            {/* Thumbnail card */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
              <SkeletonPulse className="h-5 w-36 border-b border-zinc-50 pb-2" />
              <SkeletonPulse className="w-full aspect-video rounded-2xl" />
              <SkeletonPulse className="h-10 w-full rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Card */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-6">
            
            {/* Story Title */}
            <div>
              <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">
                Story Title
              </label>
              <input
                type="text"
                placeholder="Enter a captivating story name..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-5 py-4 rounded-2xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all"
              />
            </div>

            {/* Row: Bible Verse Reference & Reading Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Verse */}
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">
                  Bible Verse Reference
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                  <input
                    type="text"
                    placeholder="e.g. Genesis 1:1"
                    value={verseRef}
                    onChange={(e) => setVerseRef(e.target.value)}
                    className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">
                  Reading Duration (Est.)
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                  <input
                    type="text"
                    placeholder="e.g. 5 minutes"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all"
                  />
                </div>
              </div>

            </div>

            {/* Story Content */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 tracking-wide block">
                Story Content
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                onImageRequest={handleEditorImageRequest}
              />
            </div>

          </div>

          {/* Content Tip Box */}
          <div className="bg-[#FFF0F2]/40 border border-[#FFF0F2]/60 rounded-3xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#B31046]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-[#B31046]">Content Tip</h4>
              <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
                Stories with vivid imagery and emotional hooks perform 40% better with children aged 4-8. Consider adding reflection questions at the end.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Publishing settings */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2 pb-2 border-b border-zinc-50">
              <Send className="w-4 h-4 text-[#B31046]" />
              Publishing
            </h3>

            <div className="space-y-4">
              {/* Radio 1: Publish immediately */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="status-opt"
                  checked={statusOpt === "immediately"}
                  onChange={() => setStatusOpt("immediately")}
                  className="sr-only"
                />
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    statusOpt === "immediately"
                      ? "border-[#B31046] ring-4 ring-[#B31046]/10"
                      : "border-zinc-300 group-hover:border-zinc-400"
                  }`}>
                    {statusOpt === "immediately" && (
                      <div className="w-2 h-2 rounded-full bg-[#B31046]" />
                    )}
                  </div>
                </div>
                <div className="text-xs font-extrabold text-zinc-700 select-none">
                  Publish immediately
                </div>
              </label>

              {/* Radio 2: Schedule for later */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="status-opt"
                  checked={statusOpt === "scheduled"}
                  onChange={() => setStatusOpt("scheduled")}
                  className="sr-only"
                />
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    statusOpt === "scheduled"
                      ? "border-[#B31046] ring-4 ring-[#B31046]/10"
                      : "border-zinc-300 group-hover:border-zinc-400"
                  }`}>
                    {statusOpt === "scheduled" && (
                      <div className="w-2 h-2 rounded-full bg-[#B31046]" />
                    )}
                  </div>
                </div>
                <div className="text-xs font-extrabold text-zinc-700 select-none">
                  Schedule for later
                </div>
              </label>

              {/* Sub-inputs for Scheduling */}
              {statusOpt === "scheduled" && (
                <div className="pl-7 space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* Date Input */}
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                    <input
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 focus:bg-white focus:border-[#B31046] pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-800 outline-none transition-all cursor-pointer"
                    />
                  </div>

                  {/* Time Input */}
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                    <input
                      type="time"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                      className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 focus:bg-white focus:border-[#B31046] pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-800 outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Radio 3: Save as draft */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="status-opt"
                  checked={statusOpt === "draft"}
                  onChange={() => setStatusOpt("draft")}
                  className="sr-only"
                />
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    statusOpt === "draft"
                      ? "border-[#B31046] ring-4 ring-[#B31046]/10"
                      : "border-zinc-300 group-hover:border-zinc-400"
                  }`}>
                    {statusOpt === "draft" && (
                      <div className="w-2 h-2 rounded-full bg-[#B31046]" />
                    )}
                  </div>
                </div>
                <div className="text-xs font-extrabold text-zinc-700 select-none">
                  Save as draft
                </div>
              </label>

            </div>

            {/* Action Submit Button inside publishing card */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-extrabold text-sm rounded-full shadow-md active:scale-[0.98] transition-all flex items-center justify-center select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : statusOpt === "immediately" ? (
                "Publish Story"
              ) : statusOpt === "scheduled" ? (
                "Schedule Story"
              ) : (
                "Save Draft"
              )}
            </button>

          </div>

          {/* Card 2: Category settings */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2 pb-2 border-b border-zinc-50">
              <Folder className="w-4 h-4 text-[#B31046]" />
              Category
            </h3>

            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-4 py-3.5 rounded-2xl text-xs font-semibold text-zinc-800 outline-none transition-all appearance-none cursor-pointer"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Card 3: Featured Image Dropzone */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-zinc-800 flex items-center gap-2 pb-2 border-b border-zinc-50">
              <ImageIcon className="w-4 h-4 text-[#B31046]" />
              Featured Image
            </h3>

            {featuredImage ? (
              <div className="relative rounded-2xl aspect-[4/3] bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                {/* Visual Image/Gradient Thumbnail representation */}
                {featuredImage.url ? (
                  <img src={featuredImage.url} alt={featuredImage.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${featuredImage.gradient} opacity-90`} />
                )}
                
                {!featuredImage.url && (
                  <div className="relative z-10 flex flex-col items-center text-center space-y-1 p-4">
                    <FileImage className="w-10 h-10 text-white/40" />
                    <span className="text-xs font-extrabold text-white truncate max-w-[150px]">
                      {featuredImage.name}
                    </span>
                  </div>
                )}

                {/* Always-visible Bottom Controls overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs px-3 py-2 flex items-center justify-between text-white z-10">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileImage className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span className="text-[10px] font-extrabold truncate max-w-[110px] sm:max-w-[130px]">
                      {featuredImage.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={openFeaturedImageModal}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-800 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer select-none"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeaturedImage(null)}
                      className="p-1 bg-[#B31046] hover:bg-[#960d3a] text-white rounded-lg transition-colors cursor-pointer select-none"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={openFeaturedImageModal}
                className="border-2 border-dashed border-[#FFF0F2] hover:border-[#B31046]/30 bg-[#FFF0F2]/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[#FFF0F2]/20 space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#B31046]" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-[#B31046] hover:underline block">
                    Click to select from media library
                  </span>
                  <span className="text-[10px] font-bold text-zinc-450 block">
                    PNG, JPG (max. 5MB)
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

      </form>
      )}

      {/* ── Custom Media Library Selector Modal ── */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-5xl border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <button
              onClick={() => setIsMediaModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-zinc-900">
                {mediaModalMode === "editor" ? "Insert Image" : "Select Featured Image"}
              </h3>
              <p className="text-xs text-zinc-400">
                {mediaModalMode === "editor"
                  ? "Choose an image from your Media Library to insert into the story content."
                  : "Choose an image from your Media Library to set as the story thumbnail."}
              </p>
            </div>

            {/* Grid display of media files */}
            {loadingMedia ? (
              <div className="py-12 text-center text-sm font-semibold text-zinc-400">Loading library files...</div>
            ) : mediaList.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-zinc-400">No images found. Upload images in Media Library first.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-15 overflow-y-auto pr-1 py-1 no-scrollbar my-2">
                {mediaList.map((media) => {
                  const isSelected = selectedMediaId === media.id;
                  return (
                    <div
                      key={media.id}
                      onClick={() => setSelectedMediaId(media.id)}
                      className={`relative aspect-[4/3] rounded-2xl bg-gradient-to-br ${media.gradient} flex items-center justify-center cursor-pointer overflow-hidden border-2 transition-all select-none
                        ${
                          isSelected
                            ? "border-[#B31046] ring-4 ring-[#B31046]/10 scale-102"
                            : "border-transparent hover:border-zinc-200"
                        }`}
                    >
                      {media.url ? (
                        <img src={media.url} alt={media.name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : null}
                      {/* Tick box overlay when selected */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#B31046] flex items-center justify-center z-10 shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                      <div className="flex flex-col items-center text-center space-y-1 p-3 z-10 relative">
                        {!media.url && <FileImage className="w-8 h-8 text-white/40" />}
                        <span className={`text-[10px] font-extrabold truncate max-w-[120px] ${
                          media.url ? "text-white bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs" : "text-white"
                        }`}>
                          {media.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 mt-2">
              <button
                onClick={() => setIsMediaModalOpen(false)}
                className="px-6 py-2.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs rounded-full transition-all active:scale-[0.98] select-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleMediaConfirm}
                disabled={!selectedMediaId}
                className="px-6 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full transition-all shadow-md active:scale-[0.98] select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mediaModalMode === "editor" ? "Insert Image" : "Confirm Selection"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function CreateStoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-[#B31046] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CreateStoryForm />
    </Suspense>
  );
}
