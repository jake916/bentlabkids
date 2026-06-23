"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  AlertTriangle,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Globe,
  EyeOff,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { PRAYER_CATEGORIES, PRAYER_CATEGORY_COLOURS } from "@/lib/prayerCategories";
import {
  getPrayers,
  deletePrayer,
  getCategories,
  CategoryApiData,
  PrayerResponse,
  publishPrayer,
  unpublishPrayer,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type PrayerStatus = "Published" | "Draft" | "Scheduled";

interface Prayer {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  status: PrayerStatus;
  imageUrl?: string;
  gradient: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getAvatarBg(title: string) {
  const gradients = [
    "from-rose-400 to-orange-500",
    "from-amber-400 to-yellow-500",
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-pink-500",
    "from-cyan-400 to-blue-500",
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function mapApiPrayerToPrayer(api: PrayerResponse): Prayer {
  let status: PrayerStatus = "Draft";
  if (api.status === "PUBLISHED") status = "Published";
  if (api.status === "SCHEDULED") status = "Scheduled";

  let formattedDate = "N/A";
  if (api.createdAt) {
    const d = new Date(api.createdAt);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  let excerpt = "";
  if (api.content) {
    const cleanContent = api.content.replace(/<[^>]*>/g, "");
    excerpt = cleanContent.length > 60 ? `"${cleanContent.slice(0, 60)}..."` : `"${cleanContent}"`;
  }

  return {
    id: api.id,
    title: api.title,
    excerpt,
    category: api.category?.name || "Uncategorized",
    date: formattedDate,
    status,
    imageUrl: api.featuredImage || undefined,
    gradient: getAvatarBg(api.title),
  };
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

function PrayersGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm flex flex-col">
          <SkeletonPulse className="w-full aspect-video rounded-none" />
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <SkeletonPulse className={`h-4 rounded-full ${i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-2/3"}`} />
              <div className="flex items-center gap-2">
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

function PrayersListSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
        {["Image", "Prayer Title", "Category", "Date Added", "Status", "Actions"].map((h) => (
          <span key={h} className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">{h}</span>
        ))}
      </div>
      <div className="divide-y divide-zinc-50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-6 py-3.5">
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
            <SkeletonPulse className={`h-3.5 rounded-full ${i % 2 === 0 ? "w-3/4" : "w-2/3"}`} />
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

const ITEMS_PER_PAGE = 8;

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PrayerStatus }) {
  const styles: Record<PrayerStatus, string> = {
    Published: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Draft:     "bg-zinc-100   text-zinc-500   border-zinc-200",
    Scheduled: "bg-blue-50    text-blue-600   border-blue-100",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${styles[status]}`}>
      {status}
    </span>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const colour = PRAYER_CATEGORY_COLOURS[category] ?? "bg-zinc-50 border-zinc-100 text-zinc-500";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${colour}`}>
      {category}
    </span>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 transition-all shadow-sm select-none"
      >
        <span>{value}</span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 bg-white border border-zinc-100 rounded-2xl shadow-xl z-20 min-w-[180px] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors hover:bg-zinc-50 ${opt === value ? "text-[#B31046] bg-[#FFF0F2]/20" : "text-zinc-600"}`}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PrayersPage() {
  const router = useRouter();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [categories, setCategories] = useState<CategoryApiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const [deletingPrayer, setDeletingPrayer] = useState<Prayer | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Fetch categories on mount
  useEffect(() => {
    getCategories("PRAYER")
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch((err) => console.warn("Failed to load categories", err));
  }, []);

  // Fetch prayers helper
  const fetchPrayers = () => {
    setLoading(true);
    const params: any = {};
    if (filterCategory !== "All Categories") {
      const cat = categories.find((c) => c.name === filterCategory);
      if (cat) {
        params.categoryId = cat.id;
      }
    }
    if (filterStatus !== "All Statuses") {
      params.status = filterStatus.toUpperCase(); // DRAFT, PUBLISHED
    }
    if (search.trim()) {
      params.search = search.trim();
    }
    getPrayers(params)
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setPrayers(res.data.map(mapApiPrayerToPrayer));
        }
      })
      .catch((err) => {
        console.error("Failed to load prayers", err);
        addToast("error", "Failed to load prayers from server.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Trigger refetch when filters/search changes
  useEffect(() => {
    fetchPrayers();
  }, [filterCategory, filterStatus, search, categories]);

  // Client-side pagination logic
  const totalPages = Math.max(1, Math.ceil(prayers.length / ITEMS_PER_PAGE));
  const paginated = prayers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = () => {
    if (!deletingPrayer) return;
    setIsDeleting(true);
    deletePrayer(deletingPrayer.id)
      .then((res) => {
        if (res.success) {
          addToast("success", `Prayer "${deletingPrayer.title}" deleted.`);
          fetchPrayers();
        } else {
          addToast("error", res.message || "Failed to delete prayer.");
        }
      })
      .catch((err) => {
        console.error("Delete failed", err);
        addToast("error", "An error occurred while deleting the prayer.");
      })
      .finally(() => {
        setIsDeleting(false);
        setDeletingPrayer(null);
      });
  };

  const handleTogglePublish = async (id: string, action: "publish" | "unpublish") => {
    setTogglingId(id);
    try {
      const res = action === "publish" ? await publishPrayer(id) : await unpublishPrayer(id);
      if (res?.success) {
        addToast("success", `Prayer ${action === "publish" ? "published" : "unpublished"} successfully.`);
        fetchPrayers();
      } else {
        addToast("error", `Failed to ${action} prayer.`);
      }
    } catch (err) {
      console.error(`Failed to ${action} prayer`, err);
      addToast("error", `An error occurred while trying to ${action} the prayer.`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Prayers</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage and publish prayers for children</p>
        </div>
        <button
          onClick={() => router.push("/prayers/new")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full shadow-md active:scale-[0.98] transition-all self-start md:self-auto select-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Prayer
        </button>
      </header>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search prayers..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-full focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 outline-none transition-all placeholder-zinc-400 font-semibold text-zinc-800 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <FilterDropdown
            value={filterCategory}
            options={["All Categories", ...categories.map((c) => c.name)]}
            onChange={(v) => { setFilterCategory(v); setPage(1); }}
          />
          <FilterDropdown
            value={filterStatus}
            options={["All Statuses", "Published", "Scheduled", "Draft"]}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
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

      {/* ── Table / Grid ── */}
      {loading ? (
        viewMode === "grid" ? <PrayersGridSkeleton /> : <PrayersListSkeleton />
      ) : paginated.length > 0 ? (
        viewMode === "list" ? (
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_auto] gap-4 px-6 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
              {["Image", "Prayer Title", "Category", "Date Added", "Status", "Actions"].map((h) => (
                <span key={h} className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-zinc-50">
              {paginated.map((prayer) => (
                <div key={prayer.id} className="grid grid-cols-[56px_2fr_1.2fr_1fr_1fr_auto] gap-4 items-center px-6 py-3.5 hover:bg-zinc-50/50 transition-colors group">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-zinc-100 to-zinc-200">
                    {prayer.imageUrl ? (
                      <img src={prayer.imageUrl} alt={prayer.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${prayer.gradient} flex items-center justify-center`}>
                        <ImageIcon className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                  </div>
                  {/* Title + excerpt */}
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-zinc-900 truncate">{prayer.title}</p>
                    <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">{prayer.excerpt}</p>
                  </div>
                  <div><CategoryBadge category={prayer.category} /></div>
                  <span className="text-xs font-semibold text-zinc-500">{prayer.date}</span>
                  <div><StatusBadge status={prayer.status} /></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/prayers/new?edit=${prayer.id}`)} className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] hover:border-[#FFF0F2] transition-all cursor-pointer" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    {prayer.status === "Published" ? (
                      <button
                        onClick={() => handleTogglePublish(prayer.id, "unpublish")}
                        disabled={togglingId === prayer.id}
                        className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Unpublish to Draft"
                      >
                        {togglingId === prayer.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-zinc-450 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTogglePublish(prayer.id, "publish")}
                        disabled={togglingId === prayer.id}
                        className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-[#B31046] hover:border-[#FFF0F2] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Publish Immediately"
                      >
                        {togglingId === prayer.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#B31046] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button onClick={() => setDeletingPrayer(prayer)} className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] hover:border-[#FFF0F2] transition-all cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          /* ── Grid View ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((prayer) => (
              <div key={prayer.id} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Thumbnail */}
                <div className={`relative aspect-video bg-gradient-to-br ${prayer.gradient} flex items-center justify-center overflow-hidden`}>
                  {prayer.imageUrl ? (
                    <img src={prayer.imageUrl} alt={prayer.title} className="w-full h-full object-cover transition-transform hover:scale-103 duration-300" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-white/30" />
                  )}
                  <span className={`absolute top-4 right-4 text-[9px] font-extrabold px-3 py-1 rounded-full tracking-wider uppercase backdrop-blur-md shadow-sm select-none ${
                    prayer.status === "Published" ? "bg-emerald-100/80 text-emerald-800 border border-emerald-200/30"
                    : prayer.status === "Scheduled" ? "bg-blue-50/90 text-blue-600 border border-blue-100/50"
                    : "bg-zinc-800/40 text-zinc-200 border border-white/10"
                  }`}>{prayer.status}</span>
                </div>
                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-zinc-900 leading-snug line-clamp-1 hover:text-[#B31046] transition-colors">{prayer.title}</h3>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={prayer.category} />
                      <span className="text-xs text-zinc-400 font-semibold">{prayer.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => router.push(`/prayers/new?edit=${prayer.id}`)} className="flex-1 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-xs rounded-full transition-all text-center cursor-pointer select-none active:scale-[0.98]">Edit</button>
                    {prayer.status === "Published" ? (
                      <button
                        onClick={() => handleTogglePublish(prayer.id, "unpublish")}
                        disabled={togglingId === prayer.id}
                        className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 border border-zinc-200 rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Unpublish to Draft"
                      >
                        {togglingId === prayer.id ? (
                          <div className="w-4 h-4 border-2 border-zinc-450 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTogglePublish(prayer.id, "publish")}
                        disabled={togglingId === prayer.id}
                        className="p-2 hover:bg-[#FFF0F2] text-[#B31046] border border-zinc-200 hover:border-[#FFF0F2] rounded-full transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                        title="Publish Immediately"
                      >
                        {togglingId === prayer.id ? (
                          <div className="w-4 h-4 border-2 border-[#B31046] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button onClick={() => setDeletingPrayer(prayer)} className="p-2 hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] border border-zinc-200 hover:border-[#FFF0F2] rounded-full transition-all cursor-pointer active:scale-[0.95]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-3xl py-20 text-center border border-zinc-100 shadow-sm space-y-2">
          <p className="text-sm font-extrabold text-zinc-700">No prayers found</p>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-xs font-semibold text-zinc-500">
              Showing <span className="font-extrabold text-zinc-700">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, prayers.length)}</span> of{" "}
              <span className="font-extrabold text-zinc-700">{prayers.length}</span> prayers
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
      {deletingPrayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setDeletingPrayer(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mx-auto w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#B31046]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-zinc-900">Delete Prayer</h3>
              <p className="text-sm font-semibold text-zinc-500 leading-relaxed">
                Are you sure you want to delete <span className="font-extrabold text-zinc-800">"{deletingPrayer.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeletingPrayer(null)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-sm rounded-full transition-all active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
