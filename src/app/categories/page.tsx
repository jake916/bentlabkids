"use client";

import React, { useState, useEffect } from "react";
import { Search, Pencil, Trash2, Lock, X, AlertTriangle, Loader2 } from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { createCategory, updateCategory, deleteCategory, getCategories, CategoryApiType, ApiError } from "@/lib/api";

// ─── Skeleton Components ──────────────────────────────────────────────────────

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div
      className={`bg-zinc-200 rounded-lg animate-pulse ${className}`}
      style={{
        backgroundImage: "linear-gradient(90deg, #e4e4e7 25%, #f0f0f2 50%, #e4e4e7 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}

function CategoriesListSkeleton() {
  return (
    <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
      {/* Panel heading */}
      <SkeletonPulse className="h-4 w-44 rounded-full" />

      <div className="space-y-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3.5 px-3 rounded-2xl"
          >
            {/* Left: name + slug line */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <SkeletonPulse
                className={`h-3.5 rounded-full ${i % 3 === 0 ? "w-32" : i % 3 === 1 ? "w-44" : "w-36"}`}
              />
              <SkeletonPulse
                className={`h-2.5 rounded-full ${i % 2 === 0 ? "w-64" : "w-52"}`}
              />
            </div>

            {/* Right: count badge */}
            <SkeletonPulse className="h-6 w-16 rounded-full shrink-0 ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryFormSkeleton() {
  return (
    <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
      {/* Panel heading */}
      <SkeletonPulse className="h-4 w-36 rounded-full" />

      <div className="space-y-4">
        {/* Name field */}
        <div className="space-y-2">
          <SkeletonPulse className="h-3 w-24 rounded-full" />
          <SkeletonPulse className="h-11 w-full rounded-2xl" />
        </div>

        {/* Slug field */}
        <div className="space-y-2">
          <SkeletonPulse className="h-3 w-12 rounded-full" />
          <SkeletonPulse className="h-11 w-full rounded-2xl" />
          <SkeletonPulse className="h-2.5 w-3/4 rounded-full" />
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <SkeletonPulse className="h-3 w-20 rounded-full" />
            <SkeletonPulse className="h-3 w-12 rounded-full" />
          </div>
          <SkeletonPulse className="h-24 w-full rounded-2xl" />
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-3 pt-2">
          <SkeletonPulse className="h-12 flex-1 rounded-full" />
          <SkeletonPulse className="h-12 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "Bible Stories" | "Prayers" | "Videos";
type CategoryType = "stories" | "prayers" | "videos";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
  type: CategoryType;
}

// ─── Initial Mock Data ────────────────────────────────────────────────────────

// (No mock data — categories are loaded from the API per tab)


// ─── Main Page Component ──────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Bible Stories");
  // categories stored per-type so each tab caches its own list
  const [categoriesByType, setCategoriesByType] = useState<Record<CategoryType, Category[]>>({
    stories: [],
    prayers: [],
    videos: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // track which tabs have been fetched so we only show skeleton on first visit
  const [fetchedTabs, setFetchedTabs] = useState<Set<TabType>>(new Set());

  // Editing Category State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Deleting Category State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);

  // ── On mount: fetch ALL three types in parallel so tab counts are immediately correct ──
  useEffect(() => {
    const typeMap: [CategoryApiType, CategoryType][] = [
      ["BIBLE_STORY", "stories"],
      ["PRAYER", "prayers"],
      ["VIDEO", "videos"],
    ];

    setLoading(true);

    Promise.allSettled(typeMap.map(([apiType]) => getCategories(apiType))).then(
      (results) => {
        setCategoriesByType((prev) => {
          const next = { ...prev };
          results.forEach((result, i) => {
            const [, catType] = typeMap[i];
            if (result.status === "fulfilled" && result.value.success) {
              next[catType] = result.value.data.map((d) => ({
                id: d.id,
                name: d.name,
                slug: d.slug,
                description: d.description ?? "",
                count: (d._count?.contents ?? 0) + (d._count?.videos ?? 0),
                type: catType,
              }));
            }
          });
          return next;
        });
        // Mark all three tabs as fetched
        setFetchedTabs(new Set<TabType>(["Bible Stories", "Prayers", "Videos"]));
        setLoading(false);
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tab change: re-fetch only if this tab wasn't loaded on mount (safety net) ──
  useEffect(() => {
    if (fetchedTabs.has(activeTab)) return;
    setLoading(true);
    getCategories(toApiType(activeTab))
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const catType: CategoryType =
            activeTab === "Bible Stories" ? "stories" : activeTab === "Prayers" ? "prayers" : "videos";
          const mapped: Category[] = res.data.map((d) => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
            description: d.description ?? "",
            count: (d._count?.contents ?? 0) + (d._count?.videos ?? 0),
            type: catType,
          }));
          setCategoriesByType((prev) => ({ ...prev, [catType]: mapped }));
          setFetchedTabs((prev) => new Set(prev).add(activeTab));
        }
      })
      .catch((err: unknown) => {
        const apiErr = err as ApiError;
        addToast("error", apiErr?.message || "Failed to load categories.");
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Helper Toast Notification
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

  // Map UI tab type → backend enum
  const toApiType = (tab: TabType): CategoryApiType => {
    if (tab === "Bible Stories") return "BIBLE_STORY";
    if (tab === "Prayers") return "PRAYER";
    return "VIDEO";
  };

  const currentType: CategoryType =
    activeTab === "Bible Stories" ? "stories" : activeTab === "Prayers" ? "prayers" : "videos";

  // Convenience: categories for the current tab
  const categories = categoriesByType[currentType];

  // Get Tab Totals (count of category entries per type)
  const storiesCount = categoriesByType.stories.length;
  const prayersCount = categoriesByType.prayers.length;
  const videosCount = categoriesByType.videos.length;

  // Filter Categories list based on active tab and search query
  const filteredCategories = categories.filter((c) => {
    const query = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    );
  });

  // Slugify Helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  // Handlers for Form
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugEdited(true);
  };

  const handleClear = () => {
    setName("");
    setSlug("");
    setDescription("");
    setIsSlugEdited(false);
    setEditingCategory(null);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setIsSlugEdited(true);

    // Scroll slightly to the form panel on mobile layout
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast("error", "Category name is required.");
      return;
    }

    const finalSlug = slug.trim() ? slugify(slug) : slugify(name);
    if (!finalSlug) {
      addToast("error", "A valid URL slug is required.");
      return;
    }

    if (editingCategory) {
      // ── Edit path: call real PATCH API ──
      const duplicate = categories.find(
        (c) => c.slug === finalSlug && c.type === currentType && c.id !== editingCategory.id
      );
      if (duplicate) {
        addToast("error", "A category with this slug already exists in this section.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: finalSlug,
          description: description.trim() || undefined,
        });
        if (res.success && res.data) {
          const d = res.data;
          setCategoriesByType((prev) => ({
            ...prev,
            [currentType]: prev[currentType].map((c) =>
              c.id === editingCategory.id
                ? {
                    ...c,
                    name: d.name,
                    slug: d.slug,
                    description: d.description ?? "",
                    count: (d._count?.contents ?? 0) + (d._count?.videos ?? 0),
                  }
                : c
            ),
          }));
          addToast("success", `Category "${d.name}" updated successfully.`);
          handleClear();
        }
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        addToast("error", apiErr?.message || "Failed to update category. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ── Create path: call real API ──
    setSubmitting(true);
    try {
      const res = await createCategory({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || undefined,
        type: toApiType(activeTab),
      });

      if (res.success && res.data) {
        const d = res.data;
        const newCategory: Category = {
          id: d.id,
          name: d.name,
          slug: d.slug,
          description: d.description ?? "",
          count: (d._count?.contents ?? 0) + (d._count?.videos ?? 0),
          type: currentType,
        };
        setCategoriesByType((prev) => ({
          ...prev,
          [currentType]: [...prev[currentType], newCategory],
        }));
        addToast("success", `Category "${d.name}" created successfully.`);
        handleClear();
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      // Surface the backend message if available
      addToast("error", apiErr?.message || "Failed to create category. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingCategory) return;

    // Block default category deletion
    if (deletingCategory.slug === "uncategorized") {
      addToast("error", "System default category cannot be deleted.");
      return;
    }

    setDeleting(true);
    try {
      await deleteCategory(deletingCategory.id);

      // Remove from cached list
      const catType = deletingCategory.type;
      setCategoriesByType((prev) => {
        const remaining = prev[catType].filter((c) => c.id !== deletingCategory.id);
        const reassigned = remaining.map((c) =>
          c.slug === "uncategorized"
            ? { ...c, count: c.count + deletingCategory.count }
            : c
        );
        return { ...prev, [catType]: reassigned };
      });

      addToast("success", `Category "${deletingCategory.name}" deleted successfully.`);

      if (editingCategory?.id === deletingCategory.id) {
        handleClear();
      }
      setDeletingCategory(null);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      addToast("error", apiErr?.message || "Failed to delete category. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header Row ── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Categories</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage categories for Bible stories, prayers and videos</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-full focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 outline-none transition-all placeholder-zinc-400 font-semibold text-zinc-800"
          />
        </div>
      </header>

      {/* ── Tabs Row ── */}
      <div className="flex border-b border-zinc-100 gap-6">
        {(["Bible Stories", "Prayers", "Videos"] as TabType[]).map((tab) => {
          const isActive = tab === activeTab;
          const count =
            tab === "Bible Stories" ? storiesCount : tab === "Prayers" ? prayersCount : videosCount;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchTerm("");
                if (editingCategory) handleClear();
              }}
              className={`flex items-center gap-2 pb-3 font-extrabold text-sm relative transition-all cursor-pointer select-none
                ${isActive ? "text-[#B31046]" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              {tab}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${
                    isActive
                      ? "bg-[#B31046] text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
              >
                {count}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B31046] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Split Grid Layout ── */}
      {/* Shimmer keyframe injected inline for portability */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {loading ? (
          <>
            <CategoriesListSkeleton />
            <CategoryFormSkeleton />
          </>
        ) : (
          <>
        {/* Left Column: Categories List */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
          <h2 className="text-base font-extrabold text-zinc-800">
            {activeTab === "Bible Stories"
              ? "Bible Story Categories"
              : activeTab === "Prayers"
              ? "Prayer Categories"
              : "Video Categories"}
          </h2>

          <div className="divide-y divide-zinc-50 max-h-[600px] overflow-y-auto pr-1 no-scrollbar space-y-1">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between py-3.5 px-3 rounded-2xl transition-all duration-200 group
                    ${editingCategory?.id === cat.id ? "bg-[#FFF0F2]/50 border border-[#FFF0F2]" : "hover:bg-zinc-50/60 border border-transparent"}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-zinc-800 truncate">{cat.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-sm lg:max-w-md">
                        <span className="font-bold text-zinc-500">{cat.slug}</span>
                        {cat.description && (
                          <>
                            <span className="mx-1.5 text-zinc-300">•</span>
                            <span>{cat.description}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Default lock state or Action buttons */}
                    {cat.slug === "uncategorized" ? (
                      <div className="flex items-center gap-1.5 text-zinc-400 select-none bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
                        <Lock className="w-3 h-3 text-zinc-400" />
                        <span className="text-[9px] font-extrabold tracking-wider uppercase">Default</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cat);
                          }}
                          className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-850 transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCategory(cat);
                          }}
                          className="p-1.5 rounded-full hover:bg-[#FFF0F2] text-zinc-500 hover:text-[#B31046] transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <span className="bg-[#FFF0F2] border border-[#FFF0F2] text-[#B31046] text-[10px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap">
                      {cat.count} {cat.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <p className="text-sm font-bold text-zinc-700">No categories found</p>
                <p className="text-xs text-zinc-400 max-w-xs">
                  Try adjusting your search criteria or add a new category to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Add/Edit Category Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-5">
          <h2 className="text-base font-extrabold text-zinc-800">
            {editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Category"}
          </h2>

          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            
            {/* Name */}
            <div>
              <label htmlFor="cat-name" className="text-xs font-bold text-zinc-700 tracking-wide block mb-1.5">
                Category name
              </label>
              <input
                id="cat-name"
                type="text"
                placeholder="e.g. Parables of Jesus"
                value={name}
                onChange={handleNameChange}
                className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all"
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="cat-slug" className="text-xs font-bold text-zinc-700 tracking-wide block mb-1.5">
                Slug
              </label>
              <input
                id="cat-slug"
                type="text"
                placeholder="parables-of-jesus"
                value={slug}
                onChange={handleSlugChange}
                className="w-full bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all"
              />
              <p className="text-[10px] text-zinc-500 leading-relaxed mt-1.5">
                The slug is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.
              </p>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="cat-desc" className="text-xs font-bold text-zinc-700 tracking-wide">
                  Description
                </label>
                <span className="text-[10px] font-bold text-zinc-400">
                  {description.length} / 200
                </span>
              </div>
              <textarea
                id="cat-desc"
                maxLength={200}
                placeholder="Brief overview of this category content..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-24 bg-[#FFF0F2]/30 border border-[#FFF0F2]/50 hover:bg-[#FFF0F2]/45 focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3.5 bg-[#B31046] hover:bg-[#960d3a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-full transition-all shadow-md active:scale-[0.98] select-none cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting
                  ? (<><Loader2 className="w-4 h-4 animate-spin" /> {editingCategory ? "Saving..." : "Creating..."}</> )
                  : editingCategory
                  ? "Save Changes"
                  : "Create Category"
                }
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-sm rounded-full transition-all active:scale-[0.98] select-none cursor-pointer"
              >
                {editingCategory ? "Cancel Edit" : "Clear form"}
              </button>
            </div>

          </form>
        </div>

          </>
        )}
      </div>

      {/* ── Custom Delete Confirmation Modal ── */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            
            <button
              onClick={() => !deleting && setDeletingCategory(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-40"
              disabled={deleting}
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Warn Icon Header */}
            <div className="mx-auto w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#B31046]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-zinc-900">Delete Category</h3>
              <p className="text-sm font-semibold text-zinc-500 leading-relaxed">
                Are you sure you want to delete <span className="font-extrabold text-zinc-800">"{deletingCategory.name}"</span>? This action is permanent.
              </p>
            </div>

            {/* Reassignment Warning Box */}
            {deletingCategory.count > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left">
                <p className="text-xs font-bold text-amber-800 leading-relaxed">
                  ⚠️ This category has {deletingCategory.count} {deletingCategory.type} items. Deleting it will automatically reassign all of them to "Uncategorized".
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                disabled={deleting}
                className="flex-1 py-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-sm rounded-full transition-all active:scale-[0.98] select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-full transition-all shadow-md active:scale-[0.98] select-none cursor-pointer flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
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
