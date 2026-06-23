"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Video, Clock, Calendar, ChevronDown, Sparkles,
  Send, Folder, Image as ImageIcon, Upload, X, ArrowLeft, FileImage, Link as LinkIcon,
  Play, FileVideo, VideoOff,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import { VIDEO_CATEGORIES } from "@/lib/videoCategories";
import { resolveAssetUrl } from "@/lib/api";
import MediaSelectModal, { MediaFile } from "@/components/MediaSelectModal";

type PublishStatus = "immediately" | "scheduled" | "draft";

interface VideoMediaFile {
  id: string; name: string; url: string; duration: string; size: string;
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

const MOCK_MEDIA: MediaFile[] = [
  { id: "m1", name: "david_goliath.jpg",    gradient: "from-blue-500 via-teal-500 to-indigo-600",     type: "JPG", url: "https://images.unsplash.com/photo-1548625361-155deee223de?q=80&w=350&auto=format&fit=crop" },
  { id: "m2", name: "jesus_loves_me.jpg",   gradient: "from-pink-500 via-rose-500 to-amber-500",      type: "JPG", url: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?q=80&w=350&auto=format&fit=crop" },
  { id: "m3", name: "psalm_23.jpg",         gradient: "from-sky-300 via-indigo-400 to-purple-500",    type: "JPG", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=350&auto=format&fit=crop" },
  { id: "m4", name: "puppet_show.jpg",      gradient: "from-purple-400 via-indigo-500 to-blue-600",   type: "JPG", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=350&auto=format&fit=crop" },
];

const MOCK_VIDEOS_MEDIA: VideoMediaFile[] = [
  { id: "v1", name: "david_goliath_animated.mp4", url: "https://www.w3schools.com/html/mov_bbb.mp4", duration: "0:10", size: "3.2 MB" },
  { id: "v2", name: "jesus_loves_me_song.mp4",    url: "https://www.w3schools.com/html/movie.mp4",   duration: "0:12", size: "2.8 MB" },
];

const MOCK_VIDEOS = [
  { id: "1", title: "David and Goliath (Animated)",   category: "Animated Stories", status: "Published", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "5:10", description: "Watch how a young shepherd boy defeats a giant with just a sling." },
  { id: "2", title: "Jesus Loves Me (Sing-Along)",   category: "Sing-Along Songs", status: "Published", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "2:30", description: "A fun and uplifting version of the classic Sunday school hymn." },
  { id: "3", title: "Psalm 23 Memory Verse",         category: "Memory Verses",    status: "Published", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "1:45", description: "Learn 'The Lord is my shepherd' using interactive typography." },
  { id: "4", title: "The Lost Sheep Puppet Play",     category: "Puppet Shows",     status: "Published", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "8:15", description: "Barnaby the Puppet goes on a search to find the one sheep." },
  { id: "5", title: "Noah's Ark & Scientific Facts", category: "Science & Bible",  status: "Draft",     videoUrl: "",                                            duration: "6:40", description: "How big was the ark? Explore the science behind the dimensions." },
  { id: "6", title: "Goodnight Little Lamb",          category: "Bedtime Stories",  status: "Scheduled", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "15:20", description: "A soothing bedtime narrative designed to help toddlers wind down." },
];

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

  const [title, setTitle]                 = useState("");
  const [videoUrl, setVideoUrl]           = useState("");
  const [duration, setDuration]           = useState("");
  const [description, setDescription]     = useState("");
  const [statusOpt, setStatusOpt]         = useState<PublishStatus>("immediately");
  const [publishDate, setPublishDate]     = useState("2024-10-24");
  const [publishTime, setPublishTime]     = useState("09:00");
  const [category, setCategory]           = useState<string>(VIDEO_CATEGORIES[1]);
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null);
  const [attachedVideo, setAttachedVideo] = useState<VideoMediaFile | null>(null);

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalMode, setMediaModalMode] = useState<"featured" | "editor" | "video">("featured");
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const editorImageInsert = useRef<((url: string) => void) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);



  const addToast = (type: "success" | "error" | "info", msg: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((p) => [...p, { id, type, message: msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  useEffect(() => {
    if (!editId) return;
    setIsLoadingDetails(true);
    const timer = setTimeout(() => {
      const found = MOCK_VIDEOS.find((v) => v.id === editId);
      if (found) {
        setTitle(found.title);
        setCategory(found.category);
        setVideoUrl(found.videoUrl);
        setDuration(found.duration);
        setDescription(found.description);
        if (found.status === "Published") setStatusOpt("immediately");
        else if (found.status === "Scheduled") setStatusOpt("scheduled");
        else setStatusOpt("draft");
        const img = MOCK_MEDIA.find((m) => m.id === `m${found.id}`) || null;
        setFeaturedImage(img);

        // Auto-attach a mock video matching the ID
        const videoFile = MOCK_VIDEOS_MEDIA.find((vm) => vm.id === `v${found.id}`) || MOCK_VIDEOS_MEDIA[0];
        setAttachedVideo(videoFile);
      }
      setIsLoadingDetails(false);
    }, 500);
    return () => clearTimeout(timer);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { addToast("error", "Video title is required."); return; }
    if (!attachedVideo) { addToast("error", "Please attach a video file."); return; }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      addToast("success", editId ? `Video "${title}" updated!` : `Video "${title}" published!`);
      setTimeout(() => router.push("/videos"), 1200);
    }, 1000);
  };

  const inputCls = "w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-5 py-4 rounded-2xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-all";
  const inputSmCls = "w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all";

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-100 pb-4 bg-white -mx-8 px-8 -mt-8 pt-8 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/videos")} className="p-1.5 rounded-full hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-extrabold text-[#B31046] tracking-tight">
            {editId ? "Edit Video" : "Upload New Video"}
          </h1>
        </div>
        <button onClick={() => router.push("/videos")} className="text-sm font-extrabold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer">
          Cancel
        </button>
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
                {/* Premium Video Player */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950 aspect-video flex items-center justify-center shadow-inner group/player">
                  <video
                    src={attachedVideo.url || undefined}
                    controls
                    className="w-full h-full object-contain"
                  />
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

            {/* Video Link & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">Alternative Streaming Link (e.g. YouTube)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                  <input type="text" placeholder="e.g. https://www.youtube.com/watch?v=..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputSmCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-2">Duration</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B31046]" />
                  <input type="text" placeholder="e.g. 5:30" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputSmCls} />
                </div>
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

            {!editId && (
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
            )}

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
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-4 py-3.5 rounded-2xl text-xs font-semibold text-zinc-800 outline-none transition-all appearance-none cursor-pointer">
                {VIDEO_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
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
