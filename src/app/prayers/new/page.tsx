"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen, Clock, Calendar, ChevronDown, Sparkles,
  Send, Folder, Image as ImageIcon, Upload, X, ArrowLeft, FileImage,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import {
  getCategories,
  createPrayer,
  getPrayerById,
  updatePrayer,
  Category,
} from "@/lib/api";
import MediaSelectModal, { MediaFile } from "@/components/MediaSelectModal";

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

type PublishStatus = "immediately" | "scheduled" | "draft";

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


function CreatePrayerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [isLoadingDetails, setIsLoadingDetails] = useState(!!editId);
  const [title, setTitle]           = useState("");
  const [occasion, setOccasion]     = useState("");
  const [verseRef, setVerseRef]     = useState("");
  const [duration, setDuration]     = useState("");
  const [content, setContent]       = useState("");
  const [statusOpt, setStatusOpt]   = useState<PublishStatus>("immediately");
  const [publishDate, setPublishDate] = useState("2024-10-24");
  const [publishTime, setPublishTime] = useState("09:00");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null);



  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalMode, setMediaModalMode] = useState<"featured" | "editor">("featured");
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const editorImageInsert = useRef<((url: string) => void) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: "success" | "error" | "info", msg: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((p) => [...p, { id, type, message: msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  // Fetch live Categories
  useEffect(() => {
    getCategories("PRAYER")
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCategories(res.data);
          if (res.data.length > 0 && !editId) {
            setCategoryId(res.data[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to load categories in create prayer form", err);
      });
  }, [editId]);

  // Populate form if editing
  useEffect(() => {
    if (editId) {
      setIsLoadingDetails(true);
      getPrayerById(editId)
        .then((res) => {
          if (res.success && res.data) {
            const prayer = res.data;
            setTitle(prayer.title);
            setCategoryId(prayer.category?.id || "");
            setVerseRef(prayer.verseReference || "");
            setDuration(prayer.duration ? `${prayer.duration} minutes` : "");
            setContent(prayer.content || "");
            
            // Map occasion from first tag
            if (prayer.tags && prayer.tags.length > 0) {
              const firstTag = prayer.tags[0]?.tag?.name || "";
              setOccasion(firstTag);
            }

            if (prayer.status === "PUBLISHED") {
              setStatusOpt("immediately");
            } else if (prayer.status === "SCHEDULED") {
              setStatusOpt("scheduled");
              if (prayer.scheduledFor) {
                const d = new Date(prayer.scheduledFor);
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

            if (prayer.featuredImage) {
              setFeaturedImage({
                id: prayer.featuredImage,
                name: prayer.featuredImage.split("/").pop() || "image",
                gradient: getAvatarBg(prayer.title),
                type: "JPG",
                url: prayer.featuredImage,
              });
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load prayer details for editing", err);
          addToast("error", "Failed to load prayer details.");
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

  const handleMediaConfirm = (media: MediaFile) => {
    if (mediaModalMode === "featured") {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast("error", "Prayer title is required.");
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

      // Map occasion to a tag if provided
      const tags = occasion.trim() ? [occasion.trim()] : [];

      const payload = {
        title: title.trim(),
        slug: finalSlug,
        content,
        duration: durationMinutes,
        verseReference: verseRef.trim() || undefined,
        ageGroup: "TODDLER" as const,
        categoryId: categoryId || undefined,
        image: featuredImage?.url || undefined,
        tags,
        scheduledFor,
        status,
      };

      if (editId) {
        const res = await updatePrayer(editId, payload);
        if (res.success) {
          addToast("success", `Prayer "${title.trim()}" updated successfully!`);
          setTimeout(() => {
            router.push("/prayers");
          }, 1200);
        } else {
          addToast("error", "Failed to update prayer.");
        }
      } else {
        const res = await createPrayer(payload);
        if (res.success) {
          addToast("success", `Prayer "${title.trim()}" created successfully!`);
          setTimeout(() => {
            router.push("/prayers");
          }, 1200);
        } else {
          addToast("error", "Failed to create prayer.");
        }
      }
    } catch (err: any) {
      console.error("Failed to submit prayer. Full error context:", err);
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
          <button onClick={() => router.push("/prayers")} className="p-1.5 rounded-full hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-extrabold text-[#B31046] tracking-tight">
            {editId ? "Edit Prayer" : "Create New Prayer"}
          </h1>
        </div>
        <button onClick={() => router.push("/prayers")} className="text-sm font-extrabold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer">
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
              {/* Occasion Input */}
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-40" />
                <SkeletonPulse className="h-12 w-full rounded-2xl" />
              </div>
              {/* Verse + Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <SkeletonPulse className="h-4 w-32" />
                  <SkeletonPulse className="h-12 w-full rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <SkeletonPulse className="h-4 w-36" />
                  <SkeletonPulse className="h-12 w-full rounded-2xl" />
                </div>
              </div>
              {/* Content Editor */}
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-24" />
                <SkeletonPulse className="h-48 w-full rounded-2xl" />
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-4 space-y-6">
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
            {/* Featured Image */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
              <SkeletonPulse className="h-5 w-28 rounded-lg" />
              <SkeletonPulse className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left Column ── */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-6">

              {/* Prayer Title */}
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">Prayer Title</label>
                <input type="text" placeholder="Enter a heartwarming title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
              </div>

              {/* Occasion */}
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">When is this prayer for</label>
                <input type="text" placeholder="e.g before going to bed" value={occasion} onChange={(e) => setOccasion(e.target.value)} className={inputCls} />
              </div>

              {/* Verse + Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">Bible Verse Reference</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                    <input type="text" placeholder="e.g. Genesis 1:1" value={verseRef} onChange={(e) => setVerseRef(e.target.value)} className={inputSmCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">Prayer Duration (Est.)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                    <input type="text" placeholder="e.g. 5 minutes" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputSmCls} />
                  </div>
                </div>
              </div>

              {/* Prayer Content */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 tracking-wide block">Prayer Content</label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Once upon a time, in a land filled with wonder..." onImageRequest={handleEditorImageRequest} />
              </div>
            </div>

            {/* Tip Box */}
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
                ) : editId ? "Update Prayer" : statusOpt === "immediately" ? "Publish Prayer" : statusOpt === "scheduled" ? "Schedule Prayer" : "Save Draft"}
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
                Featured Image
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
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2.5 transition-all duration-200 z-10">
                    <button
                      type="button"
                      onClick={openFeaturedImageModal}
                      className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold rounded-lg transition-colors cursor-pointer select-none"
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
          mediaModalMode === "editor"
            ? "Insert Image"
            : "Select Featured Image"
        }
        type="image"
      />
    </div>
  );
}

export default function CreatePrayerPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-[#B31046] border-t-transparent rounded-full animate-spin" /></div>}>
      <CreatePrayerForm />
    </Suspense>
  );
}
