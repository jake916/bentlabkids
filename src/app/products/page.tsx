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
  LayoutGrid,
  List,
  Pencil,
  ShoppingBag,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { getProducts, getProductCategories, deleteProduct, Product, ProductCategory } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductStatus = "In Stock" | "Out of Stock" | "Draft";

interface ProductItem {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: string;
  status: ProductStatus;
  imageUrl?: string;
  images: string[];
  bgGradient: string; // Background gradient or background style class for visual beauty
}

const STATUSES = ["All Statuses", "In Stock", "Out of Stock", "Draft"];

// ─── Filter Dropdown Component ────────────────────────────────────────────────

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
        className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:border-zinc-300 transition-all shadow-sm select-none cursor-pointer animate-in duration-200"
      >
        <span>{value}</span>
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-52 bg-white border border-zinc-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-1.5 duration-150">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors select-none cursor-pointer ${
                  opt === value ? "bg-[#FFF0F2]/60 text-[#B31046] hover:bg-[#FFF0F2]" : "text-zinc-600 hover:bg-zinc-50/70 hover:text-zinc-900"
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

// ─── Skeletons ───────────────────────────────────────────────────────────────

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

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm flex flex-col p-4 space-y-4">
          <SkeletonPulse className="w-full aspect-square rounded-2xl" />
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <SkeletonPulse className={`h-4 rounded-full ${i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-2/3"}`} />
              <div className="flex justify-between items-center">
                <SkeletonPulse className="h-4 w-16 rounded-full" />
                <SkeletonPulse className="h-3 w-12 rounded-full" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <SkeletonPulse className="flex-1 h-9 rounded-full" />
              <SkeletonPulse className="w-9 h-9 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductsListSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden animate-pulse">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="grid grid-cols-[64px_2.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-zinc-100 bg-zinc-50/60">
        {["Product", "Name", "Category", "Price", "Stock", "Actions"].map((h) => (
          <span key={h} className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">{h}</span>
        ))}
      </div>
      <div className="divide-y divide-zinc-50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[64px_2.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-3.5">
            <SkeletonPulse className="w-12 h-12 rounded-2xl" />
            <SkeletonPulse className={`h-3.5 rounded-full ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
            <SkeletonPulse className="h-5 w-24 rounded-md" />
            <SkeletonPulse className="h-3.5 w-16 rounded-full" />
            <SkeletonPulse className="h-3.5 w-12 rounded-full" />
            <div className="flex items-center gap-2">
              <SkeletonPulse className="w-8 h-8 rounded-full" />
              <SkeletonPulse className="w-8 h-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCard({
  prod,
  onEdit,
  onDelete,
  formatNaira,
}: {
  prod: ProductItem;
  onEdit: () => void;
  onDelete: () => void;
  formatNaira: (amount: number) => string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const images = prod.images.length > 0 ? prod.images : [];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentIdx];

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm flex flex-col p-4 hover:shadow-md transition-all duration-300 group">
      {/* Image Container Card */}
      <div className={`relative aspect-square rounded-2xl ${prod.bgGradient} flex items-center justify-center overflow-hidden mb-4 border border-zinc-50`}>
        {currentImage ? (
          <img
            src={currentImage}
            alt={prod.title}
            onError={(e) => {
              e.currentTarget.src = "/logogo.png";
            }}
            className="w-4/5 h-4/5 object-contain rounded-xl drop-shadow-md transition-transform duration-300"
          />
        ) : (
          <img
            src="/logogo.png"
            alt={prod.title}
            className="w-4/5 h-4/5 object-contain rounded-xl drop-shadow-md transition-transform duration-300"
          />
        )}

        {/* Carousel controls - visible if there are multiple images */}
        {images.length > 1 && (
          <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <button
              onClick={handlePrev}
              type="button"
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-zinc-700 hover:text-zinc-900 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-auto"
              title="Previous Image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              type="button"
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-zinc-700 hover:text-zinc-900 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-auto"
              title="Next Image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dot Indicators at the bottom of image container */}
        {images.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  i === currentIdx ? "bg-[#B31046] w-3" : "bg-zinc-300"
                }`}
              />
            ))}
          </div>
        )}

        {/* Top Badges */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-md text-[9px] font-extrabold text-zinc-500 shadow-xs uppercase tracking-wide">
          {prod.category}
        </span>

        <span
          className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase shadow-xs ${
            prod.status === "In Stock"
              ? "bg-emerald-100 text-emerald-700"
              : prod.status === "Out of Stock"
              ? "bg-red-100 text-red-700"
              : "bg-zinc-200/80 text-zinc-700"
          }`}
        >
          {prod.status === "In Stock" ? "In Stock" : prod.status === "Out of Stock" ? "Out of Stock" : "Draft"}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-zinc-800 line-clamp-2 leading-snug">{prod.title}</h3>
          <div className="flex items-center justify-between mt-2 pt-0.5">
            <span className="text-base font-black text-[#B31046]">{formatNaira(prod.price)}</span>
            <span className="text-[11px] font-bold text-zinc-400">
              Stock: {prod.status === "Draft" ? "--" : prod.stock}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onEdit}
            type="button"
            className="flex-1 py-2 bg-[#FFF0F2]/50 hover:bg-[#FFF0F2] text-[#B31046] font-extrabold text-xs rounded-full transition-all text-center cursor-pointer select-none active:scale-[0.98]"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            type="button"
            className="p-2 bg-zinc-100/80 hover:bg-[#FFF0F2] text-[#B31046] hover:text-[#B31046]/80 rounded-full border border-zinc-200/60 hover:border-transparent transition-all cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Products Component ──────────────────────────────────────────────────

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic categories list
  const [apiCategories, setApiCategories] = useState<ProductCategory[]>([]);
  
  // Filter settings
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const itemsPerPage = 12;

  // Add toast helper
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

  // Helper mapping function to maintain visual representation
  const mapProductToItem = (p: Product): ProductItem => {
    let mappedStatus: ProductStatus = "In Stock";
    if (p.status === "DRAFT") mappedStatus = "Draft";
    else if (p.status === "OUT_OF_STOCK") mappedStatus = "Out of Stock";

    const gradients = [
      "bg-pink-50",
      "bg-blue-50",
      "bg-emerald-50",
      "bg-amber-50/70",
      "bg-purple-50",
      "bg-sky-50",
      "bg-lime-50/50",
      "bg-amber-50/40"
    ];
    const hash = p.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bgGradient = gradients[hash % gradients.length];

    const imageUrls: string[] = [];
    if (p.featuredImage) {
      imageUrls.push(p.featuredImage);
    }
    if (p.images && p.images.length > 0) {
      p.images.forEach((img) => {
        if (img.url) {
          imageUrls.push(img.url);
        }
      });
    }
    if (imageUrls.length === 0) {
      imageUrls.push("/logogo.png");
    }

    return {
      id: p.id,
      title: p.name,
      price: p.price,
      stock: p.inventory,
      category: p.category ? p.category.name : "Uncategorized",
      status: mappedStatus,
      imageUrl: p.featuredImage || "/logogo.png",
      images: imageUrls,
      bgGradient: bgGradient,
    };
  };

  // Fetch product categories on mount
  useEffect(() => {
    getProductCategories()
      .then((res) => {
        if (res && res.success) {
          let list = res.data;
          const hasUncategorized = list.some((c) => c.slug === "uncategorized");
          if (!hasUncategorized) {
            list = [
              {
                id: "uncategorized",
                name: "Uncategorized",
                slug: "uncategorized",
                description: "Default category",
                createdAt: "",
                updatedAt: "",
                _count: { products: 0 },
              },
              ...list,
            ];
          }
          setApiCategories(list);
        }
      })
      .catch((err) => {
        console.error("Error loading categories", err);
      });
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products query from backend
  const fetchProductsList = async () => {
    setLoading(true);
    try {
      let apiStatus: string | undefined = undefined;
      if (selectedStatus === "In Stock") apiStatus = "ACTIVE";
      else if (selectedStatus === "Out of Stock") apiStatus = "OUT_OF_STOCK";
      else if (selectedStatus === "Draft") apiStatus = "DRAFT";

      let apiCategoryId: string | undefined = undefined;
      if (selectedCategory !== "All Categories") {
        const matched = apiCategories.find((c) => c.name === selectedCategory);
        if (matched) {
          apiCategoryId = matched.id;
        }
      }

      const res = await getProducts({
        page,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        categoryId: apiCategoryId,
        status: apiStatus,
      });

      if (res && res.success) {
        const mapped = res.data.map(mapProductToItem);
        setProducts(mapped);
        setTotalProducts(res.meta.total);
        setTotalPages(res.meta.totalPages || 1);
      }
    } catch (err: any) {
      console.error("Error loading products list", err);
      addToast("error", err?.message || "Failed to load products from backend.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger query load when dependencies change
  useEffect(() => {
    fetchProductsList();
  }, [page, selectedCategory, selectedStatus, debouncedSearch, apiCategories]);

  // Delete product action call
  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      const res = await deleteProduct(deletingProduct.id);
      if (res && res.success) {
        addToast("success", `Product "${deletingProduct.title}" has been deleted.`);
        fetchProductsList();
      } else {
        addToast("error", "Failed to delete product.");
      }
    } catch (err: any) {
      console.error("Error deleting product", err);
      addToast("error", err?.message || "Failed to delete product.");
    } finally {
      setDeletingProduct(null);
    }
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace("NGN", "₦");
  };

  const CATEGORIES = ["All Categories", ...apiCategories.map((c) => c.name)];

  return (
    <div className="min-h-full p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header Row ── */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Products</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your app products</p>
        </div>

        <button
          onClick={() => router.push("/products/new")}
          className="flex items-center gap-2 px-6 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-sm rounded-full shadow-md active:scale-[0.98] transition-all self-start md:self-auto select-none cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add New Products
        </button>
      </header>

      {/* ── Filters bar ── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          {/* Dropdown 1 */}
          <FilterDropdown
            value={selectedCategory}
            options={CATEGORIES}
            onChange={(val) => {
              setSelectedCategory(val);
              setPage(1);
            }}
          />

          {/* Dropdown 2 */}
          <FilterDropdown
            value={selectedStatus}
            options={STATUSES}
            onChange={(val) => {
              setSelectedStatus(val);
              setPage(1);
            }}
          />

          {/* Search bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search for Products"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-full focus:bg-white focus:border-[#B31046] focus:ring-2 focus:ring-[#B31046]/5 outline-none transition-all placeholder-zinc-400 font-semibold text-zinc-800 shadow-sm"
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-white border border-zinc-200 rounded-full p-1 gap-0.5 shadow-sm self-end md:self-auto shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            title="Grid view"
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              viewMode === "grid" ? "bg-[#B31046] text-white shadow-sm" : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="List view"
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              viewMode === "list" ? "bg-[#B31046] text-white shadow-sm" : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Render Block ── */}
      {loading ? (
        viewMode === "list" ? <ProductsListSkeleton /> : <ProductsGridSkeleton />
      ) : products.length > 0 ? (
        viewMode === "grid" ? (
          /* Grid Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                prod={prod}
                onEdit={() => router.push(`/products/new?edit=${prod.id}`)}
                onDelete={() => setDeletingProduct(prod)}
                formatNaira={formatNaira}
              />
            ))}
          </div>
        ) : (
          /* List Mode */
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[64px_2.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-zinc-100 bg-zinc-50/60 items-center">
              {["Product", "Name", "Category", "Price", "Stock Status", "Actions"].map((h) => (
                <span key={h} className="text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-zinc-50">
              {products.map((prod) => (
                <div key={prod.id} className="grid grid-cols-[64px_2.5fr_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-3.5 hover:bg-zinc-50/50 transition-colors group">
                  {/* Image */}
                  <div className={`w-12 h-12 rounded-2xl ${prod.bgGradient} flex items-center justify-center overflow-hidden border border-zinc-100/50 shrink-0`}>
                    <img
                      src={prod.imageUrl || "/logogo.png"}
                      alt={prod.title}
                      onError={(e) => {
                        e.currentTarget.src = "/logogo.png";
                      }}
                      className="w-4/5 h-4/5 object-contain"
                    />
                  </div>

                  {/* Title */}
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-zinc-800 truncate">{prod.title}</p>
                  </div>

                  {/* Category */}
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {prod.category}
                    </span>
                  </div>

                  {/* Price */}
                  <span className="text-sm font-extrabold text-[#B31046]">{formatNaira(prod.price)}</span>

                  {/* Stock */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        prod.status === "In Stock"
                          ? "bg-emerald-100 text-emerald-700"
                          : prod.status === "Out of Stock"
                          ? "bg-red-100 text-red-700"
                          : "bg-zinc-200/85 text-zinc-700"
                      }`}
                    >
                      {prod.status}
                    </span>
                    {prod.status !== "Draft" && (
                      <span className="text-xs font-semibold text-zinc-400">({prod.stock})</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/products/new?edit=${prod.id}`)}
                      className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-zinc-600 hover:text-[#B31046] hover:border-transparent transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(prod)}
                      className="p-1.5 rounded-full border border-zinc-200 hover:bg-[#FFF0F2] text-zinc-600 hover:text-[#B31046] hover:border-transparent transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-16 border border-zinc-100 shadow-sm text-center flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FFF0F2] flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-[#B31046]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-zinc-800">No products found</h3>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              We couldn't find any products matching your search terms or filters. Try adjusting your query or create a new product!
            </p>
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-full text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500 transition-all cursor-pointer select-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-full text-xs font-bold transition-all select-none cursor-pointer ${
                  page === pageNum
                    ? "bg-[#B31046] text-white shadow-sm"
                    : "border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-800"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border border-zinc-200 hover:border-zinc-300 rounded-full text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500 transition-all cursor-pointer select-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-zinc-100 shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setDeletingProduct(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-50 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-zinc-900">Delete Product?</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Are you sure you want to delete <strong className="text-zinc-700">"{deletingProduct.title}"</strong>? This action will remove the product from the catalog and cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-5 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-extrabold text-xs rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-full shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
