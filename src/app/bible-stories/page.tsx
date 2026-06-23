"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  LayoutGrid,
  List,
  Pencil,
  Globe,
  EyeOff,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { STORY_CATEGORIES } from "@/lib/storyCategories";
import { getStories, getCategories, deleteStory, Category, publishStory, unpublishStory } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type StoryStatus = "Published" | "Scheduled" | "Draft";

interface Story {
  id: string;
  title: string;
  category: string;
  date: string;
  status: StoryStatus;
  gradient: string;
  imageUrl?: string;
}

const INITIAL_STORIES: Story[] = [];

function getAvatarBg(title: string) {
  const colors = [
    "from-orange-400 via-red-500 to-teal-600",
    "from-amber-600 via-yellow-700 to-amber-900",
    "from-sky-300 via-indigo-400 to-violet-500",
    "from-purple-400 via-rose-500 to-amber-500",
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

const GRADIENTS = [
  "from-blue-500 via-teal-500 to-indigo-600",
  "from-amber-500 via-yellow-600 to-orange-700",
  "from-sky-300 via-pink-400 to-yellow-300",
  "from-purple-400 via-rose-500 to-amber-500",
  "from-slate-500 via-zinc-600 to-gray-700",
  "from-cyan-400 via-blue-500 to-sky-600",
  "from-rose-400 via-pink-500 to-red-500",
  "from-green-400 via-emerald-500 to-teal-600",
];

// ─── Skeleton Components ──────────────────────────────────────────────────────

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

function BibleStoriesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm flex flex-col">
          {/* Thumbnail */}
          <SkeletonPulse className="w-full aspect-video rounded-none" />
          {/* Info */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              {/* Title */}
              <SkeletonPulse className={`h-4 rounded-full ${i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-2/3"}`} />
              {/* Category + date */}
              <div className="flex items-center gap-2">
                <SkeletonPulse className="h-5 w-24 rounded-md" />
                <SkeletonPulse className="h-3.5 w-16 rounded-full" />
              </div>
            </div>
            {/* Action buttons */}
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

function BibleStoriesListSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
        {["Image", "Story Title", "Category", "Date Added", "Status", "Actions"].map((h) => (
          <span key={h} className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">{h}</span>
        ))}
      </div>
      <div className="divide-y divide-zinc-50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-6 py-3.5">
            {/* Thumb */}
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
            {/* Title */}
            <SkeletonPulse className={`h-3.5 rounded-full ${i % 2 === 0 ? "w-3/4" : "w-2/3"}`} />
            {/* Category */}
            <SkeletonPulse className="h-5 w-24 rounded-md" />
            {/* Date */}
            <SkeletonPulse className="h-3.5 w-20 rounded-full" />
            {/* Status */}
            <SkeletonPulse className="h-6 w-20 rounded-full" />
            {/* Actions */}
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
          <div className="absolute right-0 md:left-0 top-full mt-1.5 bg-white border border-zinc-100 rounded-2xl shadow-xl z-20 min-w-[170px] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-5 py-2.5 text-xs font-bold transition-colors hover:bg-zinc-50 ${
                  opt === value ? "text-[#B31046] bg-[#FFF0F2]/20" : "text-zinc-600"
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

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function BibleStoriesPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [deletingStory, setDeletingStory] = useState<Story | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Form Fields state
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Old Testament");
  const [formStatus, setFormStatus] = useState<StoryStatus>("Published");
  const [formGradient, setFormGradient] = useState(GRADIENTS[0]);

  const itemsPerPage = 6;

  // Fetch categories on mount
  useEffect(() => {
    getCategories("BIBLE_STORY")
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch((err) => console.warn("Failed to load categories", err));
  }, []);

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

  // Fetch stories helper
  const fetchStories = () => {
    setLoading(true);
    const params: any = {};
    if (selectedCategoryId !== "all") {
      params.categoryId = selectedCategoryId;
    }
    if (selectedStatus !== "All Statuses") {
      params.status = selectedStatus.toUpperCase(); // DRAFT, PUBLISHED
    }
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    getStories(params)
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          const mapped: Story[] = res.data.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category?.name || "Uncategorized",
            date: new Date(item.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            status: item.status === "PUBLISHED" ? "Published" : item.status === "SCHEDULED" ? "Scheduled" : "Draft",
            gradient: getAvatarBg(item.title),
            imageUrl: item.featuredImage || undefined,
          }));
          setStories(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load stories", err);
        addToast("error", "Failed to load stories from backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStories();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [selectedCategoryId, selectedStatus, searchTerm]);

  // Pagination Logic
  const totalStories = stories.length;
  const totalPages = Math.max(1, Math.ceil(totalStories / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedStories = stories.slice(startIndex, startIndex + itemsPerPage);

  // Form Helpers (Unused legacy code, preserved for compatibility)
  const openAddModal = () => {
    setEditingStory(null);
    setFormTitle("");
    setFormCategory(STORY_CATEGORIES[1]);
    setFormStatus("Published");
    setFormGradient(GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]);
    setIsFormModalOpen(true);
  };

  const openEditModal = (story: Story) => {
    setEditingStory(story);
    setFormTitle(story.title);
    setFormCategory(story.category);
    setFormStatus(story.status);
    setFormGradient(story.gradient);
    setIsFormModalOpen(true);
  };

  const handleSaveStory = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormModalOpen(false);
  };

  const handleDeleteStory = async () => {
    if (!deletingStory) return;
    setIsDeleting(true);
    try {
      const res = await deleteStory(deletingStory.id);
      if (res?.success) {
        addToast("success", `Story "${deletingStory.title}" deleted successfully.`);
        fetchStories();
      } else {
        addToast("error", "Failed to delete story.");
      }
    } catch (err) {
      console.error("Failed to delete story", err);
      addToast("error", "Failed to delete story.");
    } finally {
      setIsDeleting(false);
      setDeletingStory(null);
    }
  };

  const handleTogglePublish = async (id: string, action: "publish" | "unpublish") => {
    setTogglingId(id);
    try {
      const res = action === "publish" ? await publishStory(id) : await unpublishStory(id);
      if (res?.success) {
        addToast("success", `Story ${action === "publish" ? "published" : "unpublished"} successfully.`);
        fetchStories();
      } else {
        addToast("error", `Failed to ${action} story.`);
      }
    } catch (err) {
      console.error(`Failed to ${action} story`, err);
      addToast("error", `An error occurred while trying to ${action} the story.`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header Row ── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Bible Stories</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage and publish your Bible story content</p>
        </div>

        <button
          onClick={() => router.push("/bible-stories/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full shadow-md active:scale-[0.98] transition-all self-start md:self-auto select-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Story
        </button>
      </header>

      {/* ── Filters bar ── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search stories..."
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
          <FilterDropdown
            value={
              selectedCategoryId === "all"
                ? "All Categories"
                : categories.find((c) => c.id === selectedCategoryId)?.name || "All Categories"
            }
            options={["All Categories", ...categories.map((c) => c.name)]}
            onChange={(val) => {
              if (val === "All Categories") {
                setSelectedCategoryId("all");
              } else {
                const found = categories.find((c) => c.name === val);
                if (found) {
                  setSelectedCategoryId(found.id);
                }
              }
              setPage(1);
            }}
          />

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

      {/* ── Shimmer keyframe ── */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Story Grid / List ── */}
      {loading ? (
        viewMode === "grid" ? <BibleStoriesGridSkeleton /> : <BibleStoriesListSkeleton />
      ) : paginatedStories.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedStories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Thumbnail */}
                <div className={`relative aspect-video bg-gradient-to-br ${story.gradient} flex items-center justify-center overflow-hidden`}>
                  {story.imageUrl ? (
                    <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover transition-transform hover:scale-103 duration-300" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-white/30" />
                  )}
                  <span className={`absolute top-4 right-4 text-[9px] font-extrabold px-3 py-1 rounded-full tracking-wider uppercase backdrop-blur-md shadow-sm select-none ${
                    story.status === "Published" ? "bg-emerald-100/80 text-emerald-800 border border-emerald-200/30"
                    : story.status === "Scheduled" ? "bg-blue-100/80 text-blue-800 border border-blue-200/30"
                    : "bg-zinc-800/40 text-zinc-200 border border-white/10"
                  }`}>{story.status}</span>
                </div>
                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-zinc-900 leading-snug line-clamp-1 hover:text-[#B31046] transition-colors">{story.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">{story.category}</span>
                      <span className="text-xs text-zinc-400 font-semibold">{story.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => router.push(`/bible-stories/new?edit=${story.id}`)} className="flex-1 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-xs rounded-full transition-all text-center cursor-pointer select-none active:scale-[0.98]">Edit</button>
                    {story.status === "Published" ? (
                      <button
                        onClick={() => handleTogglePublish(story.id, "unpublish")}
                        disabled={togglingId === story.id}
                        className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 border border-zinc-200 rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Unpublish to Draft"
                      >
                        {togglingId === story.id ? (
                          <div className="w-4 h-4 border-2 border-zinc-450 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTogglePublish(story.id, "publish")}
                        disabled={togglingId === story.id}
                        className="p-2 hover:bg-[#FFF0F2] text-[#B31046] border border-zinc-200 hover:border-[#FFF0F2] rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Publish Immediately"
                      >
                        {togglingId === story.id ? (
                          <div className="w-4 h-4 border-2 border-[#B31046] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button onClick={() => setDeletingStory(story)} className="p-2 hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] border border-zinc-200 hover:border-[#FFF0F2] rounded-full transition-all cursor-pointer active:scale-[0.95]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── List View ── */
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
              {["Image", "Story Title", "Category", "Date Added", "Status", "Actions"].map((h) => (
                <span key={h} className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-zinc-50">
              {paginatedStories.map((story) => (
                <div key={story.id} className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-6 py-3.5 hover:bg-zinc-50/50 transition-colors group">
                  {/* Thumb */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    {story.imageUrl ? (
                      <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${story.gradient} flex items-center justify-center`}>
                        <ImageIcon className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                  </div>
                  {/* Title */}
                  <p className="text-sm font-extrabold text-zinc-900 truncate">{story.title}</p>
                  {/* Category */}
                  <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md inline-block w-fit">{story.category}</span>
                  {/* Date */}
                  <span className="text-xs font-semibold text-zinc-500">{story.date}</span>
                  {/* Status */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border w-fit ${
                    story.status === "Published" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : story.status === "Scheduled" ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-zinc-100 text-zinc-500 border-zinc-200"
                  }`}>{story.status}</span>
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/bible-stories/new?edit=${story.id}`)} className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] hover:border-[#FFF0F2] transition-all cursor-pointer" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    {story.status === "Published" ? (
                      <button
                        onClick={() => handleTogglePublish(story.id, "unpublish")}
                        disabled={togglingId === story.id}
                        className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Unpublish to Draft"
                      >
                        {togglingId === story.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-zinc-450 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTogglePublish(story.id, "publish")}
                        disabled={togglingId === story.id}
                        className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-[#B31046] hover:border-[#FFF0F2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Publish Immediately"
                      >
                        {togglingId === story.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#B31046] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button onClick={() => setDeletingStory(story)} className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] hover:border-[#FFF0F2] transition-all cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-3xl py-20 text-center border border-zinc-150 shadow-sm space-y-2.5">
          <p className="text-base font-extrabold text-zinc-700">No stories found</p>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">Try adjusting your search queries or category filters to find the stories you need.</p>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-100 pt-5">
          <span className="text-xs font-semibold text-zinc-500">
            Showing <span className="font-extrabold text-zinc-700">{paginatedStories.length}</span> of{" "}
            <span className="font-extrabold text-zinc-700">{totalStories}</span> stories
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50 text-zinc-500 disabled:opacity-35 disabled:cursor-not-allowed select-none cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all select-none cursor-pointer
                  ${
                    p === page
                      ? "bg-[#B31046] text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50 text-zinc-500 disabled:opacity-35 disabled:cursor-not-allowed select-none cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Add/Edit Story Modal ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-zinc-900">
                {editingStory ? "Edit Bible Story" : "Add New Bible Story"}
              </h3>
              <p className="text-xs text-zinc-400">Fill in the story details to update or add to your library.</p>
            </div>

            <form onSubmit={handleSaveStory} className="space-y-4 pt-1">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-1.5">
                  Story Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. David Slays the Giant"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-1.5">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-805 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {STORY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-1.5">
                  Status
                </label>
                <div className="flex bg-zinc-50 border border-zinc-200 p-1 rounded-full gap-1">
                  {(["Published", "Scheduled", "Draft"] as StoryStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer select-none
                        ${
                          formStatus === st
                            ? "bg-[#B31046] text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Gradients */}
              <div>
                <label className="text-xs font-bold text-zinc-700 tracking-wide block mb-1.5">
                  Thumbnail Color Theme
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {GRADIENTS.map((grad) => (
                    <button
                      key={grad}
                      type="button"
                      onClick={() => setFormGradient(grad)}
                      className={`h-9 rounded-xl bg-gradient-to-br ${grad} border-2 transition-all relative
                        ${
                          formGradient === grad
                            ? "border-zinc-800 scale-105 shadow-sm ring-2 ring-zinc-800/10"
                            : "border-transparent hover:scale-102"
                        }`}
                    >
                      {formGradient === grad && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-3.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-sm rounded-full transition-all active:scale-[0.98] cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer select-none"
                >
                  {editingStory ? "Save Changes" : "Create Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingStory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            
            <button
              onClick={() => setDeletingStory(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="mx-auto w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#B31046]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-zinc-900">Delete Bible Story</h3>
              <p className="text-sm font-semibold text-zinc-500 leading-relaxed">
                Are you sure you want to delete <span className="font-extrabold text-zinc-800">"{deletingStory.title}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingStory(null)}
                disabled={isDeleting}
                className="flex-1 py-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-sm rounded-full transition-all active:scale-[0.98] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStory}
                disabled={isDeleting}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full transition-all shadow-md active:scale-[0.98] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
